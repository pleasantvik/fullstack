# Where we are

**Active milestone:** 1 — September, the delivery spine
**Active increment:** 1.4 — auth module
**Schedule:** Milestone 1 runs into mid-October. The month names in the roadmap
are ordering, not deadlines — see the note at the top of `docs/roadmap.md`.
**Last updated:** 2026-10-05

## Start here next session

**On Windows:**

    cd ~/Desktop/task-manager/infra/vagrant
    vagrant up
    vagrant ssh

**Then inside the VM** — prompt must read `vagrant@task-manager-dev`:

    cd ~/task-manager
    docker compose up -d
    docker compose ps        # postgres should report (healthy)

Then increment **1.4 — auth module**. Not explained yet, so it starts with the
WHAT/WHY/WHERE/HOW before any code:

- Register and login, passwords hashed with argon2 or bcrypt
- JWT access tokens, short-lived
- Refresh token rotation, stored hashed in the `refresh_tokens` table that has
  been sitting empty since 1.2b
- Guards, and `/auth/me`

*Concept focus:* why refresh tokens are stored hashed, what rotation actually
prevents, and where a guard sits in the request lifecycle.

`JWT_SECRET` joins the manifest in `env.validation.ts` and **must not have a
default**. A default secret lives in a public repo, so anyone could forge a token
for any user - and the app would start normally, which is what makes it worse
than a missing variable.

To run what exists:

    docker compose up -d
    pnpm --filter api start:dev     # curl -i localhost:3000 -> JSON 404

Rules earned so far, all of which compile clean and fail at runtime:

- Every relative import needs `.js`, even though the file is `.ts`
- An `import` is not a DI registration - a provider needs `providers`, and
  `exports` + `imports` to cross a module boundary
- Configuring a thing is not using it - `LoggerModule` needs `useLogger` too
- Never type `prisma` directly; every Prisma command goes through a `db:*` script

Known quirks, deliberately not fixed:

- `Database connection closed` does not appear on Ctrl+C **in development**.
  `pino-pretty` runs its transport in a worker thread and the process exits
  before it flushes. Measured, not assumed - it appears with
  `NODE_ENV=production`. Production has no transport, so 1.10 will see the drain
- A fresh clone must run `pnpm --filter api db:generate` before it type-checks.
  The generated client is gitignored build output - see ADR 0004
- No formatter or linter yet, so the editor reflows files I wrote and diffs are
  noisy. Belongs with lint and type-check in 1.8

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
