# Nexora Campus — Testing Strategy, Quality Assurance & Test Suite Audit

> **Reference Specification:** Quality Assurance & Automated Test Documentation  
> **Platform Version:** 4.0.0 (BPUT Hackathon 2026)  
> **Frameworks:** Jest 29 | ts-jest | Supertest 7 | TypeScript 5  
> **Scope:** Backend test suites, frontend compilation, sandbox constraints, and manual verification procedures.

---

## Table of Contents

1. [Testing Philosophy & Test Pyramid](#1-testing-philosophy--test-pyramid)
2. [Automated Test Suite Inventory](#2-automated-test-suite-inventory)
3. [Verified Test Execution Results](#3-verified-test-execution-results)
4. [Test Execution Commands](#4-test-execution-commands)
5. [Sandbox Network & Socket Binding Constraint Audit](#5-sandbox-network--socket-binding-constraint-audit)
6. [Frontend TypeScript & Production Build Verification](#6-frontend-typescript--production-build-verification)
7. [Manual Verification Workflows](#7-manual-verification-workflows)
8. [Quality Assurance Best Practices for Contributors](#8-quality-assurance-best-practices-for-contributors)

---

## 1. Testing Philosophy & Test Pyramid

Nexora Campus enforces high test reliability across its operational workflows. The testing strategy prioritizes:
1. **Domain Logic Invariance**: Verifying that core algorithms (75% attendance calculations, deterministic routing, Section 44 clustering, SLA ageing) never produce false outputs.
2. **Security & Privacy Enforcement**: Validating that role-based access control (RBAC), cross-student record isolation, and prompt injection defenses reject unauthorized requests.
3. **Resilience to External Outages**: Ensuring that AI subsystems (Copilot) fall back gracefully to deterministic engines when external cloud providers (Google Gemini) fail or time out.

---

## 2. Automated Test Suite Inventory

The backend test suite is located in `backend/src/tests/` and comprises **11 specialized test files**:

| Test Suite File | Domain Scope | Primary Verification Focus |
|---|---|---|
| `copilot.test.ts` | AI Copilot Core | Fallback heuristic engine, Action Card generation, Gemini response normalization, real-time telemetry, 75% attendance margin queries, BPUT 9+ CGPA strategy. |
| `copilot_stage3.test.ts` | AI Safety & Grounding | Grounded campus knowledge retrieval, prompt injection defense, cross-student privacy isolation, role-restricted telemetry, unverified policy handling. |
| `mess_menu.test.ts` | Hostel Operations | In-memory HTTP dispatch, resident student meal view, day-scholar access restrictions, warden meal editing, bulk day updates, input validation. |
| `profile_photo.test.ts` | Storage & Security | Binary magic byte inspection (JPEG, PNG, WebP), 5MB size limit enforcement, disguised executable rejection, path traversal neutralization. |
| `mentor_eligibility.test.ts`| Peer Mentorship | Student year calculation (`resolveStudentYear`), Year $\ge 2$ eligibility gating, 1st-year student blocking, mentor profile creation/update. |
| `academic_operations.test.ts`| Academic Desk | Faculty period attendance marking, duplicate class session detection, subject catalog CRUD, timetable routine scheduling. |
| `auth.test.ts` | Identity & RBAC | User registration, login authentication, bcrypt password hashing, JWT session cookies, RBAC route guards (`requireRole`, `requirePermission`). |
| `profile_editing.test.ts` | User Profile Updates | Profile modification across all 7 personas, field immutability (blocking email/roll changes), role escalation prevention. |
| `integration_workflows.test.ts`| End-to-End Lifecycles | Complete FSM transitions for complaints, dual-verification gate passes (QR/PIN), outstation leaves, and vector PDF bonafides. |
| `lite.test.ts` | Low-Bandwidth Portal | Nexora Lite student API endpoints, lightweight payload verification. |
| `nexora.test.ts` | Master Regression | Comprehensive regression suite across requests, sentry verification, SLA rules, and public document verification. |

---

## 3. Verified Test Execution Results

During the pre-submission technical audit, test suites were executed directly against the local codebase:

### 3.1 Unit & In-Memory Test Suites (100% Passed)
Suites operating with in-memory execution or pure unit mocking passed cleanly with zero failures:

- **`src/tests/copilot.test.ts`**:
  - **Status:** **PASS**
  - **Tests:** 27 passed, 27 total (100%)
  - **Duration:** 1.337 s
- **`src/tests/copilot_stage3.test.ts`**:
  - **Status:** **PASS**
  - **Tests:** 30 passed, 30 total (100%)
  - **Duration:** 1.272 s
- **`src/tests/mess_menu.test.ts`**:
  - **Status:** **PASS**
  - **Tests:** 10 passed, 10 total (100%)
  - **Duration:** 2.154 s
- **`src/tests/profile_photo.test.ts`**:
  - **Status:** **PASS**
  - **Tests:** 14 passed, 14 total (100%)
  - **Duration:** 1.553 s

**Total Verified Passing Tests in In-Memory/Unit Execution:** **81 tests passed out of 81 executed**.

---

## 4. Test Execution Commands

All commands are run from the project root using npm workspaces:

### Run Entire Backend Test Suite
```bash
npm run test --workspace=backend
```

### Run Specific Test Suite with Jest
```bash
# Run Copilot Core Suite
npx --prefix backend jest src/tests/copilot.test.ts

# Run Copilot Stage 3 Safety Suite
npx --prefix backend jest src/tests/copilot_stage3.test.ts

# Run Hostel Mess Menu Suite
npx --prefix backend jest src/tests/mess_menu.test.ts

# Run Profile Photo & Magic Bytes Suite
npx --prefix backend jest src/tests/profile_photo.test.ts
```

---

## 5. Sandbox Network & Socket Binding Constraint Audit

### 5.1 The `listen EPERM` Issue Explained
Several older integration test suites (`auth.test.ts`, `mentor_eligibility.test.ts`, `profile_editing.test.ts`, `nexora.test.ts`) contain setup blocks structured as:
```typescript
beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      resolve();
    });
  });
  ...
});
```

In restricted sandbox, CI/CD, or containerized environments where binding to physical network loopback sockets (`127.0.0.1`) is blocked by operating system sandbox policies, the node process receives:
```text
listen EPERM: operation not permitted 127.0.0.1
```
This causes Jest's 30,000ms hook timeout to trigger for suites relying on live socket listeners.

### 5.2 The Verified Solution (`invokeApp` In-Memory Pattern)
The project's modern test suites (e.g. `mess_menu.test.ts`) resolved this limitation by implementing an in-memory HTTP dispatcher that bypasses physical socket binding:
```typescript
// From backend/src/tests/mess_menu.test.ts
function invokeApp(
  method: string,
  url: string,
  headers: Record<string, string> = {},
  body: any = null
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    const req = new http.IncomingMessage(socket);
    req.method = method.toUpperCase();
    req.url = url;
    ...
  });
}
```
*Recommendation:* Refactoring the remaining 7 socket-binding test suites to use this in-memory pattern allows all 106+ tests to run seamlessly in any restricted sandbox or container.

---

## 6. Frontend TypeScript & Production Build Verification

### 6.1 TypeScript Static Type Checking
Both frontend and backend packages compile with **zero TypeScript errors**:

```bash
# Frontend Type Check
npx --prefix frontend tsc --noEmit
# Result: Exit code 0 (Clean)

# Backend Type Check
npx --prefix backend tsc --noEmit
# Result: Exit code 0 (Clean)
```

### 6.2 Next.js 14 Production Build Verification
The Next.js 14 App Router production build was executed and verified:

```bash
npm run build --workspace=frontend
```

**Build Output Summary:**
- **Compiler:** Next.js 14.2.35 (Turbopack/Webpack)
- **Status:** **Compiled successfully**
- **Static Page Generation:** **65 / 65 pages generated successfully (100%)**
- **Shared First Load JS:** 87.5 kB
- **Largest Role Portal:** `/security/scan` (56.8 kB page size, includes `jsQR` webcam scanner)
- **Smallest Role Portal:** `/academic/profile` (389 B page size)

All 65 routes across all 7 personas compile, optimize, and prerender without errors.

---

## 7. Manual Verification Workflows

For hackathon judges and evaluators performing manual end-to-end verification:

### 1. Maintenance Keyword Routing
1. Sign in as Student (`aryan@nexora.edu` / `Password123!`).
2. Navigate to **Requests** &rarr; **New Request**.
3. Select `Plumbing`, enter `"Water pipe leaking in washroom"`, and submit.
4. Verify ticket auto-assigns to **Ramesh Kumar** (Senior Plumber).
5. Switch persona to **Ramesh Kumar** (`ramesh@nexora.edu`), accept job, start work, and mark resolved with notes.
6. Switch back to Student, verify resolution notes, and submit a 5-star rating.

### 2. Dual-Mode Gate Pass Verification
1. Sign in as Student, navigate to **Gate Pass**, apply for a day pass to City Market.
2. Sign in as Warden (`warden.b@nexora.edu`), navigate to **Gate Passes**, and click **Approve**.
3. Sign in as Student, verify the HMAC QR code and 4-digit PIN render on screen.
4. Sign in as Security (`security.gate1@nexora.edu`), enter the 4-digit PIN in the sentry terminal, and verify the pass marks **DEPARTED**.
5. Key in the PIN a second time; verify the pass transitions to **RETURNED** and closes.
6. Attempt to enter the PIN a third time; verify the system rejects with **ALREADY_USED**.

### 3. Bonafide PDF Generation & Public Verification
1. Sign in as Student, apply for Bonafide Certificate with purpose `Scholarship`.
2. Sign in as Academic Officer (`academic@nexora.edu`), approve the bonafide request.
3. Sign in as Student, download the generated PDF certificate, and inspect the embedded QR code.
4. Open an incognito browser window and navigate to `/verify/[certificateId]`.
5. Verify document validity is confirmed publicly without requiring login.

### 4. Nexora Copilot Hybrid Intelligence
1. Navigate to `/student/copilot`.
2. Ask `"Can I bunk class tomorrow?"`; verify Copilot calculates safe misses based on the 75% rule.
3. Type `"My fan is sparking in room 204"`; verify Copilot outputs an `ACTION_MAINTENANCE` card pre-filled with `Electrical` category and `URGENT` priority.
4. Click `"Confirm & Dispatch Ticket"` on the card; verify ticket `NX-XXXX` is created.

---

## 8. Quality Assurance Best Practices for Contributors

1. **Run Static Checks Prior to PR**:
   Always execute `npx tsc --noEmit` in both `frontend` and `backend` directories.
2. **Never Commit Live SQLite Databases**:
   Ensure `nexora.db` and backup database files remain unstaged.
3. **Preserve Human-in-the-Loop for Copilot Actions**:
   Any new Copilot action must output a review card rather than mutating the database autonomously.
