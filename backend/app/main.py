import os
import uuid
import json
import time
import logging
from collections import defaultdict
from typing import Literal
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Request, Depends, Security, Form
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import custom modules
from app.core.config import settings
from app.services.pdf_parser import PDFParser
from app.services.llm_client import LLMClient
from app.agents.summary_agent import SummaryAgent
from app.agents.risk_agent import RiskAgent
from app.agents.clause_agent import ClauseAgent
from app.agents.db_agent import DBAgent, MissingDBCredentialsError
from app.services.report_generator import generate_report
from app.models.schemas import FinalAnalysisResponse, AnalyzeTextRequest, LLMResponse, GlobalChatRequest, ResolveRiskRequest, SuggestionsRequest, SuggestionsResponse

app = FastAPI(title="Lexicon AI Backend API", version="2.0.0")

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom In-Memory Rate Limiter (100 requests per minute)
class InMemoryRateLimiter:
    def __init__(self, requests_limit: int, window_seconds: int):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)

    def is_allowed(self, ip: str) -> bool:
        now = time.time()
        # Keep only timestamps within window
        self.requests[ip] = [t for t in self.requests[ip] if now - t < self.window_seconds]
        if len(self.requests[ip]) >= self.requests_limit:
            return False
        self.requests[ip].append(now)
        return True

rate_limiter = InMemoryRateLimiter(requests_limit=100, window_seconds=60)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    path = request.url.path
    # Exclude Swagger/OpenAPI docs and root endpoint from rate limiting to facilitate testing
    if path.startswith("/docs") or path.startswith("/openapi.json") or path == "/" or path == "/health":
        return await call_next(request)
        
    client_ip = request.client.host if request.client else "127.0.0.1"
    if not rate_limiter.is_allowed(client_ip):
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please try again later."}
        )
    return await call_next(request)

