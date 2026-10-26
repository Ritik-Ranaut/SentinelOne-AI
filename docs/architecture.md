# SENTINEL AI Architecture Documentation

## High-Level System Architecture

SENTINEL AI is designed with an enterprise three-tier decoupled architecture:
1. **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide React, Socket.IO client.
2. **Backend**: Node.js / Express, MongoDB Mongoose ODM, Socket.IO WebSocket hub, Simulation Engine, RBAC, and Immutable Audit Logger.
3. **AI Service**: Python FastAPI with LangGraph multi-agent StateGraph, Ollama local LLM integration, external LLM provider abstraction, and deterministic cybersecurity rule fallback.

```
React Single Page Application (Port 5173)
       │
       ▼ (REST APIs & WebSocket Telemetry)
Node.js / Express Application Server (Port 5000)
       ├── MongoDB (Port 27017)
       └── Python FastAPI LangGraph Service (Port 8000)
                 └── Local Ollama / External LLM
```

## Communication Flow

1. **Telemetry Generation / Ingestion**: Security logs arrive at the backend via REST `POST /api/logs` or the dynamic `scenarioEngine`.
2. **Live Telemetry Broadcast**: Logs are instantly emitted via WebSockets `security:log` to connected SOC analyst consoles.
3. **Threshold Detection**: Anomaly patterns (e.g. repeated authentication failures, impossible travel, multi-gigabyte data exfiltration) trigger the incident creation pipeline.
4. **LangGraph Multi-Agent Invocation**: The backend invokes the Python AI service (`/api/ai/investigate`) with normalized events and context.
5. **Deterministic Risk Vector Calculation**: Mathematical scoring is calculated using verifiable rules (+20 failed auth, +15 new IP, +25 admin access, +25 exfiltration), while AI models generate natural language explanations.
6. **Human-in-the-Loop Response Orchestration**: Sensitive containment actions (e.g., blocking IPs, revoking sessions, isolating hosts) require analyst authorization.
7. **Immutable Audit Trail**: Every authorization and status change is immutably logged to the `AuditLog` collection.
