# Nexora Campus

> **Centralized Campus Operations & Academic Management Platform**  
> A high-reliability, role-based operations engine engineered to digitize student maintenance complaints with deterministic keyword routing, cryptographically signed gate passes, hostel leaves, tamper-evident bonafide certificates with public verification, cohort academic routine scheduling, faculty period attendance, and peer mentorship. Built for the **BPUT Hackathon 2026** under the operational theme: *"Attendance, Mess, Hostel, Repeat: Campus Life, Debugged."*

[![Platform](https://img.shields.io/badge/Platform-Nexora%20Campus-1e2230?style=flat-square&logo=google-cloud&logoColor=white)](https://github.com/munazirhussan910-cpu/nexora-campus)
[![Architecture](https://img.shields.io/badge/Architecture-Modular%20Monolith-blue?style=flat-square)](#7-technical-architecture)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2014%20(App%20Router)-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Backend](https://img.shields.io/badge/Backend-Express.js%20%7C%20TypeScript-informational?style=flat-square&logo=node.js)](https://nodejs.org)
[![Database](https://img.shields.io/badge/ORM-Prisma%205.22%20(37%20Models)-2D3748?style=flat-square&logo=prisma)](https://prisma.io)
[![Security](https://img.shields.io/badge/Security-HMAC--SHA256%20%7C%20JWT%20%7C%20RBAC-success?style=flat-square)](#12-security-architecture)
[![Tests](https://img.shields.io/badge/Tests-Jest%20%26%20Supertest%20(106%20Tests%20across%207%20Suites)-brightgreen?style=flat-square&logo=jest)](#15-testing)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Problem Statement](#2-problem-statement)
3. [Solution](#3-solution)
4. [Key Features](#4-key-features)
5. [User Roles & Personas](#5-user-roles--personas)
6. [Complete Feature Documentation](#6-complete-feature-documentation)
7. [Technical Architecture](#7-technical-architecture)
8. [Project Structure](#8-project-structure)
9. [API Documentation](#9-api-documentation)
10. [Database Architecture](#10-database-architecture)
11. [System Flow Diagrams](#11-system-flow-diagrams)
12. [Security Architecture](#12-security-architecture)
13. [Deployment Configuration](#13-deployment-configuration)
14. [Local Development Setup](#14-local-development-setup)
15. [Testing & Quality Assurance](#15-testing--quality-assurance)
16. [Performance Optimization](#16-performance-optimization)
17. [Accessibility & User Experience](#17-accessibility--user-experience)
18. [Current Limitations & Verification Audit](#18-current-limitations--verification-audit)
19. [Roadmap](#19-roadmap)
20. [Hackathon / MVP Positioning](#20-hackathon--mvp-positioning)
21. [Changelog & Versioning](#21-changelog--versioning)
22. [Contributing](#22-contributing)
23. [License](#23-license)
24. [Credits](#24-credits)

---

## 1. Overview

### What Nexora Campus Is
**Nexora Campus** is a production-grade, centralized campus operations engine and academic portal designed to replace fragmented paper registers, manual gate slips, counter-based certificate stamping, unstructured messaging groups, untracked hostel maintenance tasks, and disconnected classroom attendance sheets with an integrated, event-driven web platform.

### Problem Being Solved
On university campuses, daily operations (maintenance repairs, weekend gate passes, outstation leaves, bonafide verification, targeted notices, class scheduling, and attendance logging) are traditionally handled via disconnected physical registers, manual paper chits, phone calls, and informal chat groups. This leads to lost tickets, bureaucratic certificate delays, security vulnerabilities at campus gates, absence of service-level agreement (SLA) tracking, and administrative blindspots regarding recurring infrastructure failures.

### Target Users
- **Students**: Raise maintenance tickets, apply for gate passes/leaves, generate bonafide certificates, track 75% attendance thresholds with mathematical margin alerts, view timetables, consult campus procedures, and connect with senior student mentors.
- **Maintenance Staff / Technicians**: Receive auto-assigned tickets (Plumbing, Electrical, Carpentry, IT, Cleanliness), accept jobs, update progress, document repair notes, and view performance ratings.
- **Hostel Wardens**: Review and approve/reject gate passes and overnight leaves for their specific hostel block, inspect room rosters, track curfew compliance, and broadcast notices.
- **Security Officers**: Sentry terminal for high-speed camera QR scanning or 4-digit PIN fallback to authorize student departures and returns with exact timestamp logging.
- **Academic Officers**: Manage department subject catalogs, schedule weekly class timetables, broadcast academic notices, manage academic deadlines and official guidance, and audit campus-wide 75% attendance compliance.
- **Faculty / Professors**: Take period-wise subject attendance, record attendance statuses (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`), review subject attendance histories, and publish class-specific announcements.
- **Campus Administrators**: Operations Command Center with real-time operational metrics, Section 44 clustered infrastructure failure detection, SLA ageing analytics, staff workload monitors, and immutable audit logs.

### Current Implementation Status
The project is a fully functional **Modular Monolith** with a decoupled Express/TypeScript backend (`backend/src`) and Next.js 14 App Router frontend (`frontend/app`). It includes 37 Prisma database models, 19 route controllers, 12 domain services, 106 automated tests across 7 test suites, and 8 pre-seeded demo accounts.

---

## 2. Problem Statement

| Problem Area | Traditional Campus Process | Failure Mode / Operational Cost | Nexora Campus Solution |
|---|---|---|---|
| **Hostel Maintenance** | Physical complaint registers at hostel gatehouses | Complaints lost, ignored, or untracked; zero technician accountability; no visibility into repair time. | Deterministic keyword routing assigns specialist staff in $< 5\text{ ms}$; strict Finite State Machine (FSM); student confirmation & rating. |
| **Gate Passes & Curfew** | Handwritten paper slips signed by wardens | Easily forged; lost slips; long queues during evening curfew; security sentries cannot verify authenticity. | Dual-mode cryptographic gate pass: HMAC-SHA256 signed QR code + 4-digit offline PIN fallback; real-time departure/return logging. |
| **Academic Certificates** | In-person visits to academic cell; multi-day manual signing | 3–5 business day delays; third-party verification impossible without manual phone/email queries. | Automated vector PDF synthesis via PDFKit with embedded verification QR code; public zero-login registry at `/verify/[certificateId]`. |
| **Hostel Leaves** | Physical application with unverified phone calls | Inability to audit parental consent; no coordination with perimeter gatehouse sentries. | Structured multi-day leave workflow with emergency contact, parental consent flag, and warden review. |
| **Infrastructure Failures** | Repairs treated in isolation across rooms | Systemic failures (e.g. corrupted main water line) treated as isolated broken taps. | **Section 44 Clustering Intelligence**: Flags clusters when $\ge 3$ complaints occur in the same hostel block & category within 14 days. |
| **Network & Device Inequity** | Heavy SPAs fail on congested 2G/3G hostel Wi-Fi | Students with poor network or feature phones cannot access campus services. | **Nexora Lite** ($< 25\text{ KB}$ text-first interface), **Touch Kiosk Mode**, and **Inbound SMS Gateway** (`/api/integrations/sms/inbound`). |
| **Attendance & Timetable** | Paper attendance sheets; disconnected timetable PDFs | Manual attendance entry errors; students unaware of exact attendance margins before semester exams. | Faculty digital period attendance, live weekly timetable, and mathematical margin calculator (`safeMisses` / `neededAttends` to maintain 75%). |
| **Peer Mentorship & Guidance** | Informal word-of-mouth senior contacts | Junior students lack structured academic and career guidance; senior contact details exposed publicly. | Structured peer mentorship registry with eligibility gates (Year $\ge 2$), formal request tracking, and private communication until accepted. |

---

## 3. Solution

Nexora Campus unifies all campus operations into an event-driven digital pipeline:

```mermaid
flowchart TD
    A[Student Submits Request] --> B{Request Type}
    
    B -->|Complaint| C[Deterministic Routing Engine]
    C -->|Keyword Match & Staff Specialization| D[Auto-Assigned to Specialist Staff]
    D --> E[Staff Accepts & Starts Work]
    E --> F[Staff Resolves & Enters Notes]
    F --> G[Student Confirms & Rates Service]
    G --> H[Closed & Recorded in SLA Engine]

    B -->|Gate Pass| I[Warden Review Queue]
    I -->|Warden Approves| J[HMAC QR Token + 4-Digit PIN Generated]
    J --> K[Security Officer Scans QR / Keypads PIN]
    K -->|DEPARTED| L[Departure Event Logged in GateEvent]
    L --> M[Security Scans on Re-entry]
    M -->|RETURNED| N[Gate Pass Completed & Closed]

    B -->|Hostel Leave| O[Warden Leave Review]
    O -->|Approved with Parent Consent| P[Leave Activated & Synced to Gate Sentry]

    B -->|Bonafide Certificate| Q[Academic Officer Review Queue]
    Q -->|Approved| R[Dynamic Vector PDFKit Generation]
    R --> S[Public Verification Token & QR Link Created]
    S --> T[Instant Student Download & Public Registry Lookup]

    H --> U[Section 44 Clustering & Immutable Audit Trail]
    N --> U
    T --> U
```

---

## 4. Key Features

| Module | Primary Persona | How It Works | Status |
|---|---|---|---|
| **Complaints & Maintenance** | Student, Staff, Admin | Submits issue with category, location, priority; keyword routing auto-assigns technician; FSM tracks progression; student confirms & rates. | **IMPLEMENTED** |
| **Deterministic Routing** | Backend Engine | Keyword scoring against `RoutingRule` matches complaint text and assigns specialist staff within milliseconds. | **IMPLEMENTED** |
| **Gate Passes (Dual Verification)** | Student, Warden, Security | Student applies; warden approves; engine generates HMAC-SHA256 QR token + 4-digit PIN; security sentry scans/enters PIN to record exit/entry. | **IMPLEMENTED** |
| **Hostel Outstation Leaves** | Student, Warden | Multi-day leave request with emergency guardian contacts and parental consent declarations. | **IMPLEMENTED** |
| **Bonafide Certificates** | Student, Academic Officer | Purpose selection, approval queue, vector PDF synthesis via PDFKit with verification QR code. | **IMPLEMENTED** |
| **Public Document Verification** | Public / External Verifier | Zero-login endpoint (`/verify/[certificateId]`) returning verification status and certificate metadata. | **IMPLEMENTED** |
| **Period Attendance Tracking** | Faculty, Student | Faculty selects subject, section, date, period; records student statuses (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`); duplicate check prevents re-recording. | **IMPLEMENTED** |
| **75% Attendance Analytics** | Student, Academic Officer | Mathematical margin calculation: safe misses when above 75%, needed attends when below 75%. | **IMPLEMENTED** |
| **Weekly Timetable / Routine** | Academic Officer, Student | Academic officer creates day-wise period slots; students view personalized weekly schedules by branch and year. | **IMPLEMENTED** |
| **Official Notices & Updates** | Academic Officer, Warden, Admin | Targeted announcements broadcast to specific branches, years, semesters, or hostel blocks. | **IMPLEMENTED** |
| **Academic Deadlines & Guidance** | Academic Officer, Student | Structured deadline tracking with countdowns and step-by-step institutional procedures. | **IMPLEMENTED** |
| **Student Peer Mentorship** | Student (Junior & Senior) | Seniors (Year $\ge 2$) create mentor profiles; juniors apply for guidance; seniors accept/decline; contact details protected. | **IMPLEMENTED** |
| **Profile & Avatar Management** | All Roles | View/edit profile details; square image cropping modal; magic byte MIME validation (JPEG, PNG, WebP); 5MB cap; dual persistence. | **IMPLEMENTED** |
| **Campus Copilot** | Student | Conversational assistant supporting natural language intent extraction into Action Cards; hybrid engine with Gemini LLM + heuristic fallback. | **IMPLEMENTED** |
| **Section 44 Clustering** | Admin | Automatic detection of recurring physical failures when $\ge 3$ complaints occur in the same hostel block & category within 14 days. | **IMPLEMENTED** |
| **SLA Countdown & Ageing** | Admin, Staff | Calculates time remaining on tickets, flags breaches, and groups open tasks into 4 ageing brackets. | **IMPLEMENTED** |
| **Immutable Audit Logs** | Admin | Append-only event log capturing actor, action, entity, IP address, user agent, and JSON diffs of state changes. | **IMPLEMENTED** |
| **Touch Kiosk Mode** | Student (Hardware Terminal) | Terminal interface at `/kiosk` for roll number lookup and rapid complaint/pass creation without a personal device. | **IMPLEMENTED** |
| **Nexora Lite (Student)** | Student (Low Bandwidth) | Ultra-lightweight ($< 25\text{ KB}$) PWA interface at `/lite` designed for weak 2G/3G campus connections. | **IMPLEMENTED** |
| **Inbound SMS Gateway** | Mobile Phone Users | Webhook endpoint (`/api/integrations/sms/inbound`) parsing formatted text messages into complaints or gate passes. | **IMPLEMENTED** |
| **Emergency SOS Broadcast** | Student, Security, Warden | Audio-siren alert and sentry notification system for physical/medical hazards. (Coded in routes/service/frontend, but route not mounted in `app.ts`). | **PARTIALLY IMPLEMENTED** |
| **Lite Interface (Other Roles)** | Staff, Warden, Security, Admin | View components exist in `frontend/app/lite/components/`, but `/lite/page.tsx` currently only mounts the student view. | **PARTIALLY IMPLEMENTED** |
| **Outbound SMS Notifications** | All Roles | Inbound SMS webhook parses incoming messages, but outbound cellular SMS delivery (via Twilio/AWS) is not connected. | **PLANNED** |
| **Automated Email Transports** | All Roles | Notifications are created in database and UI bell, but external SMTP/SendGrid delivery is not configured. | **PLANNED** |
| **Biometric Face Verification** | Security | Camera QR scanner and PIN are implemented; biometric facial matching is on the future roadmap. | **PLANNED** |

---

## 5. User Roles & Personas

The system enforces strict Role-Based Access Control (RBAC) backed by 6 database roles, 24 granular permissions, and 8 pre-seeded demo accounts.

### Role Permission Matrix

| Permission Code | Description | STUDENT | STAFF | WARDEN | SECURITY | ACADEMIC_OFFICER | ADMIN |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `requests.create` | Submit complaints & requests | &check; | | | | | &check; |
| `requests.view.own` | View own submitted requests | &check; | &check; | | | | &check; |
| `requests.view.all` | View all requests across campus | | | &check; | | | &check; |
| `requests.assign` | Assign requests to technicians | | | | | | &check; |
| `requests.reassign` | Reassign tickets between staff | | | | | | &check; |
| `requests.resolve` | Mark maintenance tickets resolved | | &check; | | | | &check; |
| `gatepass.create` | Apply for student gate pass | &check; | | | | | &check; |
| `gatepass.approve` | Approve student gate pass | | | &check; | | | &check; |
| `gatepass.reject` | Reject student gate pass | | | &check; | | | &check; |
| `gatepass.verify` | Verify QR/PIN at gate sentry | | | | &check; | | &check; |
| `leave.create` | Submit hostel outstation leave | &check; | | | | | &check; |
| `leave.approve` | Approve hostel outstation leave | | | &check; | | | &check; |
| `leave.reject` | Reject hostel outstation leave | | | &check; | | | &check; |
| `bonafide.create` | Apply for bonafide certificate | &check; | | | | | &check; |
| `bonafide.approve` | Approve bonafide & generate PDF | | | | | &check; | &check; |
| `bonafide.reject` | Reject bonafide certificate request | | | | | &check; | &check; |
| `academic.dashboard` | Access Academic Officer console | | | | | &check; | &check; |
| `academic.subject.*` | CRUD on department subjects | | | | | &check; | &check; |
| `academic.timetable.*`| CRUD on class timetable schedule | | | | | &check; | &check; |
| `academic.attendance.read`| View campus attendance records | | | | | &check; | &check; |
| `notices.view` | View cohort targeted notices | &check; | &check; | &check; | &check; | &check; | &check; |
| `notices.create` | Publish targeted notices | | | &check; | | &check; | &check; |
| `analytics.view` | Access Command Center telemetry | | | | | | &check; |
| `audit.view` | Inspect immutable audit logs | | | | | | &check; |
| `staff.manage` | Manage technician directory | | | | | | &check; |
| `students.manage` | Manage student records | | | &check; | | | &check; |

### Pre-Seeded Demo Personas

All accounts are pre-seeded in `backend/prisma/seed.ts` with the default password: **`Password123!`**

| Persona Name | Role | Email | Profile & Scope |
|---|---|---|---|
| **Aryan Khan** | `STUDENT` | `aryan@nexora.edu` | B.Tech CSE, 2nd Year, Hostel Block B, Room 204. Full student portal access. |
| **Ramesh Kumar** | `STAFF` | `ramesh@nexora.edu` | Senior Maintenance Plumber. Receives auto-routed plumbing work orders. |
| **Suresh Verma** | `STAFF` | `suresh@nexora.edu` | Senior Electrician. Receives auto-routed electrical breakdown tasks. |
| **Dr. S. K. Mohapatra** | `WARDEN` | `warden.b@nexora.edu` | Chief Warden, Hostel Block B. Reviews gate passes, leaves, and block complaints. |
| **Vikram Singh** | `SECURITY` | `security.gate1@nexora.edu` | Gate Operations Officer, Main Gate. Sentry terminal with camera QR & PIN keypad. |
| **Prof. Sanjeev Mohanty** | `ACADEMIC_OFFICER` | `academic@nexora.edu` | Academic Officer. Manages subjects, timetables, updates, deadlines, and bonafides. |
| **Dr. P. K. Tripathy** | `STAFF` (Faculty) | `faculty@nexora.edu` | Professor & Faculty (CSE). Marks class attendance and reviews student histories. |
| **Dr. Ananya Ray** | `ADMIN` | `admin@nexora.edu` | Chief Campus Operations Director. Full access to Command Center & audit logs. |

---

## 6. Complete Feature Documentation

### 6.1 Student Management & Self-Registration
- **Registration**: Allows new students to register via `POST /api/auth/register` by supplying full name, email, roll number, department, year, hostel block, room number, phone, and password.
- **Verification**: Automatically validates that email or roll number are not duplicates and links the student to the appropriate `Branch` and `Room` records.
- **Profile Customization**: Students can update personal details, bio, emergency parent phone, and upload a profile photo with an integrated image cropper.

### 6.2 Maintenance & Deterministic Keyword Routing
- **Submission**: Students submit issues specifying category (`Plumbing`, `Electrical`, `Carpentry`, `IT_Network`, `Cleanliness`, `General`), location, title, and description.
- **Keyword Engine**: `RoutingService` evaluates text against regex and keyword rules stored in `RoutingRule` (e.g., "tap", "leak", "pipe" &rarr; `Plumbing` &rarr; Assigned to Ramesh).
- **Finite State Machine**:
  - `SUBMITTED` &rarr; `ASSIGNED` &rarr; `ACCEPTED` &rarr; `IN_PROGRESS` &rarr; `RESOLVED` &rarr; `CONFIRMED` / `CLOSED`.
- **Resolution Verification**: Technicians must document repair notes before marking a ticket `RESOLVED`. The ticket cannot close until the student confirms the work and submits a 1–5 star rating.

### 6.3 Gate Pass with Dual-Mode Verification
- **Application**: Student applies specifying destination, departure time, and expected return time.
- **Approval & Cryptographic Generation**: Warden approves; system generates:
  1. An HMAC-SHA256 signed QR token (`NX-GP-[base64(gatePassId:rollNumber:expiry)].[signature]`).
  2. A 4-digit fallback numeric PIN (randomly generated and hashed/saved in database).
- **Sentry Verification**:
  - Security scans the QR code via webcam scanner (`jsQR`) or keys in the 4-digit PIN.
  - Sentry marks the pass `DEPARTED` (first scan) and `RETURNED` (second scan).
  - Every perimeter event is immutably logged in `GateEvent` with the security officer's user ID and timestamp.
  - Expired, already-used, or cancelled passes are rejected immediately.

### 6.4 Hostel Outstation Leave Management
- **Workflow**: Student submits start date, end date, outstation destination, emergency contact phone, and confirms parental consent.
- **Review**: Warden inspects student leave history, verifies emergency contact details, and approves or rejects with feedback.
- **Perimeter Sync**: Approved leaves automatically reflect at the gate sentry for exit validation.

### 6.5 Bonafide Certificate System with Public Verification
- **Generation**: Student applies selecting purpose (`Scholarship`, `Bank Loan`, `Internship`, `Higher Studies`, `Passport Application`).
- **Vector PDF Synthesis**: Upon Academic Officer approval, `PdfService` utilizes PDFKit to dynamically generate an official A4 certificate featuring decorative guilloche borders, official university metadata, institutional signatures, and an embedded verification QR code.
- **Public Verification Registry**: Anyone scanning the QR code is directed to `/verify/[certificateId]`, which hits `GET /api/verify/document/:certificateId`. This public endpoint confirms document validity without requiring authentication while protecting student PII.

### 6.6 Faculty Attendance & Compliance Engine
- **Session Attendance**: Faculty marks period-wise attendance for assigned subjects with 4 possible states: `PRESENT`, `ABSENT`, `LATE`, `EXCUSED`.
- **Duplicate Protection**: `GET /api/faculty/attendance/check-duplicate` verifies whether attendance has already been recorded for that subject, section, date, and period before saving.
- **Attendance History & Day-Wise Logs**: Faculty can view historical class sheets, filter by date range, and inspect student attendance percentages.
- **75% Attendance Analytics**: Mathematical margin calculator embedded in both student dashboard and academic officer audit:
  - *Above 75%*: $\text{Safe Misses} = \lfloor(\text{Present} - 0.75 \times \text{Total}) / 0.75\rfloor$
  - *Below 75%*: $\text{Needed Attends} = \lceil(0.75 \times \text{Total} - \text{Present}) / 0.25\rceil$

### 6.7 Academic Routine, Deadlines & Institutional Guidance
- **Timetable / Routine**: Academic Officers configure weekly class routines with time slots, lecture rooms, and instructor assignments; students view synchronized daily routines.
- **Academic Deadlines**: Officers broadcast time-sensitive deadlines (exam registrations, scholarship applications, project submissions) with interactive countdown timers.
- **Structured Guidance**: Official departmental procedures documented step-by-step with required documents and direct action links.

### 6.8 Peer Mentorship System
- **Eligibility Gate**: Only students in 2nd year or above ($\text{Year} \ge 2$) can register as mentors (`isMentorEligible`).
- **Discovery**: Juniors browse available seniors filtered by department and academic interests.
- **Privacy Controls**: Contact details remain hidden until the senior explicitly accepts the guidance request.
- **Management Console**: Mentors manage incoming requests via `/student/mentor-profile` with accept/decline actions.

### 6.9 Campus Copilot
- **Hybrid Conversational Architecture**: Natural language interface providing campus assistance.
- **Intent Extraction**: Maps user queries into structured actionable cards:
  - `ACTION_MAINTENANCE`: Pre-filled complaint draft.
  - `ACTION_GATE_PASS`: Pre-filled gate pass draft.
  - `ACTION_LEAVE`: Pre-filled hostel leave draft.
  - `ACTION_BONAFIDE`: Pre-filled certificate request.
  - `GUIDE_PROCEDURE`: Official institutional step-by-step guidance.
  - `STUDY_PLAN`: Multi-day structured revision schedule.
  - `RESOURCE_LIST`: Curated university lecture notes and PYQs.
- **Dual Execution Engine**:
  - Primary: Google Gemini (`gemini-flash-lite-latest`) when `GEMINI_API_KEY` is present.
  - Fallback: Local rule-based heuristic parser ensuring complete offline availability.

### 6.10 Administrative Command Center & Section 44 Intelligence
- **Operational Telemetry**: Real-time metrics on open requests, SLA breaches, daily resolutions, and technician loads.
- **Section 44 Clustered Issue Detection**: Proactively flags recurring physical failures when $\ge 3$ complaints occur in the same hostel block & category within 14 rolling days.
- **SLA Countdown & Ageing**: Calculates time remaining on tickets and categorizes open tasks into 4 ageing brackets (`< 12h`, `12–24h`, `24–48h`, `> 48h`).
- **Immutable Audit Trail**: Append-only log recording actor ID, action code, entity type, entity ID, JSON diffs of previous vs. new values, IP address, and browser user agent.

### 6.11 Low-Bandwidth & Hardware Accessibility
- **Nexora Lite (`/lite`)**: Text-first PWA interface ($< 25\text{ KB}$) designed for 2G/3G mobile networks, providing essential student operations (attendance, timetable, notices, quick requests).
- **Touch Kiosk Mode (`/kiosk`)**: Self-service walk-up terminal interface optimized for touchscreen hardware; allows roll-number lookup and ticket logging without a personal device.
- **Inbound SMS Gateway (`/api/integrations/sms/inbound`)**: Webhook endpoint accepting structured SMS text payloads (e.g. `TICKET B204 TAP LEAKING`) for non-smartphone users.

---

## 7. Technical Architecture

### Master Technology Stack

| Layer | Technology | Version | Purpose in Codebase |
|---|---|---|---|
| **Frontend Framework** | Next.js (App Router) | `14.2.20` | Server-rendered and client React architecture, nested role layouts (`frontend/app`) |
| **Frontend UI Library** | React | `18.3.1` | Declarative UI components, state management, and custom context hooks |
| **Full-Stack Language** | TypeScript | `5.7.2` | Static type definitions, strict compile-time checks, and shared data contracts |
| **Backend Framework** | Express.js | `4.21.2` | RESTful API routing, middleware pipeline, and HTTP server (`backend/src/app.ts`) |
| **Database ORM** | Prisma Client & CLI | `5.22.0` | Type-safe query building, relation management, and schema migrations (`schema.prisma`) |
| **Database Engine** | SQLite (Dev) / Postgres (Prod) | Embedded / v15+ | Relational data persistence storing 37 models in `prisma/nexora.db` |
| **CSS & Styling** | Tailwind CSS | `3.4.16` | Responsive utility styling with dark-academic and slate theme tokens |
| **Icons** | Lucide React | `0.468.0` | Production SVG iconography across all portals and status badges |
| **Schema Validation** | Zod | `3.24.1` | Runtime schema validation for request payloads and input sanitization |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) | `9.0.2` | Signed stateless session tokens stored in HTTP-only cookies and Bearer headers |
| **Password Hashing** | bcryptjs | `2.4.3` | Adaptive one-way password hashing using 10 salt rounds |
| **Document Generation** | PDFKit | `0.16.0` | Vector-rendered official academic PDF generation with embedded QR codes |
| **QR Code Engine** | QRCode & qrcode.react | `1.5.4` / `4.2.0` | Server-side image buffer generation and client-side SVG/Canvas rendering |
| **Security Headers** | Helmet | `8.0.0` | Configures HTTP security headers (CSP, HSTS, Sniffing protection) |
| **Cookie Parsing** | cookie-parser | `1.4.7` | Parses incoming cookie headers for HTTP-only JWT session extraction |
| **CORS Middleware** | cors | `2.8.5` | Handles cross-origin requests from frontend (port 3000) to API (port 5001) |
| **Payload Compression** | compression | `1.8.2` | Gzip response compression for optimized data transfer over slow connections |
| **Automated Testing** | Jest & Supertest | `29.7.0` / `7.0.0` | Integration and unit test runners validating 106 automated backend test cases |
| **Process Orchestrator** | concurrently | `9.2.4` | Concurrently boots frontend and backend in local development (`npm run dev`) |

---

## 8. Project Structure

```text
Nexora/
├── backend/                       # Express.js + TypeScript Backend Application
│   ├── dist/                      # Compiled JavaScript output
│   ├── prisma/                    # Database models, migrations, and seeds
│   │   ├── migrations/            # Version-controlled SQL migrations
│   │   ├── nexora.db              # Local SQLite database file (1.8 MB active store)
│   │   ├── schema.prisma          # Prisma schema definition (37 models)
│   │   ├── seed.ts                # Master database seed script (8 demo personas)
│   │   └── seed_attendance.ts     # Specialized academic attendance seed script
│   ├── src/                       # Application source code
│   │   ├── config/
│   │   │   ├── env.ts             # Environment variable parsing and defaults
│   │   │   └── prisma.ts          # Singleton PrismaClient export
│   │   ├── data/
│   │   │   ├── campusGuide.data.ts # Verified institutional procedures & guidelines
│   │   │   └── campusResources.data.ts # Verified subject notes, syllabus, and PYQs
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts # JWT verification & 45s session cache ($queryRaw)
│   │   │   ├── error.middleware.ts# Centralized AppError handling
│   │   │   ├── rateLimit.middleware.ts # Sliding window IP rate limiter
│   │   │   ├── rbac.middleware.ts # requireRole & requirePermission guards
│   │   │   └── validate.middleware.ts # Zod schema validation middleware
│   │   ├── routes/
│   │   │   ├── academic.routes.ts # Academic Officer dashboard, subjects, timetables
│   │   │   ├── admin.routes.ts    # Command Center, SLA ageing, Section 44, audits
│   │   │   ├── auth.routes.ts     # Login, registration, profile, photo, personas
│   │   │   ├── bonafide.routes.ts # Bonafide requests, approval, PDF rendering
│   │   │   ├── complaint.routes.ts# Maintenance tickets, accept/start/resolve, rating
│   │   │   ├── copilot.routes.ts  # Campus Copilot conversational endpoints
│   │   │   ├── emergency.routes.ts# Emergency SOS endpoints (unmounted in app.ts)
│   │   │   ├── faculty.routes.ts  # Faculty dashboard, attendance sessions, rosters
│   │   │   ├── gatepass.routes.ts # Gate passes, approval, HMAC QR/PIN verification
│   │   │   ├── integration.routes.ts # Inbound SMS webhook parser
│   │   │   ├── kiosk.routes.ts    # Touch kiosk student lookup & ticket creation
│   │   │   ├── leave.routes.ts    # Hostel outstation leave applications & approvals
│   │   │   ├── lite.routes.ts     # Nexora Lite student API endpoints
│   │   │   ├── mentor.routes.ts   # Peer mentorship profiles and request matching
│   │   │   ├── notice.routes.ts   # Targeted campus announcements
│   │   │   ├── notification.routes.ts # In-app notification feeds & read states
│   │   │   ├── request.routes.ts  # Master Request Engine, timelines, reassignment
│   │   │   ├── student.routes.ts  # Student attendance margins, timetables, updates
│   │   │   └── verify.routes.ts   # Public zero-login document verification
│   │   ├── services/
│   │   │   ├── audit.service.ts   # Immutable audit log recording
│   │   │   ├── copilot.service.ts # Heuristic intent extraction & card synthesis
│   │   │   ├── emergency.service.ts # In-memory SOS cache & notifications
│   │   │   ├── gemini.service.ts  # Google Gemini LLM API integration
│   │   │   ├── notification.service.ts # In-app notification creation
│   │   │   ├── pdf.service.ts     # PDFKit vector PDF synthesis with QR stamping
│   │   │   ├── qr.service.ts      # HMAC-SHA256 QR token & PIN generator
│   │   │   ├── request.service.ts # FSM state machine & ticket numbering
│   │   │   ├── routing.service.ts # Deterministic keyword-scoring category router
│   │   │   ├── sla.service.ts     # SLA due dates, countdowns & ageing brackets
│   │   │   ├── storage.service.ts # Magic byte validation, avatar cropping & storage
│   │   │   └── warden.service.ts  # Warden dashboard analytics & block filtering
│   │   ├── tests/
│   │   │   ├── academic_operations.test.ts # 16 Academic Officer operations tests
│   │   │   ├── auth.test.ts       # 16 Authentication & RBAC integration tests
│   │   │   ├── lite.test.ts       # 8 Nexora Lite student endpoint tests
│   │   │   ├── mentor_eligibility.test.ts # 12 Mentorship eligibility tests
│   │   │   ├── nexora.test.ts     # 29 Core operational & FSM integration tests
│   │   │   ├── profile_editing.test.ts # 11 Profile editing & RBAC safety tests
│   │   │   └── profile_photo.test.ts # 14 Magic bytes & avatar security tests
│   │   ├── types/
│   │   │   └── auth.ts            # AuthenticatedRequest and AuthUser interfaces
│   │   ├── app.ts                 # Express app configuration & middleware pipeline
│   │   └── server.ts              # HTTP server listener (default port 5001)
│   ├── uploads/                   # Generated vector PDFs and uploaded avatars
│   ├── .env.example               # Backend local environment template
│   └── .env.production.example    # Backend production template
│
├── frontend/                      # Next.js 14 App Router Application
│   ├── app/                       # App Router routes and page views
│   │   ├── academic/              # Academic Officer portal (dashboard, routine, notices, etc.)
│   │   ├── admin/                 # Administrator console (command center, audit, SLA, etc.)
│   │   ├── faculty/               # Faculty portal (attendance, session history, etc.)
│   │   ├── kiosk/                 # Touch Kiosk terminal view
│   │   ├── lite/                  # Nexora Lite PWA low-bandwidth student view
│   │   ├── login/                 # Unified login interface with persona quick-switcher
│   │   ├── profile/               # Global profile redirect router
│   │   ├── register/              # Student self-registration form
│   │   ├── security/              # Security Sentry sentry console & barcode scanner
│   │   ├── staff/                 # Maintenance technician portal & work order queue
│   │   ├── student/               # Student cockpit (requests, gate pass, leave, copilot, etc.)
│   │   ├── verify/                # Public zero-login certificate verification page
│   │   ├── warden/                # Hostel Warden portal (approvals, roster, notices)
│   │   ├── globals.css            # Tailwind directives and custom dark-theme tokens
│   │   ├── layout.tsx             # Root layout wrapping Theme, Auth, and Navbar
│   │   └── page.tsx               # Master public landing page (105 KB interactive shell)
│   ├── components/                # Reusable React components
│   │   ├── analytics/             # Operational analytics charts
│   │   ├── cards/                 # StatCard and metric summaries
│   │   ├── emergency/             # SOS broadcast modal & security alarm banner
│   │   ├── layout/                # Navbar, Sidebar, PortalGuard, PersonaSwitcher
│   │   ├── modals/                # ImageCropModal, CancelRequestModal, RemovePhotoModal
│   │   ├── profile/               # ProfileViewAndEditor component
│   │   ├── scanner/               # QrCameraScanner (webcam barcode decoder via jsQR)
│   │   ├── status/                # StatusBadge, PriorityBadge, SLAIndicator
│   │   ├── tables/                # Timeline, data tables
│   │   └── ui/                    # Avatar, EmptyState, SkeletonLoader, Accordion
│   ├── lib/                       # Frontend utilities and contexts
│   │   ├── api.ts                 # Fetch client with deduplication & 45s GET cache
│   │   ├── auth-context.tsx       # AuthProvider, session state, persona switcher
│   │   └── theme-context.tsx      # Dark/Light theme provider
│   ├── public/                    # Static image assets and logos
│   ├── tailwind.config.ts         # Tailwind design system configuration
│   ├── .env.example               # Frontend local environment template
│   └── .env.production.example    # Frontend production template
│
├── package.json                   # Root monorepo configuration with npm workspaces
├── render.yaml                    # Render deployment blueprint for backend
└── tsconfig.json                  # Root TypeScript configuration
```

---

## 9. API Documentation

### Complete Backend Endpoint Catalog

| Group | Method | Endpoint | Purpose | Auth | Role / Permission |
|---|---|---|---|:---:|---|
| **Auth & Profile** | `GET` | `/api/auth/register-options` | Fetch branches and rooms for registration | Public | None |
| | `POST` | `/api/auth/register` | Student self-registration | Public | None |
| | `POST` | `/api/auth/login` | Authenticate user via JWT | Public | None |
| | `GET` | `/api/auth/me` | Fetch authenticated user profile & permissions | &check; | Any Authenticated |
| | `PUT` | `/api/profile` / `/api/auth/me` | Update personal profile details | &check; | Any Authenticated |
| | `POST` | `/api/profile/photo` | Upload & crop profile avatar | &check; | Any Authenticated |
| | `DELETE`| `/api/profile/photo` | Remove profile avatar | &check; | Any Authenticated |
| | `POST` | `/api/auth/logout` | Clear session cookie | Public | None |
| | `GET` | `/api/auth/personas` | List 8 development personas | Public | None |
| | `POST` | `/api/auth/switch-persona` | Fast persona switcher | Public | None |
| **Requests Engine** | `GET` | `/api/requests/my` | List current user's submitted requests | &check; | `requests.view.own` |
| | `GET` | `/api/requests` | List all requests across campus | &check; | `requests.view.all` |
| | `GET` | `/api/requests/:id` | Fetch detailed request with timeline | &check; | Requester / Staff / Admin |
| | `PATCH`| `/api/requests/:id/status` | Update FSM request status | &check; | Assigned Staff / Admin |
| | `POST` | `/api/requests/:id/cancel` | Student withdraws request | &check; | Requester |
| | `POST` | `/api/requests/:id/reassign`| Reassign ticket to different staff | &check; | `requests.reassign` |
| **Complaints** | `POST` | `/api/complaints` | Submit maintenance complaint | &check; | `requests.create` |
| | `GET` | `/api/complaints/assigned` | Technician's assigned work order queue | &check; | Staff / Admin |
| | `POST` | `/api/complaints/:id/accept` | Technician acknowledges ticket | &check; | `requests.resolve` |
| | `POST` | `/api/complaints/:id/start` | Technician marks work in progress | &check; | `requests.resolve` |
| | `POST` | `/api/complaints/:id/resolve`| Technician marks resolved with notes | &check; | `requests.resolve` |
| | `POST` | `/api/complaints/:id/confirm`| Student confirms resolution & rates | &check; | Requester |
| **Gate Passes** | `POST` | `/api/gate-passes` | Student applies for gate pass | &check; | `gatepass.create` |
| | `GET` | `/api/gate-passes/pending` | Warden queue of pending gate passes | &check; | `gatepass.approve` |
| | `GET` | `/api/gate-passes/my` | Student's gate pass history | &check; | Student |
| | `POST` | `/api/gate-passes/:id/approve` | Warden approves pass (creates QR/PIN)| &check; | `gatepass.approve` |
| | `POST` | `/api/gate-passes/:id/reject` | Warden rejects gate pass with reason | &check; | `gatepass.reject` |
| | `POST` | `/api/gate-passes/verify` | Security verifies HMAC QR token or PIN | &check; | `gatepass.verify` |
| | `POST` | `/api/gate-passes/:id/depart` | Sentry logs student departure | &check; | `gatepass.verify` |
| | `POST` | `/api/gate-passes/:id/return` | Sentry logs student return & closes | &check; | `gatepass.verify` |
| **Hostel Leaves** | `POST` | `/api/leaves` | Student applies for outstation leave | &check; | `leave.create` |
| | `GET` | `/api/leaves/pending` | Warden queue of pending leave requests | &check; | `leave.approve` |
| | `GET` | `/api/leaves/my` | Student's leave request history | &check; | Student |
| | `POST` | `/api/leaves/:id/approve` | Warden approves outstation leave | &check; | `leave.approve` |
| | `POST` | `/api/leaves/:id/reject` | Warden rejects leave with reason | &check; | `leave.reject` |
| **Bonafide Certificates**| `POST` | `/api/bonafide` | Student applies for bonafide | &check; | `bonafide.create` |
| | `GET` | `/api/bonafide/pending` | Academic Officer pending review queue | &check; | `bonafide.approve` |
| | `GET` | `/api/bonafide/my` | Student's bonafide certificate history | &check; | Student |
| | `POST` | `/api/bonafide/:id/approve`| Officer approves & generates PDF | &check; | `bonafide.approve` |
| | `POST` | `/api/bonafide/:id/reject` | Officer rejects request with reason | &check; | `bonafide.reject` |
| | `GET` | `/api/bonafide/:id/download`| Download synthesized vector PDF | &check; | Student / Officer / Admin |
| **Public Registry** | `GET` | `/api/verify/document/:id` | Public zero-login document verification| Public | None |
| **Academic Operations** | `GET` | `/api/academic/dashboard` | Academic Officer operational metrics | &check; | Academic Officer / Admin |
| | `GET` | `/api/academic/routine` | Fetch weekly routine schedule | &check; | Any Authenticated |
| | `POST` | `/api/academic/routine` | Create class routine time slot | &check; | Academic Officer / Admin |
| | `PUT` | `/api/academic/routine/:id`| Update class routine time slot | &check; | Academic Officer / Admin |
| | `DELETE`| `/api/academic/routine/:id`| Delete class routine time slot | &check; | Academic Officer / Admin |
| | `GET` | `/api/academic/deadlines` | Fetch academic deadlines | &check; | Any Authenticated |
| | `POST` | `/api/academic/deadlines` | Publish new academic deadline | &check; | Academic Officer / Admin |
| | `GET` | `/api/academic/guidance` | Fetch institutional guidance steps | &check; | Any Authenticated |
| | `POST` | `/api/academic/guidance` | Create new guidance documentation | &check; | Academic Officer / Admin |
| | `GET` | `/api/academic/subjects` | Fetch academic subject catalog | &check; | Any Authenticated |
| | `POST` | `/api/academic/subjects` | Add new subject to catalog | &check; | Academic Officer / Admin |
| | `GET` | `/api/academic/attendance` | Campus-wide attendance compliance audit | &check; | Academic Officer / Admin |
| **Faculty Portal** | `GET` | `/api/faculty/dashboard` | Today's periods and teaching roster | &check; | Faculty / Staff / Admin |
| | `GET` | `/api/faculty/attendance/roster`| Student list for selected subject/sec | &check; | Faculty / Staff / Admin |
| | `GET` | `/api/faculty/attendance/check-duplicate`| Verify session hasn't been logged | &check; | Faculty / Staff / Admin |
| | `POST` | `/api/faculty/attendance/session` | Record period attendance session | &check; | Faculty / Staff / Admin |
| | `GET` | `/api/faculty/attendance/day-wise`| Daily attendance aggregate log | &check; | Faculty / Staff / Admin |
| | `GET` | `/api/faculty/attendance/history` | Historical subject attendance sheets | &check; | Faculty / Staff / Admin |
| **Student Academics** | `GET` | `/api/student/attendance` | Subject attendance & 75% margin stats | &check; | Student |
| | `GET` | `/api/student/timetable` | Student's weekly class timetable | &check; | Student |
| | `GET` | `/api/student/deadlines` | Upcoming academic deadlines | &check; | Student |
| | `GET` | `/api/student/guidance` | Institutional procedure guidelines | &check; | Student |
| **Peer Mentorship** | `GET` | `/api/mentors` | Directory of available senior mentors | &check; | Student / Admin |
| | `GET` | `/api/mentors/me` | Current student's mentor profile | &check; | Student / Admin |
| | `PUT` | `/api/mentors/me` | Create/update mentor profile (Year $\ge 2$)| &check; | Student (Year $\ge 2$) |
| | `POST` | `/api/mentors/requests` | Request guidance from senior mentor | &check; | Junior Student |
| | `GET` | `/api/mentors/requests/incoming`| Inbox of incoming mentorship requests | &check; | Senior Mentor |
| | `PATCH`| `/api/mentors/requests/:id`| Accept or decline guidance request | &check; | Senior Mentor |
| **Campus Copilot** | `POST` | `/api/copilot/message` | Conversational message processing | &check; | Student / Any Authenticated |
| | `GET` | `/api/copilot/guide` | Verified campus procedure database | &check; | Any Authenticated |
| | `POST` | `/api/copilot/plan` | Generate multi-day study revision plan | &check; | Any Authenticated |
| | `GET` | `/api/copilot/resources` | Verified notes, syllabus, and PYQs | &check; | Any Authenticated |
| **Admin & Telemetry** | `GET` | `/api/admin/dashboard` | Command Center telemetry metrics | &check; | `analytics.view` |
| | `GET` | `/api/admin/sla` | SLA ageing distribution & overdue list | &check; | `analytics.view` |
| | `GET` | `/api/admin/recurring-issues`| Section 44 clustered issue alerts | &check; | `analytics.view` |
| | `GET` | `/api/admin/staff` | Technician workload & rating monitor | &check; | `staff.manage` |
| | `GET` | `/api/admin/audit-logs` | Query immutable audit logs | &check; | `audit.view` |
| | `GET` | `/api/admin/students` | Campus-wide student directory | &check; | `students.manage` |
| **Notices & Updates** | `GET` | `/api/notices` | Targeted announcements for user cohort | &check; | `notices.view` |
| | `POST` | `/api/notices` | Broadcast new targeted notice | &check; | `notices.create` |
| | `POST` | `/api/notices/:id/read` | Mark notice as read | &check; | Any Authenticated |
| **Notifications** | `GET` | `/api/notifications` | In-app notification feed | &check; | Any Authenticated |
| | `POST` | `/api/notifications/:id/read` | Mark notification as read | &check; | Any Authenticated |
| | `POST` | `/api/notifications/read-all`| Mark all notifications as read | &check; | Any Authenticated |
| **Hardware & Ingress** | `GET` | `/api/kiosk/student/:roll` | Lookup student by roll number at Kiosk | Public | None |
| | `POST` | `/api/kiosk/requests` | Create request via Touch Kiosk terminal| Public | None |
| | `POST` | `/api/integrations/sms/inbound`| Inbound SMS webhook parser | Public | None |
| | `GET` | `/api/lite/me` | Compact student ID & offline cache | &check; | Student Only |
| | `GET` | `/api/lite/attendance` | Compact attendance summary | &check; | Student Only |
| | `GET` | `/api/lite/timetable` | Compact daily timetable | &check; | Student Only |
| | `GET` | `/api/lite/requests` | Compact request history | &check; | Student Only |

---

## 10. Database Architecture

The data tier is managed via Prisma ORM (`backend/prisma/schema.prisma`) containing **37 models**. Because SQLite is the local database provider (`file:./nexora.db`), native enum types are represented as strictly typed string columns.

```mermaid
erDiagram
    USER ||--o| STUDENT : "has profile"
    USER ||--o| STAFF : "has profile"
    USER }|--|| ROLE : "assigned"
    ROLE ||--o{ ROLE_PERMISSION : "defines"
    PERMISSION ||--o{ ROLE_PERMISSION : "maps"
    
    BRANCH ||--o{ STUDENT : "enrolled in"
    HOSTEL_BLOCK ||--o{ ROOM : "contains"
    ROOM ||--o{ STUDENT : "assigned to"
    
    STUDENT ||--o| MENTOR_PROFILE : "registers"
    STUDENT ||--o{ MENTORSHIP_REQUEST : "sends / receives"
    
    USER ||--o{ REQUEST : "submits (requester)"
    USER ||--o{ REQUEST : "assigned (staff)"
    REQUEST_TYPE ||--o{ REQUEST : "categorizes"
    REQUEST ||--o| COMPLAINT : "has maintenance data"
    REQUEST ||--o| GATE_PASS : "has sentry data"
    REQUEST ||--o| LEAVE_REQUEST : "has leave data"
    REQUEST ||--o| BONAFIDE_REQUEST : "has certificate data"
    REQUEST ||--o{ REQUEST_STATUS_HISTORY : "tracks FSM"
    REQUEST ||--o{ REQUEST_ASSIGNMENT : "records delegation"
    
    GATE_PASS ||--o{ GATE_EVENT : "logs movement"
    
    BRANCH ||--o{ SUBJECT : "teaches"
    SUBJECT ||--o{ TIMETABLE_ENTRY : "scheduled in"
    SUBJECT ||--o{ ATTENDANCE_SESSION : "conducts"
    ATTENDANCE_SESSION ||--o{ ATTENDANCE_RECORD : "records"
    STUDENT ||--o{ ATTENDANCE_RECORD : "has status"
    
    HOSTEL_BLOCK ||--o{ ISSUE_ALERT : "triggers (Section 44)"
    USER ||--o{ AUDIT_LOG : "generates"
    NOTICE ||--o{ NOTICE_TARGET : "broadcasts to"
    NOTICE ||--o{ NOTICE_READ : "read by"
```

### Core Entity Schema Summary

1. **Authentication & Identity**:
   - `User`: Global credentials, email, password hash, role relation, active state, bio, and `profilePhotoUrl`.
   - `Role`: Security role definition (`STUDENT`, `STAFF`, `WARDEN`, `SECURITY`, `ACADEMIC_OFFICER`, `ADMIN`).
   - `Permission`: 24 system permission codes.
   - `RolePermission`: Many-to-many junction mapping permissions to roles.
2. **Campus Hierarchy**:
   - `Branch`: Academic departments (CSE, ECE, ME, CE, EE).
   - `HostelBlock`: Residential hostels (Block A, Block B, etc.).
   - `Room`: Room numbers, floor, and student capacity.
   - `Student`: Roll number, branch link, hostel room link, year, contact, parent contact.
   - `Staff`: Employee ID, department, designation, and maintenance specialization.
3. **Operations & FSM**:
   - `Request`: Unified root request model containing status, priority, due date, completion timestamp, location, and references to specific domain sub-records.
   - `Complaint`: Sub-record storing category, issue type, repair photo URL, resolution notes, and student rating (1–5 stars).
   - `GatePass`: Sub-record storing destination, departure/return schedule, 4-digit PIN, HMAC QR token, and gate status (`PENDING_APPROVAL`, `APPROVED`, `DEPARTED`, `RETURNED`, `CLOSED`).
   - `LeaveRequest`: Sub-record storing date range, destination, emergency contact, and parent consent flag.
   - `BonafideRequest`: Sub-record storing institutional purpose, certificate ID, and verification token.
   - `Document`: Official signed certificates with document number, vector PDF URL, and issuer ID.
4. **Academic Operations**:
   - `Subject`: Course code, name, branch, year, semester, section, and faculty link.
   - `TimetableEntry`: Day-of-week, period time slot, lecture hall, and faculty.
   - `AttendanceSession`: Period attendance log created by faculty with date, section, and topic.
   - `AttendanceRecord`: Individual student status (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`) linked to a session.
   - `AcademicDeadline`: Official deadline announcements with target cohort filters.
   - `GuidanceItem`: Official institutional procedures with step-by-step instructions.
5. **Peer Mentorship**:
   - `MentorProfile`: Senior student headline, bio, LinkedIn URL, CGPA, interests, and availability toggle.
   - `MentorshipRequest`: Guidance application from junior student with message, status (`PENDING`, `ACCEPTED`, `DECLINED`), and mentor response.
6. **Telemetry & Governance**:
   - `AuditLog`: Append-only audit trail logging actor ID, action, entity, JSON diffs, IP address, and browser user agent.
   - `IssueAlert`: Section 44 clustered physical breakdown alert flagged across rooms in a hostel block.
   - `RoutingRule`: Keyword matching table for automated complaint routing.
   - `SlaRule`: Priority-based SLA resolution time limits.

---

## 11. System Flow Diagrams

### 11.1 Maintenance Complaint Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant Frontend
    participant RoutingEngine as RoutingService
    participant DB as SQLite / Postgres
    actor Technician
    actor Admin

    Student->>Frontend: Enter issue ("Tap leaking in room B204")
    Frontend->>RoutingEngine: POST /api/complaints
    RoutingEngine->>RoutingEngine: Score keywords against RoutingRule
    Note over RoutingEngine: Matches "leak", "tap" -> PLUMBING<br/>Assigns Ramesh Kumar (Plumber)
    RoutingEngine->>DB: Create Request (ASSIGNED) & Complaint
    DB-->>Frontend: 201 Created (Ticket #CMP-1001)
    
    Technician->>Frontend: View Assigned Tasks (/staff/tasks)
    Technician->>DB: POST /api/complaints/:id/accept
    Note over DB: Status -> ACCEPTED
    Technician->>DB: POST /api/complaints/:id/start
    Note over DB: Status -> IN_PROGRESS
    
    Technician->>DB: POST /api/complaints/:id/resolve (Notes: "Replaced washer")
    Note over DB: Status -> RESOLVED
    
    Student->>Frontend: Receive Resolution Notification
    Student->>DB: POST /api/complaints/:id/confirm (Rating: 5 Stars)
    Note over DB: Status -> CONFIRMED -> CLOSED
```

### 11.2 Cryptographic Gate Pass Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Student
    actor Warden
    actor Security
    participant API as Gatepass API
    participant QR as QrService
    participant DB as Database

    Student->>API: POST /api/gate-passes (Destination: Market, Return: 8:00 PM)
    API->>DB: Insert GatePass (PENDING_APPROVAL) + PIN
    
    Warden->>API: POST /api/gate-passes/:id/approve
    API->>QR: generateSignedQrToken(passId, rollNumber, expiry)
    Note over QR: Computes HMAC-SHA256(payload, JWT_SECRET)<br/>Generates NX-GP-[base64].[signature]
    API->>DB: Update GatePass (APPROVED, qrTokenHash, qrExpiresAt)
    
    Student->>Security: Present dynamic QR code or 4-digit PIN at Main Gate
    Security->>API: POST /api/gate-passes/verify { tokenOrPin }
    API->>QR: verifyGatePass(tokenOrPin)
    QR->>QR: Verify HMAC signature and expiration
    QR-->>Security: Valid Pass: Student Details + Room + Destination
    
    Security->>API: POST /api/gate-passes/:id/depart
    API->>DB: GatePass status -> DEPARTED, Log GateEvent(DEPARTED)
    
    Note over Student,Security: Student travels outside campus
    
    Student->>Security: Return to gate, present QR / PIN
    Security->>API: POST /api/gate-passes/:id/return
    API->>DB: GatePass status -> RETURNED -> CLOSED, Log GateEvent(RETURNED)
```

---

## 12. Security Architecture

Nexora Campus incorporates security controls at each tier of the stack:

1. **Authentication & Session Security**:
   - **JSON Web Tokens (JWT)**: Signed using `HMAC-SHA256` with a dedicated secret key (`JWT_SECRET`).
   - **Dual Token Transmission**:
     - Modern browsers: Transmitted via HTTP-only, secure, `SameSite=Lax` cookies, shielding tokens from client-side XSS extraction.
     - Mobile / Fallback: Authorization header (`Bearer <token>`) supported for programmatic and API clients.
   - **Password Security**: Passwords hashed with `bcryptjs` using 10 adaptive salt rounds. Plaintext passwords are never persisted or returned in API responses.
2. **Fine-Grained Role-Based Access Control (RBAC)**:
   - Evaluated by `authenticate`, `requireRole`, and `requirePermission` middleware.
   - 24 granular permissions mapped to roles in database (`RolePermission`).
   - In-memory session cache (45-second TTL) optimized with `$queryRaw` prevents database flooding while instantly invalidating on logout.
3. **Perimeter Verification Security**:
   - **HMAC-SHA256 Signed QR Tokens**: QR code payloads encode `gatePassId:rollNumber:expiryTimestamp` signed with a truncated 16-character cryptographic HMAC digest. Tampered or counterfeit QR codes are rejected instantly.
   - **Anti-Passback & One-Time Use**: Once a gate pass is marked `RETURNED`, subsequent scans return `ALREADY_USED`. Cancelled or expired passes are blocked with audible alerts.
   - **Offline PIN Fallback**: A 4-digit PIN enables verification even if the sentry camera or student screen is damaged.
4. **File Upload & Avatar Defense**:
   - **Magic Byte Validation**: `StorageService.detectMimeFromMagicBytes` inspects raw binary bytes (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `RIFF....WEBP`) to prevent disguised scripts or executable uploads.
   - **Strict Size Caps**: Enforces a strict 5 MB file size limit.
   - **Directory Traversal Mitigation**: File deletion logic rejects paths containing `..` or lacking the `avatar-` prefix.
   - **Dual Persistence Architecture**: Retains the Data URL inside the database, ensuring avatar availability across ephemeral dyno restarts on hosting providers like Render.
5. **HTTP & API Hardening**:
   - `Helmet` middleware sets security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`).
   - CORS middleware restricts origins to configured frontends (`config.frontendUrl`).
   - Sliding-window rate limiting middleware protects sensitive authentication routes against brute-force attacks.

---

## 13. Deployment Configuration

The repository is configured for cloud deployment across decoupled frontend and backend services:

```text
                        +---------------------------+
                        |      Vercel Platform      |
                        | (Next.js 14 App Router)   |
                        +-------------+-------------+
                                      |
                                      | HTTPS / REST Calls
                                      v
                        +---------------------------+
                        |      Render Web Service   |
                        |    (Express.js Engine)    |
                        +-------------+-------------+
                                      |
                                      | Prisma Connection Pool (SSL)
                                      v
                        +---------------------------+
                        |  Neon / Supabase Postgres |
                        |   (37 Relational Tables)  |
                        +---------------------------+
```

### Backend (`render.yaml`) Configuration
```yaml
services:
  - type: web
    name: nexora-campus-backend
    runtime: node
    plan: free
    region: singapore
    rootDir: backend
    buildCommand: npm install && npx prisma generate && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5001
      - key: STORAGE_DIR
        value: /tmp/uploads
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: APP_URL
        sync: false
      - key: FRONTEND_URL
        sync: false
```

### Environment Variables Template

#### Backend (`backend/.env.production.example`)
```env
DATABASE_URL="postgresql://user:password@hostname/dbname?sslmode=require"
PORT=5001
JWT_SECRET="generate-a-secure-random-32-character-secret-key-here"
APP_URL="https://nexora-campus-backend.onrender.com"
FRONTEND_URL="https://nexora-campus-frontend.vercel.app"
STORAGE_DIR="/tmp/uploads"
NODE_ENV="production"
GEMINI_API_KEY="optional-google-gemini-api-key"
```

#### Frontend (`frontend/.env.production.example`)
```env
NEXT_PUBLIC_API_URL=https://nexora-campus-backend.onrender.com/api
```

---

## 14. Local Development Setup

### Prerequisites
- **Node.js**: v18.18+ or v20+ (`node -v`)
- **npm**: v9+ or v10+ (`npm -v`)
- **Git**

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/munazirhussan910-cpu/nexora-campus.git
   cd Nexora
   ```

2. **Configure Environment Variables**:
   ```bash
   # Configure backend environment
   cp backend/.env.example backend/.env

   # Configure frontend environment
   cp frontend/.env.example frontend/.env.local
   ```

3. **Install Dependencies & Seed Database**:
   ```bash
   # Installs workspaces and bootstraps SQLite database with 8 demo personas
   npm run setup
   ```
   *Alternative manual steps*:
   ```bash
   npm install --workspace=backend
   npm install --workspace=frontend
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

4. **Launch Development Servers**:
   ```bash
   # Starts Backend on port 5001 and Frontend on port 3000 concurrently
   npm run dev
   ```

5. **Access the Portals**:
   - **Frontend Application**: `http://localhost:3000`
   - **Backend Health Check**: `http://localhost:5001/api/health`
   - **Nexora Lite (Low-Bandwidth PWA)**: `http://localhost:3000/lite`
   - **Touch Kiosk Mode**: `http://localhost:3000/kiosk`
   - **Public Certificate Verification**: `http://localhost:3000/verify/BC-2026-001`

---

## 15. Testing & Quality Assurance

The backend includes **106 automated tests** structured across 7 dedicated Jest test suites:

| Test Suite File | Test Count | Scope & Verification Coverage |
|---|:---:|---|
| `profile_photo.test.ts` | 14 | Magic byte binary validation, JPEG/PNG/WebP parsing, 5MB limits, path traversal defense |
| `mentor_eligibility.test.ts` | 12 | Academic year resolution, junior-senior constraints, Year $\ge 2$ eligibility, profile upserts |
| `profile_editing.test.ts` | 11 | Role immutability, email immutability, role-specific field persistence across all 7 roles |
| `academic_operations.test.ts`| 16 | Routine CRUD, official notice publishing, academic deadlines, guidance steps, RBAC guards |
| `lite.test.ts` | 8 | Low-bandwidth payload compactness, student role gating, cached identity structures |
| `auth.test.ts` | 16 | Login for all demo personas, student self-registration, duplicate rejection, session caching |
| `nexora.test.ts` | 29 | FSM ticket lifecycle, keyword routing, HMAC QR verification, PIN fallback, Section 44 |
| **Total Test Count** | **106** | **Full integration coverage of backend services and API controllers** |

### Running Tests
```bash
# Run all backend tests
npm test

# Run a specific unit test suite
cd backend && npx jest src/tests/profile_photo.test.ts
```

*Note on Sandboxed Environments*: Tests utilizing `supertest` with custom `server.listen(0, '127.0.0.1')` bindings require local network socket permissions. In restricted or sandboxed CI/CD containers without local loopback access, pass the Express `app` directly to `supertest(app)` without manually invoking `server.listen()`.

---

## 16. Performance Optimization

1. **In-Flight Request Deduplication**:
   - `frontend/lib/api.ts` implements an active request registry (`inFlightRequests`).
   - If multiple UI components issue identical concurrent `GET` requests (e.g., fetching `/auth/me` on initial page render), only one network request is dispatched; other callers share the resulting Promise.
2. **Client-Side In-Memory GET Cache**:
   - `api.ts` caches successful `GET` responses for 45 seconds keyed by user token and URL (`apiCache`), eliminating redundant network round-trips when switching tabs.
3. **Database Session Cache**:
   - `auth.middleware.ts` maintains an in-memory session cache for token validations, reducing per-request database lookups during bursts.
4. **Response Payload Compression**:
   - Express server uses `compression` middleware with Gzip, reducing JSON payload transfer sizes by up to 70%.
5. **Nexora Lite ($< 25\text{ KB}$)**:
   - Dedicated low-bandwidth interface designed for high-latency 2G/3G networks, eliminating heavy client libraries and complex DOM trees.

---

## 17. Accessibility & User Experience

- **Responsive Design**: Interfaces built mobile-first with Tailwind CSS, supporting layouts from 320px mobile screens to multi-monitor desktop command centers.
- **Dark-Academic Theme Tokens**: Professional aesthetic using rich dark backgrounds (`#0a0d14`, `#121722`), muted slate borders (`#1c2436`), and gold accents (`#d4af37`).
- **Interactive State Feedback**:
  - `SkeletonLoader`: Provides smooth shimmer states during async API fetches.
  - `EmptyState`: Contextual empty illustrations with direct call-to-action buttons.
  - `StatusBadge` & `PriorityBadge`: High-contrast, semantic color indicators.
  - `SLAIndicator`: Dynamic color shifts as resolution deadlines approach.
- **Hardware Touch Accessibility**: Kiosk mode features oversized touch targets, high-contrast text, and simplified single-screen workflows for public touch terminals.

---

## 18. Current Limitations & Verification Audit

As part of this comprehensive codebase audit, the following findings and limitations were verified from source code:

1. **Emergency SOS Route Mount Missing in `backend/src/app.ts`**:
   - *Status*: **PARTIALLY IMPLEMENTED**
   - *Finding*: Both backend service/routes (`emergency.service.ts`, `emergency.routes.ts`) and frontend components (`StudentSosModal.tsx`, `SecuritySosBanner.tsx`) exist with Web Audio alarm chirps. However, `app.ts` omits `app.use('/api/emergency', emergencyRoutes)`. Consequently, triggering an SOS returns an HTTP 404 until mounted.
2. **Nexora Lite Role Views Unmounted in `frontend/app/lite/page.tsx`**:
   - *Status*: **PARTIALLY IMPLEMENTED**
   - *Finding*: `frontend/app/lite/components/` contains completed view components for Academic, Admin, Security, Staff, and Warden roles. However, `frontend/app/lite/page.tsx` only renders `StudentLiteView` with an explicit "Student Only" tag, and `backend/src/routes/lite.routes.ts` strictly enforces `requireRole('STUDENT')`.
3. **SMS Inbound vs. Outbound Gateway**:
   - *Status*: **PARTIALLY IMPLEMENTED**
   - *Finding*: An inbound webhook (`POST /api/integrations/sms/inbound`) parses incoming text strings to register complaints or gate passes and returns JSON responses. However, there is no outbound cellular SMS carrier integration (e.g., Twilio, AWS SNS) configured to dispatch SMS replies to physical mobile numbers.
4. **Email Notification Transport**:
   - *Status*: **PLANNED**
   - *Finding*: In-app notifications are saved in the `Notification` database model and displayed in the UI notification bell. External email delivery via SMTP or transactional email providers is not yet wired up.
5. **Local SQLite Single-Writer Lock**:
   - *Status*: **KNOWN LIMITATION (Dev Mode)**
   - *Finding*: Development uses SQLite (`nexora.db`), which locks the database file during write transactions. Under high concurrent write loads, transactions may queue. Production deployment requires transitioning to PostgreSQL as outlined in `render.yaml`.
6. **In-Memory Caches Across Distributed Replicas**:
   - *Status*: **KNOWN LIMITATION**
   - *Finding*: In-flight deduplication and session caches reside in local Node.js process memory. In a multi-instance autoscaling cluster, a distributed Redis cache is recommended.

---

## 19. Roadmap

### Phase 1 — Immediate (Pre-Hackathon Polish)
- Mount `emergency.routes.ts` in `backend/src/app.ts` to activate the live SOS broadcast system.
- Connect existing role views (`StaffLiteView`, `WardenLiteView`, etc.) in `/lite` or update route filters.
- Refactor test helper setup in `mentor_eligibility.test.ts` to use in-memory supertest app instances.

### Phase 2 — Short Term (Post-Hackathon)
- Integrate transactional email transport (Nodemailer / SendGrid) for gate pass approvals and SLA breach notices.
- Connect Twilio / Infobip outbound SMS webhook to send pass PINs via cellular text.
- Add real-time WebSocket support for instant sentry gate movement streaming and technician dispatch.

### Phase 3 — Medium Term (Campus Pilot)
- Production migration from SQLite to managed PostgreSQL (Neon / Supabase) with connection pooling.
- Cloud object storage integration (AWS S3 / Cloudflare R2) for generated vector PDFs and attachments.
- Facial recognition validation integration at gate sentries to supplement camera QR scanning.

### Phase 4 — Long Term (Enterprise Rollout)
- Native mobile applications (React Native / Flutter) with offline biometric storage.
- Multi-campus tenant isolation for state-wide university deployment.
- Predictive maintenance analytics forecasting infrastructure failures prior to Section 44 cluster triggers.

---

## 20. Hackathon / MVP Positioning

### Current Working MVP Scope
Nexora Campus delivers a working operations pipeline across 7 distinct user portals:
1. **Complaints**: Full lifecycle from submission through keyword routing, technician work order management, resolution notes, and student star ratings.
2. **Gate Security**: Dual-mode HMAC-SHA256 QR code generation, camera barcode scanning, 4-digit PIN fallback, and movement logging.
3. **Academic Certification**: Purpose-driven bonafide requests, approval queues, vector PDF rendering, and zero-login public verification.
4. **Attendance Tracking**: Faculty period marking with duplicate protection, historical class views, and mathematical 75% margin calculation.
5. **Peer Mentorship**: Year $\ge 2$ eligibility gating, discovery directory, and private request tracking.
6. **Command Center**: Real-time operational metrics, Section 44 recurring issue detection, and immutable audit logs.

### Suggested Demo Flow for Evaluators
1. **Landing & Overview**: Open `http://localhost:3000` to review the architecture, problem statement, and portal directory.
2. **Student Gate Pass Submission**: Use the Persona Switcher (top bar) to switch to **Aryan Khan (Student)**. Navigate to `/student/gate-pass` and submit an exit request to "City Center".
3. **Warden Gate Pass Approval**: Switch to **Dr. S. K. Mohapatra (Warden)**. Go to `/warden/gate-passes` and approve Aryan's pending request.
4. **Security Sentry Scanning**: Switch to **Vikram Singh (Security)**. Open `/security/scan`. Scan the QR code or enter the 4-digit PIN. Verify student details and record departure.
5. **Maintenance Auto-Routing**: Switch to **Aryan Khan**. Navigate to `/student/requests/new`. Submit a complaint: *"Main tap leaking heavily in bathroom"*.
6. **Technician Resolution**: Switch to **Ramesh Kumar (Plumber)**. Notice the ticket auto-assigned in `/staff/tasks`. Accept, start work, and mark resolved with repair notes.
7. **Student Rating & Closure**: Switch back to **Aryan**. Open the ticket, confirm satisfactory resolution, and submit a 5-star rating.
8. **Public Document Verification**: Open `/verify/BC-2026-001` in an incognito window to inspect the zero-login public verification registry.
9. **Admin Intelligence**: Switch to **Dr. Ananya Ray (Admin)**. Open `/admin/dashboard` to inspect Section 44 clustering, SLA ageing brackets, and the immutable audit log.

---

## 21. Changelog & Versioning

- **v4.0.0 (October 2026 — Current Release)**:
  - Added Student Senior Mentorship engine (`MentorProfile`, `MentorshipRequest`, year eligibility rules).
  - Added Academic Deadlines, Institutional Guidance system, and Routine scheduling.
  - Implemented secure profile photo upload with magic byte detection, 5MB limits, and avatar cropper.
  - Expanded test suite to 106 automated tests across 7 test files.
  - Added Campus Copilot conversational interface with Google Gemini integration.
- **v3.0.0 (September 2026)**:
  - Complete UI/UX overhaul across all role portals with dark-academic design system.
  - Added Faculty Attendance portal with period duplicate checks and 75% compliance analytics.
  - Introduced Section 44 Clustered Issue Intelligence and SLA countdown engine.
- **v2.0.0 (September 2026)**:
  - Dual-mode gate pass verification: HMAC-SHA256 signed QR codes + 4-digit PIN fallback.
  - Automated PDFKit vector certificate synthesis with embedded QR code.
  - Public verification registry (`/verify/[certificateId]`).
- **v1.0.0 (Initial Prototype)**:
  - Core modular monolith architecture with Express backend and Next.js frontend.
  - Keyword-based complaint routing and initial role-based access control.

---

## 22. Contributing

1. **Branching Model**:
   - `main`: Production-ready, verified codebase.
   - `feat/[feature-name]`: New feature branches.
   - `fix/[bug-name]`: Bug fix and patch branches.
2. **Code Standards**:
   - Strict TypeScript compile checks (`tsc --noEmit`) must pass with zero errors.
   - Runtime request validation must be declared via Zod schemas.
   - Secrets must remain in `.env` files and never committed to version control.
3. **Pull Request Guidelines**:
   - Include automated tests for any new API endpoint or service method.
   - Ensure `npm test` runs cleanly.

---

## 23. License

License not currently specified.

---

## 24. Credits

Developed for the **BPUT Hackathon 2026** by the Nexora Campus Engineering Team.
