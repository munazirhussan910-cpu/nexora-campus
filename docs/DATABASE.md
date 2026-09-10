# NEXORA CAMPUS — DATABASE SPECIFICATION

The Nexora Campus database architecture is fully normalized and managed via **Prisma ORM**.

---

## 1. Entity-Relationship Diagram (ASCII)

```text
       +---------------+ 1        * +-------------------+
       |     Role      |------------|  RolePermission   |
       +---------------+            +-------------------+
               | 1                            | *
               |                              v
               | *                     +----------------+
               |                       |   Permission   |
               v                       +----------------+
       +---------------+
       |     User      |
       +---------------+
        | 1         | 1
        |           |
        v 1         v 1
+-------------+ +-------------+
|   Student   | |    Staff    |
+-------------+ +-------------+
   | *   | *           | 1
   v 1   v 1           |
Branch  Room           |
         | *           |
         v 1           |
     HostelBlock       |
                       |
                       v
         +-----------------------------+
         |           Request           |<---+
         | (Central Lifecycle Entity)  |    |
         +-----------------------------+    |
            | 1   | 1    | 1     | 1        |
            |     |      |       |          | *
            v 1   v 1    v 1     v 1        |
      Complaint GatePass Leave  Bonafide    |
                   |                |       |
                   v *              v 1     |
               GateEvent         Document   |
                                            |
         +-----------------------------+    |
         |    RequestStatusHistory     |----+
         |   (Immutable Audit Event)   |
         +-----------------------------+
```

---

## 2. Table Schemas & Data Dictionaries

### A. Authentication & Authorization

#### `User`
| Field | Type | Attributes | Description |
|---|---|---|---|
| `id` | String | `@id @default(uuid())` | Primary key |
| `username` | String | `@unique` | Login username |
| `email` | String | `@unique` | Institutional email |
| `passwordHash` | String | | Bcrypt hash |
| `roleId` | String | `@relation(Role)` | Role foreign key |
| `isActive` | Boolean | `@default(true)` | Account active flag |
| `lastLoginAt` | DateTime? | Nullable | Last authenticated timestamp |
| `createdAt` | DateTime | `@default(now())` | Registration date |
| `updatedAt` | DateTime | `@updatedAt` | Automatic update timestamp |

#### `Role` & `Permission`
- **`Role`**: `id`, `name` (`STUDENT`, `STAFF`, `WARDEN`, `SECURITY`, `ADMIN`), `description`.
- **`Permission`**: `id`, `code` (`requests.create`, `requests.view.all`, `gatepass.approve`, `leave.approve`, etc.), `description`.
- **`RolePermission`**: Junction table linking `roleId` and `permissionId` with compound unique index `@@unique([roleId, permissionId])`.

---

### B. Campus Structure

#### `Branch`
- `id`: UUID Primary Key
- `code`: Unique code (`CSE`, `ECE`, `MECH`, `CIVIL`, `EE`)
- `name`: Full department name

#### `HostelBlock` & `Room`
- **`HostelBlock`**: `id`, `name` (`Block A`, `Block B`, etc.), `gender` (`MALE`, `FEMALE`, `COED`), `wardenName`.
- **`Room`**: `id`, `hostelBlockId`, `roomNumber` (e.g. `204`), `floor` (Int), `capacity` (Int). Compound unique constraint on `[hostelBlockId, roomNumber]`.

#### `Student`
- `id`: UUID Primary Key
- `userId`: `@unique`, Foreign Key &rarr; `User.id` (`onDelete: Cascade`)
- `rollNumber`: `@unique`, University Roll Number (e.g. `220101048`)
- `fullName`: Student name
- `branchId`: Foreign Key &rarr; `Branch.id`
- `year`: Academic year (1, 2, 3, 4)
- `phone`: Student contact number
- `parentPhone`: Emergency parent/guardian contact
- `hostelRoomId`: Foreign Key &rarr; `Room.id`
- `admissionYear`: Intake year (e.g. 2024)

