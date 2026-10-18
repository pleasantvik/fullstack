# API image - 1.7c: multi-stage. A build stage compiles; a clean runtime stage
# gets only production dependencies and the compiled output. Still root - 1.7d.
#
# Build from the repo root - the context must include the workspace lockfile:
#   docker build -f infra/docker/api.Dockerfile -t task-manager-api:1.7c .

# ---------------------------------------------------------------- build ---
# Everything needed to compile. Its layers stay in the build cache on this
# machine; none of them are in the final image.

# A fixed major on Debian (glibc), slim variant. Not alpine: musl breaks the
# prebuilt native binaries Prisma ships, which then need compiling.
FROM node:22-bookworm-slim AS build

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

# Exec form (a JSON array): node runs as PID 1 and receives SIGTERM directly,
# so the shutdown hooks from 1.3 close the database pool. The shell form
# ("CMD node dist/main.js") wraps it in /bin/sh, which does not forward signals.
CMD ["node", "dist/main.js"]
