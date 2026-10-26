# Autonomous Multi-Agent Architecture (LangGraph)

## Overview

Rather than relying on isolated conversational chatbots, SENTINEL AI coordinates a specialized team of 8 autonomous agents communicating through a shared state (`SOCWorkflowState`) in a compiled LangGraph `StateGraph`.

```
START
  │
  ▼
Planner Agent
  │
  ▼
Log Analysis Agent
  │
  ▼
Threat Detection Agent
  │
  ├── [No Anomaly] ──> END
  │
  └── [Suspicious Anomaly Confirmed]
        │
        ▼
      Investigation Agent
        │
        ├── Threat Intelligence Agent
        │
        ▼
      Risk Analysis Agent (Deterministic Math + AI Reasoning)
        │
        ▼
      Response Agent (Playbooks + Human-in-the-Loop Signoff)
        │
        ▼
      Report Agent (Post-Mortem Compilation)
        │
        ▼
       END
```

## Agent Responsibilities

### 1. Planner Agent
- **Input**: Raw event sequence, incident context.
- **Output**: Multi-phase investigation roadmap and required specialized agents.

### 2. Log Analysis Agent
- **Input**: Raw telemetry logs.
- **Output**: Normalized event sequence and velocity anomaly detection (failed authentication count, transfer volumes).

### 3. Threat Detection Agent
- **Input**: Normalized logs and anomalies.
- **Output**: MITRE ATT&CK technique mapping (e.g. T1110, T1078, T1098, T1048, T1046, T1190) and binary routing decision (`is_suspicious`).

### 4. Investigation Agent
- **Input**: Confirmed security incident context.
- **Output**: Chronological timeline reconstruction, target entity identification, and cross-asset correlation.

### 5. Threat Intelligence Agent
- **Input**: Source IPs, domains, file hashes.
- **Output**: Reputation scores, threat group attribution, and historical IOC confidence.

### 6. Risk Analysis Agent
- **Design Philosophy**: Never ask an LLM to hallucinate a risk number. Mathematical risk points are computed deterministically, and AI provides the evidence-based explanation:
  - Repeated Failed Authentication: +20 pts
  - Compromise Follow-through: +15 pts
  - Malicious IP Reputation: +15 pts
  - Privilege Escalation / Admin Access: +25 pts
  - Bulk Data Exfiltration: +25 pts
  - Port Scan Probing: +20 pts
- **Categories**: Low (0-30), Medium (31-60), High (61-80), Critical (81-100).

### 7. Response Agent
- **Input**: Risk evaluation and affected entities.
- **Output**: Recommended defensive containment actions. Critical containment steps (e.g., Firewall block, Session termination) are flagged as `requiresApproval = True` and require explicit human sign-off.

### 8. Report Agent
- **Input**: Full graph state.
- **Output**: Markdown post-mortem documentation, executive briefs, and remediation steps.