# Setup local caching directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(BASE_DIR)
UPLOADS_DIR = os.path.join(BACKEND_ROOT, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

# API Key Authentication Setup
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def verify_api_key(api_key: str = Security(api_key_header)):
    """Validates the request API Key if API_KEY is defined in the environment/dotenv."""
    env_api_key = os.getenv("API_KEY")
    if env_api_key:
        if not api_key or api_key != env_api_key:
            raise HTTPException(status_code=403, detail="Invalid or missing API Key.")
    return api_key

# Custom Request/Response Models
class ChatRequest(BaseModel):
    document_id: str
    question: str

class ChatResponse(BaseModel):
    answer: str
    sources: list[str] = []

@app.get("/")
def read_root():
    return {"message": "Lexicon AI Backend API is running!", "version": "2.0.0"}

@app.get("/health")
def health():
    """Health check endpoint to monitor API status."""
    return {"status": "healthy"}

async def run_analysis_pipeline(document_id: str, user_id: str, filename: str, text: str, playbook_rules: list = None) -> FinalAnalysisResponse:
    """Executes the core LLM analysis and agent structure pipeline."""
    # 1. Run LLM Analysis
    llm_client = LLMClient()
    try:
        llm_response: LLMResponse = await llm_client.analyze_document(text, playbook_rules)
    except Exception as e:
        logger.error(f"LLM analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"LLM analysis failed: {str(e)}")

    # 2. Run Agents
    summary_agent = SummaryAgent()
    risk_agent = RiskAgent()
    clause_agent = ClauseAgent()

    final_summary = summary_agent.process(llm_response.summary)
    final_risks = risk_agent.process(llm_response.risks)
    final_clauses = clause_agent.process(llm_response.clauses)

    # 3. Build Final Response
    response = FinalAnalysisResponse(
        document_id=document_id,
        summary=final_summary,
        risks=final_risks,
        clauses=final_clauses,
        metadata=llm_response.metadata
    )
    # Store filename in metadata record
    response.metadata.filename = filename

    # 4. Save locally
    txt_path = os.path.join(UPLOADS_DIR, f"{document_id}.txt")
    json_path = os.path.join(UPLOADS_DIR, f"{document_id}.json")
    
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(text)
        
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(response.model_dump(), f, indent=2)

    # 5. Save to Supabase (Graceful Fallback)
    try:
        db_agent = DBAgent()
        await db_agent.save_analysis(
            document_id=document_id,
            user_id=user_id,
            summary=response.summary.model_dump(),
            risks=[r.model_dump() for r in response.risks],
            clauses=response.clauses.model_dump(),
            metadata=response.metadata.model_dump()
        )
        logger.info(f"Successfully saved analysis {document_id} to Supabase.")
    except MissingDBCredentialsError:
        logger.warning("Supabase credentials missing. Storing analysis in local cache only.")
    except Exception as e:
        logger.error(f"Failed to save analysis to Supabase: {str(e)}", exc_info=True)

    return response

@app.post("/upload", response_model=FinalAnalysisResponse, dependencies=[Depends(verify_api_key)])
async def upload_pdf(file: UploadFile = File(...), user_id: str = Form(...), playbook_rules: str = Form("[]")):
    """Uploads a PDF, extracts text, runs analysis, and returns structured data."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    # Check for duplicate filename for this user to prevent redundancies
    try:
        db_agent = DBAgent()
        existing = await db_agent.get_analysis_by_filename(file.filename, user_id)
        if existing:
            logger.info(f"Duplicate found: Document '{file.filename}' already analyzed. Returning existing ID: {existing['document_id']}")
            return FinalAnalysisResponse(
                document_id=existing["document_id"],
                summary=existing["summary"],
                risks=existing["risks"],
                clauses=existing["clauses"],
                metadata=existing["metadata"]
            )
    except Exception as e:
        logger.warning(f"Duplicate check failed, proceeding with normal pipeline: {str(e)}")

    try:
        file_bytes = await file.read()
        # 50MB file size validation
        if len(file_bytes) > 50 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB.")
            
        extracted_text = PDFParser.extract_text(file_bytes)
        if not extracted_text or not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No text found in PDF.")
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to parse PDF: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
        
    document_id = str(uuid.uuid4())
    logger.info(f"Processing uploaded PDF '{file.filename}' with ID: {document_id}")
    
    rules = []
    try:
        rules = json.loads(playbook_rules)
    except:
        pass
        
    return await run_analysis_pipeline(document_id, user_id, file.filename, extracted_text, rules)

@app.post("/analyze", response_model=FinalAnalysisResponse, dependencies=[Depends(verify_api_key)])
async def analyze_text(req: AnalyzeTextRequest):
    """Analyzes raw contract text and returns structured data."""
    if not req.content or not req.content.strip():
        raise HTTPException(status_code=400, detail="Document content cannot be empty.")
        
    document_id = str(uuid.uuid4())
    logger.info(f"Processing raw text input with ID: {document_id}")
    
    return await run_analysis_pipeline(document_id, req.user_id, "Pasted_Contract.txt", req.content, req.playbook_rules)

@app.get("/analyses/{document_id}", response_model=FinalAnalysisResponse, dependencies=[Depends(verify_api_key)])
def get_analysis(document_id: str):
    """Retrieves cached analysis by ID."""
    json_path = os.path.join(UPLOADS_DIR, f"{document_id}.json")
    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail="Analysis session not found.")
        
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return FinalAnalysisResponse.model_validate(data)
    except Exception as e:
        logger.error(f"Failed to load analysis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to load analysis results.")

@app.get("/analyses/{document_id}/text", dependencies=[Depends(verify_api_key)])
def get_analysis_text(document_id: str):
    """Retrieves the raw extracted text of the document."""
    txt_path = os.path.join(UPLOADS_DIR, f"{document_id}.txt")
    if not os.path.exists(txt_path):
        raise HTTPException(status_code=404, detail="Document text not found.")
    try:
        with open(txt_path, "r", encoding="utf-8") as f:
            text = f.read()
        return {"text": text}
    except Exception as e:
        logger.error(f"Failed to read text file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to load document text.")

@app.post("/chat", response_model=ChatResponse, dependencies=[Depends(verify_api_key)])
async def chat_with_doc(req: ChatRequest):
    """Queries the document text with a question."""
    txt_path = os.path.join(UPLOADS_DIR, f"{req.document_id}.txt")
    document_text = "Document text is currently unavailable on the server due to cache expiration. However, I can still answer general questions or redraft clauses provided in the prompt."
    if os.path.exists(txt_path):
        try:
            with open(txt_path, "r", encoding="utf-8") as f:
                document_text = f.read()
        except Exception as e:
            logger.error(f"Failed to read contract text: {str(e)}", exc_info=True)

    # Call LLM client for Q&A
    llm_client = LLMClient()
    system_prompt = (
        "You are an expert AI legal assistant. You are helping a user analyze a legal contract.\n"
        "Below is the full text of the legal contract:\n\n"
        f"--- START CONTRACT ---\n{document_text}\n--- END CONTRACT ---\n\n"
        "Answer the user's question accurately using only the contract text when possible. "
        "If the information is not in the contract, explain that it cannot be found in the document. "
        "Be clear, professional, and highlight specific section numbers or references if they exist.\n\n"
        "IMPORTANT FORMATTING RULES:\n"
        "- You MUST format your response using rich Markdown.\n"
        "- Use **bold text** to highlight key terms, risks, or section names.\n"
        "- Use bulleted or numbered lists when presenting multiple points.\n"
        "- Break your response into short, readable paragraphs rather than a single wall of text."
    )
    
    try:
        # Utilize LLM client's active client property
        response = await llm_client.client.chat.completions.create( 
            model=llm_client.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.question}
            ],
            temperature=0.2
        )
        answer = response.choices[0].message.content
        return ChatResponse(answer=answer, sources=[])
    except Exception as e:
        logger.error(f"LLM chat query failed: {str(e)}", exc_info=True)
        error_msg = str(e)
        if "429" in error_msg or "rate limit" in error_msg.lower():
            friendly_answer = "⚠️ **Rate limit reached.** The AI model is temporarily busy. Please wait a minute and try again."
        else:
            friendly_answer = f"⚠️ **Error:** I encountered an issue querying the document: {error_msg}"
        return ChatResponse(answer=friendly_answer, sources=[])

@app.get("/report/{document_id}", dependencies=[Depends(verify_api_key)])
def get_pdf_report(
    document_id: str,
    inc_summary: bool = True,
    inc_risks: bool = True,
    inc_clauses: bool = True,
    inc_meta: bool = True
):
    """Generates and downloads the PDF report with optional sections."""
    json_path = os.path.join(UPLOADS_DIR, f"{document_id}.json")
    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail="Analysis results not found.")
        
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        summary = data.get("summary", {})
        risks = data.get("risks", [])
        clauses = data.get("clauses", {})
        metadata = data.get("metadata", {})
        
        options = {
            "inc_summary": inc_summary,
            "inc_risks": inc_risks,
            "inc_clauses": inc_clauses,
            "inc_meta": inc_meta
        }
        
        pdf_path = generate_report(document_id, summary, risks, clauses, metadata, options)
        
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"lexicon_analysis_{document_id}.pdf"
        )
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

@app.post("/global_chat", response_model=ChatResponse, dependencies=[Depends(verify_api_key)])
async def global_chat(req: GlobalChatRequest):
    """Queries across all user documents."""
    db_agent = DBAgent()
    try:
        response = db_agent.client.table("analyses").select("metadata, summary, risks").eq("user_id", req.user_id).execute()
        docs = response.data
    except Exception as e:
        logger.error(f"Failed to fetch documents for global chat: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve document portfolio.")

    if not docs:
        return ChatResponse(answer="You don't have any analyzed documents in your library yet.")

    # Construct portfolio context
    context_parts = []
    for idx, doc in enumerate(docs):
        meta = doc.get("metadata", {})
        doc_type = meta.get("document_type", "Document")
        parties = meta.get("parties", [])
        
        summary_info = doc.get("summary", {}).get("tldr", "")
        
        risks = doc.get("risks", [])
        high_risks = [r.get("title") for r in risks if r.get("severity") == "High"]
        
        doc_str = f"Document {idx+1} ({doc_type}):\n"
        doc_str += f"- Parties: {', '.join(parties)}\n"
        doc_str += f"- Summary: {summary_info}\n"
        if high_risks:
            doc_str += f"- High Risks: {', '.join(high_risks)}\n"
        context_parts.append(doc_str)

    portfolio_context = "\n".join(context_parts)

    llm_client = LLMClient()
    system_prompt = (
        "You are an expert AI legal assistant. You are helping a user analyze their entire legal document portfolio.\n"
        "Below is a condensed summary of all the documents in the user's library, including their types, parties, summaries, and high-level risks.\n\n"
        f"--- START PORTFOLIO CONTEXT ---\n{portfolio_context}\n--- END PORTFOLIO CONTEXT ---\n\n"
        "Answer the user's question accurately using only the portfolio context provided above. "
        "If the information is not in the context, explain that it cannot be found in the current summaries. "
        "Be clear, professional, and highlight specific documents when answering.\n\n"
        "IMPORTANT FORMATTING RULES:\n"
        "- You MUST format your response using rich Markdown.\n"
        "- Use **bold text** to highlight key terms, risks, or document names.\n"
        "- Use bulleted or numbered lists when presenting multiple points.\n"
        "- Break your response into short, readable paragraphs rather than a single wall of text."
    )
    
    try:
        res = await llm_client.client.chat.completions.create(
            model=llm_client.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.question}
            ],
            temperature=0.3
        )
        answer = res.choices[0].message.content
        return ChatResponse(answer=answer, sources=[])
    except Exception as e:
        logger.error(f"Global LLM chat query failed: {str(e)}", exc_info=True)
        error_msg = str(e)
        if "429" in error_msg or "rate limit" in error_msg.lower():
            friendly_answer = "⚠️ **Rate limit reached.** The AI model is temporarily busy. Please wait a minute and try again."
        else:
            friendly_answer = f"⚠️ **Error:** I encountered an issue querying the portfolio: {error_msg}"
        return ChatResponse(answer=friendly_answer, sources=[])

@app.post("/resolve_risk", dependencies=[Depends(verify_api_key)])
async def resolve_risk(req: ResolveRiskRequest):
    """Marks a risk as resolved in the document metadata."""
    db_agent = DBAgent()
    try:
        # Fetch current document
        response = db_agent.client.table("analyses").select("metadata").eq("document_id", req.document_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Document not found.")
            
        metadata = response.data[0].get("metadata", {})
        resolved_risks = metadata.get("resolved_risks", [])
        
        if req.is_resolved:
            if req.risk_title not in resolved_risks:
                resolved_risks.append(req.risk_title)
        else:
            if req.risk_title in resolved_risks:
                resolved_risks.remove(req.risk_title)
                
        metadata["resolved_risks"] = resolved_risks
        
        # Update in database
        db_agent.client.table("analyses").update({"metadata": metadata}).eq("document_id", req.document_id).execute()
        
        return {"status": "success", "resolved_risks": resolved_risks}
    except Exception as e:
        logger.error(f"Failed to resolve risk: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update risk status: {str(e)}")

@app.post("/suggestions", response_model=SuggestionsResponse, dependencies=[Depends(verify_api_key)])
async def get_suggestions(req: SuggestionsRequest):
    """Generates dynamic chat suggestions based on user document portfolio, risks and context."""
    db_agent = DBAgent()
    docs = []
    try:
        response = db_agent.client.table("analyses").select("metadata, summary, risks").eq("user_id", req.user_id).execute()
        docs = response.data
    except Exception as e:
        logger.warning(f"Failed to fetch documents for suggestions: {str(e)}")

    llm_client = LLMClient()

    if not docs:
        system_prompt = (
            "You are an expert legal AI assistant. The user has not uploaded any legal documents yet. "
            "Generate exactly 3 short, relevant, and engaging question suggestions that the user can ask "
            "to explore the platform's capabilities (e.g., how to analyze NDAs, what risks are detected, how formatting is done).\n"
            "Keep each suggestion concise (under 8 words).\n"
            "You MUST return only a valid JSON object with a single key 'suggestions' containing a list of exactly 3 strings.\n"
            "Example:\n"
            "{\n"
            "  \"suggestions\": [\n"
            "    \"What risks can you identify?\",\n"
            "    \"How do I analyze an NDA?\",\n"
            "    \"Can you redraft standard clauses?\"\n"
            "  ]\n"
            "}"
        )
        try:
            res = await llm_client.client.chat.completions.create(
                model=llm_client.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": "Generate 3 startup suggestions."}
                ],
                response_format={"type": "json_object"},
                temperature=0.7
            )
            data = json.loads(res.choices[0].message.content)
            return SuggestionsResponse(suggestions=data.get("suggestions", []))
        except Exception as e:
            logger.error(f"Failed to generate generic startup suggestions: {str(e)}")
            return SuggestionsResponse(suggestions=[
                "How do I analyze an NDA?",
                "What risks can you identify?",
                "Can you redraft standard clauses?"
            ])

    # Construct portfolio context
    context_parts = []
    for idx, doc in enumerate(docs):
        meta = doc.get("metadata", {})
        doc_type = meta.get("document_type", "Document")
        if not doc_type or doc_type.lower() == "unknown":
            doc_type = "Document"
        parties = meta.get("parties", [])
        summary_info = doc.get("summary", {}).get("tldr", "")
        risks = doc.get("risks", [])
        high_risks = [r.get("title") for r in risks if r.get("severity", "").lower() in ["high", "critical"]]
        
        doc_str = f"Document {idx+1} ({doc_type}):\n"
        if parties:
            doc_str += f"- Parties: {', '.join(parties)}\n"
        if summary_info:
            doc_str += f"- Summary: {summary_info}\n"
        if high_risks:
            doc_str += f"- High Risks: {', '.join(high_risks)}\n"
        context_parts.append(doc_str)

    portfolio_context = "\n".join(context_parts)

    system_prompt = (
        "You are an expert AI legal assistant. Based on the user's legal document portfolio below, "
        "generate exactly 3 highly relevant, short, and actionable question or prompt suggestions that the user "
        "can ask the chatbot. These suggestions must directly reference specific documents, parties, or risks "
        "present in the portfolio so the user gets context-aware suggestions (e.g. 'Are there payment risks in the Juris MSA?' "
        "or 'Can you summarize the NDA with TechFlow?').\n"
        "Keep each suggestion extremely concise and to the point (under 10 words).\n"
        "You MUST return only a valid JSON object with a single key 'suggestions' containing a list of exactly 3 strings.\n"
        "Example format:\n"
        "{\n"
        "  \"suggestions\": [\n"
        "    \"Summarize the payment terms in TechFlow MSA\",\n"
        "    \"Explain the liability risk in the NDA\",\n"
        "    \"What is the governing law of the Lease?\"\n"
        "  ]\n"
        "}"
    )

    try:
        res = await llm_client.client.chat.completions.create(
            model=llm_client.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Portfolio Context:\n{portfolio_context}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        data = json.loads(res.choices[0].message.content)
        return SuggestionsResponse(suggestions=data.get("suggestions", []))
    except Exception as e:
        logger.error(f"Failed to generate dynamic suggestions: {str(e)}")
        fallback_suggs = []
        latest_doc = docs[-1]
        meta = latest_doc.get("metadata", {})
        doc_type = meta.get("document_type", "document")
        if not doc_type or doc_type.lower() == "unknown":
            doc_type = "document"
        fallback_suggs.append(f"Summarize my latest {doc_type}")
        fallback_suggs.append(f"Key terms in the {doc_type}")
        risks = latest_doc.get("risks", [])
        if risks:
            fallback_suggs.append(f"Explain the \"{risks[0].get('title')}\" risk")
        else:
            fallback_suggs.append("Are there any liabilities?")
        return SuggestionsResponse(suggestions=fallback_suggs)

class VerifyClauseRequest(BaseModel):
    clause_text: str
    playbook_rules: list[str] = []

@app.post("/verify_clause")
async def verify_clause(request: VerifyClauseRequest):
    """Verifies if an edited contract clause complies with company playbook policies."""
    llm_client = LLMClient()
    try:
        result = await llm_client.verify_clause(request.clause_text, request.playbook_rules)
        return result
    except Exception as e:
        logger.error(f"Clause verification endpoint failed: {str(e)}")
        return {
            "compliant": False,
            "reason": f"⚠️ Rate limit or connection issue: {str(e)}. Please try again."
        }
