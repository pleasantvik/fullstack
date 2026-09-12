# Where we are

**Active milestone:** 1 — September, the delivery spine
**Active increment:** 1.2a — Postgres in a container
**Last updated:** 2026-08-30

## Start here next session

The development VM is built and the repo is cloned inside it. No setup left.

**On Windows:**

    cd ~/Desktop/task-manager/infra/vagrant
    vagrant up
    vagrant ssh

**Then inside the VM** — prompt must read `vagrant@task-manager-dev`:

    cd ~/task-manager

Then increment **1.2a — Postgres in a container**. Explained already, nothing
written yet:

- `docker-compose.yml` at the repo root: one `postgres:16` service, credentials
  from `.env`, port 5432 published, data in a **named** volume, a healthcheck
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` and `DATABASE_URL` added
  to `.env.example`
- `docker compose up -d`, then prove the database is actually reachable

*Concept focus:* named volumes, and why `docker compose down` and
`docker compose down -v` are different commands typed for different reasons.

The WHAT/WHY/WHERE/HOW was already covered — market stall, lock-up, packing the
stall away versus emptying the lock-up. No need to repeat it.

Then **1.2b** — Prisma into `apps/api`, schema v1 (`User`, `RefreshToken`,
`Task`, two enums), first migration generated and committed, Prisma Studio to
inspect it. Prisma lands before NestJS does; Nest arrives in 1.3.

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

**1.1 — repo scaffold.** pnpm workspace with `apps/api` and `apps/web`, Node 22
and pnpm 11.24.0 pinned, ignore rules committed before anything else, README,
empty `.env.example`, `main` protected.

**Development environment.** Ubuntu 22.04 under Vagrant/VirtualBox with Docker
Engine, provisioned reproducibly from `infra/vagrant/provision.sh` and verified
by a clean `vagrant destroy && vagrant up`. ADR 0002 records the decision, the
correction to its original reasoning, and the known NEM-backend constraint.

**Posts.** `docs/posts/` established with two drafts. Drafting a post is now
item 6 of the definition of done.

## Open questions

- Three merged branches still on the remote: `docs/close-1-1`,
  `infra/vagrant-dev-vm`, `docs/vm-workflow`. Delete when convenient.
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
