CommunityOS

**Tagline**
The operating layer connecting communities to the services that keep them running.

## Overview

CommunityOS is a multi-community, event-driven platform that synchronizes Residents, Community Managers, Service Providers and Workers around essential services (water, gas, electricity, waste, maintenance, deliveries, and more).

This repository contains:

- `communityos-backend` — Node.js / Express backend (Prisma + PostgreSQL, Redis + BullMQ, Socket.IO).
- `communityos-frontend` — Vite + React frontend.

Key concepts
------------

- Multi-tenant: tenant isolation is enforced at the DB level (Prisma + Postgres).
- Event-driven: domain events (ORDER_CREATED, ORDER_ACCEPTED, etc.) are recorded in an append-only timeline and published to subscribers.
- Real-time: Socket.IO channels for updates (order:{id}, community:{id}, tenant:{id}).
- Designed for unstable networks and Kenyan payment contexts (M-PESA integration planned); MVP uses simulated payments if unavailable.

---

## Quick start — development (local)

Prerequisites:
- Node 18+
- PostgreSQL (local or a dev instance)
- Redis (local or dev instance)
- npm

### Backend

```bash
cd communityos-backend
cp .env.example .env          # fill DATABASE_URL, REDIS_URL, SUPABASE_*, JWT_SECRET, FRONTEND_URL
npm install
npx prisma generate
npm run migrate               # development migrations
npm run seed                  # optional seed
npm run dev                   # starts server at http://localhost:3000
```

Health: `GET http://localhost:3000/api/health`

### Frontend

```bash
cd communityos-frontend
cp .env.example .env          # set VITE_API_URL (default: http://localhost:3000)
npm install
npm run dev                   # open http://localhost:5173
```

### Docker Compose (dev demo)

A docker-compose file can be created to run Postgres + Redis + backend + frontend for demos. See `communityos-backend/docker-compose.yml` for a starting point.

## API docs

OpenAPI spec: `communityos-backend/openapi.yaml`

## Environment variables (important)

Backend (`communityos-backend/.env`)
- DATABASE_URL (postgres://...)
- REDIS_URL (redis://...)
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_KEY (optional)
- JWT_SECRET
- FRONTEND_URL (frontend origin)
- PORT (optional; default 3000)
- LOG_LEVEL (info/debug)

Frontend (`communityos-frontend/.env`)
- VITE_API_URL (e.g. https://api.communityos.example)

## Deployment notes

- Frontend: static app — deploy to Vercel (set project root to `communityos-frontend`, build command `npm run build`).
- Backend: deploy to Render (or another host that supports WebSockets and Node processes). Use env variables and managed Postgres/Redis.
- Use `prisma migrate deploy` on production databases (CI/CD or deployment hooks) — do not run `prisma migrate dev` in production.

## Security & operations

- Do not commit secrets to source.
- In production set `NODE_ENV=production`, use secure `JWT_SECRET`, and verify webhook signatures for external integrations.
- Enable an error tracking solution (Sentry or similar) and structured logs (pino).



## Contributing

Contributions are welcome — open an issue or a PR describing the change. A CONTRIBUTING.md will be added in a follow-up.



MIT
