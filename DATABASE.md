# NEXORA CAMPUS — DATABASE SCHEMA SPECIFICATION

The database schema is fully normalized and managed with **Prisma ORM**.

---

## Relational Architecture

```text
       Role <-----+               User
                  |                 | 1:1
RolePermission <--+      +----------+----------+
                  |      |                     |
              Permission Student              Staff
                         |                     |
                      Branch, Room             |
                         |                     |
                         v                     v
                    +-----------------------------+
                    |           Request           |
                    | (Engine Root: NX-XXXXX)     |
                    +-----------------------------+
                       |       |       |       |
            +----------+   +---+---+   |   +---+-----------+
            |              |       |   |   |               |
            v              v       v   v   v               v
        Complaint     GatePass   LeaveRequest   BonafideRequest
            |              |                           |
       RoutingRule     GateEvent                   Document
```

---

## Key Table Structures

### `requests` (Central Engine Entity)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | String (UUID) | Primary Key | Internal unique identifier |
| `requestNumber` | String | Unique, Indexed | Human-readable ticket number (`NX-10291`) |
| `requesterId` | String | FK &rarr; `User.id` | Student or staff who initiated ticket |
| `requestTypeId` | String | FK &rarr; `RequestType.id` | Ticket classification |
| `status` | String | Indexed | Current lifecycle status |
| `priority` | String | Indexed | `LOW`, `NORMAL`, `HIGH`, `URGENT` |
| `title` | String | Required | Concise summary |
| `description` | String | Required | Detailed description |
| `location` | String | Optional | Room / Wing identifier |
| `assignedTo` | String | FK &rarr; `User.id`, Indexed | Technician or officer handling request |
| `createdAt` | DateTime | Indexed, Default now | Submission timestamp |
| `dueAt` | DateTime | Indexed | Target SLA resolution deadline |
| `completedAt` | DateTime | Optional | Timestamp when resolved or closed |

### `request_status_history` (Audit Timeline)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | String (UUID) | Primary Key | Entry ID |
| `requestId` | String | FK &rarr; `Request.id` | Associated request |
| `oldStatus` | String | Nullable | Previous state |
| `newStatus` | String | Required | Updated state |
| `changedBy` | String | FK &rarr; `User.id` | Actor who performed the transition |
| `comment` | String | Optional | Operational transition note |
| `createdAt` | DateTime | Indexed | State mutation timestamp |

### `gate_passes` (Exit Authorization)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | String (UUID) | Primary Key | Pass identifier |
| `requestId` | String | Unique, FK &rarr; `Request.id` | Request engine linkage |
| `destination` | String | Required | Off-campus destination |
| `reason` | String | Required | Purpose of travel |
| `departureTime` | DateTime | Required | Scheduled departure |
| `expectedReturnTime`| DateTime | Required | Curfew deadline |
| `approvedBy` | String | FK &rarr; `User.id`, Nullable | Warden approver ID |
| `passPin` | String | Indexed | 4-digit numeric fallback PIN |
| `qrTokenHash` | String | Unique, Indexed | Signed HMAC token |
| `qrExpiresAt` | DateTime | Nullable | Token expiration deadline |
| `gateStatus` | String | Indexed | `PENDING_APPROVAL`, `APPROVED`, `DEPARTED`, `RETURNED` |

### `bonafide_requests` & `documents`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `certificateId` | String | Unique, Indexed | Official certificate ID (`NX-BON-2026-00231`) |
| `documentUrl` | String | Required | Path to server-generated PDF |
| `verificationToken` | String | Unique | Cryptographic lookup token |
| `status` | String | Required | `VALID`, `REVOKED`, `EXPIRED` |

### `audit_logs` (Tamper-Proof Audit Trail)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | String (UUID) | Primary Key | Entry identifier |
| `actorId` | String | FK &rarr; `User.id`, Nullable | Responsible user ID |
| `action` | String | Indexed | Mutation event name |
| `entityType` | String | Indexed | `REQUEST`, `GATE_PASS`, `BONAFIDE`, etc. |
| `entityId` | String | Required | Affected entity primary key |
| `oldValues` | String (JSON) | Nullable | Snapshot before mutation |
| `newValues` | String (JSON) | Nullable | Snapshot after mutation |
| `ipAddress` | String | Nullable | Client IP address |
| `createdAt` | DateTime | Indexed | Exact immutable timestamp |

---

## Performance & Indexing Strategy

Indexes are explicitly applied on:
- `requests.status`
- `requests.assigned_to`
- `requests.requester_id`
- `requests.created_at`
- `requests.due_at`
- `gate_passes.qr_token_hash`
- `gate_passes.pass_pin`
- `students.roll_number`
- `audit_logs.action`
- `audit_logs.created_at`
