# NEXORA CAMPUS — API SPECIFICATION

All endpoints are prefixed with `/api`. Consistent JSON responses are returned for all calls.

### Response Conventions

#### Success:
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

#### Error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Detailed error message"
  }
}
```

---

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/login` | Login with `usernameOrEmail` and `password`. Returns JWT and sets HTTP-only cookie | None |
| `GET` | `/api/auth/me` | Fetch authenticated user profile, role, and permissions | Yes |
| `POST` | `/api/auth/logout` | Clears authentication session cookie | Yes |
| `GET` | `/api/auth/personas` | List 5 development demo personas | None |
| `POST` | `/api/auth/switch-persona` | 1-click switch session to any demo persona | None |

---

## 2. Request Engine (`/api/requests`)

| Method | Endpoint | Description | Permissions |
|---|---|---|---|
| `GET` | `/api/requests/my` | List current user's requests with SLA | Authenticated |
| `GET` | `/api/requests` | List all campus requests with filters (`status`, `priority`, `type`, `hostel`, `search`) | `requests.view.all` |
| `GET` | `/api/requests/:id` | Get single request details, live timeline, and SLA | Owner or `requests.view.all` |
| `PATCH` | `/api/requests/:id/status` | Execute validated state transition | Authenticated |
| `POST` | `/api/requests/:id/reassign` | Reassign ticket to another staff member | `requests.reassign` |

---

## 3. Maintenance Complaints (`/api/complaints`)

| Method | Endpoint | Description | Permissions |
|---|---|---|---|
| `POST` | `/api/complaints` | Submit complaint. Automatically routed and assigned | `requests.create` |
| `GET` | `/api/complaints/assigned` | List complaints assigned to logged-in technician | Staff |
| `POST` | `/api/complaints/:id/accept` | Staff accepts assigned complaint | Assigned Staff |
| `POST` | `/api/complaints/:id/start` | Staff marks work as IN PROGRESS | Assigned Staff |
| `POST` | `/api/complaints/:id/resolve` | Staff records resolution notes and resolves | Assigned Staff |
| `POST` | `/api/complaints/:id/confirm` | Student confirms complaint resolution | Ticket Requester |
| `POST` | `/api/complaints/:id/rating` | Student rates resolution (1-5 stars) and feedback | Ticket Requester |

---

## 4. Gate Passes (`/api/gate-passes`)

| Method | Endpoint | Description | Permissions |
|---|---|---|---|
| `POST` | `/api/gate-passes` | Student applies for exit gate pass | `gatepass.create` |
| `GET` | `/api/gate-passes/pending` | Warden lists pending gate passes | `gatepass.approve` |
| `GET` | `/api/gate-passes/my` | Student lists own gate passes with active QR & PIN | Authenticated |
| `POST` | `/api/gate-passes/:id/approve` | Warden approves pass, generates signed QR & PIN | `gatepass.approve` |
| `POST` | `/api/gate-passes/:id/reject` | Warden rejects gate pass with reason | `gatepass.reject` |
| `POST` | `/api/gate-passes/verify` | Security officer verifies QR token or PIN | `gatepass.verify` |
| `POST` | `/api/gate-passes/:id/depart` | Security logs student departure | `gatepass.verify` |
| `POST` | `/api/gate-passes/:id/return` | Security logs student return and completes pass | `gatepass.verify` |

---

## 5. Bonafide Certificates (`/api/bonafide`)

| Method | Endpoint | Description | Permissions |
|---|---|---|---|
| `POST` | `/api/bonafide` | Student requests Bonafide Certificate | `bonafide.create` |
| `GET` | `/api/bonafide/pending` | Authority views pending certificate applications | `bonafide.approve` |
| `GET` | `/api/bonafide/my` | Student views issued certificates | Authenticated |
| `POST` | `/api/bonafide/:id/approve` | Authority approves, renders dynamic PDF, issues ID | `bonafide.approve` |
| `GET` | `/api/bonafide/:id/download` | Download generated official PDF | Authenticated |

---

## 6. Public Document Verification (`/api/verify`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/verify/document/:certificateId` | Public cryptographic document legitimacy check | **None (Public)** |

---

## 7. Hostel Leave (`/api/leaves`)

| Method | Endpoint | Description | Permissions |
|---|---|---|---|
| `POST` | `/api/leaves` | Student submits overnight hostel leave request | `leave.create` |
| `GET` | `/api/leaves/pending` | Warden lists pending leaves | `leave.approve` |
| `GET` | `/api/leaves/my` | Student views own leave applications | Authenticated |
| `POST` | `/api/leaves/:id/approve` | Warden approves leave | `leave.approve` |
| `POST` | `/api/leaves/:id/reject` | Warden rejects leave with reason | `leave.reject` |

---

## 8. Targeted Notices (`/api/notices`)

| Method | Endpoint | Description | Permissions |
|---|---|---|---|
| `GET` | `/api/notices` | Fetch notices targeted to user profile (with read status) | Authenticated |
| `POST` | `/api/notices` | Broadcast targeted notice (Branch, Year, Hostel, ALL) | `notices.create` |
| `POST` | `/api/notices/:id/read` | Record user read receipt | Authenticated |

---

## 9. Admin Operations (`/api/admin`)

| Method | Endpoint | Description | Permissions |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | Cockpit metrics (Open, Overdue, Approvals, Resolved) | `analytics.view` |
| `GET` | `/api/admin/sla` | Campus SLA metrics and ageing distribution | `analytics.view` |
| `GET` | `/api/admin/recurring-issues` | Section 44 clustered issue detection | `analytics.view` |
| `GET` | `/api/admin/staff` | Staff directory with active task counts | `staff.manage` |
| `GET` | `/api/admin/students` | Student roster with hostel allocations | `students.manage` |
| `GET` | `/api/admin/audit-logs` | Immutable audit log trail | `audit.view` |

---

## 10. Kiosk & Integrations

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/kiosk/student/:rollNumber` | Student lookup at self-service kiosk | None |
| `POST` | `/api/kiosk/requests` | Create request via self-service kiosk | None |
| `POST` | `/api/integrations/sms/inbound` | Inbound SMS parser gateway (e.g. `TICKET B204 TAP LEAKING`) | None |
