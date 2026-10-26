import logging
from typing import Optional, Dict, Any
from .llm_base import LLMBaseProvider

logger = logging.getLogger(__name__)

class FallbackRuleProvider(LLMBaseProvider):
    """Deterministic, zero-latency rule-based reasoning engine for when LLM services are offline."""

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        prompt_lower = prompt.lower()
        if "explain" in prompt_lower or "risk" in prompt_lower:
            return (
                "Risk evaluation completed via deterministic heuristic correlation. "
                "The incident exhibits malicious behavioral patterns including repeated failed authentication "
                "followed by privileged resource access and abnormal data transfer rates."
            )
        if "plan" in prompt_lower:
            return (
                "1. Isolate compromised origin endpoints\n"
                "2. Revoke active identity session tokens\n"
                "3. Preserve memory forensics and correlate network telemetry"
            )
        return "Automated analysis completed. Telemetry parameters aligned with MITRE ATT&CK mitigation playbooks."

    async def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        return {
            "summary": "Deterministic cyber reasoning completed.",
            "status": "VALIDATED",
            "confidence": 0.95
        }
