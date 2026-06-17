import uuid
import logging
from app.services.pdf_parser import PDFParser
from app.services.llm_client import LLMClient
from app.agents.summary_agent import SummaryAgent
from app.agents.risk_agent import RiskAgent
from app.agents.clause_agent import ClauseAgent
from app.agents.db_agent import DBAgent
from app.models.schemas import FinalAnalysisResponse

logger = logging.getLogger(__name__)

class Orchestrator:
    def __init__(
        self,
        pdf_parser: PDFParser,
        llm_client: LLMClient,
        summary_agent: SummaryAgent,
        risk_agent: RiskAgent,
        clause_agent: ClauseAgent,
        db_agent: DBAgent
    ):
        self.pdf_parser = pdf_parser
        self.llm_client = llm_client
        self.summary_agent = summary_agent
        self.risk_agent = risk_agent
        self.clause_agent = clause_agent
        self.db_agent = db_agent

    async def analyze(
        self,
        content: bytes | str,
        is_pdf: bool,
        user_id: str = "default_user",
        filename: str = None
    ) -> FinalAnalysisResponse:
        """
        Orchestrates the single-pass document analysis workflow:
        1. Extract text from PDF using PyMuPDF, or use raw text content directly.
        2. Make a single ChatCompletion call to the LLM client requesting JSON mode.
        3. Post-process the components through Summary, Risk, and Clause Agents.
        4. Store the results in Supabase.
        5. Return the finalized structured response.
        """
        # 1. Text extraction
        if is_pdf:
            logger.info("Extracting text from PDF upload...")
            if not isinstance(content, bytes):
                raise ValueError("PDF content must be passed as raw bytes.")
            
            # Save PDF file locally to 'uploads/' directory
            import os
            backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            uploads_dir = os.path.join(backend_root, "uploads")
            os.makedirs(uploads_dir, exist_ok=True)
            
            safe_filename = filename if filename else "document.pdf"
            # Prefix with a random unique ID to avoid namespace collisions
            saved_filename = f"{uuid.uuid4().hex}_{safe_filename}"
            saved_path = os.path.join(uploads_dir, saved_filename)
            
            try:
                with open(saved_path, "wb") as f:
                    f.write(content)
                logger.info(f"Saved uploaded PDF locally to: {saved_path}")
            except Exception as e:
                logger.error(f"Failed to save PDF locally: {str(e)}", exc_info=True)
                
            text = self.pdf_parser.extract_text(content)
        else:
            logger.info("Extracting text from raw string payload...")
            if not isinstance(content, str):
                raise ValueError("Text content must be passed as a string.")
            text = content.strip()

        if not text:
            raise ValueError("No extractable text found in input.")

        # 2. Call LLM exactly once
        logger.info("Triggering single-pass LLM document analysis...")
        llm_response = await self.llm_client.analyze_document(text)

        # 3. Process outputs with specialist agents
        logger.info("Directing parsed elements to respective specialist agents...")
        summary = self.summary_agent.process(llm_response.summary)
        risks = self.risk_agent.process(llm_response.risks)
        clauses = self.clause_agent.process(llm_response.clauses)
        metadata = llm_response.metadata

        # Generate a unique document_id
        document_id = str(uuid.uuid4())

        # 4. Save analysis data to Supabase database
        logger.info(f"Saving analysis to database table 'analyses' with ID: {document_id}")
        await self.db_agent.save_analysis(
            document_id=document_id,
            user_id=user_id,
            summary=summary.model_dump(),
            risks=[r.model_dump() for r in risks],
            clauses=clauses.model_dump(),
            metadata=metadata.model_dump()
        )

        # 5. Build final HTTP payload response
        return FinalAnalysisResponse(
            document_id=document_id,
            summary=summary,
            risks=risks,
            clauses=clauses,
            metadata=metadata
        )
