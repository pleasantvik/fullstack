# 0001 — Prisma over TypeORM

**Date:** 2026-08-29
**Status:** Accepted

## Context

The project needs an ORM for PostgreSQL in NestJS. Migrations are a deployment concern here, not only a code concern — they run as an explicit step in the deploy pipeline and, from Milestone 3, against live data.

## Options

**TypeORM** — closer NestJS integration, decorator-based entities, familiar to most Nest tutorials. Migration generation is less predictable and `synchronize: true` is an easy foot-gun.

**Prisma** — separate schema file, generated client, explicit and readable migration files, clear separation between `migrate dev` and `migrate deploy`.

## Decision

Prisma.

## Consequence

The migration workflow is explicit and legible, which supports the expand-migrate-contract work in Milestone 3. The schema lives outside TypeScript, which is a small context switch. Prisma's generated client must be regenerated in CI and in the Docker build — a step easy to forget, so it goes in the Dockerfile explicitly.
