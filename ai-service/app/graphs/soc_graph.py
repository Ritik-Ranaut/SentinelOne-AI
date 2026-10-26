import time
import logging
from langgraph.graph import StateGraph, END
from ..models.state import SOCWorkflowState
from ..agents.planner import plan_investigation
from ..agents.log_analyst import analyze_logs
from ..agents.threat_detector import detect_threat
from ..agents.investigator import investigate_incident
from ..agents.threat_intel import enrich_threat_intel
from ..agents.historical_analyst import analyze_history
from ..agents.risk_scorer import evaluate_risk
from ..agents.responder import recommend_responses
from ..agents.reporter import generate_report

logger = logging.getLogger(__name__)

def _record_execution(state: SOCWorkflowState, agent_name: str, task: str, start_time: float, output: dict):
    duration_ms = round((time.time() - start_time) * 1000)
    exec_entry = {
        "agentName": agent_name,
        "currentTask": task,
        "status": "COMPLETED",
        "duration": max(duration_ms, 50),
        "output": output
    }
    return exec_entry

async def node_planner(state: SOCWorkflowState):
    t0 = time.time()
    logger.info(f"[Graph] Executing Planner Agent for #{state.incident_id}")
    res = await plan_investigation(state)
    entry = _record_execution(state, "Planner Agent", "Establishing investigation scope and playbook strategy", t0, res)
    executions = list(state.agent_executions) + [entry]
    return {**res, "agent_executions": executions}

async def node_log_analysis(state: SOCWorkflowState):
    t0 = time.time()
    logger.info(f"[Graph] Executing Log Analysis Agent for #{state.incident_id}")
    res = await analyze_logs(state)
    entry = _record_execution(state, "Log Analysis Agent", f"Normalized {len(state.raw_logs)} logs and identified velocity anomalies", t0, res)
    executions = list(state.agent_executions) + [entry]
    return {**res, "agent_executions": executions}

async def node_threat_detection(state: SOCWorkflowState):
    t0 = time.time()
    logger.info(f"[Graph] Executing Threat Detection Agent for #{state.incident_id}")
    res = await detect_threat(state)
    entry = _record_execution(state, "Threat Detection Agent", f"Mapped to MITRE ATT&CK: {res.get('mitre_technique', 'T1078')}", t0, res)
    executions = list(state.agent_executions) + [entry]
    return {**res, "agent_executions": executions}

def check_suspicious(state: SOCWorkflowState) -> str:
    """Route suspicious activity for investigation and finalize benign activity."""
    if state.is_suspicious:
        logger.info(f"[Graph] Anomaly confirmed for #{state.incident_id}. Routing to Investigation Agent.")
        return "investigate"
    logger.info(f"[Graph] Event pattern nominal for #{state.incident_id}. Finalizing benign result.")
    return "benign"


def finalize_benign(state: SOCWorkflowState) -> dict:
    return {
        "risk_score": 5,
        "severity": "LOW",
        "risk_breakdown": [],
        "requires_human_approval": False,
        "approval_status": "NOT_REQUIRED",
        "status": "COMPLETED",
    }

async def node_investigation(state: SOCWorkflowState):
    t0 = time.time()
    logger.info(f"[Graph] Executing Investigation Agent for #{state.incident_id}")
    res = await investigate_incident(state)
    entry = _record_execution(state, "Investigation Agent", f"Compiled chronological timeline of {len(res.get('timeline', []))} events", t0, res)
    executions = list(state.agent_executions) + [entry]
    return {**res, "agent_executions": executions}

async def node_threat_intel(state: SOCWorkflowState):
    t0 = time.time()
    logger.info(f"[Graph] Executing Threat Intelligence Agent for #{state.incident_id}")
    res = await enrich_threat_intel(state)
    entry = _record_execution(state, "Threat Intelligence Agent", res.get("threat_intel_findings", {}).get("summary", "IOC intelligence retrieved"), t0, res)
    executions = list(state.agent_executions) + [entry]
    return {**res, "agent_executions": executions}

