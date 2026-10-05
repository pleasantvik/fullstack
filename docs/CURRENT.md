# Where we are

**Active milestone:** 1 — September, the delivery spine
**Active increment:** 1.3b — config module and fail-fast validation
**Schedule:** Milestone 1 runs into mid-October. The month names in the roadmap
are ordering, not deadlines — see the note at the top of `docs/roadmap.md`.
**Last updated:** 2026-09-26

## Start here next session

**On Windows:**

    cd ~/Desktop/task-manager/infra/vagrant
    vagrant up
    vagrant ssh

**Then inside the VM** — prompt must read `vagrant@task-manager-dev`:

    cd ~/task-manager
    docker compose up -d
    docker compose ps        # postgres should report (healthy)

Then increment **1.3b — config module and fail-fast validation**. Not explained
yet, so it starts with the WHAT/WHY/WHERE/HOW before any code:

- `@nestjs/config` with a **schema-validated** env shape. A missing or malformed
  `DATABASE_URL` crashes at boot with a message naming the variable
- The hardcoded `3000` in `src/main.ts` becomes a validated `PORT`
- Global validation pipe

*Concept focus:* fail-fast. A process that cannot possibly work should refuse to
start rather than accept traffic and fail on the first request at 2am.

1.3 is split into four slices. Docs, post and PR are held until all four land,
rather than four of each:

| | Ships | Concept focus |
|---|---|---|
| 1.3a ✅ | Nest installed, app boots, answers 404 | dependency injection and modules |
| **1.3b** | validated config, `PORT` from env | fail-fast config |
| 1.3c | `PrismaService` in Nest's DI, `@prisma/adapter-pg` | connection lifecycle - who opens the pool |
| 1.3d | Pino structured logging with request IDs | why logs are JSON, and request correlation |

To run what exists:

    pnpm --filter api start:dev     # then curl -i localhost:3000 -> JSON 404

Two traps already met in 1.3a, both compile-clean and runtime-fatal:

- **Every relative import needs `.js`**, even though the file is `.ts`. ESM
  resolves the compiled path. TypeScript will not warn you
- **An `import` is not a DI registration.** A provider missing from a module's
  `providers` array compiles fine and fails at boot with "Nest can't resolve
  dependencies"

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
