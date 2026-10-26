# SENTINEL AI: AI-Powered Security Operations Center (SOC)

[![Defense Grade](https://img.shields.io/badge/Security-Defensive_SOC-06b6d4.svg)](#)
[![LangGraph](https://img.shields.io/badge/Multi--Agent-LangGraph-8b5cf6.svg)](#)
[![Stack](https://img.shields.io/badge/Stack-React_|_Node_|_FastAPI_|_MongoDB-10b981.svg)](#)
[![Status](https://img.shields.io/badge/Verification-automated_checks_passed-blue.svg)](#)

SENTINEL AI is an enterprise-grade, defensive cybersecurity platform designed to simulate an intelligent, autonomous Security Operations Center. Multiple AI agents work in a compiled LangGraph workflow to ingest telemetry, detect anomalous attack patterns, reconstruct chronological timelines, compute deterministic and explainable risk scores, recommend defensive response playbooks, enforce human-in-the-loop analyst authorization, and generate compliance-ready post-mortem incident reports.

---

## Key Features

1. **Autonomous Multi-Agent Architecture**:
   - 8 specialized agents communicating through a shared LangGraph `StateGraph`:
     - **Planner Agent**: Decomposes telemetry patterns and establishes investigation paths.
     - **Log Analysis Agent**: Ingests, normalizes, and flags velocity anomalies.
     - **Threat Detection Agent**: Maps anomalous behaviors to MITRE ATT&CK techniques.
     - **Investigation Agent**: Correlates identity history, IP origin, and device fingerprints into a chronological timeline.
     - **Threat Intelligence Agent**: Queries IP, domain, and hash reputation with confidence scoring.
     - **Risk Analysis Agent**: Evaluates strict deterministic mathematical factors (+20 failed auth, +15 new IP, +25 privilege change, +25 exfiltration) and generates evidence-grounded AI explanations.
     - **Response Agent**: Recommends defensive containment playbooks.
     - **Report Agent**: Synthesizes formal incident briefs and exportable post-mortem documentation.

2. **Interactive Attack Simulation Center**:
   - 7 realistic, synthetic cyber attack simulations:
     1. **Brute-Force Authentication**: Repeated password failures followed by account compromise and admin access.
     2. **Suspicious Login Anomaly**: Off-hours access from an untrusted proxy subnet.
     3. **Privilege Escalation**: Unauthorized IAM role elevation to Domain Admin.
     4. **Data Exfiltration**: Bulk database query followed by multi-gigabyte outbound transfer.
     5. **Port Scanning**: Sequential TCP SYN probing across internal management ports.
     6. **Impossible Travel**: Valid logins from US and Tokyo within 8 minutes.
     7. **Abnormal API Activity**: Automated token fuzzing and SQL parameter tampering.
   - Comprehensive controls: **Start**, **Pause**, **Resume**, **Stop**, and **Clear Simulation Data**.

3. **High-Density Cyber SOC Console**:
   - **Main Dashboard**: Real-time KPI cards and 6 Recharts visualizations (Events Over Time, Threat Distribution, Severity Breakdown, Event Types, Incidents by Hour, Risk Bins).
   - **Live Event Stream**: Terminal-like viewer with color-coded severity (Red: Critical, Orange: High, Yellow: Medium, Green: Normal), pause/resume, filters, search, and CSV/JSON export.
   - **Incident Hero Screen**: Incident #INC-XXXX dossier, evidence-based AI reasoning, deterministic mathematical breakdown (+20 failed auth, etc.), chronological timeline, and **Human-in-the-Loop [APPROVE] / [REJECT] action buttons**.
   - **Threat Intelligence Console**: Catalog of MITRE ATT&CK threats, indicator table (IP/Domain/Hash) with confidence scores, and real-time live IOC reputation query engine.
   - **Interactive Threat Map**: Animated SVG world map showing attack origins and suspicious IPs.
   - **SOC AI Copilot**: Grounded conversational assistant answering queries directly against MongoDB records and RAG security policies.
   - **RAG Knowledge Base**: Security SOP repository with chunking and semantic policy search.
   - **Compliance Incident Reports**: Automated post-mortem documentation with Markdown export and native downloadable PDF reports.
   - **Audit Logs**: Tamper-evident record of all analyst decisions, simulations, and status changes.

4. **Multi-Provider AI Abstraction & Fallback**:
   - Native integration with local **Ollama** (`qwen3:8b`).
   - Compatible with external LLM APIs (OpenAI, Gemini, OpenRouter) via environment variables.
   - **Zero-Crash Fallback**: Built-in deterministic cybersecurity heuristic engine ensures full platform functionality even when LLM endpoints are offline.

---

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Lucide React, Recharts, Socket.IO Client.
- **Backend API & WebSockets**: Node.js, Express.js, MongoDB (Mongoose), Socket.IO, JWT Authentication, RBAC, Helmet, Express-Rate-Limit.
- **AI Service**: Python 3.12, FastAPI, LangGraph, Pydantic v2, Uvicorn, Httpx.
- **Database**: MongoDB (runs locally on port `27017` or via Docker).

---

## Project Structure

```
sentinel-ai/
├── backend/
│   ├── src/
│   │   ├── config/ (db.js, constants.js)
│   │   ├── controllers/ (auth, dashboard, log, incident, simulation, agent, chat, rag, reports, audit)
│   │   ├── middleware/ (auth.js, errorHandler.js)
│   │   ├── models/ (User, SecurityLog, Incident, Threat, Device, AgentRun, ResponseAction, etc.)
│   │   ├── routes/ (index.js, incidentRoutes.js, simulationRoutes.js, etc.)
│   │   ├── services/ (aiServiceClient.js, auditService.js)
│   │   ├── simulators/ (scenarioEngine.js)
│   │   ├── sockets/ (socketHandler.js)
│   │   ├── utils/ (seed.js)
│   │   └── server.js
│   ├── tests/ (api.test.js, e2e_verification.js)
│   └── package.json
├── ai-service/
│   ├── app/
│   │   ├── agents/ (planner, log_analyst, threat_detector, investigator, threat_intel, risk_scorer, responder, reporter, copilot)
│   │   ├── graphs/ (soc_graph.py - LangGraph StateGraph)
│   │   ├── models/ (state.py)
│   │   ├── providers/ (llm_base.py, ollama_provider.py, openai_provider.py, fallback_provider.py, provider_factory.py)
│   │   ├── rag/ (policy_retriever.py)
│   │   ├── routes/ (investigate.py, chat.py, rag.py, health.py)
│   │   └── main.py
│   ├── tests/ (test_agents.py)
│   ├── requirements.txt
│   └── pytest.ini
├── frontend/
│   ├── src/
│   │   ├── components/ (Navbar, Sidebar, GlassCard, StatusBadge, RiskDial)
│   │   ├── context/ (AuthContext, SocketContext)
│   │   ├── pages/ (Dashboard, LiveEvents, Incidents, IncidentDetail, SimulationCenter, ThreatMap, Users, Devices, Agents, ChatCopilot, KnowledgeBase, Reports, AuditLogs, Settings, Login, Register)
│   │   ├── services/ (api.js, socket.js)
│   │   ├── utils/ (constants.js)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── docs/ (architecture.md, agents.md, api.md, database.md, simulations.md, security.md)
├── docker-compose.yml
└── README.md
```

---

## Getting Started

### Quick local startup (Windows PowerShell)

With Node.js installed, MongoDB running locally, and backend/frontend dependencies installed, run this from the project root:

```powershell
.\start-sentinel.ps1
```

The launcher selects free ports, starts the backend and frontend, configures the frontend API proxy, verifies both services respond, and opens the application in your browser. It uses the MongoDB URI from `backend/.env` when configured; database-backed features require that MongoDB instance to be reachable. Use `.\start-sentinel.ps1 -NoBrowser` to start and verify the services without opening a browser.

This launcher does not start the Python AI service. Start that service separately using the instructions below. The backend health route alone is not proof that MongoDB is reachable; verify the database connection before using database-backed features.

### Prerequisites
- **Node.js**: v18.0.0 or higher (Tested on v22.12.0)
- **Python**: 3.10 or higher (Tested on 3.12.5)
- **MongoDB**: A reachable MongoDB instance configured by `MONGO_URI` in `backend/.env`; local MongoDB can use `mongodb://127.0.0.1:27017/sentinel_soc`.
- *(Optional)* **Ollama**: Running on `http://127.0.0.1:11434` with model `qwen3:8b`.

---

### Step 1: Database Setup & Seeding

1. Ensure MongoDB service is running on `mongodb://127.0.0.1:27017`.
2. Seed the database with 1,150+ realistic logs, 50 incidents, 20 users, 20 devices, threats, and SOP policies:
   ```bash
   cd backend
   npm run seed
   ```

Development-only operator accounts generated by the seed script:
- **Admin**: `admin` / `SentinelAdmin123!`
- **Analyst**: `analyst` / `SentinelAdmin123!`
- **Viewer**: `viewer` / `SentinelAdmin123!`
Do not use these seeded credentials in a shared or production environment. The login page also provides one-click demo-profile buttons.

---

### Step 2: Start the Python AI Service (LangGraph)

1. Activate virtual environment and install dependencies:
   ```bash
   cd ai-service
   ..\.venv\Scripts\Activate.ps1   # Or source ../.venv/bin/activate on Unix
   pip install -r requirements.txt
   ```
2. Run unit tests to verify agent graph execution:
   ```bash
   pytest
   ```
3. Start the FastAPI service:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *Health Check*: `http://127.0.0.1:8000/api/ai/health`

---

### Step 3: Start the Backend API & WebSockets

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Run backend tests:
   ```bash
   npm test
   ```
3. Start the Node.js server:
   ```bash
   npm start
   ```
   *Health Check*: `http://127.0.0.1:5000/api/health` (returns HTTP 503 when MongoDB is unavailable)

---

### Step 4: Start the Frontend Application

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Build validation:
   ```bash
   npm run build
   ```
3. Launch development server:
   ```bash
   npm run dev
   ```
4. Open your browser at: **`http://localhost:5173`**

---

## End-to-End Walkthrough Demonstration

1. Navigate to `http://localhost:5173` and log in with the **Analyst** profile.
2. View the **Dashboard** to see the 6 live Recharts metrics and real-time event stream.
3. Open the **Simulation Center** from the sidebar.
4. Click **[Simulate Brute Force]**:
   - Watch the live telemetry logs stream in real-time.
   - Observe the multi-agent pipeline trigger detection and create incident `INC-XXXX`.
   - Watch the agent status indicators pulse across Planner -> Log Analyst -> Threat Detection -> Investigator -> Threat Intel -> Risk Scorer -> Responder -> Reporter.
5. Click the newly created incident link to open the **Incident Dossier**:
   - Review the **AI Explanation** and the **Deterministic Risk Factor Breakdown** (+20 Failed Auth, +15 New IP, +25 Admin Access = 76/100 High Risk).
   - Inspect the **Visual Chronological Timeline**.
   - Review the recommended defensive response: *"Block IP at Perimeter Firewall"*.
   - Click **[APPROVE ACTION]** to execute the containment policy.
6. Verify in **Audit Logs** that your approval was immutably recorded.
7. Open **Incident Reports** and export the markdown compliance post-mortem.
8. Query the **SOC AI Copilot**: *"Why is INC-XXXX high risk?"* and verify the grounded database response.

---

## Defensive Cybersecurity Disclaimer

SENTINEL AI is strictly a defensive Security Operations Center simulation platform. All simulated scenarios generate synthetic in-memory telemetry records and do not execute offensive network attacks, port scans, or system exploits.
