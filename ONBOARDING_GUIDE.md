# NEXORA CAMPUS — COMPREHENSIVE ONBOARDING & ARCHITECTURE GUIDE

Welcome to Nexora Campus! This document is the single source of truth for any new developer, engineer, administrator, or stakeholder joining the project. After reading this guide, you will understand the project's purpose, design philosophy, architecture, data models, core workflows, codebase structure, and how to run or deploy the system.

---

## 1. Executive Summary & Problem Statement

### The Problem
Traditional higher-education campuses run on fragmented, archaic operational processes:
* Paper complaint registers for hostel maintenance that get lost, delayed, or ignored.
* Physical gate books prone to proxy signatures, delayed curfews, and manual bottlenecking.
* In-person counters for academic certificates (e.g., Bonafide certificates) requiring days of manual verification.
* WhatsApp groups and notice boards where critical circulars get buried.
* Siloed maintenance teams with no Service Level Agreement (SLA) tracking or visibility into systemic building failures.

### The Solution: Nexora Campus
Nexora Campus is a centralized, role-based campus operations platform engineered to unify all student, staff, warden, security, and administrative interactions into one integrated engine. Rather than five disparate applications, every campus action flows through the **Nexora Request Engine** backed by a Finite State Machine (FSM).

---

## 2. Core Architecture & Philosophy

### Architectural Pattern: Modular Monolith
Nexora Campus is built as a **Modular Monolith** in a monorepo setup (`backend/` and `frontend/` workspaces):
* **Why Modular Monolith?** Avoids the operational overhead, network latency, distributed transactions, and deployment complexity of microservices, while maintaining clean domain boundaries across TypeScript modules sharing a single transactional database.
* **Unified Request Lifecycle**: Maintenance complaints, exit gate passes, bonafide certificates, and hostel leaves all share the central `Request` model and state machine.

### Technology Stack
* **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React icons, QR code renderers.
* **Backend**: Node.js, Express.js, TypeScript, Helmet (security headers), CORS (configured for cross-origin credentials), Cookie-parser.
* **Database & ORM**: Prisma ORM with 21 relational models. Local runtime uses SQLite for zero-dependency execution; schema is 100% PostgreSQL compliant for production.
* **Security & Auth**: Bcryptjs password hashing, JWT signed tokens, dual-mode authentication (HTTP-only cookies + Authorization Bearer header fallback), granular Role-Based Access Control (RBAC).
* **Document Engine**: PDFKit with digital QR code stamping for authenticating certificates.
* **Testing**: Jest + Supertest (24 integration tests covering auth, RBAC, FSM, and routing).

---

## 3. The Nexora Request Engine & Finite State Machine (FSM)

Every student action is normalized into a `Request` record with a sequential identifier (`NX-XXXXX`).

### Finite State Machine Transition Matrix
The backend strictly enforces allowable state transitions in `RequestService.isValidTransition()`. Any illegal transition returns an HTTP `422 Unprocessable Entity`:
* `SUBMITTED` -> `ROUTED`, `ASSIGNED`, `PENDING_APPROVAL`, `CANCELLED`, `REJECTED`
* `ROUTED` -> `ASSIGNED`, `CANCELLED`
* `ASSIGNED` -> `ACCEPTED`, `IN_PROGRESS`, `REASSIGNED`, `CANCELLED`
* `ACCEPTED` -> `IN_PROGRESS`, `RESOLVED`, `ASSIGNED`, `CANCELLED`
* `IN_PROGRESS` -> `RESOLVED`, `ASSIGNED`, `CANCELLED`
* `RESOLVED` -> `CONFIRMED`, `CLOSED`, `IN_PROGRESS`
* `CONFIRMED` -> `CLOSED`
* `PENDING_APPROVAL` -> `APPROVED`, `REJECTED`, `CANCELLED`
* `APPROVED` -> `DEPARTED`, `COMPLETED`, `CLOSED`, `CANCELLED`
* `DEPARTED` -> `RETURNED`, `CLOSED`
* `RETURNED` -> `CLOSED`
* `CLOSED`, `REJECTED`, `CANCELLED` -> Terminal states

### Immutable Status & Audit History
Every transition automatically writes an append-only entry to `RequestStatusHistory` and `AuditLog`, capturing the timestamp, actor ID, old status, new status, and action comments.

