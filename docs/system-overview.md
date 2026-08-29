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
| Frontend | React + Vite UI | M1 | Planned |
| API | NestJS — auth, tasks, validation | M1 | Planned |
| Database | PostgreSQL | M1 | Planned |
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
