# NEXORA CAMPUS
> **ONE PLATFORM FOR EVERY CAMPUS REQUEST.**  
> *BPUT Hackathon 2026 • Problem Statement: Attendance, Mess, Hostel, Repeat: Campus Life, Debugged*

---

## 🏛️ Executive Overview

**Nexora Campus** is a centralized, role-based campus operations platform built to eliminate paper complaint logs, physical gate registers, manual leave applications, counter-based certificate requests, WhatsApp circulars, and untracked maintenance tasks.

Nexora is not a loose bundle of disconnected tools. Every operational workflow connects directly to the core:

```text
               +-----------------------------------+
               |       NEXORA REQUEST ENGINE       |
               +-----------------------------------+
                                 |
     +---------------+-----------+-----------+---------------+
     |               |                       |               |
     v               v                       v               v
Maintenance     Campus Gate Pass       Hostel Leaves    Bonafide Certs
Complaints      (QR & PIN Dual-Mode)   (Multi-Day)      (Dynamic PDFs)
```

---

## 🚀 Key Modules & Capabilities

### 1. Centralized Request Engine (`NX-XXXXX`)
- **Lifecycle Pipeline**: `CREATE` &rarr; `ROUTE` &rarr; `ASSIGN` &rarr; `ACCEPT` &rarr; `IN_PROGRESS` &rarr; `RESOLVE` &rarr; `CONFIRM` &rarr; `CLOSE`.
- **Finite-State Machine (FSM)**: Enforces legal state transitions on the server. Invalid transitions (e.g., `CLOSED` &rarr; `APPROVED` or `REJECTED` &rarr; `DEPARTED`) are blocked with HTTP `422`.
- **Audit Timeline**: Every transition creates an immutable historical event record with actor details, timestamps, and comments.

### 2. Deterministic Keyword Routing
- **Zero AI Hallucinations**: Regex keyword analyzer matches complaint descriptions directly to technician specializations:
  - *tap, pipe, leak, water, drain, flush, sink* &rarr; **Plumbing** (`Ramesh Kumar`)
  - *fan, light, switch, socket, power, bulb, short, wire* &rarr; **Electrical** (`Suresh Verma`)
  - *door, window, lock, handle, table, chair, bed* &rarr; **Carpentry**
  - *wifi, internet, lan, router, network* &rarr; **Network & IT**
- Automatic allocation to available specialized technicians with zero latency.

### 3. Dual-Mode Gate Pass Security (Cryptographic QR & Offline PIN)
- **HMAC-Signed QR Code**: Token payload signed with HMAC-SHA256 and bound to a return curfew expiry.
- **4-Digit Fallback PIN**: Eliminates scanner bottlenecks if camera scanning is slow or devices are offline.
- **Real-Time Sentry Verification**: Guards verify status (`VALID`, `EXPIRED`, `ALREADY_USED`, `INVALID`), logging exact departure and return timestamps into `gate_events`.

### 4. Dynamic Bonafide Certificate Generator & Public Registry
- **On-Demand PDF Generation**: Server renders official high-resolution certificates via PDFKit with institution seals and verification QR codes.
- **Zero-Login Public Registry**: Public verification portal at `/verify/[certificateId]` exposing strictly necessary validation data.

### 5. Hostel Leave Application Workflow
- Student submission with parental contact verification and consent affirmations.
- Warden review cockpit with one-click approval or rejection with reason recording.

### 6. Targeted Campus Notice Board
- Granular audience filtering by **Branch** (CSE, ECE, MECH, etc.), **Academic Year** (1–4), **Hostel Block** (Block A–D), or **ALL**.
- Per-user read receipt registration.

### 7. Section 44 Operational Intelligence & SLA Monitoring
- **Section 44 Clustering**: Automatically alerts administrators when $\ge 3$ complaints occur in the same hostel block and category within a 14-day window (pre-seeded with 7 Block B Plumbing complaints).
- **SLA Ageing Monitor**: Visual indicators categorizing open tickets into `< 12h`, `12–24h`, `24–48h`, and `> 48h`.

### 8. Accessibility & Alternative Channels
- **Nexora Lite** (`/lite`): High-performance, text-first interface (&lt; 25 KB footprint) tailored for low-bandwidth 2G/3G campus connections.
- **Campus Touch Kiosk** (`/kiosk`): Terminal for student roll number lookups and immediate self-service ticket submissions.
- **Inbound SMS Gateway** (`POST /api/integrations/sms/inbound`): Simulated SMS webhook parser creating tickets directly from incoming text strings (e.g., `TICKET B204 TAP LEAKING`).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express.js, TypeScript (Modular Monolith) |
| **Database & ORM** | Prisma ORM, SQLite (local zero-dependency sandbox runtime; 100% PostgreSQL compatible) |
| **Validation** | Zod |
| **Security & Auth** | Bcryptjs password hashing, JWT in HTTP-only cookies, granular RBAC middleware |
| **Document Generation** | PDFKit, QRCode |
| **Testing** | Jest, Supertest, ts-jest (24 integration tests, 100% pass rate) |

