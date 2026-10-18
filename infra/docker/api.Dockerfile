# API image - 1.7a, DELIBERATELY NAIVE.
#
# One stage, the whole repo copied in, every dependency installed. This is the
# baseline that 1.7b (layer order and the cache) and 1.7c (multi-stage and
# pruning) are measured against. Do not ship this one.
#
# Build from the repo root - the context must include the workspace lockfile:
#   docker build -f infra/docker/api.Dockerfile -t task-manager-api:1.7a .

# A fixed major on Debian (glibc), slim variant. Not alpine: musl breaks the
# prebuilt native binaries argon2 and Prisma ship, which then need compiling.
FROM node:22-bookworm-slim

WORKDIR /repo

# pnpm comes from Corepack, at exactly the version (and hash) pinned in the root
# package.json's packageManager field - not whatever pnpm is latest today.
RUN corepack enable

COPY . .

# --frozen-lockfile: install exactly what pnpm-lock.yaml says, or fail. Never
# resolve fresh versions inside an image build.
RUN pnpm install --frozen-lockfile

# prisma generate never connects to a database, but prisma.config.ts refuses to
# load without DATABASE_URL. A placeholder for this one command only.
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    pnpm --filter api exec prisma generate

RUN pnpm --filter api build

WORKDIR /repo/apps/api
ENV NODE_ENV=production
EXPOSE 3000

# Exec form (a JSON array): node runs as PID 1 and receives SIGTERM directly,
# so the shutdown hooks from 1.3 close the database pool. The shell form
# ("CMD node dist/main.js") wraps it in /bin/sh, which does not forward signals.
CMD ["node", "dist/main.js"]
