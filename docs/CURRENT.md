# Where we are

**Active milestone:** 1 — September, the delivery spine
**Active increment:** 1.7 — Containerise (a–e done; **1.7f next**)
**Schedule:** Milestone 1 runs into mid-October. The month names in the roadmap
are ordering, not deadlines — see the note at the top of `docs/roadmap.md`.
**Last updated:** 2026-10-18

## Start here next session

**On Windows:**

    cd ~/Desktop/task-manager/infra/vagrant
    vagrant up
    vagrant ssh

**Then inside the VM** — prompt must read `vagrant@task-manager-dev`:

    cd ~/task-manager

**Branch AFTER the previous PR is merged, from `origin/main`.** Twice in 1.6 a
branch was cut before its predecessor merged and had to be moved.

    git fetch && git switch -c feat/<increment> origin/main

Then:

    docker compose up -d postgres    # only the database - see below
    pnpm --filter api start:dev
    pnpm --filter web dev            # http://localhost:5173 only

`docker compose up -d` (no service name) now starts the containerised API too,
on port 3000 - the same port `start:dev` wants. Use it to run the API as it
will run in production; use `up -d postgres` when coding on the API.

**Restart Vite after any branch switch**, and **stop `vite preview` after
measuring** - it holds port 5173 and serves an old build that looks almost
right (it fooled us once). `strictPort` makes the dev server refuse the port
rather than quietly moving to 5174.

**First: is the 1.7e PR merged?** (`feat/1.7e-compose-api`: migrate target,
API in Compose, OpenSSL in the build stage.) Merge it, then branch for 1.7f
from `origin/main`.

Done in 1.7 so far: API image (1.7a-d, #25 - naive 1.58 GB → multi-stage,
non-root, healthcheck; rebuild after a code change 2 min 7 s → 20 s) and Compose
running postgres → migrate → api (1.7e). Numbers are in the commit messages and
`docs/interview-notes.md` section 10.

Then **1.7f — web image**, which opens with a decision waiting since 1.6a:
`VITE_API_URL` is baked into the bundle at build time, so a web image cannot be
promoted between environments like the API image. Options: one image per
environment; a config file written when the container starts; or serving the
API on the **same origin** behind Nginx (`/api`), which removes the problem and
CORS - and ties into 1.9's Nginx. Decide first, then a multi-stage build: Vite
build → Nginx serving static files with an SPA fallback.

Then **1.7g** - `docker compose up` on a clean checkout runs everything. That is
the slice 1.7 exists for: definition-of-done item 1.

Open from 1.7: ~170 MB of Prisma CLI still in the runtime image as an optional
peer of `@prisma/client` - no longer needed there now migrations have their own
target; base image not pinned by digest; `X-Powered-By: Express` header.

Frontend conventions (settled at the 1.6 close-out): one component per file;
components presentational; logic in hooks or plain functions. Frontend
explanations are technical only unless an analogy is asked for; optimisation,
security, accessibility, caching and rendering always explained in depth. Every
concept goes into `docs/interview-notes.md`.

Build only the screens `docs/design/ui-spec.md` assigns to Milestone 1.

Rules earned so far, all compile-clean and runtime-fatal:

- Every relative import needs `.js`, even though the file is `.ts`
- An `import` is not a DI registration; configuring a thing is not using it
- A handler parameter with no decorator is `undefined`
- `findUnique`/`update`/`delete` take only unique `where` clauses, so they
  cannot be scoped to an owner. Use `findFirst`/`updateMany`/`deleteMany`
- Prisma ignores `undefined` in a `where` clause - which makes optional filters
  clean and an undefined `userId` catastrophic
- Nest matches routes in declaration order: literal segments before `:id`
- `Boolean("false")` is `true`. Query values are strings
- Never type `prisma` directly; every Prisma command goes through a `db:*` script

Known quirks, deliberately not fixed:

- `Database connection closed` does not appear on Ctrl+C in development
- A fresh clone must run `pnpm --filter api db:generate` before it type-checks
- No formatter or linter yet - belongs with CI in 1.8 (the web app has no tests either; `task-rules.ts` is the first easy target)
- No absolute session lifetime on refresh token chains (ADR 0006)
- Search uses `ILIKE '%term%'`, which no B-tree index helps. Milestone 5
- No tests yet. 1.8 is where CI needs something to run

## Environment rules, learned the hard way

| Path | Machine | Purpose |
|---|---|---|
| `~/Desktop/task-manager` | Windows | holds the Vagrantfile. **Never edit code here** |
| `~/task-manager` | **inside the VM** | where all work happens |

The prompt is the tell: `MINGW64` means Windows, `vagrant@task-manager-dev`
means the VM. Pasting VM commands into Windows cost an hour once already.

