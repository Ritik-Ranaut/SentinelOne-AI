from fastapi import APIRouter, HTTPException
from ..models.state import InvestigateRequest, SOCWorkflowState
from ..graphs.soc_graph import soc_agent_graph

router = APIRouter()

@router.post("/investigate")
async def run_investigation(req: InvestigateRequest):
    try:
        initial_state = SOCWorkflowState(
            incident_id=req.incident_id,
            raw_logs=req.logs,
            context=req.context or {}
        )
        
        # Invoke compiled LangGraph multi-agent workflow
        final_state = await soc_agent_graph.ainvoke(initial_state)
        
        # Convert output state to dict
        result_dict = final_state.dict() if hasattr(final_state, "dict") else dict(final_state)
        
        return {
            "success": True,
            "incident_id": req.incident_id,
            "result": {
                "incidentId": req.incident_id,
                "timeline": result_dict.get("timeline", []),
                "findings": result_dict.get("findings", []),
                "recommendations": result_dict.get("recommendations", []),
                "aiExplanation": result_dict.get("ai_explanation", ""),
                "riskScore": result_dict.get("risk_score", 50),
                "severity": result_dict.get("severity", "MEDIUM"),
                "explanationSource": result_dict.get("explanation_source", "UNKNOWN"),
                "riskBreakdown": result_dict.get("risk_breakdown", []),
                "reportMarkdown": result_dict.get("report_markdown", ""),
                "historicalFindings": result_dict.get("historical_findings", {}),
                "agentExecutions": result_dict.get("agent_executions", [])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
