# 0003 — Prisma pinned to 7.x while npm's `latest` is an 8.0 release candidate

**Date:** 2026-09-12
**Status:** Accepted

## Context

Increment 1.2b installs Prisma. `pnpm add prisma` resolves the `latest` dist-tag
by default, and Prisma currently publish **8.0.0-rc.14** under `latest` — a
release candidate, not a stable release. The last stable version is 7.10.0,
published under the `prev` tag.

The first install therefore landed `prisma@8.0.0-rc.13`, which pulled in
`@alchemy.run`, Cloudflare's `workerd`, `rolldown`, Vite 8, Vitest 5 and `sharp`
— an experimental deployment stack with no relevance to this project.

This matters more than usual here: migrations are a deployment concern, and the
tool that generates them runs against production from increment 1.10.

## Options

1. **Accept `latest` (8.0.0-rc).** Newest features and the eventual direction of
   travel. Pre-release API, breaking changes still landing, and a large
   dependency tree that exists for use cases this project does not have.
2. **`^7.10.0` — the last stable major.** Patch and minor updates arrive, the
   major cannot change without an explicit decision.
3. **Exactly `7.10.0`.** No drift at all, and no security patches either.

## Decision

Option 2, `^7.10.0`.

The same policy already applied to `postgres:16` in increment 1.2a: pin the
major, let patches through. A release candidate is not a version to learn on,
and it is certainly not one to run migrations against a production database.

## Consequence

- Prisma 7 has already moved the datasource `url` out of `schema.prisma` and
  into `prisma.config.ts`. That change is absorbed in this increment.
- From increment 1.4, `PrismaClient` requires a driver adapter
  (`@prisma/adapter-pg`) rather than connecting on its own. Not built yet.
- Prisma 8 gets revisited when it has a stable release, as a deliberate upgrade
  in its own increment — never as a side effect of running `pnpm add`.
- The general rule this establishes: **a dist-tag is a label a maintainer chose,
  not a guarantee of stability.** `latest` said stable and meant release
  candidate. Check what a version resolves to before committing it.
