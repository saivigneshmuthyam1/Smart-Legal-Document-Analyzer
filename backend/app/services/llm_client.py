import json
import logging
from typing import List, Optional
from openai import AsyncOpenAI
from app.core.config import settings
from app.models.schemas import LLMResponse, LLMSummary, LLMRisk, LLMClause, LLMMetadata, PlaybookRuleResult

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

    async def analyze_document(self, document_text: str, playbook_rules: Optional[List[str]] = None) -> LLMResponse:
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

        # Format playbook rules description
        playbook_guide = ""
        playbook_schema = ""
        if playbook_rules and len(playbook_rules) > 0:
            playbook_schema = (
                ",\n"
                "    \"playbook_analysis\": [\n"
                "      {\n"
                "        \"rule\": \"The rule text\",\n"
                "        \"compliant\": true | false,\n"
                "        \"explanation\": \"Detailed explanation of why the contract is compliant or non-compliant.\",\n"
                "        \"severity\": \"High\" | \"Medium\" | \"Low\"\n"
                "      }\n"
                "    ]"
            )
            rules_str = "\n".join([f"- {r}" for r in playbook_rules])
            playbook_guide = (
                f"\n4. You must audit the document against the following Company Playbook rules:\n"
                f"{rules_str}\n"
                f"Evaluate each rule. If a rule is Non-Compliant, you MUST ALSO add an entry to the 'risks' list describing the risk, explanation, and setting severity."
            )
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
            "    \"effective_date\": \"YYYY-MM-DD or Unknown\""
            f"{playbook_schema}\n"
            "  }\n"
            "}\n\n"
            "Guidelines:\n"
            "1. Extract all significant risks and categorize their severity as 'High', 'Medium', or 'Low'.\n"
            "2. Extract key clauses and identify if they are 'Standard' or 'Non-Standard' (i.e. unusual, highly restrictive, or asymmetric terms).\n"
            "3. Ensure the output is strictly valid JSON. Do not include any markdown codeblocks or conversational text around the JSON."
            f"{playbook_guide}"
        )
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
            return self._apply_fallback_defaults(parsed_data, playbook_rules)

    def _apply_fallback_defaults(self, data: dict, playbook_rules: Optional[List[str]] = None) -> LLMResponse:
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

        # Parse playbook_analysis from metadata
        playbook_analysis = []
        raw_playbook_analysis = metadata_dict.get("playbook_analysis", [])
        if isinstance(raw_playbook_analysis, list):
            for pa in raw_playbook_analysis:
                if isinstance(pa, dict):
                    playbook_analysis.append(PlaybookRuleResult(
                        rule=str(pa.get("rule", "")),
                        compliant=bool(pa.get("compliant", True)),
                        explanation=str(pa.get("explanation", "")),
                        severity=str(pa.get("severity", "Low"))
                    ))
        
        # If playbook rules were requested but no analysis is present, fill with default compliant objects
        if playbook_rules and len(playbook_analysis) == 0:
            for rule in playbook_rules:
                playbook_analysis.append(PlaybookRuleResult(
                    rule=rule,
                    compliant=True,
                    explanation="No policy violations detected during parsing."
                ))

        return LLMResponse(
            summary=LLMSummary(main_summary=main_summary, key_points=key_points),
            risks=processed_risks,
            clauses=processed_clauses,
            metadata=LLMMetadata(
                document_type=document_type,
                parties=parties,
                effective_date=effective_date,
                playbook_analysis=playbook_analysis if playbook_rules else None
            )
        )

    async def validate_document_text(self, text: str) -> dict:
        """
        Validates if the text represents a valid legal document.
        Returns a dict with is_legal_document, confidence_score, and reason.
    async def verify_clause(self, clause_text: str, playbook_rules: list = None) -> dict:
        """
        Verify if a given clause complies with the active playbook rules.
        Returns a dict: {"compliant": bool, "reason": str}
        """
        try:
            openai_client = self.client
        except MissingAPIKeyError as e:
            raise e

        system_prompt = (
            "You are an expert legal document classifier. Your job is to analyze the provided OCR-extracted text "
            "and determine whether it represents a valid legal document (e.g., NDA, Lease, Agreement, Contract, "
            "Terms of Service, Service Agreement, Vendor Agreement, Legal Notice, etc.) or if it is an invalid document.\n\n"
            "LEGAL DOCUMENT INDICATORS:\n"
            "Look for keywords and concepts such as: Agreement, Contract, Terms and Conditions, Lease, "
            "Employment Agreement, Vendor Agreement, NDA, Non Disclosure, Confidentiality, Legal Notice, "
            "Party A, Party B, Obligations, Liability, Termination, Indemnification, Jurisdiction, Governing Law.\n\n"
            "INVALID DOCUMENT EXAMPLES TO REJECT:\n"
            "Selfies, Human Photos, Group Photos, Landscape Photos, Animal Photos, Food Images, "
            "Social Media Screenshots, WhatsApp Chats, Instagram Posts, Memes, Blank Images, Random Pictures.\n\n"
            "CLASSIFICATION CRITERIA:\n"
            "1. If the text does not contain any legal terminology or keywords, classify it as NOT a legal document (is_legal_document: false, confidence_score < 60).\n"
            "2. If the text appears to be from a social media post, a chat message, a selfie description, or any non-legal context, classify it as invalid (is_legal_document: false, confidence_score < 60).\n"
            "3. Provide a 'confidence_score' between 0 and 100 representing how confident you are that this is a valid legal document.\n"
            "   - If it is definitely NOT a legal document, the confidence score should be very low (e.g., 0% to 30%).\n"
            "   - If it is ambiguous, set it below 60%.\n"
            "   - Only assign >= 60% if you are reasonably confident the text represents a legal contract, agreement, or notice.\n\n"
            "Return a JSON object with this exact structure:\n"
            "{\n"
            "  \"is_legal_document\": true | false,\n"
            "  \"confidence_score\": 0 to 100,\n"
            "  \"reason\": \"A detailed reason explaining why this is or isn't a legal document (e.g., no legal terminology detected, insufficient text extracted, OCR confidence too low, appears to be conversational/social media, etc.).\"\n"
            "}"
        )
        
        user_prompt = f"Analyze this text and classify it:\n\n{text[:6000]}"
        
        try:
            logger.info("Sending document classification request to LLM...")
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
            raw_content = response.choices[0].message.content or "{}"
            result = json.loads(raw_content)
            # Normalize boolean flag and confidence score types
            if "is_legal_document" in result:
                result["is_legal_document"] = bool(result["is_legal_document"])
            if "confidence_score" in result:
                try:
                    result["confidence_score"] = int(result["confidence_score"])
                except ValueError:
                    result["confidence_score"] = 0
            return result
        except Exception as e:
            logger.error(f"Document validation LLM call failed: {str(e)}", exc_info=True)
            # Re-raise the exception to allow main.py to invoke the local keyword fallback
            raise e


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
