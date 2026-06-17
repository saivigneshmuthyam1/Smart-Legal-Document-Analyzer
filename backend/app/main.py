import logging
from fastapi import FastAPI, Depends, Request, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.orchestrator import Orchestrator
from app.services.pdf_parser import PDFParser
from app.services.llm_client import LLMClient, MissingAPIKeyError, LLMExecutionError
from app.agents.summary_agent import SummaryAgent
from app.agents.risk_agent import RiskAgent
from app.agents.clause_agent import ClauseAgent
from app.agents.db_agent import DBAgent, MissingDBCredentialsError, DatabaseExecutionError
from app.models.schemas import FinalAnalysisResponse

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("app.main")

app = FastAPI(
    title="Smart Legal Document Analyzer",
    description="A production-ready FastAPI backend for document parsing, risk/clause evaluation, and summary generation.",
    version="1.0.0"
)

# CORS Middleware for client access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependency Injection Setup ---

def get_pdf_parser() -> PDFParser:
    return PDFParser()

def get_llm_client() -> LLMClient:
    return LLMClient()

def get_summary_agent() -> SummaryAgent:
    return SummaryAgent()

def get_risk_agent() -> RiskAgent:
    return RiskAgent()

def get_clause_agent() -> ClauseAgent:
    return ClauseAgent()

def get_db_agent() -> DBAgent:
    return DBAgent()

def get_orchestrator(
    pdf_parser: PDFParser = Depends(get_pdf_parser),
    llm_client: LLMClient = Depends(get_llm_client),
    summary_agent: SummaryAgent = Depends(get_summary_agent),
    risk_agent: RiskAgent = Depends(get_risk_agent),
    clause_agent: ClauseAgent = Depends(get_clause_agent),
    db_agent: DBAgent = Depends(get_db_agent)
) -> Orchestrator:
    return Orchestrator(
        pdf_parser=pdf_parser,
        llm_client=llm_client,
        summary_agent=summary_agent,
        risk_agent=risk_agent,
        clause_agent=clause_agent,
        db_agent=db_agent
    )

# --- Global Exception Handlers ---

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    logger.error(f"Validation / Parsing Error: {str(exc)}")
    return JSONResponse(
        status_code=400,
        content={"detail": f"Input validation failed: {str(exc)}"}
    )

@app.exception_handler(MissingAPIKeyError)
@app.exception_handler(MissingDBCredentialsError)
async def credentials_error_handler(request: Request, exc: Exception):
    logger.critical(f"Configuration / Credential Error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"System Configuration Error: {str(exc)}"}
    )

@app.exception_handler(LLMExecutionError)
async def llm_error_handler(request: Request, exc: LLMExecutionError):
    logger.error(f"LLM Processing Error: {str(exc)}")
    return JSONResponse(
        status_code=502,
        content={"detail": f"LLM client invocation failed: {str(exc)}"}
    )

@app.exception_handler(DatabaseExecutionError)
async def db_error_handler(request: Request, exc: DatabaseExecutionError):
    logger.error(f"Database Storage Error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Database insertion failed: {str(exc)}"}
    )

# --- Routes ---

@app.get("/health")
async def health_check():
    """Simple status check route."""
    return {"status": "ok", "app": "Smart Legal Document Analyzer Backend"}

@app.post("/analyze", response_model=FinalAnalysisResponse)
async def analyze_document(
    request: Request,
    orchestrator: Orchestrator = Depends(get_orchestrator)
):
    """
    POST /analyze endpoint
    Supports application/json for raw text input, and multipart/form-data for PDF file uploads.
    """
    content_type = request.headers.get("content-type", "")
    
    if "multipart/form-data" in content_type:
        try:
            form = await request.form()
            file_item = form.get("file")
            
            if not file_item or not isinstance(file_item, UploadFile):
                raise HTTPException(status_code=400, detail="Missing required form-data field: 'file'.")
                
            file_bytes = await file_item.read()
            if not file_bytes:
                raise HTTPException(status_code=400, detail="Uploaded file is empty.")
                
            # Perform single-pass orchestrator analysis on PDF
            result = await orchestrator.analyze(
                content=file_bytes,
                is_pdf=True,
                filename=file_item.filename
            )
            return result
            
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.exception("Exception occurred during PDF processing")
            raise HTTPException(status_code=400, detail=f"Failed to process PDF: {str(e)}")
            
    elif "application/json" in content_type:
        try:
            body = await request.json()
            input_type = body.get("input_type")
            content = body.get("content")
            
            if input_type != "text" or not content or not isinstance(content, str):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid JSON structure. Expected payload format: {'input_type': 'text', 'content': 'document text'}"
                )
                
            # Perform single-pass orchestrator analysis on raw text
            result = await orchestrator.analyze(content=content, is_pdf=False)
            return result
            
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.exception("Exception occurred during JSON processing")
            raise HTTPException(status_code=400, detail=f"Failed to process JSON body: {str(e)}")
            
    else:
        logger.warning(f"Unsupported content type received: {content_type}")
        raise HTTPException(
            status_code=415,
            detail="Unsupported Media Type. Request content-type must be 'application/json' or 'multipart/form-data'."
        )
