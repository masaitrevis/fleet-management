# Deployment Guide — Fleet Management SaaS

## Overview

This guide covers deploying the **Fleet Management SaaS** built with **Next.js 15**, **React 19**, **TypeScript**, **Tailwind CSS**, **Prisma**, **PostgreSQL**, and **Socket.IO**.

---

## 1. Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 20+ | LTS recommended |
| npm | 10+ | Ships with Node 20 |
| PostgreSQL | 16+ | Required for Prisma |
| Redis | 7+ | Optional but recommended |
| Docker | 24+ | For containerized deployment |
| Docker Compose | 2.20+ | For multi-service orchestration |

---

## 2. Environment Variables Setup

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/fleet_management?schema=public` |
| `JWT_SECRET` | Secret for signing JWT tokens | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your public app URL | `http://localhost:3000` or `https://yourdomain.com` |
| `RESEND_API_KEY` | Resend API key for emails | `re_xxxxxxxx` |
| `EMAIL_FROM` | Default sender email | `noreply@yourdomain.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `SOCKET_IO_ADAPTER` | Redis adapter for Socket.IO | `redis` |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL | Same as `NEXTAUTH_URL` |

---

## 3. Local Development

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

### One-shot DB setup for fresh development:

```bash
# Ensure PostgreSQL is running locally
# Then:
npx prisma migrate dev --name init
npx prisma db seed
```

---

## 4. Database Setup

### Prisma workflow

```bash
# Generate the Prisma Client
npx prisma generate

# Run migrations (production-safe)
npx prisma migrate deploy

# (Optional) Seed the database
npx prisma db seed

# Open Prisma Studio
npx prisma studio
```

### Important Notes

- Always run `prisma migrate deploy` in production — **never** `prisma migrate dev`.
- `prisma generate` runs automatically via `postinstall` in `package.json`.
- Make sure your `DATABASE_URL` points to the correct database before running migrations.

---

## 5. Production Build (Local)

```bash
# Install dependencies
npm ci

# Build the Next.js app
npm run build

# Start the production server
npm start
```

This starts the server on `http://localhost:3000` using the production build.

---

## 6. Docker Deployment

### Build and run with Docker Compose

```bash
# Build and start all services (app + PostgreSQL + Redis)
docker-compose up --build -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down

# Stop and remove volumes (full reset)
docker-compose down -v
```

### Docker Compose Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `app` | Built from `Dockerfile` | `3000` | Next.js app |
| `db` | `postgres:16-alpine` | `5432` | PostgreSQL database |
| `redis` | `redis:7-alpine` | `6379` | Redis cache & Socket.IO adapter |

### Running Migrations Inside Docker

```bash
# After the db container is healthy, run migrations
docker-compose exec app npx prisma migrate deploy

# Seed the database
docker-compose exec app npx prisma db seed
```

---

## 7. Render Deployment (Blueprint)

This project includes a `render.yaml` Blueprint for one-click deployment on [Render](https://render.com).

### Steps

1. **Push to GitHub** (or GitLab / Bitbucket).
2. In the Render dashboard, click **"New +"** → **"Blueprint"**.
3. Select your repository and branch.
4. Render reads `render.yaml` and provisions:
   - Web service (`fleet-management-saas`)
   - PostgreSQL database (`fleet-management-db`)
   - Redis instance (`fleet-management-redis`)
5. Set any additional environment variables in the Render dashboard.
6. Deploy!

### Render-Specific Notes

- The `DATABASE_URL` is auto-injected from the attached Postgres service.
- The `REDIS_URL` is auto-injected from the attached Redis service.
- `JWT_SECRET` is auto-generated on first deploy.
- You may need to manually run the first migration after the DB is live:
  ```bash
  # In Render's shell for the web service
  npx prisma migrate deploy
  ```

---

## 8. Vercel Deployment

> ⚠️ **Caveat:** Vercel's serverless functions are **stateless** and **short-lived**. This causes issues with **Socket.IO** because it requires persistent connections and sticky sessions.

### If you still want to deploy on Vercel:

1. Disable Socket.IO or use a separate WebSocket server (e.g., Railway, Fly.io, or a dedicated Node server).
2. Deploy the Next.js app:
   ```bash
   vercel --prod
   ```
3. Add these environment variables in the Vercel dashboard:
   - `DATABASE_URL` (use an external Postgres provider like Neon, Supabase, or Railway)
   - `JWT_SECRET`
   - `NEXTAUTH_URL` (set to your Vercel production URL)

### Recommended Architecture for Vercel

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Vercel    │     │  Socket.IO      │     │  PostgreSQL   │
│  (Next.js)  │────▶│  Server (Node)  │     │  (Neon/Supabase) │
│  (UI + API) │     │  (Railway/Fly)  │     │               │
└─────────────┘     └─────────────────┘     └──────────────┘
```

---

## 9. Environment Variable Checklist

Before deploying anywhere, verify you have:

- [ ] `DATABASE_URL` — valid PostgreSQL connection string
- [ ] `JWT_SECRET` — strong random string (32+ chars base64)
- [ ] `NEXTAUTH_URL` — exact public URL of the deployment
- [ ] `RESEND_API_KEY` — for email sending
- [ ] `EMAIL_FROM` — valid sender domain verified with Resend
- [ ] `REDIS_URL` — if using Redis (optional but recommended)
- [ ] `NEXT_PUBLIC_APP_URL` — if different from `NEXTAUTH_URL`

---

## 10. Post-Deployment Verification

### Health Check

Visit the health check endpoint:

```bash
curl https://yourdomain.com/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-07-19T00:00:00.000Z"
}
```

### Version API

```bash
curl https://yourdomain.com/api/version
```

Expected response:

```json
{
  "version": "0.1.0",
  "build": "2026.07.19",
  "environment": "production"
}
```

### Quick Smoke Test Checklist

- [ ] Homepage loads without errors
- [ ] Login / registration flows work
- [ ] Database migrations ran successfully
- [ ] Email sending works (test with a signup)
- [ ] Real-time features work (if Socket.IO server is deployed)
- [ ] API endpoints return valid data
- [ ] No 500 errors in logs

### Checking Logs

**Docker:**
```bash
docker-compose logs -f app
```

**Render:**
- Go to the web service dashboard → **Logs** tab.

**Vercel:**
- Go to the project dashboard → **Functions** tab → **Logs**.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `DATABASE_URL` connection refused | Ensure the database service is running and the URL is correct. |
| `prisma migrate deploy` fails | Check that the DB is accessible and the schema is committed. |
| Socket.IO not working | Verify Redis is running and `REDIS_URL` is set. |
| Docker image too large | Ensure multi-stage build is used; check `output: 'standalone'` in `next.config.js`. |
| Static assets 404 | Verify `.next/static` is copied in the Dockerfile. |

---

## File Reference

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage Docker build |
| `docker-compose.yml` | Local orchestration (app + DB + Redis) |
| `render.yaml` | Render Blueprint for one-click deploy |
| `.dockerignore` | Files excluded from Docker context |
| `DEPLOYMENT.md` | This guide |
| `next.config.js` | Next.js config (includes `output: 'standalone'`) |

---

*Happy deploying! 🚀*
