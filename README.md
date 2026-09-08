# NEXORA CAMPUS
> **ONE PLATFORM FOR EVERY CAMPUS REQUEST.**
> BPUT Hackathon 2026 • Problem Statement: *Attendance, Mess, Hostel, Repeat: Campus Life, Debugged*

---

## 🏛️ Executive Summary

Nexora Campus is a centralized campus operations platform that consolidates fragmented, manual student services into a single, cohesive digital engine. It replaces:
- ❌ Paper complaint registers
- ❌ Physical gate registers
- ❌ Manual leave paper applications
- ❌ Counter-based certificate queues
- ❌ WhatsApp-based broadcast notices
- ❌ Untracked maintenance requests
- ❌ Fragmented verbal approvals

With **Nexora**, campus operations are unified under the **Nexora Request Engine** — a reusable, auditable, and SLA-aware workflow engine powering every request across its entire lifecycle.

---

## 🚀 Core Features

### 1. Centralized Nexora Request Engine
- Standardized human-readable request numbers (e.g. `NX-10291`).
- Enforced finite-state transitions (`SUBMITTED` &rarr; `ROUTED` &rarr; `ASSIGNED` &rarr; `ACCEPTED` &rarr; `IN_PROGRESS` &rarr; `RESOLVED` &rarr; `CONFIRMED` &rarr; `CLOSED`).
- Status transition validation rejecting illegal mutations (e.g., `CLOSED` &rarr; `APPROVED` is blocked).
- Complete immutable audit timeline for every ticket.

### 2. Deterministic Maintenance Routing (Zero AI Hallucination)
- Keyword-based regex parsing (e.g., *tap, pipe, leak, water* &rarr; **Plumbing**; *fan, light, switch, spark* &rarr; **Electrical**).
- Automatic staff specialization allocation and instant notifications.

### 3. Cryptographic QR Gate Pass & 4-Digit Offline PIN
- Dual-mode exit verification: HMAC-signed, expiring QR tokens + 4-digit numeric PIN fallback.
- Real-time gate security scanner with status validation (`VALID`, `EXPIRED`, `ALREADY_USED`, `INVALID`).
- Sentry departure and return logging into `gate_events`.

### 4. Dynamic Bonafide Certificate Generation & Public Verification
- Authority approval generates official unique Certificate ID (e.g., `NX-BON-2026-00231`).
- Dynamic server-side PDF generation via PDFKit featuring institution seals and embedded verification QR.
- Public, zero-login verification registry at `/verify/[certificateId]` exposing strictly necessary validation data.

### 5. Hostel Leave Workflow
- Student multi-day absence application with emergency parent contact verification and parental consent affirmation.
- Warden approval/rejection cockpit.

### 6. Targeted Campus Notice Board
- Audience-filtered broadcasts by **Branch** (CSE, ECE, etc.), **Year** (1-4), **Hostel Block** (Block A-D), or **ALL**.
- User read receipt tracking.

### 7. Operational Intelligence & Section 44 Recurring Issue Detection
- **Section 44 Algorithm**: Automatically clusters complaints by Hostel Block + Category and alerts administrators when &ge; 3 complaints occur within a 14-day window (demonstrated by the Block B Plumbing cluster with 7 complaints).
- **SLA Ageing Monitor**: Tracks benchmark response and resolution windows categorized into `< 12h`, `12–24h`, `24–48h`, and `> 48h`.

### 8. Alternative Channels: Nexora Lite, Kiosk, & Inbound SMS
- **Nexora Lite** (`/lite`): Ultra-lightweight text-first interface (&lt; 25 KB footprint) designed for low-bandwidth 2G/3G networks.
- **Campus Touch Kiosk** (`/kiosk`): Self-service station with instant student roll number lookup and quick ticket creation.
- **Non-Smartphone SMS Gateway** (`POST /api/integrations/sms/inbound`): Webhook/SMS parser converting incoming text messages (e.g., `TICKET B204 TAP LEAKING`) into verified tickets.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express.js, TypeScript (Modular Monolith) |
| **Database** | SQLite (Prisma ORM for local zero-dependency sandbox runtime; 100% PostgreSQL schema compatible) |
| **Validation** | Zod |
| **Security & Auth** | Bcrypt password hashing, JWT in HTTP-only cookies, RBAC Middleware |
| **Document Generation** | PDFKit, QRCode |
| **Testing** | Jest, Supertest, ts-jest (24 integration tests) |

---

## 👥 Demo Accounts (Pre-Seeded)

All demo accounts use the standard password: **`Password123!`**

| Persona | Role | Credentials | Description |
|---|---|---|---|
| **Aryan Khan** | `STUDENT` | `aryan@nexora.edu` | B.Tech CSE, 2nd Year, Hostel B, Room 204 |
| **Ramesh Kumar** | `STAFF` | `ramesh@nexora.edu` | Senior Plumber, Maintenance Dept |
| **Suresh Verma** | `STAFF` | `suresh@nexora.edu` | Senior Electrician, Maintenance Dept |
| **Dr. S. K. Mohapatra** | `WARDEN` | `warden.b@nexora.edu` | Chief Warden, Hostel Block B |
| **Vikram Singh** | `SECURITY` | `security.gate1@nexora.edu` | Gate Security Officer, Main Gate |
| **Dr. Ananya Ray** | `ADMIN` | `admin@nexora.edu` | Campus Operations Director |

