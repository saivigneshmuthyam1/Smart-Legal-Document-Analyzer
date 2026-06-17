import logging
import asyncio
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

class MissingDBCredentialsError(ValueError):
    pass

class DatabaseExecutionError(RuntimeError):
    pass

class DBAgent:
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_KEY
        self._client = None

    @property
    def client(self) -> Client:
        if (
            not self.supabase_url
            or self.supabase_url.strip() == ""
            or not self.supabase_key
            or self.supabase_key.strip() == ""
        ):
            raise MissingDBCredentialsError("Supabase credentials (SUPABASE_URL and SUPABASE_KEY) are not configured in the environment.")
        if self._client is None:
            self._client = create_client(self.supabase_url, self.supabase_key)
        return self._client

    async def save_analysis(
        self,
        document_id: str,
        user_id: str,
        summary: dict,
        risks: list,
        clauses: dict,
        metadata: dict
    ) -> dict:
        """
        Inserts document analysis results into the Supabase 'analyses' table.
        Runs the synchronous database operations in an executor to avoid blocking the event loop.
        """
        try:
            supabase_client = self.client
        except MissingDBCredentialsError as e:
            raise e

        data = {
            "document_id": document_id,
            "user_id": user_id,
            "summary": summary,
            "risks": risks,
            "clauses": clauses,
            "metadata": metadata
        }

        def _execute_insert():
            return supabase_client.table("analyses").insert(data).execute()

        try:
            logger.info(f"Saving analysis for document ID {document_id} to table 'analyses'")
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(None, _execute_insert)
            return response.data
        except Exception as e:
            logger.error(f"Failed to insert analysis records into Supabase: {str(e)}", exc_info=True)
            raise DatabaseExecutionError(f"Database insertion failed: {str(e)}")
