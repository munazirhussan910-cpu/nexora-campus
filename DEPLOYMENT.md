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
   npx prisma migrate deploy
   npm run prisma:seed
   ```

---

## 3. Production Build & Execution

### Backend
```bash
cd backend
npm install --omit=dev
npx prisma generate
npm run build
npm start # Launches dist/server.js on PORT (default: 5001)
```

### Frontend
```bash
cd frontend
npm install --omit=dev
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
