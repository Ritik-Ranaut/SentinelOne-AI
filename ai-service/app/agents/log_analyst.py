from typing import Dict, Any, List
from ..models.state import SOCWorkflowState

async def analyze_logs(state: SOCWorkflowState) -> Dict[str, Any]:
    """Log Analysis Agent: Normalizes and identifies pattern anomalies across events."""
    raw_logs = state.raw_logs or []
    anomalies = []
    normalized = []
    
    failed_logins = 0
    large_downloads = 0
    priv_changes = 0
    port_scans = 0
    
    for log in raw_logs:
        ev_type = log.get("eventType", "UNKNOWN")
        sev = log.get("severity", "NORMAL")
        
        norm_item = {
            "eventType": ev_type,
            "username": log.get("username", "unknown"),
            "sourceIp": log.get("sourceIp", "127.0.0.1"),
            "severity": sev,
            "timestamp": log.get("timestamp"),
            "details": log.get("metadata", {}).get("details", "")
        }
        normalized.append(norm_item)
        
        if ev_type == "LOGIN_FAILED":
            failed_logins += 1
        elif ev_type in ["LARGE_DATA_TRANSFER", "FILE_DOWNLOAD"]:
            large_downloads += 1
        elif ev_type in ["PRIVILEGE_CHANGE", "ADMIN_ACCESS"]:
            priv_changes += 1
        elif ev_type == "PORT_SCAN_SIMULATION":
            port_scans += 1
            
    if failed_logins >= 3:
        anomalies.append(f"Abnormal authentication velocity: {failed_logins} failed login events detected.")
    if large_downloads > 0:
        anomalies.append(f"High-volume data transfer detected: {large_downloads} bulk download records.")
    if priv_changes > 0:
        anomalies.append(f"Administrative privilege alteration detected: {priv_changes} sensitive events.")
    if port_scans > 0:
        anomalies.append(f"Reconnaissance probing detected: {port_scans} port scan sweeps.")
        
    return {
        "normalized_logs": normalized,
        "log_anomalies": anomalies
    }
