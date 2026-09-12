# Where we are

**Active milestone:** 1 — September, the delivery spine
**Active increment:** 1.2b — Prisma and schema v1
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

Then increment **1.2b — Prisma into `apps/api`**. Not explained yet, so this one
starts with the WHAT/WHY/WHERE/HOW before any code:

- Prisma installed into `apps/api`, `schema.prisma` created, datasource reading
  `DATABASE_URL` from `.env`
- Schema v1: `User`, `RefreshToken`, `Task`, and two enums (task status, task
  priority). No `workspaceId` — teams are Milestone 3, see the no-pre-building
  rule
- First migration generated with `prisma migrate dev` and **committed**
- `prisma studio` to look at the empty tables

*Concept focus:* a migration is a versioned artifact that lives in git, not a
command you run. Why `migrate dev` and `migrate deploy` are different commands
with different blast radii.

Prisma lands before NestJS. Nest arrives in 1.3.

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
