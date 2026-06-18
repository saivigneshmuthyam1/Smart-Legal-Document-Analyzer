"""
Smart Legal Document Analyzer — FastAPI Backend Server
Provides endpoints for document analysis, history, and AI chat.
"""
import uuid
import json
import asyncio
import logging
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.services.llm_client import LLMClient, MissingAPIKeyError, LLMExecutionError
from app.services.pdf_parser import PDFParser
from app.agents.summary_agent import SummaryAgent
from app.agents.risk_agent import RiskAgent
from app.agents.clause_agent import ClauseAgent
from app.agents.db_agent import DBAgent, MissingDBCredentialsError, DatabaseExecutionError
from app.models.schemas import FinalAnalysisResponse, AnalyzeTextRequest, AnalyzeImageRequest
from app.core.config import settings

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Smart Legal Document Analyzer API",
    description="AI-powered legal document analysis with clause extraction, risk assessment, and chatbot.",
    version="1.0.0",
)

# CORS — allow frontend dev server and common deployment origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Singleton services
# ---------------------------------------------------------------------------
llm_client = LLMClient()
pdf_parser = PDFParser()
summary_agent = SummaryAgent()
risk_agent = RiskAgent()
clause_agent = ClauseAgent()
db_agent = DBAgent()


# ---------------------------------------------------------------------------
# Helper: run full analysis pipeline
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Helper: run full analysis pipeline
# ---------------------------------------------------------------------------
async def _run_analysis_pipeline(
    document_text: str,
    user_id: str = "default_user",
    playbook_rules: Optional[list] = None,
    image_metadata: Optional[dict] = None
) -> dict:
    """Run LLM analysis, post-process with agents, save to DB, return result."""
    # 1) LLM analysis
    try:
        llm_response = await llm_client.analyze_document(document_text, playbook_rules=playbook_rules)
    except MissingAPIKeyError:
        raise HTTPException(status_code=500, detail="OpenAI API key is not configured on the server.")
    except LLMExecutionError as e:
        raise HTTPException(status_code=502, detail=f"LLM analysis failed: {str(e)}")

    # 2) Post-process with agents
    final_summary = summary_agent.process(llm_response.summary)
    final_risks = risk_agent.process(llm_response.risks)
    final_clauses = clause_agent.process(llm_response.clauses)

    # Update metadata if this is an image analysis
    meta = llm_response.metadata
    if image_metadata:
        meta.is_image_analysis = True
        meta.image_base64 = image_metadata.get("image_base64")
        meta.ocr_confidence = image_metadata.get("ocr_confidence")
        meta.image_quality_score = image_metadata.get("image_quality_score")
        meta.document_confidence_score = image_metadata.get("document_confidence_score")
        meta.extracted_ocr_text = image_metadata.get("extracted_ocr_text")

    # 3) Build response
    document_id = str(uuid.uuid4())
    analysis_response = FinalAnalysisResponse(
        document_id=document_id,
        summary=final_summary,
        risks=final_risks,
        clauses=final_clauses,
        metadata=meta,
    )

    # 4) Persist to Supabase (best-effort — don't block the user if DB is down)
    try:
        await db_agent.save_analysis(
            document_id=document_id,
            user_id=user_id,
            summary=final_summary.model_dump(),
            risks=[r.model_dump() for r in final_risks],
            clauses=final_clauses.model_dump(),
            metadata=meta.model_dump(),
        )
        logger.info(f"Analysis saved to DB: {document_id}")
    except (MissingDBCredentialsError, DatabaseExecutionError) as e:
        logger.warning(f"DB save skipped: {str(e)}")

    return analysis_response.model_dump()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
async def health_check():
    return {"status": "ok", "service": "Smart Legal Document Analyzer API"}


# ---- Analyze Text ----
@app.post("/analyze")
async def analyze_text(
    request: AnalyzeTextRequest,
    user_id: str = Query(default="default_user"),
):
    """Analyze raw legal text."""
    if not request.content or not request.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty.")
    return await _run_analysis_pipeline(request.content.strip(), user_id=user_id, playbook_rules=request.playbook_rules)


