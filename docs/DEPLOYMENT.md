# Nexora Campus — Production & Local Deployment Guide

> **Reference Specification:** Infrastructure Topology, Provisioning & Deployment Runbook  
> **Platform Version:** 4.0.0 (BPUT Hackathon 2026)  
> **Target Topology:** Vercel (Frontend SSR/Edge) + Render (Backend Express PaaS) + Managed PostgreSQL / SQLite

---

## Table of Contents

1. [Architecture & Deployment Topology](#1-architecture--deployment-topology)
2. [Prerequisites & System Requirements](#2-prerequisites--system-requirements)
3. [Local Zero-Setup Development Runbook](#3-local-zero-setup-development-runbook)
4. [Production Cloud Deployment](#4-production-cloud-deployment)
   - [4.1 Backend Deployment on Render](#41-backend-deployment-on-render)
   - [4.2 Frontend Deployment on Vercel](#42-frontend-deployment-on-vercel)
   - [4.3 Production Database Setup (PostgreSQL)](#43-production-database-setup-postgresql)
5. [Storage & Ephemeral Container Considerations](#5-storage--ephemeral-container-considerations)
6. [Monitoring, Health Checks & Diagnostics](#6-monitoring-health-checks--diagnostics)
7. [Troubleshooting & Common Deployment Gotchas](#7-troubleshooting--common-deployment-gotchas)

---

## 1. Architecture & Deployment Topology

```mermaid\nflowchart LR
    subgraph VercelEdge [\"Vercel Edge Network\"]\n        CDN[\"Vercel Global CDN\"]\n        FRONTEND[\"Next.js 14 App Router<br/>(nexora-campus-frontend)\"]\n    end

    subgraph RenderCloud [\"Render Cloud Services\"]\n        BACKEND[\"Express.js API Engine<br/>(nexora-campus-backend)\"]\n        EPHEMERAL_DISK[\"/tmp/uploads Cache\"]\n    end

    subgraph DatabaseTier [\"Cloud Database Tier\"]\n        POSTGRES[\"Managed PostgreSQL<br/>(Neon / Supabase / AWS RDS)\"]\n    end

    CLIENT[\"Client Browser / Mobile\"] --> CDN\n    CDN --> FRONTEND\n    FRONTEND -->|REST API over HTTPS| BACKEND\n    BACKEND --> EPHEMERAL_DISK\n    BACKEND -->|SSL Query Pool (Prisma 5.22)| POSTGRES\n```

The platform is designed to decouple presentation from business logic:
- **Frontend Tier**: Next.js 14 App Router deployed to Vercel's global edge network for fast server-side rendering (SSR), static generation, and edge asset caching.
- **Backend Tier**: Node.js/Express service deployed as a containerized web service on Render (or Railway/AWS ECS).
- **Persistence Tier**: Prisma ORM 5.22 connecting to local SQLite (`nexora.db`) in development, and managed PostgreSQL with SSL in production.

---

## 2. Prerequisites & System Requirements

| Requirement | Local Development | Production Environment |
|---|---|---|
| **Node.js** | `v20.x` or `v22.x` (LTS recommended) | Node.js `20.x` / `22.x` runtime |
| **npm** | `v10.x` or higher | npm `v10.x` |
| **Database** | SQLite (zero-setup, included) | PostgreSQL `v15+` (Neon, Supabase) |
| **Memory** | 2 GB RAM minimum | 512 MB (free tier) to 2 GB (standard) |
| **Disk Storage** | 500 MB free space | 1 GB ephemeral / persistent disk |

---

## 3. Local Zero-Setup Development Runbook

Nexora Campus is engineered for **instant, zero-friction local setup** using an embedded SQLite database. No external database server installation (PostgreSQL/MySQL/Docker) is required to run the full application locally.

### Step 1: Clone the Repository
```bash
git clone https://github.com/munazirhussan910-cpu/nexora-campus.git
cd nexora-campus
```

### Step 2: Configure Environment Variables
Copy the provided example files:

```bash
# Backend environment configuration
cp backend/.env.example backend/.env

# Frontend environment configuration
cp frontend/.env.example frontend/.env.local
```

### Step 3: Install Dependencies & Setup Database
Run the master setup script from the root directory:

```bash
# Installs backend & frontend dependencies, runs Prisma push, and seeds demo personas
npm run setup
```

*Alternatively, execute the commands individually:*
```bash
npm run install:all
npm run db:setup
```

### Step 4: Boot Development Servers
```bash
npm run dev
```

`concurrently` boots both services:
- **Backend API**: Listening at [http://localhost:5001](http://localhost:5001)
- **Frontend Portal**: Running at [http://localhost:3000](http://localhost:3000)

### Step 5: Sign In with Demo Accounts
Open [http://localhost:3000/login](http://localhost:3000/login) and use any pre-seeded persona with default password **`Password123!`**:
- Student: `aryan@nexora.edu`
- Maintenance Staff: `ramesh@nexora.edu`
- Hostel Warden: `warden.b@nexora.edu`
- Gate Security: `security.gate1@nexora.edu`
- Academic Officer: `academic@nexora.edu`
- Faculty Member: `faculty@nexora.edu`
- Administrator: `admin@nexora.edu`

---

## 4. Production Cloud Deployment

### 4.1 Backend Deployment on Render

The repository includes a ready-to-deploy Infrastructure-as-Code specification in `render.yaml`:

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

#### Render Web Service Manual Settings:
- **Environment**: Node
- **Root Directory**: `backend`
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm start` (or `node dist/server.js`)
- **Required Production Environment Variables**:
  - `NODE_ENV`: `production`
  - `PORT`: `5001` (Render automatically overrides or assigns port)
  - `DATABASE_URL`: `postgresql://[user]:[password]@[neon-hostname]/[dbname]?sslmode=require`
  - `JWT_SECRET`: High-entropy 32+ character random secret
  - `APP_URL`: `https://nexora-campus-backend.onrender.com`
  - `FRONTEND_URL`: `https://nexora-campus-frontend.vercel.app` (Required for CORS credentials)
  - `STORAGE_DIR`: `/tmp/uploads`
  - `GEMINI_API_KEY`: *(Optional)* Google Gemini API key for Copilot generative reasoning

---

### 4.2 Frontend Deployment on Vercel

1. Import the repository into the **Vercel Dashboard**.
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Next.js** (detected automatically).
4. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL`: The public URL of your Render backend API with `/api` path (e.g. `https://nexora-campus-backend.onrender.com/api`).
5. Click **Deploy**. Vercel will build all 65 static and dynamic pages.

---

### 4.3 Production Database Setup (PostgreSQL)

When switching from SQLite to PostgreSQL in production:
1. Update `backend/prisma/schema.prisma` datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Apply migrations to your cloud PostgreSQL instance:
   ```bash
   npx prisma db push --schema=backend/prisma/schema.prisma
   ```
3. Seed standard campus records and demo personas:
   ```bash
   npm run prisma:seed --workspace=backend
   ```

---

## 5. Storage & Ephemeral Container Considerations

### 5.1 Local vs. Production Storage
- **Development**: Files are saved to `backend/uploads/` (`/uploads/avatars` and `/uploads/*.pdf`).
- **Production (Render Free Tier)**: Container storage is ephemeral; files saved to `/tmp/uploads` are cleared when containers restart or redeploy.

### 5.2 Dual Persistence Architecture for Profile Avatars
To ensure student and staff avatars survive ephemeral restarts without an external S3 bucket:
1. `StorageService` writes the file to the local disk cache for fast static serving.
2. `StorageService` concurrently persists the base64 Data URL directly into the `User.profilePhotoUrl` database column. Even if the container filesystem resets, the avatar continues to render from the database.

### 5.3 Long-Term Enterprise Recommendation
For university deployments with over 10,000 students, connect an S3-compatible object store (AWS S3, Cloudflare R2, Google Cloud Storage) by configuring a cloud storage adapter in `StorageService`.

---

## 6. Monitoring, Health Checks & Diagnostics

### 6.1 System Health Endpoint
```http
GET /api/health
```
**Response (HTTP 200):**
```json
{
  "status": "UP",
  "platform": "Nexora Campus Operations Engine",
  "timestamp": "2026-10-09T14:30:00.000Z"
}
```

### 6.2 Administrative Command Telemetry
Administrators inspect live operational metrics via:
```http
GET /api/admin/dashboard
```
Returns active complaint volume, open task counts, SLA compliance percentage, active gate pass counts, and staff workload distribution.

---

## 7. Troubleshooting & Common Deployment Gotchas

### Issue 1: CORS Error / Network Failure on Login
- **Symptom**: Frontend shows "Network error" or browser console displays CORS blocked origin.
- **Root Cause**: Backend `FRONTEND_URL` does not match the exact Vercel deployment URL.
- **Fix**: Update `FRONTEND_URL` in the Render environment settings to match your Vercel domain (e.g. `https://nexora-campus-frontend.vercel.app`) without trailing slashes.

### Issue 2: Gate Pass Camera Scanner Blocked
- **Symptom**: Sentry webcam QR scanner displays "Camera permission denied".
- **Root Cause**: Web browsers block camera access (`getUserMedia`) on unencrypted HTTP connections.
- **Fix**: Access the sentry terminal over secure HTTPS (`https://...`), or utilize the offline 4-digit PIN keypad fallback.

### Issue 3: Copilot Falls Back to Local Responses
- **Symptom**: Copilot responses use deterministic templates instead of generative Gemini output.
- **Root Cause**: `GEMINI_API_KEY` is not configured in backend environment variables or API quota is exceeded.
- **Fix**: Add a valid Google Gemini API key to `backend/.env`. Note that the platform's local heuristic fallback continues to operate fully even without a key.
