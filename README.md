# task-manager

A task manager built as a personal learning project, running September 2026 to
January 2027. The application is the vehicle, not the point: it exists to force
a confrontation with real DevOps — packaging, CI/CD, cloud infrastructure,
observability, scaling — alongside deeper backend engineering.

## Status

**Milestone 1, increment 1.1 — repository scaffold. There is no application code
yet.** `apps/api` and `apps/web` are empty workspace members. The API is built in
increment 1.3, the frontend in 1.6.

## Prerequisites

- **Node 22.** The version is pinned in `.nvmrc`. With
  [nvm-windows](https://github.com/coreybutler/nvm-windows) or
  [nvm](https://github.com/nvm-sh/nvm), run `nvm use` in this directory.
- **Corepack.** Ships with Node. It reads the `packageManager` field in
  `package.json` and fetches the exact pnpm version this repo expects, so you do
  not need to install pnpm yourself.

## Setup

```bash
git clone https://github.com/pleasantvik/fullstack.git
cd fullstack

corepack enable     # let corepack manage pnpm
pnpm install        # installs every workspace package in one pass

cp .env.example .env
```

`.env` currently needs no values. That changes in increment 1.2.

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