# ---- Analyze Image ----
@app.post("/analyze/image")
async def analyze_image(
    request: AnalyzeImageRequest,
    user_id: str = Query(default="default_user"),
):
    """Analyze OCR-extracted text from an image after validating it is a legal document."""
    text_content = request.content.strip() if request.content else ""
    if not text_content:
        raise HTTPException(status_code=400, detail="Extracted document text cannot be empty.")

    # 1) Document Validation Check
    try:
        validation_result = await llm_client.validate_document_text(text_content)
    except Exception as e:
        logger.error(f"Error during document classification: {str(e)}", exc_info=True)
        # Fallback to local keyword validation if LLM is unavailable
        legal_keywords = [
            "agreement", "contract", "terms and conditions", "lease", "employment agreement",
            "vendor agreement", "nda", "non disclosure", "confidentiality", "legal notice",
            "party a", "party b", "obligations", "liability", "termination",
            "indemnification", "jurisdiction", "governing law"
        ]
        text_lower = text_content.lower()
        matched_keywords = [kw for kw in legal_keywords if kw in text_lower]
        match_count = len(matched_keywords)
        
        if match_count >= 2:
            validation_result = {
                "is_legal_document": True,
                "confidence_score": min(100, 50 + match_count * 10),
                "reason": f"Passed validation via keyword scanning fallback (matched keywords: {', '.join(matched_keywords)})."
            }
        else:
            validation_result = {
                "is_legal_document": False,
                "confidence_score": max(0, match_count * 20),
                "reason": f"Failed validation via keyword scanning fallback: insufficient legal terms detected (matched keywords: {', '.join(matched_keywords) if matched_keywords else 'none'})."
            }

    is_legal = validation_result.get("is_legal_document", False)
    confidence = validation_result.get("confidence_score", 0)
    reason = validation_result.get("reason", "No reason provided by AI.")

    if not is_legal or confidence < 60:
        return {
            "status": "invalid_document",
            "confidence_score": f"{confidence}%",
            "reason": reason
        }

    # 2) Valid legal document: Run regular analysis pipeline with custom image metadata
    image_metadata = {
        "image_base64": request.image_base64,
        "ocr_confidence": request.ocr_confidence,
        "image_quality_score": request.image_quality_score,
        "document_confidence_score": f"{confidence}%",
        "extracted_ocr_text": text_content
    }

    result = await _run_analysis_pipeline(
        document_text=text_content,
        user_id=user_id,
        playbook_rules=request.playbook_rules,
        image_metadata=image_metadata
    )
    result["status"] = "success"
    return result


# ---- Analyze PDF ----
@app.post("/analyze/pdf")
async def analyze_pdf(
    file: UploadFile = File(...),
    user_id: str = Query(default="default_user"),
    playbook_rules: Optional[str] = Query(default=None),
):
    """Upload and analyze a PDF document."""
    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    # Read file bytes
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {str(e)}")

    # Validate size (50 MB max)
    if len(file_bytes) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds the 50 MB limit.")

    # Extract text
    try:
        text = pdf_parser.extract_text(file_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"PDF parsing error: {str(e)}")

    # Parse playbook rules from JSON string if provided
    rules = None
    if playbook_rules:
        try:
            rules = json.loads(playbook_rules)
        except Exception:
            rules = [playbook_rules]

    return await _run_analysis_pipeline(text, user_id=user_id, playbook_rules=rules)



# ---- Get Analysis History ----
@app.get("/history")
async def get_history(user_id: str = Query(default="default_user")):
    """Fetch all analyses for a user from Supabase, newest first."""
    try:
        supabase = db_agent.client
    except MissingDBCredentialsError:
        raise HTTPException(status_code=500, detail="Database credentials are not configured.")

    try:
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: supabase.table("analyses")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
        )
        return {"history": response.data or []}
    except Exception as e:
        logger.error(f"Failed to fetch history: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")


# ---- Get Single Analysis ----
@app.get("/analysis/{document_id}")
async def get_analysis(document_id: str):
    """Fetch a single analysis by document_id."""
    try:
        supabase = db_agent.client
    except MissingDBCredentialsError:
        raise HTTPException(status_code=500, detail="Database credentials are not configured.")

    try:
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: supabase.table("analyses")
                .select("*")
                .eq("document_id", document_id)
                .single()
                .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Analysis not found.")
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch analysis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch analysis: {str(e)}")


