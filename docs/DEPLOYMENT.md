# NEXORA CAMPUS — DEPLOYMENT & PRODUCTION GUIDE

## 1. Environment Configuration

Copy `.env.example` in `backend/` and configure:

```env
DATABASE_URL="file:./nexora.db" # Or postgresql://user:pass@host:5432/nexora
PORT=5001
JWT_SECRET="generate-a-cryptographically-secure-random-secret-here"
APP_URL="https://api.nexoracampus.edu"
FRONTEND_URL="https://nexoracampus.edu"
STORAGE_DIR="./uploads"
NODE_ENV="production"
```

---

## 2. Transitioning to Production PostgreSQL

While SQLite is configured by default for zero-dependency local execution within sandboxed environments without SysV IPC requirements, the Prisma schema is 100% PostgreSQL compliant.

To switch to PostgreSQL:
1. In `backend/prisma/schema.prisma`, update the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/nexora_campus?schema=public"
   ```
3. Run migrations and seed:
   ```bash
   npx prisma db push
   npm run prisma:seed
   ```

---

## 3. Production Build & Execution (Self-Hosted / VPS)

### Backend
```bash
cd backend
npm install
npx prisma generate
npm run build
npm start # Launches dist/server.js on PORT (default: 5001)
```

### Frontend
```bash
cd frontend
npm install
npm run build
npm start # Launches Next.js production server on PORT (default: 3000)
```

---

## 4. Reverse Proxy & HTTPS (Nginx Example)

```nginx
server {
    listen 80;
    server_name nexoracampus.edu;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name nexoracampus.edu;

    ssl_certificate /etc/letsencrypt/live/nexoracampus.edu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nexoracampus.edu/privkey.pem;

    # Frontend Next.js Application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend Express REST API
    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static Uploads & PDFs
    location /uploads/ {
        proxy_pass http://localhost:5001/uploads/;
        proxy_set_header Host $host;
    }
}
```

---

## 5. Free Cloud Deployment (Neon + Render + Vercel)

### Architecture
- **Database**: Neon Serverless PostgreSQL (0.5 GB Free Tier)
- **Backend API**: Render Free Web Service (Node.js/Express)
- **Frontend**: Vercel Hobby Tier (Next.js 14 App Router)
- **Keep-Alive**: Cron-job.org free pinging service

### Step 1: Database Setup (Neon)
1. Sign up at [neon.tech](https://neon.tech) and create project `nexora-campus`.
2. Copy the pooled connection string (`?sslmode=require`).
3. In `backend/prisma/schema.prisma`, change datasource `provider = "sqlite"` to `provider = "postgresql"`.
4. Run locally to push schema & seed:
   ```bash
   export DATABASE_URL="<your-neon-pooled-connection-string>"
   cd backend
   npx prisma generate
   npx prisma db push
   npm run prisma:seed
   ```

### Step 2: Backend Deployment (Render)
1. Connect GitHub repo to Render as a **Web Service**.
2. Root Directory: `backend`
3. Build Command: `npm install && npx prisma generate && npm run build`
4. Start Command: `npm start`
5. Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5001`
   - `DATABASE_URL`: `<neon-pooled-url>`
   - `JWT_SECRET`: `<random-32-char-string>`
   - `APP_URL`: `https://<render-service-name>.onrender.com`
   - `FRONTEND_URL`: `https://<vercel-project-name>.vercel.app`
   - `STORAGE_DIR`: `/tmp/uploads`

### Step 3: Frontend Deployment (Vercel)
1. Import repository on Vercel.
2. Root Directory: `frontend`
3. Framework Preset: `Next.js`
4. Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://<render-service-name>.onrender.com/api`
5. Click **Deploy**.

### Step 4: Health Check & Keep-Alive
- Endpoint: `https://<render-service-name>.onrender.com/api/health`
- Schedule a GET ping every 10–14 minutes on [cron-job.org](https://cron-job.org).
