# Where we are

**Active milestone:** 1 — September, the delivery spine
**Active increment:** 1.3 — NestJS scaffold and config
**Last updated:** 2026-09-12

## Start here next session

**On Windows:**

    cd ~/Desktop/task-manager/infra/vagrant
    vagrant up
    vagrant ssh

**Then inside the VM** — prompt must read `vagrant@task-manager-dev`:

    cd ~/task-manager
    docker compose up -d
    docker compose ps        # postgres should report (healthy)

Then increment **1.3 — NestJS scaffold and config**. Not explained yet, so it
starts with the WHAT/WHY/WHERE/HOW before any code:

- NestJS installed into `apps/api`, app module, `main.ts`
- Config module with **schema-validated** env vars — a missing `DATABASE_URL`
  crashes at boot with a clear message, not at 2am on the first request
- Global validation pipe
- Pino structured logging with request IDs
- A `PrismaService` wiring the generated client into Nest's dependency
  injection. Prisma 7 needs a driver adapter (`@prisma/adapter-pg`) rather than
  connecting on its own — that arrives here

*Concept focus:* fail-fast config. Why a process that cannot possibly work
should refuse to start rather than accept traffic.

Rule earned in 1.2b: **never type `prisma` directly.** Every Prisma command goes
through a `db:*` script in `apps/api/package.json`, because each one needs
`dotenv-cli` in front of it to find the repo-root `.env`.

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
