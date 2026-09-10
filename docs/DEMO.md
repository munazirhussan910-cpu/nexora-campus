# NEXORA CAMPUS — 3-MINUTE HACKATHON JUDGING DEMO GUIDE

This walkthrough provides an exact, minute-by-minute demonstration script for hackathon evaluators.

---

## ⚡ Pre-Demo Checklist

1. **Verify Servers are Running**:
   - Backend running on `http://localhost:5001`
   - Frontend running on `http://localhost:3000`
   - Command: `npm run dev` (from root folder)
2. **Open Browser**:
   - Navigate to: **[http://localhost:3000](http://localhost:3000)**
   - Verify the floating **DEMO PERSONA SWITCHER** widget is visible in the bottom-right corner.

---

## ⏱️ Minute-by-Minute Presentation Script

### 🕒 Minute 1: Complaint Lifecycle & Deterministic Routing
**Key Concept**: Demonstrates zero-latency deterministic routing into the unified Request Engine, technician fulfillment, and student confirmation.

1. **Log in as Student (Aryan)**:
   - Click **Aryan (Student)** in the floating Demo Persona Switcher.
   - You are routed to `/student/dashboard`.
2. **Submit a Complaint**:
   - Click **+ New Complaint** in the navigation bar or dashboard.
   - In Title, enter: `Tap leakage in bathroom washbasin`.
   - In Description, enter: `Washbasin tap is continuously leaking and overflowing on 2nd floor.`
   - **Point out to Judges**: As soon as you type keywords like *tap* or *leak*, the dynamic routing card immediately displays:
     > *"Auto-routing category: **Plumbing** • Assigned: **Ramesh Kumar (Senior Plumber)**"*
   - Click **Submit Complaint**.
   - The ticket is registered (e.g., `NX-10108`) and routed into the Request Engine with status `ASSIGNED`.
3. **Fulfill as Technician (Ramesh)**:
   - In the Persona Switcher, click **Ramesh (Plumber)**.
   - You are redirected to `/staff/dashboard`.
   - Open ticket `NX-10108` from the Work Orders table.
   - Click **Accept Task** &rarr; status updates to `ACCEPTED`.
   - Click **Start On-Site Work** &rarr; status updates to `IN_PROGRESS`.
   - In the Resolution Notes box, type: *"Replaced worn spindle gasket with brand new brass washer and verified line pressure."*
   - Click **Mark Resolved & Notify Student** &rarr; status updates to `RESOLVED`.
4. **Confirm & Rate as Student**:
   - Switch back to **Aryan (Student)** in the Persona Switcher.
   - Open ticket `NX-10108`.
   - Click **Confirm Fixed**, select **5 Stars**, and type: *"Prompt and clean repair!"*
   - Click **Submit Rating & Close Ticket** &rarr; ticket is formally `CLOSED`.
   - **Point out to Judges**: Show the **Immutable Request Audit Timeline** at the bottom of the page showing every timestamp and actor transition.

---

### 🕒 Minute 2: Cryptographic Gate Pass & Document Verification
**Key Concept**: Demonstrates security gate pass authorization with HMAC QR tokens, offline PIN fallback, and digital Bonafide PDF verification.

1. **Request Gate Pass**:
   - As **Aryan**, click **Gate Pass (QR & PIN)** in the sidebar.
   - Enter Destination: `Bhubaneswar City Market`.
   - Enter Reason: `Purchasing electronic components for capstone project`.
   - Click **Submit Gate Pass Request**. Status becomes `PENDING_APPROVAL`.
2. **Warden Digital Authorization**:
   - Click **Warden (Block B)** in the Persona Switcher.
   - On the Warden Dashboard, locate Aryan's application.
   - Click **Approve Pass**.
   - The backend signs the pass using HMAC-SHA256, generates an expiring QR code, and issues a 4-digit PIN.
3. **Security Officer Verification at Gate**:
   - Click **Security (Gate)** in the Persona Switcher.
   - Click **OPEN GATE SCANNER (QR / PIN)**.
   - Click the preset demo button **PIN 7392 (Aryan - Ready)** &rarr; click **VERIFY**.
   - **Point out to Judges**: The scanner displays:
     > *"GATE PASS IS VALID & AUTHORIZED • Student: Aryan Khan (220101048) • Hostel B / Room 204"*
   - Click **MARK STUDENT DEPARTED** &rarr; departure event is saved to `gate_events`.
   - Later, click **MARK STUDENT RETURNED** &rarr; pass is safely completed and closed.
4. **Bonafide Certificate & Dynamic PDF**:
   - Switch to **Chief Admin** in the Persona Switcher.
   - Navigate to **Approvals Hub** (`/admin/approvals`).
   - Under *Pending Bonafide Certificate Requests*, find Aryan's scholarship certificate request.
   - Click **Approve & Generate PDF**.
   - The server dynamically renders an official Bonafide PDF via PDFKit with institution seals and verification QR code.
   - Click **Verify Online** &rarr; opens `/verify/[certificateId]` demonstrating public verification.
   - Alternatively, open the pre-seeded public verification demo directly:
     > **[http://localhost:3000/verify/NX-BON-2026-00199](http://localhost:3000/verify/NX-BON-2026-00199)**

---

### 🕒 Minute 3: Operational Cockpit, Section 44 Intelligence & Low-Bandwidth Lite
**Key Concept**: Demonstrates administrative operational intelligence, automated pattern clustering, and lightweight accessibility.

1. **Central Command Center**:
   - In **Chief Admin**, navigate to **Command Center** (`/admin/dashboard`).
   - Highlight the operational KPI cards:
     - Open Requests
     - Overdue Breaches
     - SLA Ageing Distribution (`< 12h`, `12–24h`, `24–48h`, `> 48h`)
     - Category breakdown chart
2. **Section 44 Recurring Issue Detection**:
   - Point out the prominent red operational alert card:
     > **OPERATIONAL ALERT: RECURRING ISSUE DETECTED (SECTION 44)**  
     > **Hostel Block B • Category: Plumbing • 7 Complaints / 14 Days**  
     > *"Root Cause Hypothesis: Main Riser Pressure Failure • Recommendation: Conduct systematic inspection of Block B plumbing infrastructure."*
   - Explain to the judges: *“Instead of treating each tap leak as an isolated ticket, Nexora’s intelligence engine automatically clusters repeated failures within 14 days, alerting the administration to structural issues.”*
3. **Low-Bandwidth Nexora Lite**:
   - In the Persona Switcher, click **Nexora Lite** (or open [http://localhost:3000/lite](http://localhost:3000/lite)).
   - Demonstrate the text-first, high-speed interface with zero heavy assets (&lt; 25 KB footprint) built for weak campus connectivity.
4. **Campus Touch Kiosk**:
   - Open [http://localhost:3000/kiosk](http://localhost:3000/kiosk).
   - Enter roll number `220101048` &rarr; immediately loads student identification and enables self-service ticket creation.

---

## 🎯 Evaluator Q&A Cheat Sheet

| Question | Strong Answer |
|---|---|
| *“Why use deterministic routing instead of an AI LLM?”* | Deterministic regex keywords guarantee sub-millisecond execution, zero inference cost, zero hallucinations, and 100% predictable routing for facility operations. AI can be layered on top in the future for sentiment analysis, but core operations must never fail due to token limits or prompt drifts. |
| *“What happens if the main gate camera cannot scan the QR code?”* | Every approved gate pass has a dual-mode 4-digit numeric fallback PIN. Sentry guards can type the 4 digits into the keypad to invoke the exact same server-side verification logic. |
| *“How does Nexora handle poor campus Wi-Fi?”* | Nexora Lite (`/lite`) is purpose-built with pure HTML/CSS and zero heavy animation libraries, keeping the total payload under 25 KB for 2G/3G conditions. |
| *“Is this real database logic or mock data?”* | 100% of the workflows are backed by real database transactions, Prisma models, foreign keys, and relational integrity. Every status change triggers real database mutations, status history, notifications, and immutable audit logs. |
