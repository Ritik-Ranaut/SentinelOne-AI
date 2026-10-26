import os
from fastapi import APIRouter
from ..models.state import ChatRequest
from ..agents.copilot import chat_with_copilot

router = APIRouter()

@router.post("/chat")
async def chat_copilot(req: ChatRequest):
    response = await chat_with_copilot(
        query=req.query,
        db_context=req.database_context,
        history=req.history
    )
    return {
        "success": True,
        "response": response,
        "model": os.getenv("OLLAMA_MODEL", "qwen3:8b")
    }
