# Web image. A Node stage builds the static bundle; an Nginx stage serves it and
# proxies /api to the API (ADR 0010). No Node in the final image.
#
# Build from the repo root - the context must include the workspace lockfile:
#   docker build -f infra/docker/web.Dockerfile -t task-manager-web .

# ---------------------------------------------------------------- build ---
FROM node:22-bookworm-slim AS build

WORKDIR /repo

RUN corepack enable

# Same cache order as the API image (1.7b): manifests, install, then source.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile --filter web

COPY . .

# tsc -b, then vite build → apps/web/dist. Nothing environment-specific goes in:
# the API is a relative /api.
RUN pnpm --filter web build

# -------------------------------------------------------------- runtime ---
# Runs as a non-root user and listens on 8080 - the official nginx image starts
# its master process as root. Alpine is fine here: no Node, no native modules.
FROM nginxinc/nginx-unprivileged:1.28-alpine AS runtime

# Replaces the image's default site. Only conf.d/*.conf is read for sites.
COPY infra/nginx/web.conf /etc/nginx/conf.d/default.conf

# The built files are the only thing that crosses from the build stage.
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html

EXPOSE 8080
