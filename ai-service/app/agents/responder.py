from typing import Dict, Any, List
from ..models.state import SOCWorkflowState

async def recommend_responses(state: SOCWorkflowState) -> Dict[str, Any]:
    """Response Agent: Generates defensive playbooks and tags sensitive actions for human approval."""
    risk_score = state.risk_score
    target_ip = state.target_ip or "185.220.101.42"
    target_user = state.target_user or "admin"
    threat = state.detected_threat or "Security Anomaly"
    
    recommendations = []
    
    if risk_score >= 60:
        recommendations.append({
            "action": f"Block IP {target_ip} at Perimeter Firewall",
            "reason": f"Active threat {threat} originating from untrusted address space.",
            "priority": "CRITICAL",
            "requiresApproval": True,
            "target": target_ip,
            "status": "PENDING"
        })
        recommendations.append({
            "action": f"Revoke Active Sessions & Enforce MFA for {target_user}",
            "reason": f"Account '{target_user}' exhibits signs of session hijacking or brute-force compromise.",
            "priority": "HIGH",
            "requiresApproval": True,
            "target": target_user,
            "status": "PENDING"
        })
        recommendations.append({
            "action": "Preserve Forensic Memory Dump & Logs",
            "reason": "Ensure chain of custody for SIEM event investigation.",
            "priority": "MEDIUM",
            "requiresApproval": False,
            "target": target_ip,
            "status": "APPROVED"
        })
    else:
        recommendations.append({
            "action": f"Increase Telemetry Monitoring for {target_user}",
            "reason": "Lower threshold anomaly detected. Observe authentication patterns for 24 hours.",
            "priority": "MEDIUM",
            "requiresApproval": False,
            "target": target_user,
            "status": "APPROVED"
        })
        recommendations.append({
            "action": f"Verify Identity via Out-of-Band Notification",
            "reason": "Confirm user initiated the session activity.",
            "priority": "LOW",
            "requiresApproval": True,
            "target": target_user,
            "status": "PENDING"
        })
        
    return {
        "recommendations": recommendations
    }
