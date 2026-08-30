# task-manager

A task manager built as a personal learning project, running September 2026 to
January 2027. The application is the vehicle, not the point: it exists to force
a confrontation with real DevOps — packaging, CI/CD, cloud infrastructure,
observability, scaling — alongside deeper backend engineering.

## Status

**Milestone 1. Increment 1.1 (repository scaffold) is done, and the development
VM exists. There is no application code yet.** `apps/api` and `apps/web` are
empty workspace members. Increment 1.2 adds Postgres and Prisma, the API is
built in 1.3, the frontend in 1.6.

## Prerequisites

Development happens inside a Linux VM, not on the host. Docker, Node and pnpm
are installed *in the VM* by its provisioning script — you do not install them
on your own machine. See `docs/decisions/0002-local-dev-in-a-vagrant-vm.md`.

On the host you need only:

- **VirtualBox** 7.x
- **Vagrant**

**Windows hosts:** if Core Isolation → Memory Integrity is enabled, Windows
takes ownership of the CPU's virtualisation hardware and VirtualBox falls back
to a slower path that hangs intermittently during guest boot. Turn it off and
reboot. `(Get-CimInstance Win32_ComputerSystem).HypervisorPresent` must report
`False`.

## Setup

There are two clones of this repository, with different jobs.

**1. On the host — only to start the VM.** No code is edited here.

```bash
git clone https://github.com/pleasantvik/fullstack.git
cd fullstack/infra/vagrant
vagrant up          # boots Ubuntu 22.04 and provisions Docker, Node 22, pnpm, git, gh
vagrant ssh
```

**2. Inside the VM — where all work happens.**

```bash
git config --global user.name  "your name"
git config --global user.email "your@email"
gh auth login                    # HTTPS, authenticate git, web browser

git clone https://github.com/pleasantvik/fullstack.git ~/task-manager
cd ~/task-manager
pnpm install
cp .env.example .env
```

`.env` currently needs no values. That changes in increment 1.2.

Edit the VM's files with **VS Code Remote-SSH**, so the editor stays on the host
and the files and terminal are the VM's. The default `/vagrant` synced folder is
deliberately disabled: VirtualBox shared folders do not propagate inotify
events, which silently breaks file watching, and they make Docker builds slow.

### Ports

Forwarded to `127.0.0.1` on the host only:

| Port | Service |
|---|---|
| 5432 | Postgres |
| 3000 | API |
| 5173 | Vite dev server |

There is no host-only adapter — a second NIC hung the guest on boot. The
forwarded ports above are the only route in. See
`docs/decisions/0002-local-dev-in-a-vagrant-vm.md`.

### The VM is disposable

`vagrant destroy` deletes it, and anything uncommitted goes with it. **GitHub is
the source of truth, not the VM.** Commit and push before destroying.

If you change `provision.sh`, note that provisioning runs only on first boot.
Use `vagrant provision` to re-run it, or `vagrant destroy && vagrant up` to
prove it still works from nothing.

## Layout

```
task-manager/
├── apps/
│   ├── api/      NestJS backend      (from increment 1.3)
│   └── web/      React + Vite front  (from increment 1.6)
├── docs/         roadmap, milestones, decisions, design
├── CLAUDE.md     how this project is built, and the rules it follows
└── pnpm-workspace.yaml
```

`apps/*` is the set of independently deployable services. Nothing outside it is
a package.

## Commands

```bash
pnpm install      # install every workspace package
pnpm lint         # runs in each package that defines a lint script
pnpm typecheck
pnpm test
pnpm build
```

The four fan-out commands currently do nothing, because no package defines those
scripts yet. They are wired up so that CI has a stable entry point from the
start.

Adding a dependency belongs to the package that uses it, never to the root:

```bash
pnpm --filter api add @nestjs/core   # a library the API imports
pnpm --filter web add react          # a library the frontend imports
pnpm add -w -D prettier              # a tool that acts on the whole repo
```

## Documentation

| File | What it holds |
|---|---|
| `docs/CURRENT.md` | where the project is right now — read this first |
| `docs/roadmap.md` | the full five-month plan |
| `docs/milestones/` | one file per milestone, with a reflection at the end |
| `docs/decisions/` | short ADRs: context, options, choice, consequence |
| `CLAUDE.md` | the working contract for how this project gets built |