> 💡 **Demo Persona Switcher**: Use the floating widget at the bottom right of any page to switch between personas in 1 click!

---

## ⚡ Quick Start & Development Commands

### Prerequisites
- Node.js &ge; 18.0.0
- npm &ge; 9.0.0

### Installation
From the repository root:
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Return to root and install concurrently
cd .. && npm install
```

### Database Setup & Seeding
```bash
cd backend
npx prisma generate
npx prisma db push
npm run prisma:seed
```

### Running the Application
```bash
# Option 1: Run both frontend and backend concurrently from root
npm run dev

# Option 2: Run backend and frontend in separate terminals
# Terminal 1 (Backend - Port 5001)
cd backend && npm run dev

# Terminal 2 (Frontend - Port 3000)
cd frontend && npm run dev
```

- **Frontend Portal**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5001/api](http://localhost:5001/api)
- **Public Verification Demo**: [http://localhost:3000/verify/NX-BON-2026-00199](http://localhost:3000/verify/NX-BON-2026-00199)
- **Campus Kiosk**: [http://localhost:3000/kiosk](http://localhost:3000/kiosk)
- **Nexora Lite**: [http://localhost:3000/lite](http://localhost:3000/lite)

### Running Automated Tests
```bash
cd backend
npm test
```

### Production Build
```bash
# Build backend
cd backend && npm run build

# Build frontend
cd ../frontend && npm run build
```

---

## 🎬 3-Minute Hackathon Demo Script

1. **Step 1: Student Complaint & Auto-Routing**
   - Switch to **Aryan** (Student) via Persona Switcher.
   - Click `+ New Complaint`. Enter: *Title: Bathroom tap leak*, *Location: Hostel B / Room 204*.
   - Notice the live routing preview indicating: *Category: Plumbing &bull; Staff: Ramesh Kumar*.
   - Click **Submit Complaint**. A ticket (e.g., `NX-10108`) is created and routed.

2. **Step 2: Staff Acceptance & Resolution**
   - Switch to **Ramesh** (Staff).
   - In Ramesh's Work Orders, open ticket `NX-10108`.
   - Click **Accept Task** &rarr; status transitions to `ACCEPTED`.
   - Click **Start On-Site Work** &rarr; status transitions to `IN_PROGRESS`.
   - Enter resolution notes (*"Replaced worn spindle gasket with brand new brass washer"*), click **Mark Resolved**.
   - Switch back to Aryan to confirm and award a 5-star rating!

3. **Step 3: Gate Pass Cryptographic Verification**
   - As **Aryan**, go to `Gate Pass (QR & PIN)` &rarr; apply for gate pass to *City Market*.
   - Switch to **Warden (Block B)** &rarr; click **Approve Pass**. An HMAC-signed QR token and PIN (e.g. `7392`) are generated.
   - Switch to **Security** &rarr; go to `Gate Pass Verification`.
   - Enter PIN `7392` or paste QR token &rarr; click **VERIFY** &rarr; verify result is `VALID`.
   - Click **MARK STUDENT DEPARTED** &rarr; student is logged as off-campus.
   - Later, click **MARK STUDENT RETURNED** &rarr; pass is safely closed.

4. **Step 4: Bonafide Certificate & Dynamic PDF**
   - As **Aryan**, go to `Documents & Bonafide` &rarr; apply for *Scholarship Verification*.
   - Switch to **Chief Admin** &rarr; go to `Approvals Hub` &rarr; click **Approve & Generate PDF**.
   - The server dynamically renders an official Bonafide PDF with university seals and verification QR code.
   - Open the public verification link: `/verify/[certificateId]` &rarr; see official document verification status `VALID`!

5. **Step 5: Admin Cockpit & Section 44 Recurring Issues**
   - As **Chief Admin**, open `Command Center`.
   - View live operational metrics: Open Requests, Overdue, Resolved Today, SLA Ageing.
   - View the prominent **Section 44 Alert**: *Hostel B &bull; Category: Plumbing &bull; 7 complaints in 14 days*.
   - Review root cause analysis and automated maintenance recommendation.

6. **Step 6: Nexora Lite & Kiosk**
   - Navigate to `/lite` &rarr; demo text-only interface with ultra-low latency.
   - Navigate to `/kiosk` &rarr; enter roll number `220101048` &rarr; view student profile and submit a self-service ticket.

---

## 🔒 Security & RBAC Implementation

- **Server-Side Authorization**: Every state change is authorized on the backend. Frontend UI conditional rendering is supplemented by strict backend 403 Forbidden middleware guards.
- **Append-Only Audit Log**: Every approval, status change, and security scan logs actor ID, action, entity, IP address, and payload timestamps.
- **HMAC Signatures**: QR tokens cannot be tampered with or forged; tokens expire automatically after the scheduled return curfew.

---

## 📄 License

Developed for BPUT Hackathon 2026. Distributed under the MIT License.
