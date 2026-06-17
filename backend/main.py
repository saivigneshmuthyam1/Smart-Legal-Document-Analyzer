from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uuid
import logging

from app.models.schemas import AnalyzeTextRequest, FinalAnalysisResponse
from app.services.llm_client import LLMClient
from app.agents.summary_agent import SummaryAgent
from app.agents.risk_agent import RiskAgent
from app.agents.clause_agent import ClauseAgent
from app.agents.db_agent import DBAgent

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="LegalDoc AI Backend")

# Allow frontend to make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm_client = LLMClient()
summary_agent = SummaryAgent()
risk_agent = RiskAgent()
clause_agent = ClauseAgent()
db_agent = DBAgent()

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []

@app.post("/analyze", response_model=FinalAnalysisResponse)
async def analyze_document(request: AnalyzeTextRequest):
    try:
        # LLM parsing
        llm_response = await llm_client.analyze_document(request.content)
        
        # Agent processing
        final_summary = summary_agent.process(llm_response.summary)
        final_risks = risk_agent.process(llm_response.risks)
        final_clauses = clause_agent.process(llm_response.clauses)
        
        doc_id = str(uuid.uuid4())
        
        # Save to DB
        try:
            await db_agent.save_analysis(
                document_id=doc_id,
                user_id="default_user",
                summary=final_summary.model_dump(),
                risks=[r.model_dump() for r in final_risks],
                clauses=final_clauses.model_dump(),
                metadata=llm_response.metadata.model_dump()
            )
        except Exception as db_e:
            logging.warning(f"Failed to save analysis to DB: {db_e}")
            
        return FinalAnalysisResponse(
            document_id=doc_id,
            summary=final_summary,
            risks=final_risks,
            clauses=final_clauses,
            metadata=llm_response.metadata
        )
    except Exception as e:
        logging.error(f"Error during analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(request: ChatRequest):
    # Mocking chatbot backend response
    return {"reply": f"As an AI legal assistant, I acknowledge your query: '{request.message}'. (Integration placeholder)"}

@app.get("/history")
async def get_history():
    return await db_agent.get_history(user_id="default_user")
