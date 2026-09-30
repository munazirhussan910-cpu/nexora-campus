# Task Plan: Nexora Campus Authentication Upgrade

## Phase 1 — Codebase Audit & Planning
- [x] Inspect frontend authentication pages, components, and contexts
- [x] Inspect backend authentication routes, controllers, and services
- [x] Inspect Prisma schema, models (User, Role, Student, Branch, Room, HostelBlock)
- [x] Inspect password hashing (bcryptjs) and JWT/session implementation
- [x] Inspect RBAC middleware (requireRole, requirePermission)
- [x] Inspect existing demo personas and quick-switch implementation
- [x] Verify baseline tests pass and frontend builds cleanly

## Phase 2 & 3 — Backend Student Registration & Validation
- [ ] Implement `POST /api/auth/register` route in `backend/src/routes/auth.routes.ts`
  - [ ] Validate required fields with Zod: fullName, email, rollNumber, department/branch, year/semester, hostel (optional), password, confirmPassword
  - [ ] Reject or forbid privileged role injection (`role=ADMIN`, etc.)
  - [ ] Validate campus email format and roll number format
  - [ ] Check for duplicate email ("An account with this campus email already exists.")
  - [ ] Check for duplicate student ID / roll number ("This Student ID is already registered.")
  - [ ] Validate password criteria and password confirmation match
  - [ ] Validate department/branch
- [ ] Add `GET /api/auth/register-options` to fetch branches and hostel blocks for registration form
- [ ] Hash password using `bcryptjs` (cost factor 10)
- [ ] Database transaction:
  - [ ] Ensure `Role` is strictly `STUDENT`
  - [ ] Create `User` record
  - [ ] Create `Student` record linked to User and Branch, with optional Hostel Room
- [ ] Issue 7-day JWT session cookie & bearer token matching existing auth response structure
- [ ] Enhance `POST /api/auth/login` to also allow login via roll number in addition to email and username

## Phase 4 & 5 — Frontend Authentication Architecture
- [ ] Update `frontend/lib/auth-context.tsx`:
  - [ ] Add `register(formData)` method to `AuthContextType`
  - [ ] Ensure successful registration sets session and redirects to `/student/dashboard`
- [ ] Create `/register` page (`frontend/app/register/page.tsx`):
  - [ ] Full Name
  - [ ] Campus Email
  - [ ] Student ID / Roll Number
  - [ ] Department / Branch dropdown/input
  - [ ] Semester / Year selector
  - [ ] Hostel Block (or Day Scholar)
  - [ ] Password and Confirm Password with show/hide and validation indicators
  - [ ] Clear error handling and messaging
  - [ ] No role selector (clearly marked as Student Registration)
  - [ ] Link to Login page
- [ ] Update `/login` page (`frontend/app/login/page.tsx`):
  - [ ] Clean separation:
    - Normal Campus Login (Username/Email/Roll Number + Password)
    - New Student link: "Don't have a campus account? Create Student Account" -> `/register`
    - Demo / Judging Accounts: visually labeled with 1-Click buttons for Student, Staff, Warden, Security, Admin, Academic Officer
  - [ ] Preserve all existing demo accounts and credentials
- [ ] Verify frontend route guards / role protection on dashboards

## Phase 6 — Comprehensive Verification & Testing
- [ ] Write dedicated automated tests in `backend/src/tests/` covering:
  - [ ] TEST 1: Existing demo Student login works
  - [ ] TEST 2: Existing demo Staff login works
  - [ ] TEST 3: Existing demo Warden login works
  - [ ] TEST 4: Existing demo Security login works
  - [ ] TEST 5: Existing demo Admin login works
  - [ ] TEST 6: New student can register
  - [ ] TEST 7: New student can immediately log in
  - [ ] TEST 8: Duplicate email is rejected
  - [ ] TEST 9: Duplicate Student ID is rejected
  - [ ] TEST 10: Wrong password is rejected
  - [ ] TEST 11: Empty/invalid registration fields are rejected
  - [ ] TEST 12: Malicious request with `role=ADMIN` is rejected / cannot create privileged user
  - [ ] TEST 13: New student cannot access admin endpoints (RBAC check)
  - [ ] TEST 14: New student profile loads student data
  - [ ] TEST 15: Logout works
  - [ ] TEST 16: Session refresh preserves authenticated user
- [ ] Run full test suite with all existing tests + new tests
- [ ] Run production frontend build (`npm run build:frontend`) to verify TypeScript and page routing
- [ ] Verify all existing features and dashboards remain functional
