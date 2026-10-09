# Contributing to Nexora Campus

Thank you for your interest in contributing to **Nexora Campus**! This document provides guidelines and workflows for contributing to our centralized campus operations platform.

---

## 1. Code of Conduct

We are committed to providing a welcoming, inclusive, and professional environment. All contributors, maintainers, and community members are expected to:
- Treat all participants with respect and professional courtesy.
- Focus on constructive criticism, technical rigor, and code quality.
- Respect university data privacy standards (FERPA and institutional student data regulations).

---

## 2. Development Setup

Nexora Campus uses an npm workspace monorepo structure containing `backend` (Express.js/TypeScript) and `frontend` (Next.js 14 App Router).

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **npm**: `v10.x` or higher
- **Git**: `v2.x`

### Setup Instructions
1. Fork and clone the repository:
   ```bash
   git clone https://github.com/<your-username>/nexora-campus.git
   cd nexora-campus
   ```
2. Copy environment variable examples:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```
3. Run the automated zero-setup script:
   ```bash
   npm run setup
   ```
4. Start both frontend and backend concurrently:
   ```bash
   npm run dev
   ```

---

## 3. Architecture & Repository Standards

### Workspace Separation
- **`backend/`**: Express.js REST API with domain services, Prisma ORM, and Jest test suites.
- **`frontend/`**: Next.js 14 App Router, React 18, Tailwind CSS, and role-based route layouts (`app/student/`, `app/staff/`, `app/warden/`, `app/security/`, `app/academic/`, `app/faculty/`, `app/admin/`).
- **`docs/`**: Comprehensive technical architecture, copilot specifications, feature catalogs, security models, and deployment guides.

### Coding Standards
- **TypeScript**: Strict type definitions required. Avoid using `any` unless wrapping external untyped third-party libraries.
- **Schema Validation**: Every incoming backend payload must be validated with a strict Zod schema in `backend/src/middleware/validate.middleware.ts` or domain routes.
- **UI Components**: Use Tailwind utility classes and theme tokens (`bg-surface`, `bg-surface-secondary`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-primary`). Do not use inline hardcoded styles.
- **FSM Transitions**: Every workflow status change must respect domain validation rules. Never update a ticket or pass status without state checks.

---

## 4. Testing & Verification Checklist

Before submitting a pull request, ensure all verification steps pass locally:

1. **Frontend Type Check**:
   ```bash
   npx --prefix frontend tsc --noEmit
   ```
2. **Backend Type Check**:
   ```bash
   npx --prefix backend tsc --noEmit
   ```
3. **Frontend Production Build**:
   ```bash
   npm run build --workspace=frontend
   ```
4. **Backend Test Suites**:
   ```bash
   npm run test --workspace=backend
   ```

---

## 5. Security Guidelines

- **No Secrets in Commits**: Never stage or commit `.env`, `.env.local`, API keys, JWT secrets, or production credentials.
- **No Database Dumps in Git**: The `.gitignore` file excludes `*.db`, `*.db-journal`, and `nexora.db.backup*`. Verify `git status` before committing.
- **Magic Bytes for Uploads**: Any file upload handler must inspect raw binary magic bytes (`StorageService.detectMimeFromMagicBytes`) rather than trusting file extensions.
- **Human-in-the-Loop AI**: Any conversational AI feature (Nexora Copilot) that performs actions must render an Action Card for user confirmation rather than mutating the database autonomously.

---

## 6. Pull Request Process

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make granular, focused commits with conventional commit messages:
   - `feat(...)`: New feature or user capability
   - `fix(...)`: Bug fix or patch
   - `docs(...)`: Documentation updates
   - `test(...)`: Adding or refactoring tests
   - `refactor(...)`: Code restructuring without functional change
3. Push to your fork and submit a Pull Request to `main`.
4. Provide a clear PR description detailing:
   - What problem is solved.
   - What changed across frontend, backend, or documentation.
   - Verification steps taken.
