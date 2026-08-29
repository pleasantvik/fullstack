# Where we are

**Active milestone:** 1 — September, the delivery spine
**Active increment:** 1.2 — database and Prisma
**Last updated:** 2026-08-29

## Start here next session

**Blocker: Docker is not installed on this machine.** Increment 1.2 runs
Postgres in a container, so nothing else can begin. Install Docker Desktop and
confirm `docker compose version` responds before anything else.

Then increment 1.2 — database and Prisma:

1. Postgres running locally in Docker
2. Prisma added to `apps/api`, with `DATABASE_URL` recorded in `.env.example`
   and set in `.env`
3. Schema v1 — `User`, `RefreshToken`, `Task`, and two enums
4. First migration, generated and committed to the repo
5. Prisma Studio to look at what was actually created

**Concept focus:** migrations as versioned, committed artifacts, and why
`migrate dev` must never run against a deployed database.

**Reminder:** `main` is protected. All work goes on a branch and merges via a
pull request, including small doc changes.

## Recently completed

**1.1 — repo scaffold.** pnpm workspace with `apps/api` and `apps/web` as
members, Node 22 and pnpm 11.24.0 pinned, `.gitignore`/`.gitattributes`/`.nvmrc`
committed before anything else, README and empty `.env.example`. Pushed to
`github.com/pleasantvik/fullstack`. `main` protected: pull request required,
force-push and deletion blocked. Full notes in
`docs/milestones/M1-september-spine.md`.

## Open questions

- **Git identity is set per-repo by hand.** Should be replaced with a
  `gitdir:`-based `includeIf` in the global config so personal and work commits
  are attributed correctly without having to remember. Not part of any
  milestone — parked until wanted.
- The repo is named `fullstack`, the project is `task-manager`. Harmless;
  `gh repo rename` is available if it grates.
- Domain name for production not chosen yet (needed by increment 1.9)
- AWS account and region not set up yet (needed by increment 1.9)

---

*Claude: update this file at the end of every session. Keep it short — it's a pointer, not a log.*
