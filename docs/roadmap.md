# Task Manager — Learning Roadmap

**Sept 2026 → Jan 2027 · ~22 weeks**
Personal project. Dual goal: DevOps depth and backend depth, using one app that grows.

> Living document. Update the status log as phases land.

---

## 0. The organising principle

Features are not distractions from the DevOps work — they are how you buy access to it. You cannot learn S3 without a reason to store a file. You cannot learn queues without a reason to do work asynchronously. You cannot learn horizontal scaling without stateful connections that break when you scale.

So the rule for what to build next is:

> **A feature earns its slot when it forces exactly one new infrastructure primitive.**

"Exactly one" matters. If a feature forces three new primitives at once, split it. If it forces none, it goes to the filler backlog — build it when you want a break, but it doesn't drive a milestone.

Two supporting rules:

1. **The delivery spine comes first.** By the end of month one, a tiny version of the app is live in production with CI and a real deploy. Everything after that is an increment on a running system, which is how you learn deployment — by doing it fifty times, not five.
2. **Never pre-build for a feature you haven't shipped.** Don't add a `workspaceId` column in September because teams are coming in November. The painful migration on live data *is* the November lesson. Skipping it means skipping the thing you're there to learn.

---

## 1. The feature → infrastructure map

| Feature | Backend concepts | Infrastructure unlocked | When |
|---|---|---|---|
| Auth + task CRUD | Prisma, migrations, JWT, DTOs, guards | Docker, compose, CI, EC2, Nginx, TLS | Sept |
| File attachments | Multipart, streaming, storage abstraction | S3, IAM least-privilege, instance roles, secrets management, bucket CORS + lifecycle | Oct |
| Thumbnails + due-date emails | Async job design, idempotency, retries | Redis, BullMQ, worker as a second deployable service, graceful shutdown, DLQ | Late Oct |
| Team sharing | Multi-tenancy, RBAC, N+1 queries | Live-data migrations, staging environment, backup/restore, Terraform | Nov |
| Realtime notifications | WebSocket auth, rooms, connection state | Nginx upgrade headers, horizontal scaling, Redis pub/sub adapter, load balancer, zero-downtime deploys | Dec |
| Search + activity feed | Indexes, pagination, full-text search | Metrics, dashboards, alerting, slow query logs, log aggregation, load testing | Jan |

Read that table top to bottom. Each row is only possible because the row above it exists.

---

## 2. Month by month

### September — the spine

**Ship:** register, login, task CRUD, board UI. Nothing else.

**Build order:**

1. Repo scaffold, `.env.example`, branch protection, README
2. NestJS + Prisma + Postgres in Docker locally, first migration
3. Auth module (JWT access + refresh), tasks module, `/health` with a DB probe
4. React + Vite board UI against the real API
5. Multi-stage Dockerfiles, `docker-compose.yml` for the full local stack
6. GitHub Actions: lint, test, build on PR; image push to GHCR on merge
7. EC2 instance, Docker, Nginx reverse proxy, TLS via certbot, real domain
8. First deploy **done by hand and written down step by step** — those notes become the deploy script
9. Second deploy, scripted. Then a third. Then roll back on purpose.

**Done when:** you ship a one-line copy change by merging a PR, and it's live in under five minutes without you touching the server.

This month is deliberately front-loaded. It's the heaviest month, and everything afterwards is easier because of it.

---

### October — attachments, and the AWS surface

**Ship:** upload files to a task, download them, delete them.

**Backend:** multipart handling, file type and size validation, a `StorageService` interface with a local-disk implementation and an S3 implementation. Presigned URLs so uploads and downloads bypass your API entirely — this is the interesting part, and it's also a real architectural pattern.

**Infrastructure — this is the meat:**

- S3 bucket, private, with a CORS policy that permits browser uploads from your domain only
- IAM policy scoped to that one bucket and those specific actions. Read it line by line and understand every field.
- **Instance role vs. access keys.** Start with access keys in env vars, get it working, then migrate to an EC2 instance role and delete the keys. Doing it in that order teaches you why instance roles exist.
- Secrets: GitHub Actions secrets for CI, SSM Parameter Store or a `.env` on the server with locked permissions for runtime. Write down where each secret lives.
- Bucket lifecycle rule to expire orphaned uploads

**Second half of October — background jobs**

Trigger feature: generate thumbnails for image attachments, and send an email when a task is due tomorrow.

- Redis container in compose
- BullMQ producer in the API, a **separate worker process** consuming it
- The worker is a second deployable service — your Dockerfile, compose file, CI matrix, and deploy script all have to grow to handle two services. This is the point.
- Graceful shutdown: the worker must finish its current job on SIGTERM before exiting, or your deploys will silently drop work
- Retries with backoff, and a dead-letter queue for jobs that never succeed

**Done when:** you deploy an API change and a worker change independently, and neither drops a job.

---

### November — team sharing, and the consequences of real data

**Ship:** workspaces, invite a member, shared task lists, role-based permissions.

**Backend:** `Workspace`, `Membership`, and a role enum. Every task query now filters by workspace membership. You will write an N+1 query here and it will be slow — find it with Prisma query logging and fix it.

