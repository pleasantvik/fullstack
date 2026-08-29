# Milestone 1 — September: the delivery spine

**Feature shipped:** register, login, task CRUD, board UI
**Infrastructure unlocked:** Docker, compose, CI, EC2, Nginx, TLS
**Done when:** a one-line copy change goes from PR to live production in under five minutes, without touching the server

---

## Why this shape

This month is deliberately thin on product and heavy on infrastructure. Only auth and task CRUD ship, but they ship *all the way* — real domain, HTTPS, automated pipeline.

It is the hardest and least satisfying month. Everything afterwards is an increment on a running system, which is the only way deployment becomes muscle memory rather than something looked up each time.

---

## Increments

### 1.1 — Repo scaffold
pnpm workspaces, folder structure, `.env.example`, `.gitignore` (verify `.env` is excluded *before* the first commit), README a stranger could follow, branch protection on `main`.

*Concept focus:* why a monorepo here; what branch protection buys a solo developer.

### 1.2 — Database and Prisma
Postgres in Docker locally. Prisma schema v1 — `User`, `RefreshToken`, `Task`, two enums. First migration. Prisma Studio to inspect.

*Concept focus:* migrations as versioned, committed artifacts. `migrate dev` vs `migrate deploy`.

### 1.3 — NestJS scaffold and config
App module, config module with schema-validated env vars, global validation pipe, Pino structured logging with request IDs.

*Concept focus:* fail-fast config. A missing `DATABASE_URL` should crash at boot with a clear message, not throw a null error on the first request at 2am.

### 1.4 — Auth module
Register, login, JWT access tokens, refresh token rotation with hashed storage, guards, `/auth/me`.

*Concept focus:* why refresh tokens are stored hashed, what rotation prevents, where a guard sits in the request lifecycle.

### 1.5 — Tasks module and health endpoint
CRUD with DTOs and class-validator, ownership enforcement, filtering by status / priority / search / overdue. `/health` with a real database probe, built now rather than later.

*Concept focus:* the health endpoint is load-bearing — Docker healthchecks, Nginx, and all future monitoring hang off it.

### 1.6 — Frontend
Vite scaffold, design tokens from `docs/design/ui-spec.md`, routing, auth pages, board view, task modal, TanStack Query wiring.

*Concept focus:* where the auth token lives and why; optimistic updates and rollback on failure.

### 1.7 — Containerise
Multi-stage Dockerfile for api (build → prune → slim runtime, non-root user). Multi-stage for web (build → static, served by Nginx). `.dockerignore` for both. `docker-compose.yml` with healthchecks and `depends_on` conditions.

*Concept focus:* image layers and cache invalidation, why non-root matters, why the build stage is discarded.

### 1.8 — CI
GitHub Actions on PR: install, lint, type-check, test, build. On merge to main: build and push tagged images to GHCR. Required status checks on the protected branch.

*Concept focus:* the deploy artifact is an image, not a git pull. Tagging strategy.

### 1.9 — Server and Nginx
EC2 instance, security groups, Docker installed, Nginx reverse proxy, TLS via certbot, DNS pointed at an Elastic IP.

**The first deploy is done by hand, step by step, with every command written down.** Those notes become `docs/runbook.md`, then the deploy script.

*Concept focus:* what a reverse proxy actually does; why TLS terminates at Nginx.

### 1.10 — Automated deploy and first rollback
Deploy workflow: pull image, run `migrate deploy`, restart, verify `/health`. Deploy three more times. Then roll back on purpose and confirm it works.

*Concept focus:* a rollback tested before it's needed is the only kind that counts.

---

## UI scope this month

Login, Register, Board (three status columns), Task detail modal, empty and loading states. Design tokens established. Nothing else — see `docs/design/ui-spec.md`.

---

## Reflection

*Fill in at the end of the milestone.*

**What I built:**

**What broke, and why:**

**What I'd do differently:**

**What I still don't understand:**