async def node_historical_analysis(state: SOCWorkflowState):
    t0 = time.time()
    logger.info(f"[Graph] Executing Historical Analysis Agent for #{state.incident_id}")
    res = await analyze_history(state)
    entry = _record_execution(state, "Historical Analysis Agent", res.get("historical_findings", {}).get("summary", "Historical incident correlation complete"), t0, res)
    executions = list(state.agent_executions) + [entry]
    return {**res, "agent_executions": executions}

async def node_risk_analysis(state: SOCWorkflowState):
    t0 = time.time()
    logger.info(f"[Graph] Executing Risk Analysis Agent for #{state.incident_id}")
    res = await evaluate_risk(state)
    entry = _record_execution(state, "Risk Analysis Agent", f"Evaluated risk score: {res.get('risk_score', 50)}/100 ({res.get('severity', 'MEDIUM')})", t0, res)
    executions = list(state.agent_executions) + [entry]
    return {**res, "agent_executions": executions}

async def node_human_approval(state: SOCWorkflowState):
    """Enforces human authorization gate on defensive containment actions."""
    t0 = time.time()
    logger.info(f"[Graph] Enforcing Human Approval authorization gate for #{state.incident_id}")
    approval_needed = state.risk_score >= 31
    entry = _record_execution(
        state,
        "Human Approval Gate",
        "Enforcing SOC analyst authorization gate on active containment playbooks",
        t0,
        {"requires_approval": approval_needed, "status": "WAITING_APPROVAL" if approval_needed else "AUTO_APPROVED"}
    )
    executions = list(state.agent_executions) + [entry]
    return {
        "requires_human_approval": approval_needed,
        "approval_status": "WAITING_APPROVAL" if approval_needed else "APPROVED",
        "agent_executions": executions
    }

async def node_response(state: SOCWorkflowState):
    t0 = time.time()
    logger.info(f"[Graph] Executing Response Agent for #{state.incident_id}")
    res = await recommend_responses(state)
    entry = _record_execution(state, "Response Agent", f"Formulated {len(res.get('recommendations', []))} containment actions requiring analyst authorization", t0, res)
    executions = list(state.agent_executions) + [entry]
    return {**res, "agent_executions": executions}

async def node_report(state: SOCWorkflowState):
    t0 = time.time()
    logger.info(f"[Graph] Executing Report Agent for #{state.incident_id}")
    res = await generate_report(state)
    entry = _record_execution(state, "Report Agent", "Generated post-mortem executive report", t0, res)
    executions = list(state.agent_executions) + [entry]
    return {**res, "agent_executions": executions, "status": "COMPLETED"}

def create_soc_graph():
    """Builds and compiles the full LangGraph Multi-Agent Workflow matching standard SOC pipeline."""
    workflow = StateGraph(SOCWorkflowState)

    # 1. Add all agent & gate nodes
    workflow.add_node("planner", node_planner)
    workflow.add_node("log_analyst", node_log_analysis)
    workflow.add_node("threat_detector", node_threat_detection)
    workflow.add_node("finalize_benign", finalize_benign)
    workflow.add_node("investigator", node_investigation)
    workflow.add_node("threat_intel", node_threat_intel)
    workflow.add_node("historical_analyst", node_historical_analysis)
    workflow.add_node("risk_scorer", node_risk_analysis)
    workflow.add_node("human_approval", node_human_approval)
    workflow.add_node("responder", node_response)
    workflow.add_node("reporter", node_report)

    # 2. Set entry point
    workflow.set_entry_point("planner")

    # 3. Add edges
    workflow.add_edge("planner", "log_analyst")
    workflow.add_edge("log_analyst", "threat_detector")

    # Conditional Branch based on threat detection
    workflow.add_conditional_edges(
        "threat_detector",
        check_suspicious,
        {
            "investigate": "investigator",
            "benign": "finalize_benign"
        }
    )
    workflow.add_edge("finalize_benign", END)

    workflow.add_edge("investigator", "threat_intel")
    workflow.add_edge("threat_intel", "historical_analyst")
    workflow.add_edge("historical_analyst", "risk_scorer")
    workflow.add_edge("risk_scorer", "human_approval")
    workflow.add_edge("human_approval", "responder")
    workflow.add_edge("responder", "reporter")
    workflow.add_edge("reporter", END)

    return workflow.compile()

# Pre-compile graph instance
soc_agent_graph = create_soc_graph()