---

## 4. Subsystem Deep-Dives

### A. Deterministic Keyword Routing
* **Zero AI Hallucination**: Rather than relying on non-deterministic LLM calls for critical infrastructure routing, Nexora uses regex keyword matching over complaint descriptions.
* **Keyword Rules**:
  * Tap, pipe, leak, water, drain, sink -> Category `Plumbing` -> Auto-assigned to Plumber (`Ramesh Kumar`).
  * Fan, light, switch, socket, power, bulb, wire -> Category `Electrical` -> Auto-assigned to Electrician (`Suresh Verma`).
  * Door, window, lock, table, chair, bed -> Category `Carpentry`.
  * WiFi, internet, LAN, router, network -> Category `Network & IT`.
* **Zero Latency**: Assignment happens synchronously in the request creation transaction.

### B. Dual-Mode Gate Pass Security
* **Cryptographic QR Token**: The student's approved gate pass encodes an HMAC-SHA256 signature containing Pass ID, Roll Number, and Expiration Timestamp.
* **4-Digit Offline PIN**: In case of poor lighting, camera failure, or network latency at the main gate, the security sentry can verify via a 4-digit PIN fallback.
* **Gate Event Logging**: Sentries mark `DEPARTED` and `RETURNED`, automatically calculating curfew breaches and logging verification events.

### C. Dynamic Bonafide Certificate Generator & Public Registry
* **Server-Side PDFKit Rendering**: Renders high-resolution academic certificates complete with BPUT institutional branding, student registration details, issue date, and an embedded verification QR code.
* **Public Verification Registry**: Anyone scanning the QR code is directed to `/verify/[certificateId]`, allowing external bodies (banks, scholarship offices, embassies) to verify document legitimacy without requiring campus login credentials.

### D. Hostel Leave Management
* Students submit multi-day leave requests specifying emergency contact details and parental consent flags.
* Wardens review, approve, or reject with recorded reasoning directly from their dashboard.

### E. Targeted Campus Notice Board
* Notices can be targeted to: `ALL`, specific **Branches** (CSE, ECE, MECH, etc.), **Academic Years** (1 to 4), or **Hostel Blocks** (Block A, Block B, etc.).
* Tracks per-user read receipts in `NoticeRead`.

### F. Section 44 Clustered Operational Intelligence
* An aggregation algorithm evaluates:
  `Count(Block, Category) = Sum of Complaints(Block, Category, past 14 days)`
* When complaints exceed threshold (>= 3), an `IssueAlert` is triggered on the Command Center dashboard indicating systemic infrastructure failure rather than isolated repairs (e.g., 7 recurring plumbing complaints in Hostel Block B).

### G. SLA Ageing Monitor
* Visual indicators categorize tickets by age: `< 12h`, `12-24h`, `24-48h`, and `> 48h`, alerting staff to SLA breach risks.

### H. Accessibility & Alternative Gateways
* **Nexora Lite** (`/lite`): Ultra-minimal text-first interface (< 25 KB) built for 2G/3G networks.
* **Touch Kiosk** (`/kiosk`): Campus kiosk terminal for fast student roll number lookups and ticket creation without a smartphone.
* **Inbound SMS Gateway** (`/api/integrations/sms/inbound`): Simulated SMS webhook parser that turns incoming texts (e.g. `TICKET B204 TAP LEAKING`) into verified tickets.

---

## 5. User Personas & Role-Based Access Control (RBAC)

Nexora Campus defines 5 pre-seeded demo personas with password **`Password123!`**:

1. **Aryan Khan (Student)**
   * Email: `aryan@nexora.edu` | Roll No: `220101048` | CSE 2nd Year, Block B, Room 204
   * Capabilities: File complaints, view active gate pass QR, download Bonafide certificates, submit leave requests.
2. **Ramesh Kumar (Maintenance Staff - Plumber)**
   * Email: `ramesh@nexora.edu` | Employee ID: `STF-PLUMB-01`
   * Capabilities: View assigned plumbing work orders, accept tasks, mark IN PROGRESS, record resolution notes.
