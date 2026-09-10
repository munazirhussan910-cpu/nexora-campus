# Contributing to Nexora Campus

Welcome to the team! This guide covers everything you need to know about our development workflow, coding standards, and best practices so you can hit the ground running with minimal friction.

---

## 🚀 Quick Setup

1. **Clone and Install Dependencies**:
   ```bash
   # From the project root
   npm run setup
   ```
   *(This installs backend and frontend packages, generates the Prisma client, runs migrations, and seeds demo data).*

2. **Verify Environment Files**:
   - Backend: Ensure `backend/.env` exists (copied from `backend/.env.example`).
   - Frontend: Ensure `frontend/.env.local` exists (copied from `frontend/.env.example`).

3. **Start Development Servers**:
   ```bash
   npm run dev
   ```
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5001](http://localhost:5001)

4. **Default Test Accounts**:
   - All pre-seeded accounts use password: **`Password123!`**
   - Quick-switch roles using the floating widget in the bottom-right corner of the web UI.

---

## 📁 Repository Structure

```text
Nexora3.0/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (21 models)
│   │   └── seed.ts             # Demo data seeder
│   ├── src/
│   │   ├── config/             # Environment & Prisma client setup
│   │   ├── middleware/         # Auth, RBAC, error handling
│   │   ├── routes/             # Express route controllers
│   │   ├── services/           # Core business logic & state machines
│   │   └── tests/              # Jest integration test suites
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/                    # Next.js 14 App Router (pages & layouts)
│   │   ├── (auth)/             # Login & auth routes
│   │   ├── student/            # Student portal
│   │   ├── staff/              # Staff / technician work orders
│   │   ├── warden/             # Warden approvals & oversight
│   │   ├── security/           # Gate sentry verification
│   │   ├── admin/              # Command center & operations
│   │   ├── kiosk/              # Campus touch terminal
│   │   ├── lite/               # Ultra-low bandwidth text portal
│   │   └── verify/[id]/        # Public certificate verification
│   ├── components/             # Reusable UI components & layouts
│   ├── lib/                    # API client, auth context, utilities
│   ├── package.json
│   └── tailwind.config.ts
├── docs/                       # Complete architectural and API documentation
│   ├── API.md                  # REST API reference
│   ├── ARCHITECTURE.md         # System design & FSM specification
│   ├── DATABASE.md             # Prisma schema & ER relationships
│   ├── DEMO.md                 # 3-minute hackathon evaluation script
│   ├── DEPLOYMENT.md           # Production deployment guide
│   ├── ONBOARDING_GUIDE.md     # In-depth architectural onboarding
│   └── screenshots/            # UI screenshots and visual assets
├── CONTRIBUTING.md             # Developer workflow & standards (this file)
├── README.md                   # Project overview & quick start
└── package.json                # Monorepo workspace orchestrator
```

---

## 🌿 Git Workflow & Branching

- **Main Branch**: `main` (always deployable, protected).
- **Branch Naming Conventions**:
  - Features: `feature/<module>-<short-description>` (e.g. `feature/complaints-image-upload`)
  - Fixes: `fix/<issue-description>` (e.g. `fix/qr-scanner-camera-fallback`)
  - Docs: `docs/<description>` (e.g. `docs/update-api-reference`)
- **Commit Message Format**:
  - `feat: add push notifications for complaint updates`
  - `fix: correct curfew calculation on gate return`
  - `docs: update setup steps in onboarding guide`
  - `refactor: extract request transition validation logic`

---

## 🛠️ Development Guidelines

### Backend Rules
1. **Always Enforce Request State Machine**: All status transitions must go through `RequestService.isValidTransition()`. Never bypass the FSM by updating request status directly in routes.
2. **Deterministic Keyword Routing**: Keep technician keyword matching deterministic (regex-based in `ComplaintService`) to ensure zero-latency routing.
3. **Role-Based Access Control**: Guard all protected endpoints with `authenticate` and `authorizeRole(...)` middleware.
4. **Validation**: Use Zod schemas in middleware for all request body validation.

### Frontend Rules
1. **App Router Conventions**: Place pages inside their respective role directories under `frontend/app/`.
2. **Styling**: Use Tailwind CSS with consistent color tokens (Dark Academic / Modern Minimalist palette).
3. **Authentication**: Use `useAuth()` from `@/lib/auth-context` to access the current user session and role.
4. **API Requests**: Always use the configured API client in `@/lib/api.ts` which handles cookies and bearer tokens automatically.

---

## 🗄️ Database Changes (Prisma)

When modifying the database schema:
1. Update `backend/prisma/schema.prisma`.
2. Push the schema to local database:
   ```bash
   npm run db:push
   ```
3. Update `backend/prisma/seed.ts` if demo personas or initial records need adjustments.
4. Re-seed to test:
   ```bash
   npm run db:seed
   ```

---

## 🧪 Testing & Quality Checks

Before submitting a Pull Request:
```bash
# 1. Run backend integration tests (24 test suites)
npm run test

# 2. Verify production build succeeds without TypeScript errors
npm run build
```

---

## 📚 Where to Learn More
- [Onboarding Guide](docs/ONBOARDING_GUIDE.md): Deep-dive into subsystems and architecture.
- [Architecture & FSM](docs/ARCHITECTURE.md): Finite State Machine state transition diagrams.
- [API Reference](docs/API.md): Full list of backend endpoints and payloads.
- [Database Models](docs/DATABASE.md): Detailed relational schema and indexes.
