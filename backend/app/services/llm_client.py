import json
import logging
from openai import AsyncOpenAI
from app.core.config import settings
from app.models.schemas import LLMResponse, LLMSummary, LLMRisk, LLMClause, LLMMetadata

logger = logging.getLogger(__name__)

class MissingAPIKeyError(ValueError):
    pass

class LLMExecutionError(RuntimeError):
    pass

class LLMClient:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
        self._client = None

    @property
    def client(self) -> AsyncOpenAI:
        if not self.api_key or self.api_key.strip() == "":
            raise MissingAPIKeyError("OpenAI API Key is missing or not configured in the environment.")
        if self._client is None:
            client_kwargs = {"api_key": self.api_key}
            if settings.OPENAI_BASE_URL and settings.OPENAI_BASE_URL.strip():
                client_kwargs["base_url"] = settings.OPENAI_BASE_URL.strip()
            self._client = AsyncOpenAI(**client_kwargs)
        return self._client

    async def analyze_document(self, document_text: str, playbook_rules: list = None) -> LLMResponse:
        """
        Calls OpenAI ChatCompletion in JSON mode exactly once to parse the document text.
        Applies fallback validation and defaults if some fields are missing.
        """
        # Validate API Key exists
        try:
            openai_client = self.client
        except MissingAPIKeyError as e:
            raise e

        playbook_str = ""
        if playbook_rules and len(playbook_rules) > 0:
            rules_list = "\n".join([f"- {r}" for r in playbook_rules])
            playbook_str = f"\n\nCRITICAL PLAYBOOK RULES TO ENFORCE:\nThe user has defined the following specific legal policies. You MUST evaluate the document against these rules. If any rule is violated, flag it as a 'High' severity risk and specifically mention the playbook violation in the description.\n{rules_list}\n"

        # Construct one single mega-prompt
        system_prompt = (
            "You are an expert legal document analyzer. You must analyze the legal document text provided "
            "and return a JSON object that strictly adheres to the following structure:\n\n"
            "{\n"
            "  \"summary\": {\n"
            "    \"main_summary\": \"A comprehensive description of what this agreement is, its main purpose, etc.\",\n"
            "    \"key_points\": [\"point 1\", \"point 2\"]\n"
            "  },\n"
            "  \"risks\": [\n"
            "    {\n"
            "      \"title\": \"Short risk name\",\n"
            "      \"description\": \"Detailed explanation of the risk to the parties.\",\n"
            "      \"severity\": \"High\" | \"Medium\" | \"Low\"\n"
            "    }\n"
            "  ],\n"
            "  \"clauses\": [\n"
            "    {\n"
            "      \"title\": \"Clause title (e.g. Indemnification)\",\n"
            "      \"content\": \"Full text or specific context of the clause as present in document\",\n"
            "      \"type\": \"Standard\" | \"Non-Standard\"\n"
            "    }\n"
            "  ],\n"
            "  \"metadata\": {\n"
            "    \"document_type\": \"e.g. Non-Disclosure Agreement, Master Services Agreement, Lease\",\n"
            "    \"parties\": [\"Party A\", \"Party B\"],\n"
            "    \"effective_date\": \"YYYY-MM-DD or Unknown\"\n"
            "  }\n"
            "}\n\n"
            "Guidelines:\n"
            "1. Extract all significant risks and categorize their severity as 'High', 'Medium', or 'Low'.\n"
            "2. Extract key clauses and identify if they are 'Standard' or 'Non-Standard' (i.e. unusual, highly restrictive, or asymmetric terms).\n"
            "3. Ensure the output is strictly valid JSON. Do not include any markdown codeblocks or conversational text around the JSON."
        ) + playbook_str

        user_prompt = f"Here is the legal document to analyze:\n\n{document_text}"

        try:
            logger.info(f"Sending request to OpenAI model: {self.model}")
            response = await openai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
        except Exception as e:
            logger.error(f"OpenAI API call failed: {str(e)}", exc_info=True)
            raise LLMExecutionError(f"OpenAI API call failed: {str(e)}")

        raw_content = response.choices[0].message.content
        if not raw_content:
            raise LLMExecutionError("OpenAI returned an empty response.")

        # Parse and validate response
        try:
            parsed_data = json.loads(raw_content)
        except Exception as e:
            logger.error(f"Failed to parse LLM response as JSON: {str(e)}\nRaw Response: {raw_content}")
            raise LLMExecutionError(f"LLM returned invalid JSON format: {str(e)}")

        # Validate with Pydantic and apply fallback defaults if elements are missing
        try:
            return LLMResponse.model_validate(parsed_data)
        except Exception as ve:
            logger.warning(f"Pydantic validation failed for LLM response, applying fallback defaults: {str(ve)}")
            return self._apply_fallback_defaults(parsed_data)

    def _apply_fallback_defaults(self, data: dict) -> LLMResponse:
        """Helper to construct a valid LLMResponse by applying defaults to missing or malformed keys."""
        summary_dict = data.get("summary", {}) if isinstance(data.get("summary"), dict) else {}
        risks_list = data.get("risks", []) if isinstance(data.get("risks"), list) else []
        clauses_list = data.get("clauses", []) if isinstance(data.get("clauses"), list) else []
        metadata_dict = data.get("metadata", {}) if isinstance(data.get("metadata"), dict) else {}

        # 1. Summary Fallbacks
        main_summary = summary_dict.get("main_summary", "Summary could not be fully parsed from document content.")
        key_points = summary_dict.get("key_points", [])
        if not isinstance(key_points, list):
            key_points = []
        key_points = [str(kp) for kp in key_points if kp]

        # 2. Risks Fallbacks
        processed_risks = []
        for risk in risks_list:
            if isinstance(risk, dict):
                processed_risks.append(LLMRisk(
                    title=str(risk.get("title", "Unspecified Risk")),
                    description=str(risk.get("description", "No description provided.")),
                    severity=str(risk.get("severity", "Low"))
                ))

        # 3. Clauses Fallbacks
        processed_clauses = []
        for clause in clauses_list:
            if isinstance(clause, dict):
                processed_clauses.append(LLMClause(
                    title=str(clause.get("title", "Unspecified Clause")),
                    content=str(clause.get("content", "")),
                    type=str(clause.get("type", "Standard"))
                ))

        # 4. Metadata Fallbacks
        document_type = metadata_dict.get("document_type", "Unknown Document Type")
        parties = metadata_dict.get("parties", [])
        if not isinstance(parties, list):
            parties = []
        parties = [str(p) for p in parties if p]
        effective_date = metadata_dict.get("effective_date", "Unknown Effective Date")

        return LLMResponse(
            summary=LLMSummary(main_summary=main_summary, key_points=key_points),
            risks=processed_risks,
            clauses=processed_clauses,
            metadata=LLMMetadata(
                document_type=document_type,
                parties=parties,
                effective_date=effective_date
            )
        )

    async def verify_clause(self, clause_text: str, playbook_rules: list = None) -> dict:
        """
        Verify if a given clause complies with the active playbook rules.
        Returns a dict: {"compliant": bool, "reason": str}
        """
        try:
            openai_client = self.client
        except MissingAPIKeyError as e:
            raise e

        rules_list = "\n".join([f"- {r}" for r in (playbook_rules or [])])
        
        system_prompt = (
            "You are an expert legal auditor. You must evaluate the provided contract clause "
            "against the user's specific playbook policies. You must determine if the clause "
            "strictly complies with all of the rules, or if it violates any of them.\n\n"
            "You MUST respond ONLY with a JSON object in the following format:\n"
            "{\n"
            "  \"compliant\": true | false,\n"
            "  \"reason\": \"If compliant, explain why it satisfies the policies. If not, explain exactly which rule(s) it violates and how it can be fixed.\"\n"
            "}\n\n"
            "Ensure the output is strictly valid JSON. Do not include any markdown formatting, backticks, or other text outside the JSON."
        )

        user_prompt = f"Active Playbook Rules:\n{rules_list}\n\nClause Text to Verify:\n\"{clause_text}\""

        try:
            logger.info(f"Sending verification request to model: {self.model}")
            response = await openai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            raw_content = response.choices[0].message.content
            parsed = json.loads(raw_content)
            return {
                "compliant": bool(parsed.get("compliant", True)),
                "reason": str(parsed.get("reason", "Verification complete."))
            }
        except Exception as e:
            logger.error(f"Failed to verify clause: {str(e)}", exc_info=True)
            return {
                "compliant": False,
                "reason": f"System error during verification: {str(e)}"
            }
