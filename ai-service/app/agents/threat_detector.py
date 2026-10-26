from typing import Dict, Any
from ..models.state import SOCWorkflowState

async def detect_threat(state: SOCWorkflowState) -> Dict[str, Any]:
    """Threat Detection Agent: Maps anomalies to MITRE ATT&CK techniques and determines severity."""
    logs = state.normalized_logs or []
    event_types = [l.get("eventType") for l in logs]
    
    is_suspicious = False
    detected_threat = "Normal Activity"
    mitre_technique = "N/A"
    
    # Check for attack patterns
    if event_types.count("LOGIN_FAILED") >= 3 or "BRUTE_FORCE" in str(state.context):
        is_suspicious = True
        detected_threat = "Brute-Force Authentication Attempt"
        mitre_technique = "T1110 (Brute Force)"
    elif "PRIVILEGE_CHANGE" in event_types or "ADMIN_ACCESS" in event_types:
        is_suspicious = True
        detected_threat = "Privilege Escalation / Unauthorized Admin Access"
        mitre_technique = "T1098 (Account Manipulation)"
    elif "LARGE_DATA_TRANSFER" in event_types or any(l.get("eventType") == "FILE_DOWNLOAD" for l in logs):
        is_suspicious = True
        detected_threat = "Data Exfiltration Over Network"
        mitre_technique = "T1048 (Exfiltration Over Alternative Protocol)"
    elif "PORT_SCAN_SIMULATION" in event_types:
        is_suspicious = True
        detected_threat = "Port Scanning & Network Service Probing"
        mitre_technique = "T1046 (Network Service Discovery)"
    elif "UNUSUAL_LOCATION" in event_types or "SUSPICIOUS_IP" in event_types:
        is_suspicious = True
        detected_threat = "Impossible Travel / Untrusted Origin Anomaly"
        mitre_technique = "T1078 (Valid Accounts)"
    elif any(l.get("severity") in ["HIGH", "CRITICAL"] for l in logs):
        is_suspicious = True
        detected_threat = "Critical Telemetry Threshold Breach"
        mitre_technique = "T1078 (Valid Accounts)"
        
    return {
        "is_suspicious": is_suspicious,
        "detected_threat": detected_threat,
        "mitre_technique": mitre_technique
    }
