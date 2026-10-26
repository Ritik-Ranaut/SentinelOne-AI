from typing import Dict, Any
from ..models.state import SOCWorkflowState
from ..providers.provider_factory import get_llm_provider

async def plan_investigation(state: SOCWorkflowState) -> Dict[str, Any]:
    """Planner Agent: Analyzes context and establishes targeted investigation paths."""
    logs = state.raw_logs
    context = state.context
    
    plan = [
        "Normalize raw telemetry log stream",
        "Perform signature and behavioral anomaly detection",
        "Correlate entity identities, source IPs, and device fingerprints",
        "Enrich indicators with threat intelligence",
        "Correlate historical entity incident history",
        "Calculate deterministic risk score breakdown",
        "Formulate defensive containment playbooks",
        "Draft executive incident brief"
    ]
    
    required_agents = [
        "Log Analysis Agent",
        "Threat Detection Agent",
        "Investigation Agent",
        "Threat Intelligence Agent",
        "Historical Analysis Agent",
        "Risk Analysis Agent",
        "Response Agent",
        "Report Agent"
    ]
    
    return {
        "investigation_plan": plan,
        "required_agents": required_agents
    }