# ---- Delete Analysis ----
@app.delete("/analysis/{document_id}")
async def delete_analysis(document_id: str):
    """Delete an analysis by document_id."""
    try:
        supabase = db_agent.client
    except MissingDBCredentialsError:
        raise HTTPException(status_code=500, detail="Database credentials are not configured.")

    try:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            None,
            lambda: supabase.table("analyses")
                .delete()
                .eq("document_id", document_id)
                .execute()
        )
        return {"status": "deleted", "document_id": document_id}
    except Exception as e:
        logger.error(f"Failed to delete analysis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete analysis: {str(e)}")


# ---- Update Analysis ----
class UpdateAnalysisRequest(BaseModel):
    summary: Optional[dict] = None
    risks: Optional[list] = None
    clauses: Optional[dict] = None
    metadata: Optional[dict] = None

@app.put("/analysis/{document_id}")
async def update_analysis(document_id: str, request: UpdateAnalysisRequest):
    """Update a document analysis (e.g., risk resolution state, pinning, etc.)."""
    try:
        supabase = db_agent.client
    except MissingDBCredentialsError:
        raise HTTPException(status_code=500, detail="Database credentials are not configured.")

    try:
        # Fetch current data first
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: supabase.table("analyses")
                .select("*")
                .eq("document_id", document_id)
                .single()
                .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Analysis not found.")
        
        current_data = response.data
        update_data = {}
        
        if request.summary is not None:
            update_data["summary"] = request.summary
        if request.risks is not None:
            update_data["risks"] = request.risks
        if request.clauses is not None:
            update_data["clauses"] = request.clauses
        if request.metadata is not None:
            update_data["metadata"] = request.metadata
            
        if not update_data:
            return current_data

        update_response = await loop.run_in_executor(
            None,
            lambda: supabase.table("analyses")
                .update(update_data)
                .eq("document_id", document_id)
                .execute()
        )
        return update_response.data[0] if update_response.data else current_data
    except Exception as e:
        logger.error(f"Failed to update analysis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update analysis: {str(e)}")


# ---- Redraft Clause ----
class RedraftRequest(BaseModel):
    clause_title: str
    clause_content: str
    redraft_instruction: Optional[str] = ""

