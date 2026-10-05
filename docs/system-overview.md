# System overview

> **Living document.** This describes the target architecture. Most of it doesn't exist yet — each piece is built at a specific milestone and this document is updated as things become real.

## Target architecture

```
Local machine (React + NestJS)
        │  git push
        ▼
      GitHub
        │  triggers
        ▼
CI/CD pipeline (lint, test, build)
        │  produces
        ▼
   Docker images (GHCR)
        │  deployed to
        ▼
  AWS / EC2
        │
        ▼
      Nginx (reverse proxy, TLS)
      ┌─┴─┐
      ▼   ▼
 Frontend  API ──► Redis ──► Worker
             │
             ▼
        PostgreSQL ──► S3
             │
             ▼
   Logs / metrics / health checks
```

## Layers

| Layer | Role | Built at | Status |
|---|---|---|---|
| Repository | pnpm workspace monorepo, protected `main` | M1 | **Real** |
| Frontend | React + Vite UI | M1 | Planned |
| API | NestJS — auth, tasks, validation | M1 | Planned |
| Database | PostgreSQL | M1 | **Real (local)** |
| Docker | Packaging for api, web, worker | M1 | Planned |
| CI/CD | GitHub Actions | M1 | Planned |
| EC2 | Production server | M1 | Planned |
| Nginx | Reverse proxy, TLS termination | M1 | Planned |
| Object storage | S3 for attachments | M2 | Planned |
| Queue | Redis + BullMQ | M2 | Planned |
| Worker | Second deployable service | M2 | Planned |
| Staging | Second environment | M3 | Planned |
| Terraform | Infrastructure as code | M3 | Planned |
| Backups | Scheduled pg_dump to S3 | M3 | Planned |
| Load balancing | Multiple API instances | M4 | Planned |
| Observability | Metrics, dashboards, alerting | M5 | Planned |

## Status log

- **2026-08-29** — Document created. Nothing deployed. Architecture is the reference shape.
- **2026-08-29** — Increment 1.1. Repository is real: pnpm workspace with `apps/api` and `apps/web` as members, pinned Node 22 and pnpm 11.24.0, pushed to GitHub with a ruleset on `main` requiring a pull request and blocking force-push and deletion. No application code, nothing deployed.
- **2026-09-12** — Increment 1.2a. Postgres is real locally: a `postgres:16` service declared in `docker-compose.yml`, credentials interpolated from `.env`, data in the named volume `task-manager-postgres-data`, and a `pg_isready` healthcheck so Compose reports ready-for-connections rather than merely running. Reachable on `localhost:5432` from inside the VM and from Windows via the Vagrant port forward. Nothing deployed — there is no production database, and no application code talks to this one yet.
- **2026-09-12** — Increment 1.2b. Schema v1 exists and is applied: `users`, `refresh_tokens` and `tasks`, two Postgres enum types, UUID primary keys and `ON DELETE CASCADE` on both foreign keys. The first migration is a committed artifact in `apps/api/prisma/migrations/`, and the database now carries a `_prisma_migrations` table recording that it ran. Prisma pinned to 7.x — see ADR 0003. Still no application code: nothing reads or writes these tables yet.
- **2026-10-05** — Increment 1.3 (a-d). The API is a running NestJS application: it boots, validates its environment before binding a port, holds one Prisma connection pool opened at startup and closed on SIGTERM, and logs structured JSON with a request id threaded through every line. It serves **no routes** - a request to `/` returns a 404 from Nest's exception layer. The `API` row below stays *Planned* deliberately: what that row describes is auth, tasks and validation, and none of those exist yet. What exists is the skeleton they will hang from.