#### `Staff`
- `id`: UUID Primary Key
- `userId`: `@unique`, Foreign Key &rarr; `User.id` (`onDelete: Cascade`)
- `employeeId`: `@unique`, Employee badge number (e.g. `STF-PLUMB-01`)
- `fullName`: Staff member name
- `department`: `Maintenance`, `Hostel`, `Security`, `Administration`
- `designation`: Specific job title
- `specialization`: `PLUMBING`, `ELECTRICAL`, `CARPENTRY`, `IT`, `GENERAL`, `WARDEN`
- `phone`: Contact phone number

---

### C. The Request Engine Core

#### `Request`
| Field | Type | Attributes | Description |
|---|---|---|---|
| `id` | String | `@id @default(uuid())` | Primary key |
| `requestNumber` | String | `@unique` | Human-readable identifier (`NX-10291`) |
| `requesterId` | String | FK &rarr; `User.id` | Initiator ID |
| `requestTypeId` | String | FK &rarr; `RequestType.id` | Category classification |
| `status` | String | `@default("SUBMITTED")` | Current FSM status |
| `priority` | String | `@default("NORMAL")` | `LOW`, `NORMAL`, `HIGH`, `URGENT` |
| `title` | String | | Brief summary |
| `description` | String | | Problem description |
| `location` | String? | Nullable | Physical location (e.g. `Hostel B / Room 204`) |
| `assignedTo` | String? | FK &rarr; `User.id` | Assigned technician |
| `createdAt` | DateTime | `@default(now())` | Creation timestamp |
| `updatedAt` | DateTime | `@updatedAt` | Last modification timestamp |
| `dueAt` | DateTime? | Nullable | Target resolution deadline |
| `completedAt` | DateTime? | Nullable | Completion timestamp |

#### `RequestStatusHistory`
- `id`: UUID Primary Key
- `requestId`: Foreign Key &rarr; `Request.id` (`onDelete: Cascade`)
- `oldStatus`: Previous status string
- `newStatus`: Updated status string
- `changedBy`: Foreign Key &rarr; `User.id`
- `comment`: Action description
- `createdAt`: Timestamp

#### `RequestAssignment`
- `id`: UUID Primary Key
- `requestId`: Foreign Key &rarr; `Request.id` (`onDelete: Cascade`)
- `assignedTo`: Foreign Key &rarr; `User.id`
- `assignedBy`: Foreign Key &rarr; `User.id`
- `assignedAt`: Assignment timestamp
- `acceptedAt`: Technician acceptance timestamp
- `completedAt`: Completion timestamp

---

### D. Subsystem Extension Tables

#### `Complaint`
- `id`: UUID Primary Key
- `requestId`: `@unique`, Foreign Key &rarr; `Request.id` (`onDelete: Cascade`)
- `category`: `Plumbing`, `Electrical`, `Carpentry`, `Network`, `Cleanliness`
- `subCategory`: Sub-classification
- `issueType`: Specific issue code
- `photoUrl`: Attachment storage URL
- `resolutionNotes`: Technician resolution entry
- `studentRating`: Feedback rating (1–5)
- `studentFeedback`: Comments submitted by student upon closing ticket

#### `GatePass` & `GateEvent`
- **`GatePass`**:
  - `id`: UUID Primary Key
  - `requestId`: `@unique`, Foreign Key &rarr; `Request.id` (`onDelete: Cascade`)
  - `destination`: Off-campus destination
  - `reason`: Travel purpose
  - `departureTime`: Scheduled departure time
  - `expectedReturnTime`: Curfew return deadline
  - `approvedBy`: Foreign Key &rarr; `User.id`
  - `passPin`: 4-digit numeric fallback PIN
  - `qrTokenHash`: `@unique`, Cryptographic HMAC-signed token
  - `qrExpiresAt`: Expiration deadline
  - `gateStatus`: `PENDING_APPROVAL`, `APPROVED`, `DEPARTED`, `RETURNED`, `EXPIRED`, `REJECTED`
