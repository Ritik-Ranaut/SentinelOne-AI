import logging
from typing import Dict, Any, List
from ..models.state import SOCWorkflowState
from ..providers.provider_factory import get_llm_provider
from ..providers.fallback_provider import FallbackRuleProvider

logger = logging.getLogger(__name__)

async def evaluate_risk(state: SOCWorkflowState) -> Dict[str, Any]:
    """Risk Analysis Agent: Calculates deterministic score (0-100) and synthesizes AI explanation."""
    logs = state.normalized_logs or []
    event_types = [l.get("eventType") for l in logs]
    target_ip = state.target_ip or "185.220.101.42"
    target_user = state.target_user or "admin"
    
    score = 0
    breakdown = []
    
    # 1. Authentication Anomalies
    failed_count = event_types.count("LOGIN_FAILED")
    if failed_count >= 3:
        pts = min(30, 15 + (failed_count - 3) * 3)
        score += pts
        breakdown.append({
            "factor": "Authentication Anomalies",
            "points": pts,
            "description": f"{failed_count} repeated authentication failures detected before access."
        })
    elif failed_count > 0:
        score += 10
        breakdown.append({
            "factor": "Authentication Anomalies",
            "points": 10,
            "description": f"{failed_count} failed authentication attempt(s) observed."
        })
        
    # 2. Compromise Follow-through (Login success after failures)
    if "LOGIN_SUCCESS" in event_types and failed_count >= 2:
        score += 15
        breakdown.append({
            "factor": "Compromise Follow-through",
            "points": 15,
            "description": "Successful session established directly following repeated failed attempts."
        })
        
    # 3. Untrusted Origin / Location / Threat Intel
    ti_rep = state.threat_intel_findings.get("reputation", "UNKNOWN")
    has_unusual_loc = "UNUSUAL_LOCATION" in event_types or "SUSPICIOUS_IP" in event_types
    if ti_rep == "MALICIOUS" or target_ip.startswith("185.") or target_ip.startswith("45.") or target_ip.startswith("194.") or has_unusual_loc:
        score += 15
        breakdown.append({
            "factor": "Untrusted Origin IP / Location",
            "points": 15,
            "description": f"Source IP {target_ip} flagged with malicious reputation or anomalous geographical origin."
        })
        
    # 4. Privilege Changes / Admin Access
    if "PRIVILEGE_CHANGE" in event_types or "ADMIN_ACCESS" in event_types:
        score += 25
        breakdown.append({
            "factor": "Privilege Access / Role Alteration",
            "points": 25,
            "description": "Administrative privileges elevated or restricted management resources accessed."
        })
        
    # 5. Large Data Transfer / Download
    if "LARGE_DATA_TRANSFER" in event_types or any(l.get("eventType") == "FILE_DOWNLOAD" for l in logs):
        score += 25
        breakdown.append({
            "factor": "Large Data Exfiltration",
            "points": 25,
            "description": "Anomalous bulk file download or outbound transfer exceeding security threshold."
        })
        
    # 6. Port Scan
    if "PORT_SCAN_SIMULATION" in event_types:
        score += 20
        breakdown.append({
            "factor": "Port Scanning / Reconnaissance",
            "points": 20,
            "description": "Sequential port sweep probing internal enterprise assets."
        })
        
    # 7. Previous Incidents (Historical Correlation)
    hist_findings = state.historical_findings or {}
    if hist_findings.get("has_prior_incidents") or state.context.get("hasPreviousIncidents"):
        score += 15
        breakdown.append({
            "factor": "Previous Incident Precedents",
            "points": 15,
            "description": hist_findings.get("summary") or f"Entity '{target_user}' associated with prior security incidents."
        })
        
    # Fallback minimum if suspicious
    if score == 0 and state.is_suspicious:
        score = 25
        breakdown.append({
            "factor": "Behavioral Anomaly",
            "points": 25,
            "description": "Baseline behavioral variance triggered alert threshold."
        })
        
    final_score = min(100, max(5, score))
    
    severity = "LOW"
    if final_score >= 81:
        severity = "CRITICAL"
    elif final_score >= 61:
        severity = "HIGH"
    elif final_score >= 31:
        severity = "MEDIUM"
        
    factors_summary = ", ".join([f"{b['factor']} (+{b['points']})" for b in breakdown])
    
    # Generate human explanation using LLM or deterministic fallback
    llm = get_llm_provider()
    explanation_source = "DETERMINISTIC_FALLBACK" if isinstance(llm, FallbackRuleProvider) else "LLM"
    prompt = (
        f"Explain why security incident #{state.incident_id} is classified as {severity} risk with a score of {final_score}/100. "
        f"Affected User: {target_user}, Source IP: {target_ip}. "
        f"Contributing mathematical factors: {factors_summary}. "
        f"Write a concise, professional 2-sentence executive summary explaining the evidence."
    )
    
    try:
        explanation = await llm.generate_text(prompt, system_prompt="You are a professional SOC Risk Analysis Agent.")
        if not explanation or len(explanation) < 20:
            raise ValueError("Short response")
    except Exception as exc:
        explanation_source = "DETERMINISTIC_FALLBACK"
        logger.warning("LLM explanation unavailable; using deterministic fallback: %s", exc)
        explanation = (
            f"Risk score increased to {final_score}/100 ({severity}) because account '{target_user}' experienced "
            f"{factors_summary}. The activity originated from {target_ip} and exhibited abnormal telemetry progression."
        )
        
    return {
        "risk_score": final_score,
        "severity": severity,
        "risk_breakdown": breakdown,
        "ai_explanation": explanation.strip(),
        "explanation_source": explanation_source
    }
