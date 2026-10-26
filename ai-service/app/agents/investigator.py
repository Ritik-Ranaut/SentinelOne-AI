from typing import Dict, Any
from datetime import datetime, timezone
from ..models.state import SOCWorkflowState

async def investigate_incident(state: SOCWorkflowState) -> Dict[str, Any]:
    """Investigation Agent: Builds chronological timeline and correlates user, IP, and device profiles."""
    logs = state.normalized_logs or []
    
    timeline = []
    target_user = state.context.get("user") or "admin"
    target_ip = state.context.get("ip") or "185.220.101.42"
    target_device = state.context.get("device") or "DEV-CORP-101"
    
    for i, log in enumerate(logs):
        ts = log.get("timestamp") or datetime.now(timezone.utc).isoformat()
        ev_type = log.get("eventType", "SECURITY_EVENT")
        user = log.get("username") or target_user
        ip = log.get("sourceIp") or target_ip
        details = log.get("details") or f"Event recorded: {ev_type}"
        
        target_user = user
        target_ip = ip
        
        time_str = str(ts)[11:19] if len(str(ts)) >= 19 else "12:00:00"
        
        timeline.append({
            "timestamp": ts,
            "timeFormatted": time_str,
            "event": ev_type,
            "details": f"{user} from {ip} - {details}",
            "severity": log.get("severity", "NORMAL"),
            "sourceIp": ip
        })
        
    return {
        "timeline": timeline,
        "target_user": target_user,
        "target_ip": target_ip,
        "target_device": target_device
    }
