# REST API Documentation

Base URL: `http://localhost:5000/api`

## Authentication (`/api/auth`)
- `POST /api/auth/register`: Enroll a new analyst operator.
- `POST /api/auth/login`: Authenticate and receive a JWT token.
- `GET /api/auth/me`: Fetch current user profile (requires `Bearer <token>`).

## Dashboard Metrics (`/api/dashboard`)
- `GET /api/dashboard/stats`: Returns KPI counters and 6 Recharts analytics datasets (Events Over Time, Threat Distribution, Severity Distribution, Event Types, Incidents by Hour, Risk Bins).

## Telemetry Logs (`/api/logs`)
- `GET /api/logs`: Paginated telemetry log query with filtering (`severity`, `eventType`, `username`, `sourceIp`, `search`).
- `POST /api/logs`: Ingest single security event and broadcast over WebSockets.
- `DELETE /api/logs/clear`: Clear telemetry buffer (requires `ADMIN` role).

## Incident Management (`/api/incidents`)
- `GET /api/incidents`: Retrieve filtered incidents list.
- `GET /api/incidents/:id`: Retrieve single incident dossier with timeline, findings, and audit history.
- `PATCH /api/incidents/:id`: Update status or assign analyst.
- `POST /api/incidents/:id/decision`: Human-in-the-Loop authorization (`decision: "APPROVED" | "REJECTED"`, `actionIndex: 0`).

## Simulations (`/api/simulations`)
- `GET /api/simulations/status`: Active simulation status and progress.
- `POST /api/simulations/start`: Start synthetic scenario (`scenario: "BRUTE_FORCE" | "SUSPICIOUS_LOGIN" | ...`).
- `POST /api/simulations/pause`: Pause active stream.
- `POST /api/simulations/resume`: Resume paused stream.
- `POST /api/simulations/stop`: Terminate simulation.
- `POST /api/simulations/clear`: Wipe synthetic simulation records.

## Autonomous Agents (`/api/agents`)
- `GET /api/agents`: Live health and execution metrics for all 8 agents.
- `GET /api/agents/runs`: Paginated historical execution logs.
- `POST /api/agents/investigate`: Trigger manual investigation on arbitrary log payload.

## Copilot & RAG (`/api/chat` & `/api/rag`)
- `POST /api/chat`: Query SOC AI Copilot grounded in MongoDB state.
- `GET /api/rag/documents`: List security policies and SOPs.
- `POST /api/rag/documents`: Upload and chunk new SOP documentation.
- `POST /api/rag/search`: Semantic policy search.

## Audit Logs (`/api/audit-logs`)
- `GET /api/audit-logs`: Query immutable analyst activity records.