@app.post("/redraft")
async def redraft_clause(request: RedraftRequest):
    """Generate a balanced, legally standard redraft suggestion for a clause."""
    try:
        openai_client = llm_client.client
    except MissingAPIKeyError:
        raise HTTPException(status_code=500, detail="OpenAI API key is not configured.")

    system_prompt = (
        "You are an expert legal counsel. You have been asked to redraft a counterparty's clause to be "
        "more balanced, mutual, commercially reasonable, and aligned with standard industry practices. "
        "Provide a clean, professional legal text that can replace the clause. "
        "Do not include comments, explanations, greeting, or conversational filler. Output ONLY the redrafted clause text."
    )
    
    instruction_clause = request.redraft_instruction or "Make it balanced, neutral, and commercially standard."
    user_prompt = (
        f"Clause Title: {request.clause_title}\n"
        f"Original Text:\n\"{request.clause_content}\"\n\n"
        f"Redraft Goal: {instruction_clause}\n\n"
        "Draft the revised clause now:"
    )

    try:
        response = await openai_client.chat.completions.create(
            model=llm_client.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=1500,
        )
        redraft_text = response.choices[0].message.content or "Failed to draft redraft suggestion."
        return {"original_content": request.clause_content, "redrafted_content": redraft_text.strip()}
    except Exception as e:
        logger.error(f"Redraft LLM call failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=502, detail=f"AI redrafting failed: {str(e)}")


# ---- Chat with Document ----
class ChatRequest(BaseModel):
    document_id: str
    question: str
    context: str = ""  # document summary / text context


@app.post("/chat")
async def chat_with_document(request: ChatRequest):
    """Ask a question about an analyzed document or the entire portfolio using the LLM."""
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # Setup System Prompt
    is_global = request.document_id == "global"
    if is_global:
        system_prompt = (
            "You are an expert legal assistant. You have access to the legal document analysis summaries and metadata "
            "for the user's entire legal contract portfolio. "
            "Answer the user's question accurately and concisely across their documents. "
            "Name the specific documents and parties involved whenever answering questions about specific obligations, dates, or values."
        )
    else:
        system_prompt = (
            "You are an expert legal assistant. You have been given the context of a legal document analysis. "
            "Answer the user's question accurately and concisely based on the provided context. "
            "If the context is insufficient to answer, say so clearly. "
            "Always cite relevant sections or clauses when possible."
        )

    # Gather Context
    context = request.context
    if not context.strip():
        try:
            supabase = db_agent.client
            loop = asyncio.get_running_loop()
            
            if is_global:
                # Fetch all documents summary/metadata for portfolio-wide querying
                response = await loop.run_in_executor(
                    None,
                    lambda: supabase.table("analyses")
                        .select("document_id, summary, metadata")
                        .execute()
                )
                if response.data:
                    context_items = []
                    for idx, doc in enumerate(response.data):
                        meta = doc.get("metadata", {})
                        summary = doc.get("summary", {})
                        parties = meta.get("parties", [])
                        doc_type = meta.get("document_type", "Unknown Document")
                        doc_desc = f"Document #{idx+1}: {doc_type} between {', '.join(parties)}"
                        doc_sum = summary.get("main_summary", "No summary.")
                        context_items.append(f"{doc_desc}\nID: {doc.get('document_id')}\nSummary: {doc_sum}\n")
                    context = "\n---\n".join(context_items)
            else:
                # Fetch single document context
                response = await loop.run_in_executor(
                    None,
                    lambda: supabase.table("analyses")
                        .select("summary, risks, clauses, metadata")
                        .eq("document_id", request.document_id)
                        .single()
                        .execute()
                )
                if response.data:
                    context = json.dumps(response.data, indent=2)
        except Exception as e:
            logger.warning(f"Could not fetch document context from DB: {str(e)}")

    user_prompt = f"Document Portfolio Context:\n{context}\n\nUser Question: {request.question}" if is_global else f"Document Context:\n{context}\n\nUser Question: {request.question}"

    try:
        openai_client = llm_client.client
        response = await openai_client.chat.completions.create(
            model=llm_client.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=1000,
        )
        answer = response.choices[0].message.content or "I couldn't generate a response."
        return {"answer": answer, "document_id": request.document_id}
    except MissingAPIKeyError:
        raise HTTPException(status_code=500, detail="OpenAI API key is not configured.")
    except Exception as e:
        logger.error(f"Chat LLM call failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=502, detail=f"AI chat failed: {str(e)}")


# ---- Support & System Status API Models ----
class TicketRequest(BaseModel):
    name: str
    email: str
    subject: str
    message: str

class BugRequest(BaseModel):
    title: str
    description: str
    steps_to_reproduce: str
    severity: str

class FeatureRequest(BaseModel):
    title: str
    description: str
    business_impact: str


# ---- System Status ----
@app.get("/status")
async def get_system_status():
    """Retrieve health status of backend, database, and AI service."""
    # 1) Database check
    db_status = "offline"
    try:
        if db_agent.client:
            db_status = "online"
    except Exception as e:
        logger.warning(f"Database status check failed: {str(e)}")

    # 2) AI Service check
    ai_status = "offline"
    try:
        if llm_client.api_key and llm_client.api_key.strip():
            ai_status = "online"
    except Exception:
        pass

    return {
        "status": "ok",
        "database": db_status,
        "ai_service": ai_status,
    }


# ---- Support Ticket ----
@app.post("/support/ticket")
async def create_support_ticket(request: TicketRequest):
    """Receive and log a support ticket."""
    logger.info(f"Support Ticket received: {request.subject} from {request.name} ({request.email})")
    return {"status": "success", "message": "Support ticket received successfully."}


# ---- Bug Report ----
@app.post("/support/bug")
async def report_bug(request: BugRequest):
    """Receive and log a bug report."""
    logger.info(f"Bug Report received: {request.title} [Severity: {request.severity}]")
    return {"status": "success", "message": "Bug report received successfully."}


# ---- Feature Request ----
@app.post("/support/feature")
async def request_feature(request: FeatureRequest):
    """Receive and log a feature request."""
    logger.info(f"Feature Request received: {request.title}")

async def compare_documents(
    file_original: UploadFile = File(...),
    file_revised: UploadFile = File(...),
):
    """Compare two PDF contracts and highlight the semantic risk changes."""
    # Validate file types
    if not file_original.filename or not file_original.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Original file must be a PDF.")
    if not file_revised.filename or not file_revised.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Revised file must be a PDF.")

    # Read bytes
    try:
        orig_bytes = await file_original.read()
        rev_bytes = await file_revised.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read files: {str(e)}")

    # Extract texts
    try:
        text_orig = pdf_parser.extract_text(orig_bytes)
        text_rev = pdf_parser.extract_text(rev_bytes)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"PDF parsing error: {str(e)}")

    # Call LLM
    try:
        openai_client = llm_client.client
    except MissingAPIKeyError:
        raise HTTPException(status_code=500, detail="OpenAI API key is not configured.")

    system_prompt = (
        "You are an expert legal counsel. You have been asked to perform a semantic comparison between "
        "the original contract draft and a revised/counterparty-redlined contract. "
        "Compare the two documents and return a JSON object with the following structure:\n\n"
        "{\n"
        "  \"change_summary\": \"High-level executive summary of the changes and overall risk impact.\",\n"
        "  \"changes\": [\n"
        "    {\n"
        "      \"clause_title\": \"Name of the clause or section (e.g. Limitation of Liability)\",\n"
        "      \"original_text\": \"The exact or summarized text in the original version.\",\n"
        "      \"revised_text\": \"The exact or summarized text in the revised version.\",\n"
        "      \"semantic_impact\": \"Details of what this modification means legally, commercially, and operationally, highlighting shift in risk.\",\n"
        "      \"risk_change\": \"Increased\" | \"Decreased\" | \"Neutral\",\n"
        "      \"severity\": \"High\" | \"Medium\" | \"Low\" | \"None\"\n"
        "    }\n"
        "  ]\n"
        "}\n\n"
        "Guidelines:\n"
        "1. Focus on material semantic changes, not minor grammatical edits.\n"
        "2. Make sure the output is strictly valid JSON."
    )

    user_prompt = (
        f"Original Contract:\n{text_orig[:15000]}\n\n"
        f"Revised/Redline Contract:\n{text_rev[:15000]}\n\n"
        "Run the comparison now:"
    )

    try:
        response = await openai_client.chat.completions.create(
            model=llm_client.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=2000,
        )
        raw_result = response.choices[0].message.content or "{}"
        return json.loads(raw_result)
    except Exception as e:
        logger.error(f"Compare LLM call failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=502, detail=f"AI comparison failed: {str(e)}")


# ---- Template Drafting ----
class DraftRequest(BaseModel):
    template_type: str
    parameters: dict
    user_message: Optional[str] = ""
    current_draft: Optional[str] = ""

@app.post("/draft")
async def draft_contract(request: DraftRequest):
    """Draft or refine a contract based on a template and user parameters."""
    try:
        openai_client = llm_client.client
    except MissingAPIKeyError:
        raise HTTPException(status_code=500, detail="OpenAI API key is not configured.")

    system_prompt = (
        "You are an expert contract lawyer and legal draftsman. "
        "Generate a highly professional, complete, and legally standard contract based on the requested template and parameters. "
        "If a current draft is provided, refine it based on the user's instructions while keeping the rest of the contract text intact. "
        "Do not include conversational filler, greetings, comments, or markdown explanations. Output ONLY the raw contract text, structured with standard legal numbering (Section 1, Section 2, etc.)."
    )

    if request.current_draft and request.user_message:
        user_prompt = (
            f"Current Contract Draft:\n{request.current_draft}\n\n"
            f"Refinement Request: {request.user_message}\n\n"
            "Generate the refined contract text:"
        )
    else:
        params_str = "\n".join([f"- {k}: {v}" for k, v in request.parameters.items()])
        user_prompt = (
            f"Template Type: {request.template_type}\n"
            f"Parameters:\n{params_str}\n\n"
            "Draft the contract now:"
        )

    try:
        response = await openai_client.chat.completions.create(
            model=llm_client.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=3000,
        )
        draft_text = response.choices[0].message.content or "Failed to draft contract."
        return {"draft": draft_text.strip()}
    except Exception as e:
        logger.error(f"Draft LLM call failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=502, detail=f"AI drafting failed: {str(e)}")


# ---------------------------------------------------------------------------
# Run with: uvicorn main:app --reload
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

