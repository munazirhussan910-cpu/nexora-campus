# Nexora Campus — Security, Authentication & Threat Modeling Specification

> **Reference Specification:** Enterprise Security & Defense Architecture  
> **Platform Version:** 4.0.0 (BPUT Hackathon 2026)  
> **Target Platform:** Node.js 20+ | Express.js 4 | Prisma 5.22 | Next.js 14  
> **Classification:** Confidential / System Architecture Documentation

---

## Table of Contents

1. [Security Philosophy & Threat Surface Overview](#1-security-philosophy--threat-surface-overview)
2. [Authentication Architecture](#2-authentication-architecture)
3. [Authorization & Role-Based Access Control (RBAC)](#3-authorization--role-based-access-control-rbac)
4. [Cryptographic Perimeter & Document Signing](#4-cryptographic-perimeter--document-signing)
5. [Input Sanitization & Binary Upload Security](#5-input-sanitization--binary-upload-security)
6. [Copilot Adversarial Defense & Privacy Guardrails](#6-copilot-adversarial-defense--privacy-guardrails)
7. [Immutable Audit Logging & Forensic Accountability](#7-immutable-audit-logging--forensic-accountability)
8. [Comprehensive Threat Model & Mitigation Audit](#8-comprehensive-threat-model--mitigation-audit)
9. [Secrets Management & Environment Hygiene](#9-secrets-management--environment-hygiene)

---

## 1. Security Philosophy & Threat Surface Overview

Collegiate operations platforms handle high-value operational and personal data: student identity records, residential room assignments, guardian contact details, perimeter exit/entry timestamps, disciplinary complaints, and academic attendance compliance.

Nexora Campus adheres to **defense-in-depth**, **least privilege**, and **zero-trust perimeter verification**:
- **Stateless, Cryptographically Bound Authentication**: User sessions are validated via signed JSON Web Tokens (JWT) stored in HTTP-only, Secure cookies.
- **Granular Server-Side Authorization**: Every state change and data access is guarded by role-level and permission-level middleware.
- **Cryptographic Gate Passes**: Gate passes cannot be forged through simple database ID sequencing; tokens are HMAC-SHA256 signed with anti-passback controls.
- **Strict File Upload Sanitization**: File uploads inspect binary magic bytes rather than trusting client-declared MIME types or file extensions.
- **Immutable Forensic Audit Trail**: Administrative, operational, and sentry actions append unalterable records capturing actor ID, action code, IP address, user agent, and before-and-after JSON snapshots.

---

## 2. Authentication Architecture

### 2.1 Credential Storage & Hashing
- **Algorithm**: `bcryptjs` with **10 salt rounds**.
- **Hash Invariance**: Passwords are never stored in plaintext, logged, or included in API error envelopes.
- **Default Seeding**: Seeded demo accounts use standardized development credentials (`Password123!`).

### 2.2 Token Lifecycle & Session Management
- **Token Mechanism**: Standard JSON Web Tokens (`jsonwebtoken`) signed with a server-side secret (`JWT_SECRET`).
- **Signature Algorithm**: HMAC-SHA256.
- **Token Expiry**: Default 7 days (`expiresIn: '7d'`).
- **Token Delivery**:
  1. Primary: HTTP-only, Secure (in production), `SameSite=Lax` cookie named `token`.
  2. Secondary: Bearer authorization header (`Authorization: Bearer <token>`) stored in `localStorage` as a fallback for non-cookie HTTP clients and headless requests.
- **Logout Invalidation**: `POST /api/auth/logout` clears the session cookie and purges the user's entry from the server-side in-memory session cache.

### 2.3 High-Performance Session Cache (`auth.middleware.ts`)
To prevent repetitive multi-table SQL queries (`User` &rarr; `Role` &rarr; `RolePermission` &rarr; `Permission`) on high-frequency API endpoints, `auth.middleware.ts` maintains an in-memory session cache:
- **Key**: `userId`
- **Stored Data**: Authenticated `AuthUser` object (ID, username, email, role, roleId, permissions array, department, hostel room).
- **Time-To-Live (TTL)**: 45 seconds.
- **Cache Invalidation**: Automatically evicted when a user logs out or updates their profile details.

---

## 3. Authorization & Role-Based Access Control (RBAC)

### 3.1 Role Hierarchy
The platform defines 6 foundational database roles:
1. `STUDENT`: Self-service portal for complaints, passes, leaves, certificates, and academic views.
2. `STAFF`: Operational queue for maintenance technicians and facility personnel.
3. `WARDEN`: Residential block authority reviewing passes, leaves, resident rosters, and mess menus.
4. `SECURITY`: Sentry terminal validating campus perimeter departures and returns.
5. `ACADEMIC_OFFICER`: Academic catalog, weekly routines, circular notices, and certificate generation.
6. `ADMIN`: Full operational oversight, Section 44 cluster alerts, SLA management, and audit trails.
7. *Specialized Sub-Persona*: `FACULTY` (represented as `STAFF` with faculty specialization or dedicated faculty role check in middleware) for period attendance logging.

### 3.2 Granular Permissions Matrix
The system enforces 24 distinct permission strings:

| Permission String | Description | Role Assignments |
|---|---|---|
| `requests.create` | Submit complaints and maintenance requests | STUDENT, ADMIN |
| `requests.view.own` | View own submitted tickets | STUDENT, STAFF, ADMIN |
| `requests.view.all` | View campus-wide requests | WARDEN, ADMIN |
| `requests.assign` | Assign tickets to technicians | ADMIN |
| `requests.reassign` | Reallocate tickets between staff | ADMIN |
| `requests.resolve` | Document repair notes and mark resolved | STAFF, ADMIN |
| `gatepass.create` | Apply for student gate pass | STUDENT, ADMIN |
| `gatepass.approve` | Approve student gate pass | WARDEN, ADMIN |
| `gatepass.reject` | Reject student gate pass | WARDEN, ADMIN |
| `gatepass.verify` | Scan QR / enter PIN at main gate | SECURITY, ADMIN |
| `leave.create` | Submit hostel outstation leave | STUDENT, ADMIN |
| `leave.approve` | Approve hostel outstation leave | WARDEN, ADMIN |
| `leave.reject` | Reject hostel outstation leave | WARDEN, ADMIN |
| `bonafide.create` | Apply for bonafide certificate | STUDENT, ADMIN |
| `bonafide.approve` | Approve bonafide & generate PDF | ACADEMIC_OFFICER, ADMIN |
| `bonafide.reject` | Reject bonafide request | ACADEMIC_OFFICER, ADMIN |
| `academic.dashboard`| Access Academic Officer console | ACADEMIC_OFFICER, ADMIN |
| `academic.subject.*`| CRUD operations on subjects | ACADEMIC_OFFICER, ADMIN |
| `academic.timetable.*`| CRUD operations on timetables | ACADEMIC_OFFICER, ADMIN |
| `academic.attendance.read`| View campus attendance records | ACADEMIC_OFFICER, ADMIN |
| `notices.view` | View cohort targeted notices | ALL ROLES |
| `notices.create` | Publish targeted notices | WARDEN, ACADEMIC_OFFICER, ADMIN |
| `analytics.view` | View Command Center telemetry | ADMIN |
| `audit.view` | Inspect immutable audit logs | ADMIN |
| `staff.manage` | Manage technician directory | ADMIN |
| `students.manage` | Manage student records | WARDEN, ADMIN |

### 3.3 Domain Scope Isolation
In addition to role and permission checks, domain controllers enforce **data scoping**:
- **Hostel Warden Scope**: Wardens are programmatically restricted to data where `hostelBlockId` matches their assigned residential block (`getWardenHostelBlock`). A warden in Block B cannot view or approve leaves for Block A.
- **Faculty Scope**: Faculty can only mark attendance for subjects assigned to their user ID or department.
- **Student Privacy Scope**: Students are strictly prohibited from inspecting other students' tickets, attendance percentages, leaves, or room locations.

---

## 4. Cryptographic Perimeter & Document Signing

### 4.1 Gate Pass HMAC-SHA256 Token Construction
When a warden approves a student gate pass, `QrService.generateSignedQrToken()` constructs a tamper-evident token:

$$\text{Payload} = \text{gatePassId} \mathbin{\Vert} \text{rollNumber} \mathbin{\Vert} \text{expiryEpochMs}$$

$$\text{Signature} = \text{HMAC-SHA256}(\text{Payload}, \text{JWT\_SECRET})[0 \dots 15]$$

$$\text{QR Token} = \text{"NX-GP-"} \mathbin{\Vert} \text{Base64}(\text{Payload}) \mathbin{\Vert} \text{"."} \mathbin{\Vert} \text{Signature}$$

### 4.2 Sentry Verification & Anti-Passback FSM
At campus security sentries, `POST /api/gate-passes/verify` processes the barcode:
1. **Prefix Validation**: Must begin with `NX-GP-`.
2. **Signature Verification**: Recomputes HMAC-SHA256 over decoded payload using server `JWT_SECRET`. If signature does not match, rejects as forged.
3. **Temporal Validity**: Ensures `Date.now() <= expiryEpochMs`.
4. **Anti-Passback Finite State Machine**:
   - `APPROVED`: Sentry marks student `DEPARTED`, recording exit timestamp and security officer ID.
   - `DEPARTED`: Sentry marks student `RETURNED`, recording return timestamp and transitioning pass to `CLOSED`.
   - `RETURNED` / `CLOSED`: Re-scanning immediately returns error `ALREADY_USED`, preventing screenshot sharing or multiple exits on a single pass.

### 4.3 Public Document Verification Subsystem
- **Verification Endpoint**: `GET /api/verify/document/:certificateId`.
- **Zero-Login Public Access**: External institutions (banks, scholarship committees) verify document authenticity without account registration.
- **PII Guardrail**: Returns only necessary verification metadata (Student Name, Roll Number, Issue Date, Purpose, Status, Issuing Authority); personal phone numbers and private addresses are excluded.

---

## 5. Input Sanitization & Binary Upload Security

### 5.1 Zod Runtime Validation
All incoming HTTP requests with JSON payloads pass through `validate.middleware.ts` before reaching domain controllers. Payloads with extra fields, invalid enums, or out-of-bound strings are rejected with HTTP 400 (`VALIDATION_ERROR`).

### 5.2 Binary Magic Bytes Avatar Validation (`storage.service.ts`)
To prevent disguised malicious executable uploads (e.g. PHP scripts or polyglot binaries renamed as `.jpg`), `StorageService.detectMimeFromMagicBytes()` inspects the raw leading bytes of uploaded buffers:
- **JPEG**: Leading bytes `FF D8 FF`.
- **PNG**: Leading bytes `89 50 4E 47 0D 0A 1A 0A`.
- **WebP**: Leading bytes `52 49 46 46` (`RIFF`) and bytes 8–11 `57 45 42 50` (`WEBP`).
- **Disguised / Polyglot Rejection**: Any file failing binary magic byte matching is rejected with HTTP 400 (`Disguised or invalid image file`).

### 5.3 Upload Constraints & Path Traversal Neutralization
- **File Size Cap**: Strict 5MB ceiling (`MAX_FILE_SIZE = 5 * 1024 * 1024`).
- **Path Traversal Defense**: `StorageService.safeDeleteDiskFile` explicitly normalizes paths and verifies that target filenames contain only safe alphanumeric characters and hashes, preventing directory traversal attacks (`../`).
- **Dual Persistence Architecture**: Saves avatar images to local disk (`/uploads/avatars/avatar-[userId]-[hash].[ext]`) while simultaneously writing data URLs directly to `User.profilePhotoUrl` to survive ephemeral cloud disk wipes.

---

## 6. Copilot Adversarial Defense & Privacy Guardrails

Nexora Copilot implements multiple defensive barriers in `backend/src/services/copilot.service.ts`:

### 6.1 Prompt Injection Prevention
`CopilotService.isPromptInjection()` inspects incoming user queries against known adversarial patterns:
- Injections such as `"ignore previous instructions"`, `"reveal system prompt"`, `"bypass rbac"`, `"dump database"`, and `"act as root"` are intercepted before any AI evaluation.
- Returns a standardized security refusal card (`PRIVACY_RESTRICTION`) and records the event in the security log.

### 6.2 Cross-Student Private Data Isolation
`CopilotService.isCrossStudentAccessAttempt()` prevents unauthorized access to student records:
- Detects attempts by a student to query another student's roll number (e.g. 9-digit BPUT roll numbers) or name combined with private keywords (`attendance`, `grades`, `leaves`, `complaints`).
- Denies the request with an explicit privacy regulation citation (FERPA & Student Data Protection Charter) and directs the student to their own records.

### 6.3 Safe AI Action Architecture
Copilot never executes state-altering database mutations directly. It outputs structured **Action Cards** (`ACTION_MAINTENANCE`, `ACTION_BONAFIDE`, `ACTION_LEAVE`, `ACTION_GATE_PASS`). The student must inspect the pre-filled fields and click a confirmation button to dispatch an authenticated REST call.

---

## 7. Immutable Audit Logging & Forensic Accountability

### 7.1 Append-Only Audit Trail
Implemented in `AuditService.log()`, all operational transitions create an immutable `AuditLog` entry:
- **Actor Metadata**: `actorId`, `ipAddress`, `userAgent`.
- **Entity Reference**: `action` (e.g. `GATE_PASS_APPROVED`), `entityType` (`GatePass`), `entityId`.
- **State Diffs**: `oldValues` (JSON snapshot before mutation) and `newValues` (JSON snapshot after mutation).
- **Immutable Table**: The schema provides no `UPDATE` or `DELETE` methods for `AuditLog`.

---

## 8. Comprehensive Threat Model & Mitigation Audit

| Threat Vector | Potential Impact | In-Code Countermeasure | Verification Status |
|---|---|---|:---:|
| **Credential Brute-Force** | Account takeover via automated login | Sliding window rate limiting (`rateLimit.middleware.ts`) | **VERIFIED** |
| **Session Token Interception** | Session hijacking | JWT in HTTP-only, Secure, `SameSite=Lax` cookies | **VERIFIED** |
| **Forged Gate Passes** | Unauthorized perimeter exit/entry | HMAC-SHA256 signature verified against server secret | **VERIFIED** |
| **Pass Replay / Screenshot Sharing** | Multiple students exit on one pass | One-time status FSM (`APPROVED` &rarr; `DEPARTED` &rarr; `RETURNED`) | **VERIFIED** |
| **Disguised Malicious Uploads** | Remote code execution via upload | Binary magic byte inspection (`StorageService`) + 5MB cap | **VERIFIED** |
| **Cross-Student Data Leaks in AI** | Unauthorized student record disclosure | Algorithmic roll/name detection & privacy denial in Copilot | **VERIFIED** |
| **Prompt Injection Attacks** | LLM jailbreak and system prompt leak | Deterministic injection pattern blocker in `CopilotService` | **VERIFIED** |
| **Privilege Escalation via Profile Edit** | Student alters role to ADMIN | Profile update schema strictly excludes `role` and `roleId` | **VERIFIED** |
| **Duplicate Attendance Submission** | Distorted academic attendance stats | `check-duplicate` verification query before attendance commit | **VERIFIED** |
| **Section 44 Clustered Failures** | Neglected systemic infrastructure breakdowns | 14-day rolling window clustering algorithm in Admin API | **VERIFIED** |

---

## 9. Secrets Management & Environment Hygiene

1. **Placeholder Hygiene**:
   - `.env.example` and `.env.production.example` contain non-sensitive placeholders only.
   - Production secrets (`JWT_SECRET`, database passwords) must never be committed to Git.
2. **Git Ignore Integrity**:
   - `.gitignore` strictly excludes `.env`, `.env.local`, `.env.*.local`, `*.db`, `*.log`, and `uploads/`.
3. **Key Rotation Readiness**:
   - `JWT_SECRET` rotation immediately invalidates all active sessions and gate passes, forcing re-authentication and re-issuance.