- **One VM running at a time.** 15.7 GB does not stretch to a 4 GB dev VM plus
  the 2 GB CentOS box plus Windows. `vagrant halt` whichever is not in use. The
  symptom of getting this wrong is SSH timing out during provisioning.
- `main` is protected. Everything goes through a branch and a pull request,
  including small doc changes.

## Recently completed

**1.6 — Frontend (a-g).** React + Vite + Tailwind 4 web app against the local
API: auth in httpOnly cookies (ADR 0008) with a single-flight refresh, TanStack
Query for server state, view and modal state in the URL, table and board views,
an optimistic done checkbox with targeted rollback, and create / edit / delete
in a native `<dialog>`. Measured on production builds throughout - numbers and
decisions in the milestone note. Open: table mount cost, an accessibility audit
at 95, ADR 0009.

**User.name.** Added as a nullable column - one line of SQL, no backfill,
because nullable and additive is the cheap case. Required in `RegisterDto`
though: widen the database, tighten the API. `/auth/me` now calls `getProfile`
rather than returning the guard's user, keeping the guard narrow.

**1.5 — Tasks module and health endpoint (a-d).** Task CRUD scoped to the owner
inside the `where` clause, paginated, filterable by status, priority, search and
overdue. 404 rather than 403 for a task that is not yours - ADR 0007. `/health`
and `/health/ready` split so a database outage cannot become a restart loop.

**1.4 — Auth module (a-d).** Register with argon2id, login returning a
15-minute access token and a 7-day refresh token, a globally registered guard
with `@Public()` opt-out, and `GET /auth/me`. Refresh tokens rotate on every use
and are SHA-256 hashed; presenting a retired one revokes the whole chain. ADRs
0005 and 0006. Off-roadmap additions: httpyac request files and OpenAPI docs
at `/docs`.

**1.3 — NestJS scaffold and config (a-d).** A Nest 12 application that boots,
validates its environment before binding a port, holds one Prisma connection
pool opened at startup and closed on SIGTERM, and logs structured JSON with a
request id threaded through every line. Serves no routes yet. ADR 0004 records
the switch to Prisma's `prisma-client` generator after an unrelated `pnpm add`
silently deleted the generated client.

**1.3a — Nest scaffold.** Nest 12 in `apps/api`, ESM, TypeScript pinned to
`^6.0.2` because `@nestjs/cli` wants `~6.0.2` while npm's `latest` is 7.0.2.
Scaffold cherry-picked from `nest new` run in a throwaway directory. Declined
`@nestjs/observe` - a commercial telemetry SaaS offered as a default-yes prompt;
observability is Milestone 5 and self-hosted. `AppModule` deliberately empty.

**1.2b — Prisma and schema v1.** `User`, `RefreshToken` and `Task`, two Postgres
enum types, UUID primary keys, `ON DELETE CASCADE` on both foreign keys. First
migration generated and committed. Prisma pinned to `^7.10.0` — npm's `latest`
points at an 8.0 release candidate, see ADR 0003.

**1.2a — Postgres in a container.** `docker-compose.yml` with one `postgres:16`
service, credentials from `.env`, data in the named volume
`task-manager-postgres-data`, and a `pg_isready` healthcheck. Verified that
`docker compose down` preserves data and `down -v` destroys it.

**1.1 — repo scaffold.** pnpm workspace with `apps/api` and `apps/web`, Node 22
and pnpm 11.24.0 pinned, ignore rules committed before anything else, README,
empty `.env.example`, `main` protected.

**Development environment.** Ubuntu 22.04 under Vagrant/VirtualBox with Docker
Engine, provisioned reproducibly from `infra/vagrant/provision.sh` and verified
by a clean `vagrant destroy && vagrant up`. ADR 0002 records the decision, the
correction to its original reasoning, and the known NEM-backend constraint.

## Open questions

- Four merged or stale branches still around: `docs/close-1-1`,
  `infra/vagrant-dev-vm`, `docs/vm-workflow` on the remote, and
  `docs/session-close-1` locally. Delete when convenient.
- Empty stray folder at `C:\Users\adeda\task-manager` on Windows. Delete it.
- Git identity is still set per-repo by hand. A `gitdir:`-based `includeIf`
  would fix it properly. Parked — less pressing now the VM only does personal
  work.
- VM memory is 4GB. Raise to 6-8GB before Milestone 4, which runs two API
  instances plus Redis, a worker and Grafana.
- Domain name for production not chosen yet (needed by increment 1.9)
- AWS account and region not set up yet (needed by increment 1.9)

---

*Claude: update this file at the end of every session. Keep it short — it's a pointer, not a log.*