- **`GateEvent`**:
  - `id`: UUID Primary Key
  - `gatePassId`: Foreign Key &rarr; `GatePass.id` (`onDelete: Cascade`)
  - `eventType`: `DEPARTED`, `RETURNED`, `VERIFIED`
  - `verifiedBy`: Foreign Key &rarr; `User.id` (Security Officer)
  - `eventTime`: Exact scan timestamp
  - `verificationMethod`: `QR`, `PIN`
  - `notes`: Sentry notes

#### `LeaveRequest`
- `id`: UUID Primary Key
- `requestId`: `@unique`, Foreign Key &rarr; `Request.id` (`onDelete: Cascade`)
- `startDate`: Leave commencement date
- `endDate`: Return date
- `reason`: Purpose of leave
- `emergencyContact`: Parent / guardian emergency phone
- `parentConsent`: Boolean flag
- `approvedBy`: Foreign Key &rarr; `User.id`
- `status`: `PENDING_APPROVAL`, `APPROVED`, `REJECTED`

#### `BonafideRequest` & `Document`
- **`BonafideRequest`**:
  - `id`: UUID Primary Key
  - `requestId`: `@unique`, Foreign Key &rarr; `Request.id` (`onDelete: Cascade`)
  - `purpose`: `Scholarship`, `Bank`, `Internship`, `Education`, `Other`
  - `certificateId`: `@unique`, Official identifier (`NX-BON-2026-XXXXX`)
  - `generatedAt`: PDF generation timestamp
  - `documentUrl`: Static PDF storage path
  - `verificationToken`: `@unique`, Lookup token
- **`Document`**:
  - `id`: UUID Primary Key
  - `ownerId`: Foreign Key &rarr; `Student.id`
  - `documentType`: `BONAFIDE`
  - `documentNumber`: `@unique`, Matching Certificate ID
  - `fileUrl`: PDF URL
  - `verificationToken`: `@unique`, Cryptographic registry token
  - `issuedBy`: Foreign Key &rarr; `User.id`
  - `issuedAt`: Issue date
  - `expiresAt`: Validity expiration date
  - `status`: `VALID`, `REVOKED`, `EXPIRED`

---

### E. Intelligence & Audit Tables

#### `AuditLog`
- `id`: UUID Primary Key
- `actorId`: Foreign Key &rarr; `User.id` (Nullable)
- `action`: Mutation name (`REQUEST_CREATED`, `GATE_PASS_APPROVED`, `COMPLAINT_RESOLVED`, etc.)
- `entityType`: `REQUEST`, `GATE_PASS`, `BONAFIDE`, `LEAVE`, `NOTICE`
- `entityId`: Target record UUID
- `oldValues`: JSON snapshot before mutation
- `newValues`: JSON snapshot after mutation
- `ipAddress`: Client IP
- `userAgent`: Client User-Agent
- `createdAt`: Timestamp

#### `IssueAlert` (Section 44 Pattern Detection)
- `id`: UUID Primary Key
- `hostelBlockId`: Foreign Key &rarr; `HostelBlock.id`
- `category`: Clustered category (e.g. `Plumbing`)
- `complaintCount`: Detected count (&ge; 3)
- `windowDays`: Evaluation interval (default: 14)
- `status`: `ACTIVE`, `RESOLVED`, `DISMISSED`
- `detectedAt`: Cluster detection timestamp

---

## 3. Database Indexes Strategy

To guarantee sub-millisecond query performance, indexes are established on:
- `requests.status` (Dashboard filtering)
- `requests.assigned_to` (Technician work queue queries)
- `requests.requester_id` (Student request list)
- `requests.created_at` (Timeline sorting)
- `requests.due_at` (SLA breach calculation)
- `gate_passes.qr_token_hash` & `gate_passes.pass_pin` (Main gate instant verification)
- `students.roll_number` (Kiosk & auth lookups)
- `documents.document_number` (Public verification lookups)
- `audit_logs.action` & `audit_logs.created_at` (Audit log inspection)
