import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("sentinel-ai-service")

from .routes import investigate, chat, rag, health

app = FastAPI(
    title="SENTINEL AI - Multi-Agent SOC Intelligence Service",
    description="LangGraph Multi-Agent Security Operations Center backend engine with Ollama & External LLM support.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/ai", tags=["Health"])
app.include_router(investigate.router, prefix="/api/ai", tags=["Investigation"])
app.include_router(chat.router, prefix="/api/ai", tags=["Chat"])
app.include_router(rag.router, prefix="/api/ai", tags=["RAG"])

@app.get("/")
async def root():
    return {
        "service": "SENTINEL AI Multi-Agent Service",
        "docs": "/docs",
        "health": "/api/ai/health"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