**Infrastructure — the migration is the lesson:**

Adding `workspaceId` to a table with live rows means backfilling. You cannot do it in one step without downtime or data loss. The correct sequence is:

1. Add the column nullable, deploy
2. Backfill existing tasks into a personal workspace per user, deploy
3. Make the column required, deploy

Three deploys for one feature. That's the expand-migrate-contract pattern and it's one of the most useful things you'll learn all year.

Which forces the rest:

- **A staging environment.** You need somewhere to rehearse this. That means a second identical server — which is precisely when Terraform stops being theoretical.
- **Terraform:** VPC, security groups, EC2, Elastic IP, DNS. Remote state in S3 with DynamoDB locking. Two environments from one module with different variables.
- **Backups.** Automated `pg_dump` to S3 on a schedule, and a restore that you actually test. Untested backups are decorations.

**Done when:** you can `terraform destroy` staging, rebuild it, restore last night's backup into it, and rehearse the migration there before touching production.

---

### December — realtime, and why scaling breaks things

**Ship:** live task updates and notifications across workspace members.

**Backend:** Socket.IO gateway, JWT auth on the socket handshake, one room per workspace, events on task create/update/delete.

**Infrastructure — the breakage is the curriculum:**

Run two API containers. Realtime immediately breaks, because a user connected to container A never receives an event emitted from container B. Fixing that teaches you:

- Nginx `Upgrade` and `Connection` headers for WebSocket proxying
- Nginx upstream with two backends, or an ALB with target groups
- Sticky sessions, and why they're a workaround rather than a fix
- The Redis pub/sub adapter — the actual fix, which makes your app instances stateless
- Zero-downtime deploys, which are now genuinely hard because you have live connections to drain

**Done when:** you deploy while connected in two browser tabs and neither drops a message.

---

### January — seeing inside the system

**Ship:** search across tasks and attachments, plus a workspace activity feed.

**Backend:** proper indexes, cursor pagination, Postgres full-text search with a GIN index. Measure before and after — `EXPLAIN ANALYZE` on your slow queries.

**Infrastructure:**

- Prometheus + Grafana, or a hosted equivalent. Metrics: request rate, error rate, p95 latency, queue depth, DB connection pool usage.
- Alerting on health check failure and on error rate — routed somewhere you'll actually see it
- Log aggregation so you stop reading logs over SSH
- Slow query logging enabled in Postgres
- Load testing with k6: find the point where it falls over, then find out why

**Drills, in the last week:**

- Restore the database from backup into staging
- Roll back a bad deploy under time pressure
- Kill a container in production and watch what happens
- Write the incident notes as if someone else needed them

**Done when:** you can answer "what's slow, and why" from a dashboard rather than a guess.

---

## 3. Filler backlog

Real features, no new infrastructure. Build these when you want a low-stakes week, or when the app feels thin. They don't drive milestones.

Subtasks · recurring tasks · tags and labels · keyboard shortcuts · dark mode · task templates · CSV export · drag-and-drop reordering · comments (unless you route them through the queue, in which case they graduate)

---

## 4. Prisma schema v1

September only. Deliberately missing everything that comes later.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid()) @db.Uuid
  email        String   @unique
  passwordHash String
  name         String?
  tasks        Task[]
  refreshTokens RefreshToken[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model RefreshToken {
  id        String    @id @default(uuid()) @db.Uuid
  tokenHash String    @unique
  userId    String    @db.Uuid
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime  @default(now())

  @@index([userId])
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
}

model Task {
  id          String       @id @default(uuid()) @db.Uuid
  title       String
  description String?
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  dueAt       DateTime?
  ownerId     String       @db.Uuid
  owner       User         @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([ownerId, status])
  @@index([ownerId, dueAt])
}
```

**Why these choices:**

- **UUIDs, not autoincrement.** Sequential integers leak row counts, and they collide when you merge data between environments. Changing primary key types later is genuinely awful. This is one of the few things worth getting right up front.
- **`ownerId`, not `workspaceId`.** Teams arrive in November as a real migration. That's intentional.
- **Refresh tokens stored hashed.** You need revocation, and a token you can't revoke is a liability. Storing the hash rather than the token means a database leak doesn't hand over live sessions.
- **Postgres enums via Prisma.** Cleaner than strings, but changing an enum value requires a migration. Mildly annoying, and a decent early lesson in schema evolution.

**Migration commands — know the difference:**

- `prisma migrate dev` — local only. Generates migration files. Can reset your database.
- `prisma migrate deploy` — CI and production. Applies pending migrations, never resets, never generates.

Running `migrate dev` against production would be a memorable and entirely avoidable disaster. Put `migrate deploy` in your deploy script as an explicit step before the app starts.

---

## 5. Per-milestone habit

Every increment ends with:

1. **Something shipped** — merged and live
2. **`docs/system-overview.md` updated** — one more piece moves from planned to real
3. **A short note** — what you built, what broke, what you'd do differently

Item 3 is where the learning consolidates. Match the format of your Milestone 1 document.

---

## 6. Status log

- **2026-08-29** — Roadmap drafted. Milestone 1 complete (foundations). Prisma chosen over TypeORM. Nothing built yet.
