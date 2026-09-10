# NEXORA CAMPUS — ARCHITECTURAL SPECIFICATION

## 1. System Philosophy: Modular Monolith

Nexora Campus is engineered as a **Modular Monolith**. Rather than introducing distributed microservices with high network overhead, serialization costs, and infrastructure complexity, Nexora groups cohesive business domains into decoupled TypeScript modules sharing a unified transactional relational database.

```text
+-------------------------------------------------------------------------------+
|                             NEXT.JS 14 FRONTEND                               |
|                                                                               |
|   /student/*      /staff/*      /warden/*     /security/*    /admin/*         |
|   /login          /verify/[id]  /kiosk        /lite          / (Landing)      |
+-------------------------------------------------------------------------------+
                                       |
                                       | HTTPS / JSON REST API
                                       v
+-------------------------------------------------------------------------------+
|                          EXPRESS.JS BACKEND ENGINE                            |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |                         NEXORA REQUEST ENGINE                           |  |
|  |  * Sequential Identifier Generator (NX-XXXXX)                          |  |
|  |  * Finite-State Machine (FSM) & Transition Validation                   |  |
|  |  * Staff Assignment & Reassignment Controller                           |  |
|  |  * Status History & Timeline Event Logger                               |  |
|  +-------------------------------------------------------------------------+  |
|                                                                               |
|  +----------------------+ +-----------------------+ +---------------------+  |
|  | Deterministic Router | | QR / PIN Crypto       | | PDFKit Doc Engine   |  |
|  | (Regex Keyword Spec) | | (HMAC-SHA256 Signer)  | | (Digital Seal & QR) |  |
|  +----------------------+ +-----------------------+ +---------------------+  |
|  +----------------------+ +-----------------------+ +---------------------+  |
|  | SLA Ageing Engine    | | Section 44 Clustering | | Immutable Audit Log |  |
|  | (< 12h, 12-24h, etc) | | (14-Day Cluster Math) | | (Append-Only Trail) |  |
|  +----------------------+ +-----------------------+ +---------------------+  |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  | Security & Auth: JWT HTTP-Only Cookies • Granular RBAC Permissions     |  |
|  +-------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------+
                                       |
                                       | Prisma ORM (21 Relational Models)
                                       v
+-------------------------------------------------------------------------------+
|                            RELATIONAL DATABASE                                |
|          (100% PostgreSQL Compatible Schema • SQLite Sandbox Runtime)         |
+-------------------------------------------------------------------------------+
```

---

## 2. The Nexora Request Engine (Finite State Machine)

Every student action (maintenance issue, gate exit pass, bonafide certificate, or hostel leave) is normalized into a unified `Request` record.

### Finite State Machine (FSM) Transition Matrix

The table below defines the allowed status transitions enforced in `RequestService.isValidTransition()`. Any transition outside this matrix is rejected by the backend with HTTP `422 Unprocessable Entity`.

| Current Status | Allowed Next Statuses | Business Trigger |
|---|---|---|
| `SUBMITTED` | `ROUTED`, `ASSIGNED`, `PENDING_APPROVAL`, `CANCELLED`, `REJECTED` | Initial creation by student or kiosk |
| `ROUTED` | `ASSIGNED`, `CANCELLED` | Deterministic router identifies category |
| `ASSIGNED` | `ACCEPTED`, `IN_PROGRESS`, `REASSIGNED`, `CANCELLED` | Automatic or manual staff allocation |
| `ACCEPTED` | `IN_PROGRESS`, `RESOLVED`, `ASSIGNED`, `CANCELLED` | Technician acknowledges work order |
| `IN_PROGRESS` | `RESOLVED`, `ASSIGNED`, `CANCELLED` | Technician begins on-site repairs |
| `RESOLVED` | `CONFIRMED`, `CLOSED`, `IN_PROGRESS` | Technician adds notes and resolves |
| `CONFIRMED` | `CLOSED` | Student verifies repair quality |
| `PENDING_APPROVAL` | `APPROVED`, `REJECTED`, `CANCELLED` | Warden or authority review |
| `APPROVED` | `DEPARTED`, `COMPLETED`, `CLOSED`, `CANCELLED` | Pass/Certificate authorized |
| `DEPARTED` | `RETURNED`, `CLOSED` | Guard logs student exit at gate |
| `RETURNED` | `CLOSED` | Guard logs student return at gate |
| `CLOSED` | *(Terminal)* | Ticket completed and rated |
| `REJECTED` | *(Terminal)* | Application disapproved |
| `CANCELLED` | *(Terminal)* | Requester cancels ticket |

