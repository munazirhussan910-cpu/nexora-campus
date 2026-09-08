# Nexora Campus - Implementation Checklist

- [x] Phase 1: Planning, Discovery & Project Setup
  - [x] Inspect existing connected directory and sandbox environment
  - [x] Verify Node, npm, database constraints (SQLite for local sandbox, full PostgreSQL compatibility)
  - [x] Initialize project monorepo structure (backend + frontend)
  - [x] Configure TypeScript, Tailwind CSS, dependencies, scripts

- [x] Phase 2: Database Modeling & Prisma Schema
  - [x] Define normalized Prisma schema with all required tables (users, roles, permissions, role_permissions, branches, hostel_blocks, rooms, students, staff, requests, request_types, request_status_history, request_assignments, complaints, routing_rules, gate_passes, gate_events, leave_requests, bonafide_requests, documents, notices, notice_targets, notice_reads, notifications, audit_logs, integration_events, sla_rules, issue_alerts)
  - [x] Add indexes, constraints, and relationships
  - [x] Generate Prisma client and run migrations
  - [x] Build comprehensive database seed script with demo personas (Aryan, Ramesh, Warden, Security, Chief Admin) and rich realistic dataset

- [x] Phase 3: Backend Core Architecture & Request Engine
  - [x] Set up Express app with TypeScript, security middleware (cors, helmet, cookie-parser, rate-limiting, error handler)
  - [x] Implement Authentication module (login, me, logout, password hashing with bcrypt, JWT in HTTP-only cookies)
  - [x] Implement RBAC middleware with fine-grained permission checks
  - [x] Implement Central Request Engine (request number generator NX-XXXXX, state transitions, status history, assignments, audit logger)
  - [x] Implement Complaint Module with deterministic keyword routing (e.g. tap/pipe/leak/water -> Plumbing, fan/light/switch -> Electrical)
  - [x] Implement Gate Pass Module with signed expiring QR tokens + numeric PIN fallback + gate_events recording
  - [x] Implement Bonafide Module with dynamic certificate ID generation, PDF generator, and public verification API
  - [x] Implement Leave Request Module with warden approval workflow
  - [x] Implement Targeted Notices Module (branch/year/hostel block targeting and read receipts)
  - [x] Implement Notification System (read/unread, badge count)
  - [x] Implement Admin Operations API (Command Center stats, SLA calculation and ageing, recurring issue detection, staff management, reassignment, audit logs)
  - [x] Implement Kiosk Mode API (lookup by roll number, kiosk requests)
  - [x] Implement Non-smartphone SMS/Webhook integration (`/api/integrations/sms/inbound`)

- [x] Phase 4: Frontend Development (Next.js App Router)
  - [x] Global UI design system: Dark Academic / Modern Minimalist theme, typography, responsive layouts
  - [x] Reusable UI components: Navbar, Sidebar, Topbar, StatCard, RequestCard, StatusBadge, PriorityBadge, Timeline, DataTable, Modal, ApprovalModal, ConfirmDialog, NotificationBell, QRCode display, SLAIndicator, SearchBar, FilterBar, EmptyState, LoadingState
  - [x] Auth & Session management + Persona Quick Switcher (dev/demo bar)
  - [x] Student portal: Dashboard, My Requests, Request Details with live timeline, New Complaint, Gate Pass (with dynamic QR & PIN), Bonafide request & download, Leave request, Notices, Notifications, Profile
  - [x] Staff portal: Dashboard, Task queue, Task detail, Accept/Start/Resolve actions with resolution notes, SLA indicators, Task history
  - [x] Warden portal: Dashboard, Gate pass approvals, Leave approvals, Hostel complaints, Student directory, Notices
  - [x] Security portal: Large touch-friendly interface, QR scan / token input, PIN verification, Depart/Return toggle, Gate activity log
  - [x] Admin Command Center: Cockpit dashboard with real-time operational metrics, Request management & reassignment, Approvals, Staff management, Student roster, Targeted Notice creator, Analytics charts & stats, Recurring Issue alert cards, Audit log viewer, System configuration
  - [x] Public Document Verification page (`/verify/[certificateId]`)
  - [x] Nexora Lite: High-performance text-first minimal interface (low bandwidth, 20-30KB footprint)
  - [x] Kiosk Mode interface (`/kiosk`)
  - [x] PWA manifest, service worker registration, responsive mobile/tablet/desktop layouts

- [x] Phase 5: Testing, Quality Assurance & Verification
  - [x] Unit & integration tests for Auth, RBAC, Request Engine, Routing, Gate Pass QR/PIN, Bonafide, Leave, Audit, Recurring Issues (24/24 passing)
  - [x] Type checks (`tsc`) across backend and frontend (0 errors)
  - [x] Frontend and Backend production builds (0 errors)
  - [x] End-to-end 3-minute demo flow verification (Aryan -> Ramesh -> Warden -> Security -> Bonafide verify -> Admin Command Center -> Nexora Lite)

- [x] Phase 6: Documentation & Handover
  - [x] README.md, ARCHITECTURE.md, API.md, DATABASE.md, DEPLOYMENT.md, DEMO.md
  - [x] Final project summary
