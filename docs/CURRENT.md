# Where we are

**Active milestone:** 1 — September, the delivery spine
**Active increment:** 1.6a — Vite, Tailwind, and build-time config
**Schedule:** Milestone 1 runs into mid-October. The month names in the roadmap
are ordering, not deadlines — see the note at the top of `docs/roadmap.md`.
**Last updated:** 2026-10-06

## Start here next session

**On Windows:**

    cd ~/Desktop/task-manager/infra/vagrant
    vagrant up
    vagrant ssh

**Then inside the VM** — prompt must read `vagrant@task-manager-dev`:

    cd ~/task-manager

**Branch BEFORE writing anything.** Three increments in a row have been built on
the previous increment's branch, and once it happens a PR either carries the
wrong name or merges into the wrong base. PR #10 merged into a feature branch
and looked successful while the work went nowhere near `main`.

    git checkout main && git pull
    git checkout -b feat/<increment>

Then:

    docker compose up -d
    pnpm --filter api start:dev

Then increment **1.6a — Vite, Tailwind, and build-time config**. Explained
already; nothing written yet.

- Vite + React scaffold in `apps/web`, generated into `/tmp` and cherry-picked
  rather than run in place - `apps/web/package.json` exists and a generator
  would overwrite it, same as `nest new` would have in 1.3a
- Tailwind with the tokens from `docs/design/ui-spec.md`
- `VITE_API_URL`, and an `apps/web/.env.example` separate from the root one

*Concept focus:* build-time environment variables. `import.meta.env.VITE_*` is
replaced with a string literal during the build - it is not read at runtime and
is not present at runtime. Two consequences: anything prefixed `VITE_` is
public, in plain text, in a file served to the world; and one web image cannot
be promoted between environments the way the API image can. That second one is a
real decision waiting in 1.7.

**One decision still open:** Tailwind is now 4.3.3 and configures in CSS via a
`@theme` block, but `ui-spec.md` says the dark ramp lives in
`tailwind.config.js`. Either adopt Tailwind 4 and amend that line, or pin
Tailwind 3 to match the spec as written. Leaning towards the former - the spec
says the design system is *established* in Milestone 1, so this is when that
detail gets pinned down.

Then **1.6b** login and register, **1.6c** TanStack Query and the table view,
**1.6d** the board, toggle and task modal. Your spec says build the table before
the board.

**ADR 0006 gets revisited in 1.6b.** Refresh tokens come back in the response
body today; an `httpOnly` cookie is the better answer, and its configuration
depends on whether Nginx serves the web app and the API from the same origin -
which 1.9 decides.

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
- No formatter or linter yet - belongs with CI in 1.8
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
