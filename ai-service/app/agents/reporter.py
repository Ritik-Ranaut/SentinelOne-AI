from typing import Dict, Any
from datetime import datetime, timezone
from ..models.state import SOCWorkflowState

async def generate_report(state: SOCWorkflowState) -> Dict[str, Any]:
    """Report Agent: Synthesizes final forensic incident report and executive summary."""
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    
    findings = [
        {"agentName": "Planner Agent", "summary": f"Scoped investigation with {len(state.investigation_plan)} targeted phases."},
        {"agentName": "Log Analysis Agent", "summary": f"Identified {len(state.log_anomalies)} telemetry anomalies."},
        {"agentName": "Threat Detection Agent", "summary": f"Mapped signature to {state.mitre_technique or 'T1078'} ({state.detected_threat})."},
        {"agentName": "Investigation Agent", "summary": f"Reconstructed chronological timeline of {len(state.timeline)} correlated events."},
        {"agentName": "Threat Intelligence Agent", "summary": state.threat_intel_findings.get("summary", "IOC checked.")},
        {"agentName": "Historical Analysis Agent", "summary": state.historical_findings.get("summary", "Historical incident check nominal.")},
        {"agentName": "Risk Analysis Agent", "summary": f"Calculated explainable risk score: {state.risk_score}/100 ({state.severity})."},
        {"agentName": "Response Agent", "summary": f"Recommended {len(state.recommendations)} containment actions."}
    ]
    
    exec_summary = (
        f"Automated multi-agent investigation completed for Incident #{state.incident_id}. "
        f"Classified as {state.severity} severity with risk score {state.risk_score}/100. "
        f"Primary threat identified as {state.detected_threat} targeting user '{state.target_user}'. "
        f"Defensive response playbooks have been queued for SOC analyst authorization."
    )
    
    timeline_text = "\n".join([f"- **{t.get('timeFormatted')}**: {t.get('event')} ({t.get('details')})" for t in state.timeline])
    recs_text = "\n".join([f"- **{r.get('action')}** (Priority: {r.get('priority')}) - {r.get('reason')}" for r in state.recommendations])
    
    markdown_report = f"""# SENTINEL AI Incident Report: #{state.incident_id}
**Classification**: {state.severity} | **Risk Score**: {state.risk_score}/100 | **Generated**: {now_str}

## Executive Summary
{exec_summary}

## Incident Details
- **Affected User**: {state.target_user}
- **Source IP**: {state.target_ip}
- **Threat Vector**: {state.detected_threat}
- **MITRE ATT&CK**: {state.mitre_technique}

## AI Explanation
{state.ai_explanation}

## Forensic Timeline
{timeline_text or "- No telemetry timeline records."}

## Recommended Defensive Actions
{recs_text or "- No actions required."}
"""

    return {
        "findings": findings,
        "executive_summary": exec_summary,
        "report_markdown": markdown_report,
        "status": "COMPLETED"
    }
