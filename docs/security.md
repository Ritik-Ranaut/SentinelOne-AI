# Defensive Application Security Architecture

## Defensive Engineering Best Practices

SENTINEL AI incorporates industry-standard application security controls across every layer:

### 1. Authentication & Session Management
- **Password Hashing**: Bcrypt with 10 salt rounds. Plaintext passwords are never stored or logged.
- **JWT Protection**: Signed with strong server-side secrets, short-lived expiries, and Bearer token headers.
- **Role-Based Access Control (RBAC)**: Enforces role permissions on every API endpoint (`ADMIN`, `ANALYST`, `VIEWER`).

### 2. Perimeter & Network Protections
- **Helmet HTTP Headers**: Enforces strict transport security, DNS prefetch control, and frame-guard protections.
- **Rate Limiting**: `express-rate-limit` prevents brute-force abuse on authentication and telemetry ingestion endpoints.
- **CORS Policies**: Explicit origin and allowed methods configuration.

### 3. Agent Safety & Human-in-the-Loop
- **Deterministic Risk Scoring**: LLMs are never permitted to generate risk numbers directly. Scoring is computed via deterministic, auditable rules.
- **Human Authorization Requirement**: High-impact containment actions (blocking IPs, revoking identities, isolating hosts) strictly require human analyst confirmation (`requiresApproval = True`).
- **Chain of Custody & Audit Trails**: Every analyst decision, status change, and simulation execution generates an immutable `AuditLog` entry.

### 4. RAG Knowledge Privacy
- **Local Embedding & Processing**: Document chunks and search queries remain contained within the enterprise perimeter.
