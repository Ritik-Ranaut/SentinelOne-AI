from fastapi import APIRouter
from ..models.state import RAGSearchRequest
from ..rag.policy_retriever import search_policies

router = APIRouter()

@router.post("/rag/search")
async def search_rag(req: RAGSearchRequest):
    results = search_policies(req.query, req.limit)
    return {
        "success": True,
        "results": results
    }
