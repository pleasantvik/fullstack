# 0010 — Same-origin API behind a reverse proxy

**Date:** 2026-10-26
**Status:** Accepted

## Context

The web app reads its API address from `VITE_API_URL`, which Vite inlines into
the bundle at build time. The API image takes its settings when the container
starts, so one API image runs anywhere; a web image built today has its API
address frozen inside it. 1.7f builds the web image, and 1.10 will deploy
images, so this has to be settled first.

## Options

**One image per environment** (`VITE_API_URL` as a build argument). Simplest,
but the image tested in staging is not the image shipped - rebuilt from the
same commit with different settings is not the same artefact.

**A config file written at container start** (`/config.js` from an environment
variable, loaded before the bundle). One image, but an extra render-blocking
request on the critical path, cache headers to get right, and a start script
plus a global variable to maintain.

**Same origin**: Nginx serves the static files and proxies `/api/*` to the API;
the frontend calls a relative `/api`. No address to configure, no CORS, the
simplest cookie case, and the shape 1.9 needs anyway. Costs: the API must
answer under `/api`, and every path that embeds an address must follow it.

## Decision

**Same origin.** The API sets a global `/api` prefix itself; Nginx (Vite's dev
proxy locally) forwards `/api/*` unchanged.

- The API owns its public path. Rejected: Nginx stripping `/api` - the API
  would set the refresh cookie with `Path=/auth`, the browser would request
  `/api/auth/refresh`, and the cookie would never be sent.
- `/health` and `/health/ready` are excluded from the prefix. Nginx forwards
  only `/api/*`, so they are reachable inside the Docker network (healthchecks,
  monitoring) but not from the public origin - `/health/ready` reveals whether
  the database is reachable.
- CORS stays configured until the proxied path is proven in 1.9.

## Consequences

- One web image runs in every environment.
- Every embedded path follows the prefix: the refresh cookie's `Path`, httpyac
  files, anything that calls the API by URL.
- Nginx becomes a single point of entry, and a single point of failure.
- Behind a proxy the API sees Nginx as the client; forwarded headers must be
  trusted deliberately before logging or rate limiting rely on client IPs.
