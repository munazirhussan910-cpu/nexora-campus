# Nexora Campus — Complete Feature Specification & Capabilities Catalog

> **Reference Specification:** Production Capabilities Catalog  
> **Platform Version:** 4.0.0 (BPUT Hackathon 2026)  
> **Architecture Target:** Modular Monolith (Next.js 14 App Router + Express.js TypeScript)  
> **Scope:** Comprehensive inventory of all implemented domain workflows, role capabilities, operational algorithms, and platform interfaces.

---

## Table of Contents

1. [Executive Summary & Functional Scope](#1-executive-summary--functional-scope)
2. [Role Capability Matrix](#2-role-capability-matrix)
3. [Student Operations Portal](#3-student-operations-portal)
4. [Maintenance & Facility Staff Operations](#4-maintenance--facility-staff-operations)
5. [Hostel Warden Operations](#5-hostel-warden-operations)
6. [Perimeter Security Sentry Operations](#6-perimeter-security-sentry-operations)
7. [Academic Officer Operations](#7-academic-officer-operations)
8. [Faculty Attendance & Academic Operations](#8-faculty-attendance--academic-operations)
9. [Administrative Operations Command Center](#9-administrative-operations-command-center)
10. [Nexora Copilot Conversational Assistant](#10-nexora-copilot-conversational-assistant)
11. [Low-Bandwidth & Hardware Accessibility Interfaces](#11-low-bandwidth--hardware-accessibility-interfaces)
12. [Public Verification Subsystem](#12-public-verification-subsystem)
13. [Feature Implementation Status Registry](#13-feature-implementation-status-registry)

---

## 1. Executive Summary & Functional Scope

Nexora Campus digitizes, automates, and unifies all daily operational workflows across a collegiate campus. Engineered to replace manual physical registers, paper slips, uncoordinated telephone inquiries, and administrative delays, the platform introduces deterministic dispatching, cryptographically signed perimeter passes, dynamic vector PDF synthesis, attendance compliance analytics, and an integrated hybrid AI companion.

The platform provides dedicated, role-scoped portals for **7 distinct user personas**:
1. **Students** (`STUDENT`): Self-service portal for maintenance, passes, leaves, certificates, mentorship, routines, and attendance.
2. **Maintenance Staff** (`STAFF`): Technician queue with auto-assignment, task lifecycle progression, and repair notes.
3. **Hostel Wardens** (`WARDEN`): Block-scoped approvals for passes, leaves, resident rosters, and daily mess menus.
4. **Security Officers** (`SECURITY`): Sentry terminal for webcam QR barcode scanning and 4-digit PIN verification.
5. **Academic Officers** (`ACADEMIC_OFFICER`): Curriculum catalog, timetable scheduling, academic notices, deadlines, and certificate generation.
6. **Faculty Members** (`FACULTY` / `STAFF` with faculty specialization): Period-wise attendance logging with duplicate session detection.
7. **Campus Administrators** (`ADMIN`): Directorate Command Center with Section 44 clustered failure alerts, SLA ageing, and audit trails.

---

## 2. Role Capability Matrix

| Operational Capability | STUDENT | STAFF (Tech) | WARDEN | SECURITY | ACADEMIC_OFFICER | FACULTY | ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Submit Maintenance Complaint** | &check; | | | | | | &check; |
| **Track Own Requests / Tickets** | &check; | &check; | &check; | &check; | &check; | &check; | &check; |
| **Accept & Progress Work Orders** | | &check; | | | | | &check; |
| **Apply for Student Gate Pass** | &check; | | | | | | &check; |
| **Approve / Reject Gate Pass** | | | &check; | | | | &check; |
| **Verify QR / PIN at Main Gate** | | | | &check; | | | &check; |
| **Apply for Hostel Outstation Leave** | &check; | | | | | | &check; |
| **Approve / Reject Hostel Leave** | | | &check; | | | | &check; |
| **Request Bonafide Certificate** | &check; | | | | | | &check; |
| **Approve Bonafide & Issue PDF** | | | | | &check; | | &check; |
| **Public Document Verification** | Public | Public | Public | Public | Public | Public | Public |
| **Take Period Class Attendance** | | | | | | &check; | &check; |
| **View Student 75% Margins** | &check; | | | | &check; | &check; | &check; |
| **Manage Subjects & Class Routine** | | | | | &check; | | &check; |
| **Publish Academic Notices** | | | &check; | | &check; | | &check; |
| **Manage Hostel Daily Mess Menu** | Read | | &check; | | | | &check; |
| **Peer Mentorship (Apply / Mentor)** | &check; | | | | | | |
| **Nexora Copilot AI Assistant** | &check; | &check; | &check; | &check; | &check; | &check; | &check; |
| **Section 44 Cluster Intelligence** | | | | | | | &check; |
| **SLA Countdown & Ageing Monitor** | | &check; | | | | | &check; |
| **Immutable Security Audit Log** | | | | | | | &check; |
| **Low-Bandwidth Lite PWA (`/lite`)** | &check; | | | | | | |
| **Touch Kiosk Mode (`/kiosk`)** | &check; | | | | | | |

---

## 3. Student Operations Portal

Located under `/student/*`, the student cockpit provides complete operational self-service:

### 3.1 Maintenance & Repair Logging (`/student/requests/new`)
- **Category Taxonomy**: `Plumbing`, `Electrical`, `Carpentry`, `IT_Network`, `Cleanliness`, `General`.
- **Location Auto-Binding**: Defaults to the student's assigned residential hostel block and room number (e.g., `Hostel Block B - Room 204`).
- **Priority Classification**: `LOW`, `NORMAL`, `HIGH`, `URGENT`.
- **Automated Dispatch**: On submission, backend `RoutingService` evaluates title and description against `RoutingRule` keywords and assigns specialist technicians in $< 5\text{ ms}$.

### 3.2 Request Lifecycle Tracking & Confirmation (`/student/requests`)
- **Status Timeline**: Real-time visual progress across `SUBMITTED` &rarr; `ASSIGNED` &rarr; `ACCEPTED` &rarr; `IN_PROGRESS` &rarr; `RESOLVED` &rarr; `CONFIRMED` &rarr; `CLOSED`.
- **Resolution Verification & Rating**: Once marked `RESOLVED` by a technician, students inspect documented repair notes, verify the physical fix, and submit a mandatory 1–5 star rating and feedback comment before the ticket archives.

### 3.3 Cryptographic Gate Pass System (`/student/gate-pass`)
- **Application Workflow**: Students specify destination, departure timestamp, and expected return timestamp within university curfew limits.
- **Warden Review Pipeline**: Routed to the student's assigned hostel block warden.
- **Dual-Mode Sentry Pass Generation**:
  - **HMAC-SHA256 Signed QR Code**: Cryptographically sealed payload (`NX-GP-[base64].[signature]`) rendered dynamically on canvas.
  - **Offline 4-Digit PIN**: Securely generated numeric PIN for display to sentries if camera scanning is impaired.

### 3.4 Hostel Outstation Leave Applications (`/student/leave`)
- **Extended Leave Logging**: Multi-day outstation travel applications with departure date, return date, destination address, travel reason, and emergency contact phone.
- **Parental Consent Verification**: Requires explicit parental consent declaration checkbox before submission.
- **Perimeter Sync**: Approved leaves automatically synchronize with the gate sentry terminal to authorize weekend exits.

### 3.5 Bonafide Certificate System (`/student/documents`)
- **Purpose Selection**: State Post-Matric / NSP Scholarship, Bank Education Loan, Visa / Passport Verification, Higher Studies, and Summer Internship NOC.
- **Vector PDF Generation**: On Academic Officer approval, dynamic vector PDF synthesis dynamically renders an official A4 institutional certificate with guilloche borders, university seal, registrar signature, and embedded verification QR code.
- **Instant Download**: Students download cryptographically verifiable PDF documents directly to their personal devices.

### 3.6 Academic Routine & Class Timetable (`/student/academics`)
- **Personalized Weekly Schedule**: Synchronized daily class schedule tailored to student branch (e.g. CSE) and academic year (Year 2).
- **Period Breakdown**: Period order (1–6), start and end times, subject name, subject code, assigned lecture room, and faculty name.

### 3.7 75% Attendance Analytics (`/student/attendance`)
- **Mathematical Compliance Engine**: Implements the official BPUT 75% minimum attendance rule across all registered subjects.
- **Safe Miss / Recovery Margin**:
  - If percentage $\ge 75\%$: Displays safe class misses:
    $$\text{Safe Misses} = \left\lfloor \frac{\text{Attended} - (0.75 \times \text{Total})}{0.75} \right\rfloor$$
  - If percentage $< 75\%$: Displays required consecutive attendances to recover:
    $$\text{Needed Attends} = \left\lceil \frac{(0.75 \times \text{Total}) - \text{Attended}}{0.25} \right\rceil$$

### 3.8 Daily Hostel Mess Menu (`/student/mess-menu`)
- **Day-Wise Schedule**: Complete Monday through Sunday nutritional schedule across Breakfast, Lunch, Evening Snacks, and Dinner.
- **Meal Badges**: Displays vegetarian/non-vegetarian flags, special Sunday feasts, and operating mess timings.

### 3.9 Peer Mentorship Network (`/student/mentors` & `/student/mentor-profile`)
- **Senior Directory**: Juniors browse eligible senior students (Year $\ge 2$) categorized by academic interests, competitive programming, and placement preparation.
- **Guidance Applications**: Juniors send structured guidance requests specifying their academic challenges or goals.
- **Privacy Shield**: Senior contact phone numbers and personal emails remain hidden until the senior explicitly accepts the mentorship request.
- **Mentor Console**: Senior students update bio, expertise tags, availability status, and manage incoming applications.

---

## 4. Maintenance & Facility Staff Operations

Located under `/staff/*`, this portal equips maintenance technicians with real-time field dispatch tools:

### 4.1 Technician Work Order Cockpit (`/staff/dashboard`)
- **Specialization Queue**: Technicians (Plumbing, Electrical, Carpentry, IT) receive tickets routed specifically to their trade.
- **Live Counter Cards**: Displays assigned tasks, pending acknowledgments, in-progress jobs, and completed resolutions.

### 4.2 Lifecycle Execution & Work Progress (`/staff/tasks`)
- **Acknowledge Job**: Technician clicks "Accept Job", transitioning ticket from `ASSIGNED` to `ACCEPTED`.
- **Start Work**: Transitions ticket to `IN_PROGRESS`, recording the commencement timestamp for SLA tracking.
- **Resolution Documentation Modal**: Technicians must enter comprehensive resolution notes (e.g., "Replaced 15A ceramic capacitor and rewound motor coil") before marking a ticket `RESOLVED`.

### 4.3 SLA Countdown & Workload Analytics (`/staff/sla`)
- **Breach Countdown**: Displays active countdown timer against priority SLAs (Emergency: 4 hours, Urgent: 12 hours, Normal: 24 hours, Low: 48 hours).
- **Service Rating Record**: Technicians inspect student star ratings and feedback to monitor service quality.

---

## 5. Hostel Warden Operations

Located under `/warden/*`, the warden console enables residential administration:

### 5.1 Residential Block Scoping
- **Block-Specific Authorization**: Wardens only access records, gate passes, leaves, complaints, and student rosters within their assigned hostel block (e.g., Dr. S. K. Mohapatra &rarr; Hostel Block B).

### 5.2 Curfew & Gate Pass Review (`/warden/gate-passes`)
- **Real-Time Approval Queue**: Inspects pending student departure requests with destination, departure hour, and expected return time.
- **One-Click Approval / Rejection**: Approving triggers generation of the HMAC signed QR token and 4-digit PIN; rejecting logs reason.

### 5.3 Outstation Leave Approvals (`/warden/leaves`)
- **Guardian Verification**: Displays guardian contact phone and parent consent declaration for rapid verification before authorizing outstation travel.

### 5.4 Hostel Mess Menu Editor (`/warden/mess-menu`)
- **Daily Meal Publishing**: Wardens edit and publish weekly meal rosters (Breakfast, Lunch, Snacks, Dinner) for the hostel mess.
- **Bulk Day Updates**: Allows editing single meals or updating all four meals for a day in a single action.

### 5.5 Resident Student Roster (`/warden/students`)
- **Room-by-Room Roll**: Searchable directory of hostel residents with room numbers, branch, academic year, emergency contact phone, and active status.

---

## 6. Perimeter Security Sentry Operations

Located under `/security/*`, the sentry interface operates as a sentry terminal for campus perimeter gates:

### 6.1 High-Speed QR Barcode Scanner (`/security/scan`)
- **Direct Webcam / Camera Feed**: Utilizes `jsQR` to scan digital gate passes displayed on student smartphone screens.
- **Sub-Second Validation**: Decodes base64 payload, verifies HMAC-SHA256 signature against server secret, checks token expiry epoch, and validates pass status.

### 6.2 Offline 4-Digit PIN Keypad Fallback (`/security/scan`)
- **Manual Sentry Keypad**: If a student's phone screen is cracked or camera scan fails, security keys in the student's 4-digit offline PIN.

### 6.3 Anti-Passback & One-Time Status Progression
- **Departure Scan**: Validates pass in `APPROVED` status &rarr; marks student `DEPARTED` &rarr; logs exit timestamp.
- **Return Scan**: Validates pass in `DEPARTED` status &rarr; marks student `RETURNED` &rarr; logs return timestamp &rarr; marks pass `CLOSED`.
- **Replay Defense**: Re-scanning an already returned pass instantly flags `ALREADY_USED` with audible and visual warning.

### 6.4 Perimeter Activity Feed (`/security/activity`)
- **Live Gate Log**: Chronological stream of all exits and returns with student name, roll number, hostel block, destination, timestamp, and verifying officer ID.

---

## 7. Academic Officer Operations

Located under `/academic/*`, this console manages curriculum, routines, and credentials:

### 7.1 Curriculum & Subject Management (`/academic/dashboard`)
- **Department Catalog**: CRUD management of university subjects with subject code (e.g. `CS204`), title, credit hours, department branch, and semester.

### 7.2 Weekly Routine & Timetable Builder (`/academic/routine`)
- **Day-Wise Schedule Configuration**: Assigns lecture slots (Day of week, period 1–6, start/end times, room number, faculty instructor) for student cohorts.

### 7.3 Targeted Campus Notices (`/academic/notices`)
- **Cohort Audience Targeting**: Broadcasts announcements targeted to specific branches, academic years, semesters, or hostel blocks.
- **Read Receipt Telemetry**: Tracks read counts and student acknowledgments.

### 7.4 Academic Deadlines & Institutional Guidance (`/academic/deadlines` & `/academic/guidance`)
- **Countdown Trackers**: Publishes university deadlines (exam form fill-up, semester registration, fee payment) with live countdown timers.
- **Procedural Checklists**: Publishes verified step-by-step guides for official college procedures.

### 7.5 Bonafide Certificate Approval Queue (`/academic/approvals`)
- **Verification & Generation**: Reviews student certificate applications, validates academic standing, and approves requests to trigger vector PDF generation.

---

## 8. Faculty Attendance & Academic Operations

Located under `/faculty/*`, this portal allows professors to conduct and audit attendance:

### 8.1 Period-Wise Class Attendance Session (`/faculty/attendance/take`)
- **Session Selector**: Selects subject, branch, section, academic year, date, and period slot (1–6).
- **Student Roster Grid**: Loads registered students with default `PRESENT` status and one-tap toggling to `ABSENT`, `LATE`, or `EXCUSED`.
- **Duplicate Protection**: Automatically checks `GET /api/faculty/attendance/check-duplicate` before recording to prevent accidental duplicate attendance sheets for the same class and period.

### 8.2 Historical Attendance Logs (`/faculty/attendance/history` & `/faculty/attendance/day-wise`)
- **Class Attendance Sheets**: Inspects historical session records filtered by subject, section, and date range.
- **Student Performance Audit**: Reviews individual student attendance percentages and identifies at-risk students below 75%.

---

## 9. Administrative Operations Command Center

Located under `/admin/*`, this command center provides executive institutional oversight:

### 9.1 Operational Command Center Cockpit (`/admin/dashboard`)
- **Real-Time Operational Telemetry**: Total tickets raised, open tasks, SLA compliance rate, active security passes, and average turnaround time.
- **Workload Distribution**: Visual breakdown of open tickets assigned across plumbers, electricians, carpenters, and IT specialists.

### 9.2 Section 44 Clustered Infrastructure Failure Detection (`/admin/recurring-issues`)
- **Algorithmic Cluster Detection**: Detects systemic campus physical failures by aggregating complaint records over a 14-day rolling window.
- **Trigger Rule**: When $\ge 3$ complaints occur in the same hostel block and category within 14 days, the system triggers a high-severity `IssueAlert` (e.g., 4 plumbing complaints in Hostel Block B within 6 days indicates a broken main water line rather than isolated tap leaks).

### 9.3 SLA Ageing & Breach Analytics (`/admin/sla`)
- **Ageing Brackets**: Categorizes all open operational tasks into 4 elapsed time brackets:
  - `< 12 Hours`: Active within standard SLA.
  - `12–24 Hours`: Attention required.
  - `24–48 Hours`: Approaching breach threshold.
  - `> 48 Hours`: Overdue / Critical breach.

### 9.4 Immutable Security Audit Log (`/admin/audit`)
- **Tamper-Evident Trail**: Append-only log recording actor user ID, role, action code, target entity type, entity ID, previous state JSON, updated state JSON, client IP address, and browser user agent.
- **Zero Mutation**: Schema enforces append-only semantics with no update or delete routes.

---

## 10. Nexora Copilot Conversational Assistant

Located at `/student/copilot` and powered by `backend/src/services/copilot.service.ts`:

### 10.1 "Ask. Solve. Plan. Guide." Conversational Intelligence
- **Ask (Grounded Q&A)**: Answers academic, hostel, and administrative questions strictly grounded in `VERIFIED_CAMPUS_KNOWLEDGE` and `VERIFIED_CAMPUS_PROCEDURES`.
- **Solve (Transactional Action Cards)**: Detects intent to perform campus operations and renders interactive frontend action cards pre-filled with the authenticated student's profile:
  - `ACTION_MAINTENANCE`: Pre-filled room repair ticket.
  - `ACTION_GATE_PASS`: Pre-filled gate pass application.
  - `ACTION_LEAVE`: Pre-filled hostel leave request.
  - `ACTION_BONAFIDE`: Pre-filled bonafide certificate request.
- **Plan (Academic Roadmaps)**: Generates 4-phase day-by-day exam study plans (`STUDY_PLAN`) tailored to BPUT subjects with interactive daily breakdowns.
- **Guide (Procedural Guidance)**: Outputs step-by-step checklists (`GUIDE_PROCEDURE`) for 12 official institutional procedures with department locations, turnaround times, and required physical documents.

### 10.2 Hybrid AI Engine & Fallback Resiliency
- **Primary AI Engine**: Direct HTTPS integration with Google Gemini Generative Language REST API (`gemini-flash-lite-latest`, `gemini-flash-latest`, `gemini-2.5-flash-lite`).
- **Deterministic Heuristic Engine**: Zero-failure local keyword and rule-based parser that executes offline if `GEMINI_API_KEY` is absent, unreachable, or times out (6s timeout).
- **Human-in-the-Loop Confirmation**: Copilot *drafts* actions; user must review and click confirmation buttons to invoke backend domain APIs.

---

## 11. Low-Bandwidth & Hardware Accessibility Interfaces

### 11.1 Nexora Lite PWA (`/lite`)
- **Ultra-Lightweight**: Under $25\text{ KB}$ text-first interface engineered for low-speed 2G/3G campus cellular connections.
- **Core Operations**: Fast attendance lookup, daily timetable, targeted notices, and rapid complaint submission without client bundle overhead.

### 11.2 Touch Kiosk Terminal (`/kiosk`)
- **Shared Hardware Kiosk**: Walk-up touchscreen interface located in hostel lobbies and administrative foyers.
- **Device-Free Access**: Students enter their university roll number to view active tickets, look up passes, and log room maintenance complaints without needing their personal smartphone.

### 11.3 Inbound SMS Gateway (`/api/integrations/sms/inbound`)
- **Feature Phone Integration**: Webhook endpoint that parses structured cellular SMS text messages (e.g., `TICKET B204 TAP LEAKING`) into verified maintenance complaints.

---

## 12. Public Verification Subsystem

### 12.1 Zero-Login Public Document Verification (`/verify/[certificateId]`)
- **Public Trust Registry**: External verifiers (bank loan officers, scholarship boards, consular staff) scan certificate QR codes to inspect authenticity at `/verify/[certificateId]`.
- **PII Protection**: Confirms student name, roll number, certificate number, issue date, purpose, and digital signature status without exposing sensitive private contact details or requiring user login.

---

## 13. Feature Implementation Status Registry

| Feature Name | Primary Route / File | Implementation Status | Notes |
|---|---|:---:|---|
| **Student Self-Registration & Auth** | `/api/auth/register`, `/api/auth/login` | **IMPLEMENTED** | JWT session cookies + Bearer token |
| **Profile Photo with Magic Bytes** | `/api/auth/profile/photo` | **IMPLEMENTED** | Magic byte inspection, 5MB cap, dual persistence |
| **Deterministic Keyword Routing** | `RoutingService.routeComplaint` | **IMPLEMENTED** | Sub-5ms assignment based on `RoutingRule` |
| **Room Maintenance Ticket FSM** | `/api/complaints`, `request.service.ts`| **IMPLEMENTED** | Complete lifecycle to student rating |
| **HMAC-SHA256 Signed Gate Pass** | `/api/gate-passes`, `qr.service.ts` | **IMPLEMENTED** | Cryptographic token + 4-digit PIN |
| **Sentry Webcam QR & PIN Scanner** | `frontend/app/security/scan/page.tsx`| **IMPLEMENTED** | `jsQR` webcam decode + PIN fallback |
| **Hostel Outstation Leave Review** | `/api/leaves` | **IMPLEMENTED** | Warden approval + parental consent flag |
| **Vector PDF Bonafide Generator** | `/api/bonafide`, `pdf.service.ts` | **IMPLEMENTED** | PDFKit dynamic vector certificate synthesis |
| **Public Document Verification** | `/api/verify/document/:id` | **IMPLEMENTED** | Zero-login public registry endpoint |
| **Faculty Period Attendance Marker**| `/api/faculty/attendance` | **IMPLEMENTED** | Period-wise attendance with duplicate check |
| **75% Attendance Analytics** | `/api/student/attendance` | **IMPLEMENTED** | Mathematical safe miss / recovery margin |
| **Class Timetable / Routine** | `/api/academic/timetable` | **IMPLEMENTED** | Branch and year cohort scheduling |
| **Targeted Notices & Circulars** | `/api/notices` | **IMPLEMENTED** | Cohort targeting with read receipts |
| **Daily Hostel Mess Menu** | `/api/mess-menu`, `schema.prisma` | **IMPLEMENTED** | Day-wise meal roster + warden editing |
| **Peer Mentorship Registry** | `/api/mentors` | **IMPLEMENTED** | Year $\ge 2$ eligibility gate + privacy shield |
| **Nexora Copilot (Hybrid AI)** | `/api/copilot`, `copilot.service.ts` | **IMPLEMENTED** | Gemini API + local deterministic fallback |
| **Section 44 Cluster Intelligence** | `GET /api/admin/recurring-issues` | **IMPLEMENTED** | Flags $\ge 3$ issues in 14-day window |
| **SLA Ageing & Countdown** | `GET /api/admin/sla`, `sla.service.ts`| **IMPLEMENTED** | 4-tier ageing brackets (<12h, 12-24h, 24-48h, >48h) |
| **Immutable Security Audit Log** | `AuditService.log`, `/api/admin/audit`| **IMPLEMENTED** | Append-only before/after diff audit trail |
| **Nexora Lite PWA (Student)** | `frontend/app/lite/page.tsx` | **IMPLEMENTED** | Low-bandwidth text-first interface (<25KB) |
| **Touch Kiosk Mode Terminal** | `frontend/app/kiosk/page.tsx` | **IMPLEMENTED** | Hardware walk-up terminal interface |
| **Inbound SMS Gateway Webhook** | `POST /api/integrations/sms/inbound`| **IMPLEMENTED** | Parses formatted text payloads |
| **Emergency SOS Siren Broadcast** | `/api/emergency`, `app.ts` | **IMPLEMENTED** | Route mounted in `app.ts`; in-memory store |
| **Nexora Lite for Non-Students** | `frontend/app/lite/components/` | **PARTIALLY IMPLEMENTED**| Sub-components exist; unmounted in page |
| **Outbound Cellular SMS Delivery** | External Twilio / AWS SNS | **PLANNED** | Inbound works; outbound transport planned |
| **SMTP / Email Notification Delivery**| External SendGrid / SMTP | **PLANNED** | In-app notification active; SMTP planned |
| **Biometric Facial Sentry Scan** | Security gatehouse camera | **PLANNED** | QR + PIN active; facial matching planned |
