# 0004 — Prisma client generator and output location

**Date:** 2026-10-05
**Status:** Accepted

## Context

Increment 1.2b generated the Prisma client with `prisma-client-js`, the legacy
generator, which writes its output into `node_modules/.prisma/client`. The
`@prisma/client` package is a thin re-export of whatever is found there.

In 1.3c, `pnpm --filter api add @prisma/adapter-pg` rewrote `node_modules` and
took the generated client with it. The build failed with
`Module '"@prisma/client"' has no exported member 'PrismaClient'` — an error
that describes a missing export rather than a deleted directory, so it reads
like a version or import problem.

The generated client had been destroyed by an unrelated install, silently, three
weeks after it was created. Nothing warned, and nothing re-ran generate.

## Options

1. **Keep `prisma-client-js`, add a `postinstall` script** that regenerates
   after every install. Smallest change. The client still lives inside
   `node_modules`, invisible, and the fix depends on a lifecycle hook that is
   itself easy to forget when it misbehaves.
2. **Switch to Prisma 7's `prisma-client` generator** with an explicit `output`
   inside the source tree. Generated code is visible, survives installs, and is
   the direction Prisma is moving. Changes the import path and needs a
   `.gitignore` entry.
3. **Commit the generated client.** Survives everything. Produces a large
   meaningless diff on every schema change and invites hand-editing generated
   code.

## Decision

Option 2. `provider = "prisma-client"`, `output = "../src/generated/prisma"`,
`moduleFormat = "esm"` to match the package's `"type": "module"`.

The generated directory is gitignored: it is build output, derived entirely from
`schema.prisma`, and reproducible with one command.

## Consequence

- The import changes from `@prisma/client` to
  `../generated/prisma/client.js`. The generated `PrismaClient` is exported as a
  const plus a type alias rather than a class declaration; `extends` still
  type-checks, because the const carries a construct signature.
- A `generate` step is now explicitly required in the Docker build (1.7) and in
  CI (1.8). ADR 0001 already anticipated this: *"Prisma's generated client must
  be regenerated in CI and in the Docker build — a step easy to forget, so it
  goes in the Dockerfile explicitly."* That prediction was correct and the cost
  of ignoring it was a broken build.
- A fresh clone cannot type-check until `pnpm --filter api db:generate` has run.
  That belongs in the README before anyone else tries.
- Separately, and not chosen: `prisma generate` in 7.10.0 also fetches AI-agent
  skill files from GitHub and writes `.agents/`, `.claude/` and `.windsurf/`
  into the project, unconditionally. There is no opt-out in `PrismaConfig` and
  no environment variable in the CLI. They are gitignored and the two for
  unused editors are deleted. Worth revisiting if a flag appears.
