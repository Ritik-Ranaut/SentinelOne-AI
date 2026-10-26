import os
import logging
from .llm_base import LLMBaseProvider
from .ollama_provider import OllamaProvider
from .openai_provider import OpenAICompatibleProvider
from .fallback_provider import FallbackRuleProvider

logger = logging.getLogger(__name__)

def get_llm_provider() -> LLMBaseProvider:
    provider_name = os.getenv("AI_PROVIDER", "ollama").lower()
    
    if provider_name == "ollama":
        base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
        model = os.getenv("OLLAMA_MODEL", "qwen3:8b")
        return OllamaProvider(base_url=base_url, model=model)
    
    if provider_name in ["openai", "external"]:
        api_key = os.getenv("EXTERNAL_AI_API_KEY", "")
        base_url = os.getenv("EXTERNAL_AI_BASE_URL", "https://api.openai.com/v1")
        model = os.getenv("EXTERNAL_AI_MODEL", "gpt-4o-mini")
        if api_key:
            return OpenAICompatibleProvider(api_key=api_key, base_url=base_url, model=model)
        logger.warning("External AI API key missing, falling back to FallbackRuleProvider")
    
    return FallbackRuleProvider()
