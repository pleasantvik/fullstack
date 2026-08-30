# Where we are

**Active milestone:** 1 — September, the delivery spine
**Active increment:** 1.2 — database and Prisma
**Last updated:** 2026-08-29

## Start here next session

Development runs inside a Vagrant VM, not on Windows. See
`docs/decisions/0002-local-dev-in-a-vagrant-vm.md` and the README.

```bash
cd infra/vagrant && vagrant up && vagrant ssh
cd ~/task-manager
```

Then increment 1.2 — database and Prisma, in two slices:

**1.2a — Postgres in a container.** `docker-compose.yml` with one service, a
named volume and a healthcheck. `DATABASE_URL` added to `.env.example`. Connect
and prove it is alive.
*Concept focus:* volumes, and why `docker compose down` and `down -v` are
different commands.

**1.2b — Prisma and the first migration.** Prisma into `apps/api`, schema v1
(`User`, `RefreshToken`, `Task`, two enums), first migration generated and
committed, Prisma Studio to inspect it.
*Concept focus:* migrations as versioned, committed artifacts, and why
`migrate dev` must never run against a deployed database.

Note that Prisma lands in `apps/api` before NestJS does — Nest arrives in 1.3.
The package will briefly be a `package.json`, a schema, and nothing else.

**Reminder:** `main` is protected. All work goes on a branch and merges via a
pull request, including small doc changes.

## Recently completed

**1.1 — repo scaffold.** pnpm workspace with `apps/api` and `apps/web` as
members, Node 22 and pnpm 11.24.0 pinned, `.gitignore`/`.gitattributes`/`.nvmrc`
committed before anything else, README and empty `.env.example`. Pushed to
`github.com/pleasantvik/fullstack`. `main` protected: pull request required,
force-push and deletion blocked.

**Development VM.** Ubuntu 22.04 under Vagrant/VirtualBox, provisioned with
Docker Engine, Node 22, pnpm, git and gh. Defined in `infra/vagrant/`. ADR 0002
records why, and what it costs.

## Open questions

- **Windows Memory Integrity must stay off.** With it on, Windows owns the CPU's
  virtualisation hardware and VirtualBox hangs intermittently during guest boot.
  Verify with `(Get-CimInstance Win32_ComputerSystem).HypervisorPresent` —
  it must be `False`.
- VM memory is 4GB. Milestone 4 runs two API instances plus Redis, a worker and
  Grafana; raise it to 6-8GB before then.
- The repo is named `fullstack`, the project is `task-manager`. Harmless;
  `gh repo rename` is available if it grates.
- Domain name for production not chosen yet (needed by increment 1.9)
- AWS account and region not set up yet (needed by increment 1.9)

---

*Claude: update this file at the end of every session. Keep it short — it's a pointer, not a log.*
