# NEXORA CAMPUS — ARCHITECTURE DOCUMENTATION

## 1. Architectural Style: Modular Monolith

Nexora Campus is architected as a **Modular Monolith**. It avoids unnecessary distributed microservice complexity, network latency, and deployment friction while maintaining strict modular separation across business domains.

```text
+-------------------------------------------------------------------+
|                        NEXT.JS 14 FRONTEND                        |
|                                                                   |
|   /student/*      /staff/*      /warden/*   /security/*  /admin/* |
|   /login          /verify/[id]  /kiosk      /lite        /        |
+-------------------------------------------------------------------+
                                  |
                                  | HTTPS / JSON REST API
                                  v
+-------------------------------------------------------------------+
|                     EXPRESS.JS BACKEND ENGINE                     |
|                                                                   |
|  +-------------------------------------------------------------+  |
|  |                    NEXORA REQUEST ENGINE                    |  |
|  |     Request Number Generator (NX-XXXXX)                     |  |
|  |     Finite State Machine & Transition Matrix                |  |
|  |     Assignment & Reassignment Controller                   |  |
|  |     Status History & Timeline Logger                        |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
|  +---------------------+ +--------------------+ +--------------+  |
|  | Deterministic Router| | QR / PIN Crypto    | | PDF Generator|  |
|  +---------------------+ +--------------------+ +--------------+  |
|  +---------------------+ +--------------------+ +--------------+  |
|  | SLA Ageing Monitor  | | Immutable Audit Log| | Notifications|  |
|  +---------------------+ +--------------------+ +--------------+  |
|                                                                   |
|  +-------------------------------------------------------------+  |
|  | Security & Auth: JWT HTTP-Only Cookies • RBAC Guards        |  |
|  +-------------------------------------------------------------+  |
+-------------------------------------------------------------------+
                                  |
                                  | Prisma ORM
                                  v
+-------------------------------------------------------------------+
|                       RELATIONAL DATABASE                         |
|     (PostgreSQL Compatible Schema • SQLite Local Sandbox)         |
+-------------------------------------------------------------------+
```

---

## 2. Core Subsystems

### A. The Nexora Request Engine
All campus actions flow through the unified Request Engine:
1. **Request Identity**: Human-readable sequential request numbers with entropy (e.g., `NX-10291`).
2. **Lifecycle Model**:
   `SUBMITTED` &rarr; `ROUTED` &rarr; `ASSIGNED` &rarr; `ACCEPTED` &rarr; `IN_PROGRESS` &rarr; `RESOLVED` &rarr; `CONFIRMED` &rarr; `CLOSED`
   or for approval workflows:
   `SUBMITTED` &rarr; `PENDING_APPROVAL` &rarr; `APPROVED` &rarr; `DEPARTED` &rarr; `RETURNED` &rarr; `CLOSED`
3. **Transition Validation**: State transitions are strictly validated in `RequestService.isValidTransition()`. Illegal mutations return HTTP `422 Unprocessable Entity`.
4. **Append-Only History**: Every transition records `changedBy`, `oldStatus`, `newStatus`, and custom `comment` into `request_status_history`.

### B. Deterministic Keyword Routing
Rather than introducing non-deterministic AI latency or costs for simple routing, Nexora uses regex keyword matching against the `routing_rules` table:
- Text tokens: *tap, pipe, leak, water, drain, flush, sink* &rarr; **Plumbing**
- Text tokens: *fan, light, switch, socket, power, bulb, short, wire* &rarr; **Electrical**
- Text tokens: *door, window, lock, handle, table, chair, bed* &rarr; **Carpentry**
- Text tokens: *wifi, internet, lan, router, speed* &rarr; **Network**

The routing engine matches the specialized active staff member (e.g., Ramesh for Plumbing, Suresh for Electrical) and immediately assigns the ticket.

### C. Cryptographic QR Tokens & PIN Fallback
- **Token Format**: `NX-GP-${base64(gatePassId:rollNumber:expiry)}.${hmacSignature}`
- **Security Check**: The server validates HMAC signature, expiration timestamp, pass status, and student association.
- **Offline PIN**: A 4-digit numeric PIN is generated upfront to ensure gate security verification works even if scanning cameras fail or network degrades.

### D. Dynamic PDF Generation & Verification
- Server-side streaming PDF creation with `pdfkit`
- Digital institution seals, dynamic student academic data, and embedded verification QR codes
- Public verification endpoint at `/api/verify/document/:certificateId` and public UI at `/verify/[certificateId]`

### E. Operational Intelligence (Section 44 Clustering)
The recurring issue engine runs a SQL aggregation query over the previous 14-day window:
`Same Hostel Block + Same Category + Complaint Count >= 3`
When detected, an automated operational alert is generated with maintenance recommendations for root-cause resolution.