---

## 👥 Demo Personas (Pre-Seeded)

All demo accounts use the standard password: **`Password123!`**

| Persona | Role | Email | Profile Details |
|---|---|---|---|
| **Aryan Khan** | `STUDENT` | `aryan@nexora.edu` | B.Tech CSE, 2nd Year, Hostel Block B, Room 204 |
| **Ramesh Kumar** | `STAFF` | `ramesh@nexora.edu` | Senior Maintenance Plumber |
| **Suresh Verma** | `STAFF` | `suresh@nexora.edu` | Senior Electrician |
| **Dr. S. K. Mohapatra** | `WARDEN` | `warden.b@nexora.edu` | Chief Warden, Hostel Block B |
| **Vikram Singh** | `SECURITY` | `security.gate1@nexora.edu` | Gate Operations Officer, Main Gate |
| **Dr. Ananya Ray** | `ADMIN` | `admin@nexora.edu` | Campus Operations Director |

> 💡 **Demo Persona Switcher**: A floating widget is available at the bottom-right corner of all web pages for 1-click switching between accounts during presentations.

---

## ⚡ Quick Start & Development Setup

### 1. Prerequisites
- Node.js &ge; 18.0.0
- npm &ge; 9.0.0

### 2. Installation
From the project root directory:
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Install root concurrently orchestrator
cd .. && npm install
```

### 3. Database Initialization & Seeding
```bash
cd backend
npx prisma generate
npx prisma db push
npm run prisma:seed
```

### 4. Running the Application
You can run both servers simultaneously from the root folder:
```bash
npm run dev
```

Or run them in separate terminal tabs:
- **Terminal 1 (Backend - Port 5001)**:
  ```bash
  cd backend && npm run dev
  ```
- **Terminal 2 (Frontend - Port 3000)**:
  ```bash
  cd frontend && npm run dev
  ```

---

## 🌐 Application Navigation & Endpoints

| Portal | URL | Description |
|---|---|---|
| **Main Campus Portal** | [http://localhost:3000](http://localhost:3000) | Landing page, interactive demo launchers, and authentication |
| **Student Portal** | [http://localhost:3000/student/dashboard](http://localhost:3000/student/dashboard) | Complaints, gate pass QR, Bonafide certificates, leaves |
| **Staff Work Orders** | [http://localhost:3000/staff/dashboard](http://localhost:3000/staff/dashboard) | Assigned tasks, work start, resolution notes |
| **Warden Cockpit** | [http://localhost:3000/warden/dashboard](http://localhost:3000/warden/dashboard) | Gate pass & leave approvals, block complaints |
| **Gate Security** | [http://localhost:3000/security/scan](http://localhost:3000/security/scan) | Large-touch QR and 4-digit PIN verification scanner |
| **Command Center** | [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard) | Operations cockpit, Section 44 cluster alerts, SLA ageing |
| **Nexora Lite** | [http://localhost:3000/lite](http://localhost:3000/lite) | Text-first minimal bandwidth interface (&lt; 25 KB) |
| **Campus Touch Kiosk** | [http://localhost:3000/kiosk](http://localhost:3000/kiosk) | Roll number self-service terminal |
| **Public Document Verify** | [http://localhost:3000/verify/NX-BON-2026-00199](http://localhost:3000/verify/NX-BON-2026-00199) | Online certificate legitimacy verification |
| **Backend API Health** | [http://localhost:5001/api/health](http://localhost:5001/api/health) | Operational status probe |

---

## 🧪 Automated Testing & Production Builds

### Run Test Suite
The backend contains 24 automated integration tests validating authentication, RBAC, request state transitions, routing, gate verification, PDF generation, Section 44 intelligence, and SMS parsing:
```bash
cd backend
npm test
```

### Production Build
```bash
# Build backend TypeScript
cd backend && npm run build

# Build Next.js production bundle (all 41 static & dynamic routes)
cd ../frontend && npm run build
```

---

## 📄 Documentation Index
- [ARCHITECTURE.md](file:///Users/nazir/Desktop/Version%203.0%20/ARCHITECTURE.md): System architecture, Finite State Machine, and clustering algorithms.
- [DEMO.md](file:///Users/nazir/Desktop/Version%203.0%20/DEMO.md): Step-by-step 3-minute hackathon presentation script.
- [API.md](file:///Users/nazir/Desktop/Version%203.0%20/API.md): Comprehensive REST API endpoint reference.
- [DATABASE.md](file:///Users/nazir/Desktop/Version%203.0%20/DATABASE.md): Relational schema definitions, constraints, and indexes.
- [DEPLOYMENT.md](file:///Users/nazir/Desktop/Version%203.0%20/DEPLOYMENT.md): Production deployment guide and PostgreSQL migration steps.
