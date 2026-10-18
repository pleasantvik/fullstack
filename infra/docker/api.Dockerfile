# API image. Multi-stage: a build stage compiles; a clean runtime stage gets only
# production dependencies and the compiled output, and runs as a non-root user.
#
# Build from the repo root - the context must include the workspace lockfile:
#   docker build -f infra/docker/api.Dockerfile -t task-manager-api .

# ---------------------------------------------------------------- build ---
# Everything needed to compile. Its layers stay in the build cache on this
# machine; none of them are in the final image.

# A fixed major on Debian (glibc), slim variant. Not alpine: native modules and
# their prebuilt binaries target glibc first, and musl differs in small ways
# (DNS resolution, allocator). Larger, but fewer surprises.
FROM node:22-bookworm-slim AS build

# Prisma picks its migration engine binary at install time by detecting OpenSSL,
# and slim has none - it guessed "openssl-1.1.x" with a "may not work" warning.
# Before the install, so the right engine is chosen. Build stage only (migrate
# inherits it): the runtime talks to Postgres through the pg driver adapter and
# needs no engine. Same RUN as the cleanup, or the apt lists stay in a layer.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /repo

# pnpm comes from Corepack, at exactly the version (and hash) pinned in the root
# package.json's packageManager field - not whatever pnpm is latest today.
RUN corepack enable

# Only what the install depends on, so the install layer's cache key changes
# only when dependencies do (1.7b: a comment change went from 2 min 7 s to 20 s).
# Every workspace package's manifest is listed: pnpm checks the lockfile against
# the whole workspace, even when installing one package.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

# --filter api: the API's dependencies only, dev included - the web app's are
# never installed. --frozen-lockfile: exactly what the lockfile says, or fail.
RUN pnpm install --frozen-lockfile --filter api

# The source, last: the part that changes on every commit.
COPY . .

# prisma generate never connects to a database, but prisma.config.ts refuses to
# load without DATABASE_URL. A placeholder for this one command only.
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    pnpm --filter api exec prisma generate

# Compiles src/ - including the generated Prisma client - into dist/.
RUN pnpm --filter api build

# -------------------------------------------------------------- migrate ---
# A one-off job, not a server: applies pending migrations and exits. Built from
# the build stage, which already has the Prisma CLI (a devDependency), the
# schema, the migrations folder and prisma.config.ts. Compose builds it with
# target: migrate; it never runs as the API.
FROM build AS migrate

WORKDIR /repo/apps/api

# deploy, never dev: dev can reset the database. Exec form, so a stop signal
# reaches pnpm and Prisma directly.
CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

# -------------------------------------------------------------- runtime ---
# Starts again from the clean base. Only what is copied or installed below is
# shipped: no compiler, no CLIs, no source, no web app.
FROM node:22-bookworm-slim AS runtime

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

# A fresh, production-only install from the same lockfile - the build stage's
# node_modules holds devDependencies and is never copied over.
#
# Not as lean as --prod suggests: @prisma/client declares prisma and typescript
# as optional peers, the lockfile links them to the API's devDependencies, and
# --prod keeps those links - ~170 MB of Prisma CLI, Studio and TypeScript come
# back in. Kept on purpose for now: 1.7e needs the CLI for migrate deploy.
RUN pnpm install --frozen-lockfile --prod --filter api

# The compiled API. The generated Prisma client was compiled into dist/ too.
COPY --from=build /repo/apps/api/dist apps/api/dist

WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 3000

# Liveness, not readiness (1.5): whatever acts on "unhealthy" must not restart
# the API because Postgres is down. Written in node because the slim image has no
# curl or wget, and adding one would add a tool for an attacker.
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch(`http://localhost:${process.env.PORT ?? 3000}/health`).then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]

# Everything above ran as root and stays owned by root: this user can read and
# run the app but not change it. No --chown on the copies, deliberately.
USER node

# Exec form (a JSON array): node runs as PID 1 and receives SIGTERM directly,
# so the shutdown hooks from 1.3 close the database pool. The shell form
# ("CMD node dist/main.js") wraps it in /bin/sh, which does not forward signals.
CMD ["node", "dist/main.js"]
