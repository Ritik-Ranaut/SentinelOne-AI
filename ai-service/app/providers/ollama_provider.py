import httpx
import json
import logging
import os
from typing import Optional, Dict, Any
from .llm_base import LLMBaseProvider

logger = logging.getLogger(__name__)

class OllamaProvider(LLMBaseProvider):
    def __init__(self, base_url: str = "http://127.0.0.1:11434", model: str = "qwen3:8b"):
        self.base_url = base_url.rstrip('/')
        self.model = model

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        timeout = float(os.getenv("LLM_TIMEOUT_SECONDS", "120"))
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": messages,
                    "stream": False,
                    "options": {"temperature": 0.2}
                }
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("message", {}).get("content", "")

    async def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        text = await self.generate_text(
            f"{prompt}\nIMPORTANT: Respond ONLY with a valid JSON object. Do not include markdown ticks or additional commentary.",
            system_prompt
        )
        clean = text.strip()
        if clean.startswith("```json"):
            clean = clean[7:]
        if clean.startswith("```"):
            clean = clean[3:]
        if clean.endswith("```"):
            clean = clean[:-3]
        return json.loads(clean.strip())
