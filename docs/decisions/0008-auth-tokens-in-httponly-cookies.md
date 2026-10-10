# 0008 — Auth tokens in httpOnly cookies

**Date:** 2026-10-10
**Status:** Accepted. Supersedes the *transport* half of ADR 0006; its decisions on
token format and hashing stand.

## Context

ADR 0006 returned the refresh token in the response body and deferred the
question of where a browser should keep it until a client existed. Increment
1.6 built that client, and the question became concrete.

The threat that decides it is **XSS**: attacker JavaScript running in this
origin. No storage choice survives XSS — injected script can act as the user
for as long as the page is open. Storage only decides whether the attacker
leaves with something **long-lived**.

## Options

**A — both tokens in `localStorage`.** Simplest, and the common tutorial answer.
XSS, or any browser extension with access to the page, exfiltrates a seven-day
refresh token.

**B — access token in memory, refresh token in `localStorage`.** Half the
benefit and most of the complexity.

**C — access token in memory, refresh token in an `httpOnly` cookie.** The
conventional API answer. JavaScript holds the access token; every page load must
call `/auth/refresh` before any data can be fetched.

**D — both tokens in `httpOnly` cookies.** No token is ever readable by
JavaScript. A reload within the access lifetime needs no extra round trip.

## Decision

**D.** Raised by Adedayo, against a first recommendation of C.

For this project specifically: one browser client, a deployment planned on
subdomains of one domain (so `SameSite=Strict` works across them), a JSON-only
API, and WebSockets in Milestone 4 — where the browser's `WebSocket` API cannot
set an `Authorization` header at all, but sends cookies on the handshake.

- `access_token`: `Path=/`, `Max-Age` = 15 minutes
- `refresh_token`: `Path=/auth` — not `/auth/refresh`, because logout must see it
  to revoke the token server-side
- both `HttpOnly`, `SameSite=Strict`, `Secure` (see consequences)
- login, refresh and logout return `204` with no body; no token ever appears in
  a response body
- logout is a server endpoint, because JavaScript cannot delete an `httpOnly`
  cookie

## Consequence

**CSRF now applies to every endpoint**, because cookies are sent automatically.
Three layers cover it: `SameSite=Strict` withholds the cookie from cross-site
requests; the API accepts only JSON, which an HTML form cannot send; and any
cross-origin JSON request is preflighted and refused by the CORS policy, so the
real request is never sent.

**One identity per cookie jar.** Cookies are ambient and per-domain; bearer
tokens were explicit and per-request. A browser profile, or httpyac's jar, holds
one logged-in user — switching means logging in again.

**`Secure` is configurable, defaulting to on.** Browsers treat `http://localhost`
as a secure context; httpyac's cookie jar (tough-cookie, following RFC 6265
strictly) does not, and refuses to send a `Secure` cookie over plain HTTP. So
`COOKIE_SECURE` exists, defaults to `true`, and only the exact string `"false"`
disables it. Never via `NODE_ENV`, where a wrong value would silently ship
cookies without `Secure`. Set only in a local `.env`.

**Plain `GET`s are no longer preflighted.** With no `Authorization` header, a
cookie-only `GET` is a simple CORS request — one fewer round trip per read.

**A mobile client would need a separate bearer path.** Not built; there is no
mobile app on the roadmap. If added, it must follow one rule: **cookie in →
cookie out, body in → body out, never cookie in → body out.** A refresh endpoint
that accepts the cookie and returns tokens in the body lets XSS trigger it —
the browser attaches the cookie automatically — and read a long-lived token,
which is exactly what `httpOnly` exists to prevent.