3. **Suresh Verma (Maintenance Staff - Electrician)**
   * Email: `suresh@nexora.edu` | Employee ID: `STF-ELEC-01`
   * Capabilities: View assigned electrical tasks and work order queue.
4. **Dr. S. K. Mohapatra (Hostel Warden)**
   * Email: `warden.b@nexora.edu` | Warden of Block B
   * Capabilities: Approve/reject gate passes and hostel leaves, monitor hostel block complaints.
5. **Vikram Singh (Security Officer)**
   * Email: `security.gate1@nexora.edu` | Main Gate Sentry
   * Capabilities: Scan gate pass QR tokens, verify 4-digit PINs, log gate departures and returns.
6. **Dr. Ananya Ray (Campus Operations Director / Admin)**
   * Email: `admin@nexora.edu` | Head of Operations
   * Capabilities: Full access to Command Center, Section 44 cluster alerts, SLA metrics, staff directory, and audit logs.

*Note: A floating Persona Switcher widget is anchored on all frontend pages for 1-click role swapping during presentations.*

---

## 6. Codebase Directory Structure

```text
Nexora3.0/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # 21 Relational models & indexes
│   │   ├── seed.ts             # Pre-seeded users, rules, complaints
│   │   └── nexora.db           # SQLite local database
│   ├── src/
│   │   ├── config/             # env.ts & prisma.ts client
│   │   ├── middleware/         # auth, rbac, validation, error handling
│   │   ├── routes/             # REST controllers for all 12 modules
│   │   ├── services/           # Business logic (FSM, SLA, PDF, QR, routing)
│   │   ├── tests/              # 24 Jest & Supertest integration tests
│   │   ├── app.ts              # Express application setup
│   │   └── server.ts           # Server bootstrap on PORT 5001
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/login/       # Authentication page
│   │   ├── student/            # Student dashboard, requests, gate pass, docs
│   │   ├── staff/              # Staff task queue, work order details
│   │   ├── warden/             # Approvals for gate passes, leaves, notices
│   │   ├── security/           # Gate scanner, PIN verification, activity log
│   │   ├── admin/              # Command center, recurring issues, SLA, audit
│   │   ├── kiosk/              # Campus self-service touch kiosk
│   │   ├── lite/               # Ultra-low bandwidth text portal
│   │   └── verify/[id]/        # Public certificate verification
│   ├── components/             # Reusable UI cards, layout, badges, navigation
│   ├── lib/
│   │   ├── api.ts              # Fetch client with dual cookie/bearer auth
│   │   └── auth-context.tsx    # React Auth Provider & Persona switcher
│   ├── package.json
│   └── tailwind.config.ts
│
├── .gitignore                  # Production Git ignore configuration
├── render.yaml                 # Render Blueprint specification
├── DEPLOYMENT.md               # Production deployment manual
└── package.json                # Root workspace orchestrator
```

---

## 7. Local Development Setup

### 1. Prerequisites
* Node.js >= 18.0.0
* npm >= 9.0.0

### 2. Installation
From the root directory:
```bash
npm install --workspace=backend
npm install --workspace=frontend
npm install
```

### 3. Database Initialization & Seeding
```bash
cd backend
npx prisma generate
npx prisma db push
npm run prisma:seed
```

### 4. Running the Development Servers
```bash
# Run both servers concurrently from root:
npm run dev

# Or run separately:
cd backend && npm run dev    # Express API on http://localhost:5001
cd frontend && npm run dev   # Next.js UI on http://localhost:3000
```

### 5. Running Automated Tests
```bash
cd backend
npm test
```
*Validates 24 integration tests across auth, RBAC permissions, state machine transitions, keyword routing, gate verification, and Section 44 formulas.*

---

## 8. Completely Free Cloud Deployment Plan

For zero-cost public hosting:
* **Database**: **Neon Serverless PostgreSQL** (0.5 GB free storage, connection pooling).
* **Backend**: **Render Free Web Service** (512 MB RAM, free SSL subdomain).
* **Frontend**: **Vercel Hobby Plan** (Native Next.js 14 edge CDN hosting).
* **Keep-Alive**: **Cron-job.org** pinging `GET /api/health` every 10–14 minutes to prevent Render free instance spin-down.

Refer to `DEPLOYMENT.md` for full environment variable configurations and step-by-step terminal instructions.
