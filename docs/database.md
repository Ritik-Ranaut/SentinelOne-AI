# Database Architecture & Schema Models

Database: **MongoDB** (Mongoose ODM)

## Core Collections

### 1. `users`
Tracks SOC operator identities and enterprise users.
- `username`: Unique identity handle
- `email`: Corporate email address
- `password`: Bcrypt hashed password (10 salt rounds)
- `role`: `ADMIN` | `ANALYST` | `VIEWER`
- `failedLogins`: Number of recent invalid authentication events
- `riskScore`: Behavioral risk metric (0-100)
- `knownDevices`: Array of enrolled hardware identifiers
- `status`: `ACTIVE` | `SUSPENDED` | `FLAGGED` | `LOCKED`

### 2. `securitylogs`
Raw and normalized telemetry stream.
- `eventType`: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `ADMIN_ACCESS`, `LARGE_DATA_TRANSFER`, etc.
- `timestamp`: Event occurrence date
- `username`: Target identity
- `sourceIp`: Origin IP address
- `deviceId`: Asset fingerprint
- `location`: `{ country, city, latitude, longitude }`
- `severity`: `NORMAL` | `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`
- `metadata`: Flexible payload containing HTTP status, query details, transfer size
- `simulationId`: Associated simulation scenario run (if synthetic)
- `isSuspicious`: Boolean heuristic flag

### 3. `incidents`
Security cases evaluated by the multi-agent pipeline.
- `incidentId`: Unique case identifier (e.g. `INC-1024`)
- `title`: Executive threat classification
- `type`: Attack taxonomy category
- `severity`: Case severity tier
- `riskScore`: Deterministic score (0-100)
- `status`: `NEW` | `INVESTIGATING` | `PENDING_APPROVAL` | `ACTION_TAKEN` | `RESOLVED`
- `aiExplanation`: Evidence-grounded reasoning text
- `timeline`: Array of `{ timeFormatted, event, details, severity, sourceIp }`
- `riskBreakdown`: Array of `{ factor, points, description }`
- `agentFindings`: Array of `{ agentName, summary, confidence, timestamp }`
- `recommendations`: Array of `{ action, reason, priority, requiresApproval, target, status }`
- `analystDecision`: `{ decision, analystName, decisionNotes, timestamp }`

### 4. `agentruns`
Autonomous agent execution tracking.
- `agentName`: Name of executing agent
- `incidentId`: Correlated incident
- `status`: `PENDING` | `RUNNING` | `COMPLETED` | `WAITING_APPROVAL` | `FAILED`
- `duration`: Execution latency in milliseconds
- `currentTask`: Active telemetry operation
- `output`: Result payload

### 5. `auditlogs`
Immutable compliance records.
- `user`: Operator username
- `action`: Sensitive action type (e.g. `DEFENSIVE_ACTION_APPROVED`, `SIMULATION_STARTED`)
- `resource`: Target entity affected
- `result`: `SUCCESS` | `FAILURE`
- `timestamp`: UTC timestamp
- `ipAddress`: Client origin IP
