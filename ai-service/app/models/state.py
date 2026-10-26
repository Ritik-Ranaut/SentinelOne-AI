from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class LogEvent(BaseModel):
    eventType: str
    timestamp: Optional[Any] = None
    username: Optional[str] = "unknown"
    sourceIp: Optional[str] = "127.0.0.1"
    deviceId: Optional[str] = "DEV-GENERIC"
    location: Optional[Dict[str, Any]] = None
    severity: Optional[str] = "NORMAL"
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    isSuspicious: Optional[bool] = False

class RiskFactor(BaseModel):
    factor: str
    points: int
    description: str

class AgentFinding(BaseModel):
    agentName: str
    status: str = "COMPLETED"
    timestamp: Optional[Any] = None
    summary: str
    details: Optional[Dict[str, Any]] = Field(default_factory=dict)
    confidence: float = 0.9

class Recommendation(BaseModel):
    action: str
    reason: str
    priority: str = "HIGH"
    requiresApproval: bool = True
    target: str = ""
    status: str = "PENDING"

class TimelineItem(BaseModel):
    timestamp: Optional[Any] = None
    timeFormatted: str
    event: str
    details: str
    severity: str = "NORMAL"
    sourceIp: str = ""

class SOCWorkflowState(BaseModel):
    incident_id: str
    raw_logs: List[Dict[str, Any]] = Field(default_factory=list)
    context: Dict[str, Any] = Field(default_factory=dict)
    
    # Planner Agent Output
    investigation_plan: List[str] = Field(default_factory=list)
    required_agents: List[str] = Field(default_factory=list)
    
    # Log Analysis Agent Output
    normalized_logs: List[Dict[str, Any]] = Field(default_factory=list)
    log_anomalies: List[str] = Field(default_factory=list)
    
    # Threat Detection Agent Output
    is_suspicious: bool = False
    detected_threat: Optional[str] = None
    mitre_technique: Optional[str] = None
    
    # Investigation Agent Output
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
    target_user: Optional[str] = None
    target_ip: Optional[str] = None
    target_device: Optional[str] = None
    
    # Threat Intel Agent Output
    threat_intel_findings: Dict[str, Any] = Field(default_factory=dict)
    
    # Historical Analysis Agent Output
    historical_findings: Dict[str, Any] = Field(default_factory=dict)
    
    # Risk Agent Output
    risk_score: int = 0
    severity: str = "LOW"
    risk_breakdown: List[Dict[str, Any]] = Field(default_factory=list)
    ai_explanation: str = ""
    explanation_source: str = "UNKNOWN"
    
    # Human Approval & Response Gate
    requires_human_approval: bool = True
    approval_status: str = "WAITING_APPROVAL"
    
    # Response Agent Output
    recommendations: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Report Agent Output
    findings: List[Dict[str, Any]] = Field(default_factory=list)
    executive_summary: str = ""
    report_markdown: str = ""
    
    # Execution Tracking
    agent_executions: List[Dict[str, Any]] = Field(default_factory=list)
    status: str = "IN_PROGRESS"
    errors: List[str] = Field(default_factory=list)

class InvestigateRequest(BaseModel):
    incident_id: str
    logs: List[Dict[str, Any]] = Field(default_factory=list)
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)

class ChatRequest(BaseModel):
    query: str
    database_context: Optional[Dict[str, Any]] = None
    history: Optional[List[Dict[str, str]]] = Field(default_factory=list)

class RAGSearchRequest(BaseModel):
    query: str
    limit: int = 5
