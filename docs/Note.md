# 🚀 Nexora Campus — Master Project Understanding & Hackathon Preparation Guide
> **Repository:** `/Users/nazir/Desktop/Nexora3.0`  
> **Event:** BPUT Hackathon 2026  
> **Problem Statement:** *Attendance, Mess, Hostel, Repeat: Campus Life, Debugged*

---

## 📋 Table of Contents
1. [Executive Overview](#1-executive-overview)
2. [Target Personas & Demo Accounts](#2-target-personas--demo-accounts)
3. [System Architecture & Request Lifecycle](#3-system-architecture--request-lifecycle)
4. [Master Technology Stack Matrix](#4-master-technology-stack-matrix)
5. [In-Depth Technology Explanations & Defense](#5-in-depth-technology-explanations--defense)
6. [Codebase File & Directory Classification](#6-codebase-file--directory-classification)
7. [Core Architectural Modules & Capabilities](#7-core-architectural-modules--capabilities)
8. [Automated Testing & Production Verification](#8-automated-testing--production-verification)
9. [Hackathon Defense & Technical Q&A Guide](#9-hackathon-defense--technical-qa-guide)
10. [Study & Preparation Roadmap](#10-study--preparation-roadmap)

---

## 1. Executive Overview

### What Nexora Campus Is
Nexora Campus is a centralized, role-based campus operations platform designed to replace physical paper complaint registers, paper gate passes, manual leave slips, counter-based certificate requests, unstructured WhatsApp circulars, and untracked maintenance tasks with a single, transactional event-driven operations engine.

### Problem Addressed
- **Maintenance Inefficiencies**: Maintenance requests written in physical registers are frequently misplaced or ignored. Technicians lack priority visibility, and students have no real-time status or escalation options.
- **Gate Pass Bottlenecks & Security Risks**: Paper gate slips are easily forged or lost. Manual registers cause long queues during evening curfew hours, and security guards have no instant verification tool.
- **Bureaucratic Certificate Delays**: Students wait several business days for manual bonafide certificate stamping. Third-party entities (banks, scholarship boards) have no way to verify authenticity online.
- **Hostel Leave Tracking**: Outstation leave requests lack digital parental consent records and multi-tier approval tracking.
- **Campus Infrastructure Blindspots**: Systemic failures (e.g. repeated plumbing line issues in a single hostel block) are treated as disconnected complaints rather than systemic infrastructure breakdowns.

### Key Innovations
1. **Deterministic Keyword Routing**: Description keywords are matched against database routing rules using regex to immediately assign specialized technicians in $< 5\text{ ms}$ with zero AI hallucination risk or API costs.
2. **Dual-Mode Gate Pass Security**: Issues an HMAC-SHA256 signed QR code alongside an offline 4-digit PIN, eliminating bottlenecks if camera scanners or network connectivity fail at the gate.
3. **Section 44 Clustering Intelligence**: Automatically detects recurring infrastructure issues when $\ge 3$ complaints occur in the same hostel block under the same category within a rolling 14-day window.
4. **Dynamic PDF Generation & Public Registry**: Generates tamper-evident Bonafide certificates with embedded verification QR codes via PDFKit, verifiable without logging in at `/verify/[certificateId]`.
5. **Alternative Accessibility Channels**: Includes **Nexora Lite** ($< 25\text{ KB}$ text-first interface for 2G/3G connections), a **Campus Touch Kiosk**, and an **Inbound SMS Gateway** for feature-phone users.

---

## 2. Target Personas & Demo Accounts

All demo accounts in `backend/prisma/seed.ts` are configured with the standard password: **`Password123!`**

| Persona | Role | Email | Profile & Scope |
|---|---|---|---|
| **Aryan Khan** | `STUDENT` | `aryan@nexora.edu` | B.Tech CSE, 2nd Year, Hostel Block B, Room 204. Can log maintenance complaints, apply for gate passes, request bonafide certificates, submit leave applications, and view targeted notices. |
| **Ramesh Kumar** | `STAFF` | `ramesh@nexora.edu` | Senior Plumber (Maintenance Dept). Receives auto-routed plumbing tickets, accepts jobs, updates status to in-progress, and logs resolution notes. |
| **Suresh Verma** | `STAFF` | `suresh@nexora.edu` | Senior Electrician. Receives auto-routed electrical breakdown tasks. |
| **Dr. S. K. Mohapatra** | `WARDEN` | `warden.b@nexora.edu` | Chief Warden (Hostel Block B). Reviews and approves/rejects gate passes and leave applications; tracks block complaints. |
| **Vikram Singh** | `SECURITY` | `security.gate1@nexora.edu` | Gate Operations Officer (Main Gate). Uses sentry terminal to scan QR passes or punch 4-digit PINs, recording student departures and returns. |
| **Dr. Ananya Ray** | `ADMIN` | `admin@nexora.edu` | Campus Operations Director. Oversees the Command Center, Section 44 cluster alerts, SLA compliance metrics, and immutable audit logs. |

---

## 3. System Architecture & Request Lifecycle

Nexora is structured as a **Modular Monolith** using an npm workspaces monorepo:

```
[ BROWSER / CLIENT ] (Next.js 14 on Port 3000)
       │
       │ HTTP Request with Cookie / Authorization Bearer Header
       ▼
[ EXPRESS APPLICATION ] (backend/src/app.ts on Port 5001)
       │
       ├─► 1. Helmet Security Headers & CORS Whitelist
       ├─► 2. Body Parsers: express.json(), express.urlencoded(), cookieParser()
       ├─► 3. Auth Middleware: verifies JWT token, loads User + Role + Permissions
       ├─► 4. RBAC Middleware: verifies required permission code (e.g. 'requests.create')
       ├─► 5. Validation Middleware: validates payload against Zod schema
       ├─► 6. Route Handler: parses parameters and invokes service layer
       ├─► 7. Request Engine & FSM: enforces legal transitions (e.g. SUBMITTED -> ASSIGNED)
       ├─► 8. Routing / SLA / Audit Services: determines technician, SLA deadline, audit log
       └─► 9. Prisma ORM: executes atomic queries/transactions against SQLite / PostgreSQL
               │
               ▼
[ DATABASE ] (dev.db / PostgreSQL)
```

### Standardized JSON Response Format
Every backend response follows a uniform structure:
- **Success (`200/201`)**: `{ "success": true, "data": { ... }, "message": "Optional description" }`
- **Error (`400/401/403/404/422/500`)**: `{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human-readable description" } }`

---

## 4. Master Technology Stack Matrix

| Layer | Technology | Version | Purpose in Nexora | Hackathon Priority |
|---|---|---|---|---|
| **Frontend Framework** | Next.js (App Router) | `14.2.20` | Server-rendered React framework for UI routing, layouts, and page rendering | 🔴 MUST KNOW |
| **Frontend UI Library** | React | `18.3.1` | Component-based interactive UI state management | 🔴 MUST KNOW |
| **Full-Stack Language** | TypeScript | `5.7.2` | Static typing, interface definitions, and compile-time error prevention | 🔴 MUST KNOW |
| **Backend Framework** | Express.js | `4.21.2` | Minimalist HTTP web framework for REST API endpoints and middleware | 🔴 MUST KNOW |
| **Database ORM** | Prisma Client & CLI | `5.22.0` | Declarative schema modeling, migrations, and type-safe relational queries | 🔴 MUST KNOW |
| **Database Engine** | SQLite (Dev) / Postgres (Prod)| Embedded | ACID relational data persistence storing users, requests, and logs | 🔴 MUST KNOW |
| **CSS & Styling** | Tailwind CSS | `3.4.16` | Utility-first CSS for responsive, modern UI components | 🔴 MUST KNOW |
| **Schema Validation** | Zod | `3.24.1` | Runtime HTTP request body and query parameter validation | 🔴 MUST KNOW |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`)| `9.0.2` | Stateless cryptographic session tokens in HTTP-only cookies | 🔴 MUST KNOW |
| **Password Hashing** | bcryptjs | `2.4.3` | One-way adaptive cryptographic hashing (10 salt rounds) | 🔴 MUST KNOW |
| **Document Generation**| PDFKit | `0.16.0` | Vector-based PDF rendering for dynamic Bonafide certificates | 🟠 SHOULD KNOW |
| **QR Code Engine** | QRCode / qrcode.react | `1.5.4` / `4.2.0` | Generation and display of 2D verification barcodes | 🟠 SHOULD KNOW |
| **Security Headers** | Helmet | `8.0.0` | Express middleware securing HTTP response headers | 🟠 SHOULD KNOW |
| **Cookie Parser** | cookie-parser | `1.4.7` | Parses incoming cookie headers for HTTP-only JWT sessions | 🟠 SHOULD KNOW |
| **CORS Middleware** | cors | `2.8.5` | Handles cross-origin whitelisting for port 3000 to port 5001 | 🟠 SHOULD KNOW |
| **Icons** | Lucide React | `0.468.0` | UI icon library for student, staff, and admin dashboards | 🟡 NICE TO KNOW |
| **Automated Testing** | Jest & Supertest | `29.7.0` / `7.0.0`| Integration test runner validating 24 backend test cases | 🔴 MUST KNOW |

---

## 5. In-Depth Technology Explanations & Defense

### 1. Next.js 14 (App Router)
- **Beginner**: A React-based web framework that organizes pages using folders instead of manual code routing.
- **Nexora Implementation**: Drives the entire `frontend/` directory. Each subfolder inside `frontend/app/` represents an application route segment (e.g. `app/student/dashboard/page.tsx`).
- **Technical**: Utilizes client components (`'use client'`) for interactive forms and data fetching, paired with layout components (`layout.tsx`) that enforce role-based navigation sidebars.
- **Why It Matters**: Provides nested layouts per user role, fast page loading, and dynamic URL parameters for the public verification portal (`/verify/[certificateId]`).
- **Judge Defense**: "We chose Next.js 14 App Router because it allows structured, nested layout hierarchies per role (student, staff, warden, security, admin) while supporting static optimization and future migration to Server Components."

### 2. Express.js & Node.js
- **Beginner**: A runtime environment (Node.js) and framework (Express.js) that lets JavaScript run on a server to receive and respond to network requests.
- **Nexora Implementation**: Powers `backend/src/server.ts` and `backend/src/app.ts` on port `5001`.
- **Technical**: Constructs a sequential middleware pipeline: Helmet security headers $\to$ CORS $\to$ JSON body parsing $\to$ cookie parsing $\to$ authentication middleware $\to$ route handlers $\to$ global error handler.
- **Why It Matters**: Keeps backend business logic completely decoupled from the frontend, enabling diverse clients (Next.js web portal, Nexora Lite HTML, touch kiosk terminal, inbound SMS webhook) to consume the exact same REST API.
- **Judge Defense**: "Decoupling our Express backend from Next.js ensures that background operational tasks (such as SMS webhooks, hardware kiosk requests, and PDF generation) run independently without serverless timeout constraints."

### 3. Prisma ORM & Database Architecture
- **Beginner**: A tool that maps database tables to TypeScript objects so you interact with your database using code rather than manual SQL strings.
- **Nexora Implementation**: Configured in `backend/prisma/schema.prisma` with over 20 relational models (`User`, `Request`, `Complaint`, `GatePass`, `Notice`, `AuditLog`, etc.).
- **Technical**: Generates a strictly typed client. Prevents SQL injection, manages foreign key constraints and cascade rules, and provides atomic transactions via `prisma.$transaction` for multi-table operations.
- **Why It Matters**: Ensures complete type safety across all database queries. SQLite is used for zero-dependency local hackathon evaluation, but the schema is 100% PostgreSQL compatible.
- **Judge Defense**: "Prisma abstracts the database engine while guaranteeing relational integrity and type safety. We can switch from local SQLite to a production AWS RDS or Supabase PostgreSQL instance simply by updating the connection string, without rewriting any business logic."

### 4. JSON Web Tokens (JWT) & bcryptjs
- **Beginner**: bcrypt scrambles passwords so they cannot be read if stolen; JWT is a digitally signed ticket that proves a user's identity on subsequent requests.
- **Nexora Implementation**: Passwords are hashed with 10 salt rounds. Upon login in `backend/src/routes/auth.routes.ts`, the server issues a signed JWT containing `{ userId }` valid for 7 days.
- **Technical**: Verified in `backend/src/middleware/auth.middleware.ts`. Sent via both `httpOnly` secure cookies (for XSS protection) and `Authorization: Bearer <token>` header (for kiosk and automated test suite access).
- **Why It Matters**: Provides secure, stateless authentication without requiring database session lookups on every request.
- **Judge Defense**: "We implemented dual-mode JWT authentication: HTTP-only cookies protect web browser sessions against XSS attacks, while Bearer token fallback allows headless clients, such as our kiosk terminal and automated test suites, to authenticate reliably."

### 5. PDFKit & QRCode
- **Beginner**: PDFKit draws PDF documents from scratch via code; QRCode encodes links or cryptographic text into 2D barcodes.
- **Nexora Implementation**: `backend/src/services/pdf.service.ts` renders official Bonafide certificates, embedding verification QR codes generated by `backend/src/services/qr.service.ts`.
- **Technical**: Streams vector PDF output directly to disk/HTTP with custom university typography, metadata, and security seals in $< 200\text{ ms}$ with minimal RAM overhead.
- **Why It Matters**: Automates institutional paperwork instantly without requiring heavyweight dependencies like headless Chrome browsers (Puppeteer).
- **Judge Defense**: "We chose PDFKit over headless browser HTML-to-PDF converters because it has a tiny memory footprint, generates certificates in under 200 ms, and does not require launching a 300 MB Chromium process."

---

## 6. Codebase File & Directory Classification

### Priority Legend
- 🔴 **MUST UNDERSTAND**: Core architecture, security, state machine, and data layer.
- 🟠 **SHOULD UNDERSTAND**: Specific feature routes, services, and utilities.
- 🟡 **NICE TO KNOW**: Peripheral accessibility features and styling configuration.

```
Nexora3.0/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma                  🔴 MUST UNDERSTAND  (Complete database relational schema)
│   │   └── seed.ts                        🟠 SHOULD UNDERSTAND (Pre-seeded demo accounts & scenarios)
│   └── src/
│       ├── server.ts                      🟠 SHOULD UNDERSTAND (HTTP server entry point)
│       ├── app.ts                         🔴 MUST UNDERSTAND  (Express app, middlewares & route mounting)
│       ├── config/
│       │   ├── env.ts                     🟠 SHOULD UNDERSTAND (Environment variables & defaults)
│       │   └── prisma.ts                  🟠 SHOULD UNDERSTAND (Prisma client singleton)
│       ├── middleware/
│       │   ├── auth.middleware.ts         🔴 MUST UNDERSTAND  (JWT extraction & user verification)
│       │   ├── rbac.middleware.ts         🔴 MUST UNDERSTAND  (Role & permission enforcement)
│       │   ├── validate.middleware.ts     🟠 SHOULD UNDERSTAND (Zod request payload validator)
│       │   └── error.middleware.ts        🟠 SHOULD UNDERSTAND (Centralized error response handler)
│       ├── routes/
│       │   ├── auth.routes.ts             🟠 SHOULD UNDERSTAND (Login, logout, me, persona switch)
│       │   ├── request.routes.ts          🔴 MUST UNDERSTAND  (FSM transition endpoints & timeline)
│       │   ├── complaint.routes.ts        🟠 SHOULD UNDERSTAND (Complaint logging, accept, resolve, rate)
│       │   ├── gatepass.routes.ts         🔴 MUST UNDERSTAND  (Gate pass lifecycle, QR & PIN verification)
│       │   ├── bonafide.routes.ts         🟠 SHOULD UNDERSTAND (Certificate request & PDF generation trigger)
│       │   ├── verify.routes.ts           🟠 SHOULD UNDERSTAND (Zero-login public document verification)
│       │   ├── leave.routes.ts            🟠 SHOULD UNDERSTAND (Hostel leave & parent consent approval)
│       │   ├── notice.routes.ts           🟠 SHOULD UNDERSTAND (Targeted notices & read receipts)
│       │   ├── admin.routes.ts            🔴 MUST UNDERSTAND  (Command Center, Section 44, SLA, audits)
│       │   ├── kiosk.routes.ts            🟡 NICE TO KNOW     (Touch kiosk student lookup & ticket creation)
│       │   └── integration.routes.ts      🟡 NICE TO KNOW     (Inbound SMS webhook parser simulator)
│       ├── services/
│       │   ├── request.service.ts         🔴 MUST UNDERSTAND  (FSM state machine & request numbering)
│       │   ├── routing.service.ts         🔴 MUST UNDERSTAND  (Deterministic keyword matching engine)
│       │   ├── sla.service.ts             🔴 MUST UNDERSTAND  (SLA calculation & 4 ageing brackets)
│       │   ├── pdf.service.ts             🟠 SHOULD UNDERSTAND (PDFKit certificate vector renderer)
│       │   ├── qr.service.ts              🟠 SHOULD UNDERSTAND (HMAC token signing & QR generator)
│       │   ├── audit.service.ts           🟠 SHOULD UNDERSTAND (Immutable audit log writer)
│       │   └── notification.service.ts    🟠 SHOULD UNDERSTAND (In-app notification dispatcher)
│       └── tests/
│           └── nexora.test.ts             🔴 MUST UNDERSTAND  (24 automated integration test suites)
│
└── frontend/
    ├── lib/
    │   ├── api.ts                         🔴 MUST UNDERSTAND  (Universal fetch wrapper & error handling)
    │   └── auth-context.tsx               🔴 MUST UNDERSTAND  (React AuthContext & persona switching)
    ├── components/
    │   └── layout/
    │       ├── Navbar.tsx                 🟠 SHOULD UNDERSTAND (Navigation header & active role badge)
    │       ├── Sidebar.tsx                🟠 SHOULD UNDERSTAND (Role-specific navigation menu)
    │       ├── NotificationBell.tsx       🟠 SHOULD UNDERSTAND (In-app notification popup list)
    │       └── PersonaSwitcher.tsx        🔴 MUST UNDERSTAND  (Floating 1-click live demo role switcher)
    └── app/
        ├── page.tsx                       🟠 SHOULD UNDERSTAND (Landing page & demo launcher)
        ├── login/page.tsx                 🟠 SHOULD UNDERSTAND (Authentication login form)
        ├── student/dashboard/page.tsx     🟠 SHOULD UNDERSTAND (Student operations cockpit)
        ├── staff/dashboard/page.tsx       🟠 SHOULD UNDERSTAND (Technician work order dashboard)
        ├── warden/dashboard/page.tsx      🟠 SHOULD UNDERSTAND (Warden approval management interface)
        ├── security/scan/page.tsx         🔴 MUST UNDERSTAND  (Gate sentry QR scanner & PIN keypad)
        ├── admin/dashboard/page.tsx       🔴 MUST UNDERSTAND  (Command Center, Section 44, SLA charts)
        ├── verify/[certificateId]/page.tsx🟠 SHOULD UNDERSTAND(Public zero-login certificate verification)
        ├── lite/page.tsx                  🟡 NICE TO KNOW     (Nexora Lite ultra-low bandwidth UI)
        └── kiosk/page.tsx                 🟡 NICE TO KNOW     (Campus touch kiosk terminal UI)
```

---

## 7. Core Architectural Modules & Capabilities

### 1. Finite-State Machine (FSM) State Transition Engine
The state machine in `backend/src/services/request.service.ts` governs all operational status changes.

**Transition Rules Table:**
```typescript
SUBMITTED        -> ['ROUTED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'CANCELLED', 'REJECTED']
ROUTED           -> ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'CANCELLED']
ASSIGNED         -> ['ACCEPTED', 'IN_PROGRESS', 'RESOLVED', 'REASSIGNED', 'CANCELLED']
ACCEPTED         -> ['IN_PROGRESS', 'RESOLVED', 'ASSIGNED', 'CANCELLED']
IN_PROGRESS      -> ['RESOLVED', 'ASSIGNED', 'CANCELLED']
RESOLVED         -> ['CONFIRMED', 'CLOSED', 'IN_PROGRESS']
CONFIRMED        -> ['CLOSED']
PENDING_APPROVAL -> ['APPROVED', 'REJECTED', 'CANCELLED']
APPROVED         -> ['DEPARTED', 'COMPLETED', 'CLOSED', 'CANCELLED']
DEPARTED         -> ['RETURNED', 'CLOSED']
RETURNED         -> ['CLOSED']
CLOSED, REJECTED, CANCELLED -> [] (Terminal states)
```
- If a client attempts an illegal transition (e.g., `CLOSED` $\to$ `APPROVED`), the engine throws an `AppError` with status `422` and code `INVALID_STATUS_TRANSITION`.
- Every transition automatically appends a record to `RequestStatusHistory` and records an entry in `AuditLog`.

### 2. Deterministic Keyword Routing Engine
Implemented in `backend/src/services/routing.service.ts`:
1. Concatenates complaint title and description into lowercase text.
2. Queries the database `RoutingRule` table:
   - `Plumbing`: keywords `tap, pipe, leak, water, drain, flush, basin, shower, sink, toilet` $\to$ `PLUMBING` specialization.
   - `Electrical`: keywords `fan, light, switch, socket, power, bulb, short, wiring, ac, mcb` $\to$ `ELECTRICAL` specialization.
   - `Carpentry`: keywords `door, window, lock, handle, table, chair, bed, almirah` $\to$ `CARPENTRY` specialization.
   - `Network`: keywords `wifi, internet, lan, ethernet, router, connectivity` $\to$ `IT` specialization.
   - `Cleanliness`: keywords `garbage, dustbin, clean, sweep, washroom, dirty, odor` $\to$ `GENERAL` specialization.
3. Scores each rule based on keyword hits. Selects the highest-scoring category.
4. Queries active `Staff` members matching that specialization and auto-assigns the ticket (e.g. `Ramesh Kumar` for plumbing).

### 3. Dual-Mode Gate Pass Security
Implemented in `backend/src/routes/gatepass.routes.ts` and `backend/src/services/qr.service.ts`:
- **QR Token**: An HMAC-SHA256 signed string combining request number, 4-digit PIN, and curfew timestamp.
- **PIN Fallback**: A 4-digit numeric code (e.g. `4821`) generated at pass creation.
- **Security Check at Gate**:
  - Security guard scans the QR code or enters the PIN on the touch keypad.
  - Sentry verifies status: checks if approved, not expired, and not already used.
  - Guard marks `DEPARTED` upon exit and `RETURNED` upon re-entry. Both events are timestamped and logged in `GateEvent`.

### 4. Dynamic Bonafide Certificate Generator & Public Registry
Implemented in `backend/src/services/pdf.service.ts` and `backend/src/routes/verify.routes.ts`:
- Generates official certificates bearing student name, roll number, branch, academic year, certificate ID (`NX-BON-2026-XXXXX`), and purpose.
- Renders an embedded verification QR code pointing to `http://localhost:3000/verify/NX-BON-2026-XXXXX`.
- The public portal validates the certificate against the database and displays verification status (`VALID`, `REVOKED`, `EXPIRED`) with zero login requirement, while redacting sensitive private contact information.

### 5. Section 44 Clustering & SLA Monitoring
Implemented in `backend/src/routes/admin.routes.ts` and `backend/src/services/sla.service.ts`:
- **Section 44 Clustering**: Collects all complaints created over the trailing 14 days and groups them by `hostelBlockId` and `category`. If any group has $\ge 3$ complaints, it raises an `IssueAlert` (e.g. 7 Plumbing complaints in Hostel Block B flagged as critical infrastructure failure).
- **SLA Ageing Monitor**: Dynamically assigns deadlines based on request priority (`URGENT`: 4h, `HIGH`: 8h, `NORMAL`: 12–24h) and tracks open tickets across 4 ageing buckets:
  - `< 12h`
  - `12–24h`
  - `24–48h`
  - `> 48h`

---

## 8. Automated Testing & Production Verification

The backend includes a comprehensive automated test suite in `backend/src/tests/nexora.test.ts` with **24 integration tests** covering all operational flows:

```bash
# Run backend test suite
cd backend && npm test
```

### Verified Test Suites:
1. **Authentication & RBAC**:
   - Validates `/api/auth/me` returns student profile and permissions.
   - Asserts student receives HTTP `403 Forbidden` when attempting to access `/api/admin/dashboard`.
   - Verifies 1-click persona switching to Ramesh (Staff).
2. **Complaint Workflow & Routing**:
   - Asserts a complaint describing "tap leak" auto-routes to Plumbing and assigns Ramesh.
   - Verifies sequential status flow: `ASSIGNED` $\to$ `ACCEPTED` $\to$ `IN_PROGRESS` $\to$ `RESOLVED`.
   - Verifies student confirmation and 5-star rating submission.
   - Validates that illegal transition (`CLOSED` $\to$ `APPROVED`) throws `422 INVALID_STATUS_TRANSITION`.
3. **Gate Pass Module**:
   - Asserts student pass application defaults to `PENDING_APPROVAL`.
   - Asserts warden approval generates HMAC QR token and activates PIN.
   - Verifies PIN verification returns `VALID`.
   - Verifies security departure and return state logging.
4. **Bonafide Certificate & Verification**:
   - Asserts certificate approval triggers PDFKit document generation.
   - Verifies `/api/verify/document/:certId` returns `VALID` on the public verification endpoint.
5. **Hostel Leave Module**:
   - Asserts leave submission with emergency contacts and warden approval.
6. **Command Center & Section 44**:
   - Asserts `/api/admin/dashboard` returns aggregated counts and SLA metrics.
   - Verifies Section 44 detects the Hostel Block B Plumbing cluster ($\ge 3$ complaints).
   - Verifies immutable audit logs record `REQUEST_CREATED` actions.
7. **Kiosk & SMS Integration**:
   - Asserts kiosk student lookup returns profile data by roll number.
   - Asserts inbound SMS parser converts raw text (`TICKET B204 TAP LEAKING`) into a structured complaint.

---

## 9. Hackathon Defense & Technical Q&A Guide

### Top Judge Questions & Verified Answers

#### Q1: "Why did you build a custom request engine instead of using existing ticketing tools like Jira or Zendesk?"
> **Answer**: "Commercial enterprise ticketing systems are built for corporate IT desks, not university campuses. They lack campus-specific domain concepts like hostel block curfews, warden approval hierarchies, parental leave consent, cryptographic gate pass QR codes with 4-digit sentry PIN fallbacks, and public certificate verification. Nexora unifies all campus operational workflows into a single lightweight platform."

#### Q2: "Why didn't you use an LLM like Gemini or GPT to classify and route complaints?"
> **Answer**: "We evaluated LLM-based classification, but in an operational campus environment, deterministic regex keyword routing is superior:
> 1. It executes in $< 5\text{ ms}$ on the server without external API latency.
> 2. It has zero token cost.
> 3. It works completely offline during campus internet blackouts.
> 4. It eliminates AI hallucinations, guaranteeing that a plumbing issue will never be misrouted to an electrician."

#### Q3: "What happens if a student's phone battery dies at the campus gate?"
> **Answer**: "This is why Nexora implements dual-mode verification. When a gate pass is approved, the system generates both an HMAC-signed QR code and an offline 4-digit PIN. If a student's phone runs out of battery, they can provide their roll number and 4-digit PIN to the security officer, who validates it instantly on the sentry keypad."

#### Q4: "How does the system scale if thousands of students use it simultaneously?"
> **Answer**: "The architecture is stateless. Express session tokens are JWT-based, meaning the backend server holds no session state in memory. For horizontal scaling, multiple backend instances can sit behind an NGINX reverse proxy or load balancer. The database layer uses Prisma, which can connect directly to a high-throughput PostgreSQL cluster on AWS RDS with connection pooling."

---

## 10. Study & Preparation Roadmap

| Day | Focus Area | Key Files to Inspect | Practical Objective |
|---|---|---|---|
| **Days 1–2** | Monorepo Structure & Environment Setup | `package.json`, `backend/src/app.ts`, `frontend/lib/api.ts` | Run `npm run dev`, verify port 3000 and port 5001, test health endpoint. |
| **Days 3–4** | Database Models & Seed Data | `backend/prisma/schema.prisma`, `backend/prisma/seed.ts` | Understand relationships between User, Student, Staff, Request, and GatePass. |
| **Days 5–6** | Authentication, RBAC & Security | `backend/src/middleware/auth.middleware.ts`, `rbac.middleware.ts` | Trace how a JWT cookie is parsed and permissions are verified. |
| **Days 7–8** | Central Request Engine & FSM | `backend/src/services/request.service.ts` | Trace how valid transitions are checked and illegal ones blocked. |
| **Days 9–10** | Deterministic Routing & SLA Engine | `backend/src/services/routing.service.ts`, `sla.service.ts` | Review keyword matching and 4 SLA ageing brackets. |
| **Days 11–12** | Gate Pass & Sentry Verification | `backend/src/routes/gatepass.routes.ts`, `frontend/app/security/scan` | Test QR generation, PIN verification, departure/return tracking. |
| **Days 13–14** | Admin Dashboard & Section 44 | `backend/src/routes/admin.routes.ts`, `frontend/app/admin/dashboard` | Walk through Section 44 cluster detection and SLA metrics. |
| **Day 15** | Demo Rehearsal & Judge Interview Prep | `docs/DEMO.md`, `backend/src/tests/nexora.test.ts` | Rehearse the 3-minute presentation script and answer judge questions. |