---

## 3. Subsystem Architectural Details

### A. Deterministic Keyword Routing Pipeline
```text
User Input: "Tap leakage in bathroom washbasin"
                       |
                       v
         Regex Pattern Extraction
  (/tap|pipe|leak|water|drain|flush|sink/)
                       |
                       v
    Category Match: "Plumbing"
    Specialization: "PLUMBING"
    Department:     "Maintenance"
                       |
                       v
Query Staff Directory for Specialization = "PLUMBING"
                       |
                       v
Result: Auto-assign ticket to Ramesh Kumar (STF-PLUMB-01)
Dispatch real-time notification to technician
```

### B. Cryptographic QR Token & PIN Fallback
- **Token Generation**:
  $$\text{Payload} = \text{PassId} \parallel \text{RollNumber} \parallel \text{ExpiresAt}$$
  $$\text{Signature} = \text{HMAC-SHA256}(\text{Payload}, K_{\text{jwt}})[0..16]$$
  $$\text{QR Token} = \text{"NX-GP-"} \parallel \text{Base64}(\text{Payload}) \parallel \text{"."} \parallel \text{Signature}$$
- **Verification Logic**:
  1. The sentry inputs either the scanned QR token string or the 4-digit numeric fallback PIN.
  2. The server verifies signature integrity, token expiration against current wall-clock time, pass state (`APPROVED` vs `DEPARTED`), and student roll number.
  3. Returns verification status: `VALID`, `EXPIRED`, `ALREADY_USED`, or `INVALID`.
  4. State mutations log directly into `gate_events`.

### C. Section 44 Clustered Intelligence Formula
The operational intelligence engine runs an aggregation query evaluating:

$$\text{Count}(Block, Category) = \sum_{t = \text{now} - 14\text{d}}^{\text{now}} \text{Complaints}(Block, Category, t) \ge 3$$

When the count exceeds the threshold (such as Hostel Block B Plumbing with 7 complaints), an alert is surfaced on the Command Center cockpit recommending systemic inspection rather than isolated repairs.

### D. Dynamic Document Generation (PDFKit)
- Server-side streaming PDF generator avoiding temporary disk leaks
- Standardized academic borders, BPUT institutional headers, student registration details, dynamic issue dates, and embedded verification QR codes directing to the public registry.

---

## 4. Security & RBAC Architecture

### Authentication Flow
1. User provides credentials via `POST /api/auth/login`.
2. Password verified using `bcryptjs.compare()` against `passwordHash`.
3. JWT signed containing `{ userId: user.id }` with a 7-day expiration.
4. Token dispatched inside an **HTTP-only, SameSite=Lax** cookie, plus returned in the response payload for dual-mode client authorization.

### Authorization Pipeline
```text
Inbound HTTP Request
         |
         v
[auth.middleware.ts] -----> Verify JWT & Load User, Role, and Permissions
         |
         v
[rbac.middleware.ts] -----> Check required permission (e.g. 'gatepass.approve')
         |                  If unauthorized: return HTTP 403 Forbidden
         v
[validate.middleware.ts] -> Validate request body against Zod schema
         |                  If invalid: return HTTP 422 Unprocessable Entity
         v
[Route Controller] -------> Execute Service logic via Prisma transaction
```

### Immutable Audit Trail
Every critical operational event (gate approvals, document creation, technician resolutions, staff reassignments) calls `AuditService.log()`. The audit log is strictly **append-only** from the application perspective.
