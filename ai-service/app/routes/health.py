import os
import httpx
from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    provider = os.getenv("AI_PROVIDER", "ollama").lower()
    provider_status = "AVAILABLE"
    model = "rule-based-fallback"

    if provider == "ollama":
        model = os.getenv("OLLAMA_MODEL", "qwen3:8b")
        base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                response = await client.get(f"{base_url}/api/tags")
                response.raise_for_status()
                models = response.json().get("models", [])
                provider_status = "AVAILABLE" if any(item.get("name") == model for item in models) else "MODEL_NOT_FOUND"
        except (httpx.HTTPError, ValueError):
            provider_status = "UNAVAILABLE"
    elif provider in {"openai", "external"}:
        model = os.getenv("EXTERNAL_AI_MODEL", "gpt-4o-mini")
        provider_status = "CONFIGURED" if os.getenv("EXTERNAL_AI_API_KEY") else "MISSING_CREDENTIALS"
    else:
        provider = "fallback"

    return {
        "status": "HEALTHY" if provider_status in {"AVAILABLE", "CONFIGURED"} else "DEGRADED",
        "service": "SENTINEL AI LangGraph Engine",
        "provider": provider,
        "model": model,
        "providerStatus": provider_status,
        "fallbackAvailable": True,
        "langgraph_version": "0.0.55+"
    }
