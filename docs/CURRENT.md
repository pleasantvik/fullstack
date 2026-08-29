# Where we are

**Active milestone:** 1 — September, the delivery spine
**Active increment:** 1.2 — database and Prisma
**Last updated:** 2026-08-29

## Next up

Postgres running in Docker locally. Prisma schema v1 — `User`, `RefreshToken`,
`Task`, two enums. First migration, committed. Prisma Studio to inspect it.

Concept focus: migrations as versioned, committed artifacts, and the difference
between `migrate dev` and `migrate deploy`.

## Recently completed

**1.1 — repo scaffold.** pnpm workspace with `apps/api` and `apps/web` as
members, Node 22 and pnpm 11.24.0 pinned, `.gitignore`/`.gitattributes`/`.nvmrc`
committed before anything else, README and empty `.env.example`. Pushed to
`github.com/pleasantvik/fullstack`. `main` protected: pull request required,
force-push and deletion blocked.

## Open questions

- **Docker is not installed on this machine.** Required by increment 1.2 — this
  is the immediate blocker.
- `gh` is installed and authenticated; new terminals pick it up on PATH.
- The repo is named `fullstack`, the project is `task-manager`. Harmless, but
  `gh repo rename` is available if the mismatch grates.
- Domain name for production not chosen yet (needed by increment 1.9)
- AWS account and region not set up yet (needed by increment 1.9)

---

*Claude: update this file at the end of every session. Keep it short — it's a pointer, not a log.*
