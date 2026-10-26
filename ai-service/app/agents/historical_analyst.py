from typing import Dict, Any
from ..models.state import SOCWorkflowState

async def analyze_history(state: SOCWorkflowState) -> Dict[str, Any]:
    """Historical Analysis Agent: Correlates user and IP identity history against prior security incidents."""
    target_user = state.target_user or state.context.get("user", "admin")
    target_ip = state.target_ip or state.context.get("ip", "185.220.101.42")
    context = state.context or {}
    
    # Check context or heuristic indicators for prior incident history
    has_prior_incidents = False
    prior_incident_count = 0
    prior_details = []

    if context.get("hasPreviousIncidents") or context.get("incidentCount", 0) > 0:
        has_prior_incidents = True
        prior_incident_count = context.get("incidentCount", 2)
        prior_details.append(f"Account '{target_user}' associated with {prior_incident_count} prior security incidents in past 90 days.")
    elif target_user in ["admin", "dennis.nedry", "sarah.connor", "jason.dev"]:
        # Known profiles with simulated security history
        has_prior_incidents = True
        prior_incident_count = 1
        prior_details.append(f"Historical telemetry confirms account '{target_user}' was previously targeted in simulated identity probes.")
    
    if target_ip.startswith("185.") or target_ip.startswith("45.") or target_ip.startswith("194."):
        has_prior_incidents = True
        prior_details.append(f"Source IP '{target_ip}' previously flagged in network gateway logs.")
        prior_incident_count = max(prior_incident_count, 1)

    summary = (
        f"Historical correlation identified {prior_incident_count} prior related telemetry alerts for entity '{target_user}' / '{target_ip}'."
        if has_prior_incidents
        else f"Clean entity baseline: No previous high-severity incidents recorded for '{target_user}'."
    )

    return {
        "historical_findings": {
            "has_prior_incidents": has_prior_incidents,
            "prior_incident_count": prior_incident_count,
            "summary": summary,
            "details": prior_details
        }
    }
