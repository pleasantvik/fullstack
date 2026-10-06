# 0006 — Refresh token storage, hashing, and transport

**Date:** 2026-10-06
**Status:** Accepted, with a planned revisit in Milestone 1.6

## Context

Access tokens are JWTs and cannot be revoked: once signed, a stolen one works
until it expires. That forces a short lifetime (15 minutes), which would mean
re-authenticating constantly without a second, longer-lived credential.

Increment 1.4d adds that credential. Three questions: what is it, how is it
stored, and how does it travel.

## Options and decisions

### What it is

**An opaque 32-byte random value, not a JWT.** A JWT's advantage is
verification without a database lookup. The lookup happens anyway — it is how
revocation works — so claims buy nothing and structure only adds length.

### How it is stored

**Hashed with SHA-256, not argon2.** This looks inconsistent with ADR 0005 and
is not:

- argon2 is slow because passwords are *guessable*; the slowness buys time
  against a dictionary. A 32-byte random value has 256 bits of entropy and no
  dictionary. Slowness buys nothing.
- argon2 salts every hash, so the same input hashes differently each time. That
  is exactly right for passwords and makes lookup impossible — verification
  would mean scanning every row at 19 MiB a go. SHA-256 is deterministic, so
  `tokenHash` is an indexed equality match.

**The right hash depends on what is being hashed.** Low-entropy secret a human
chose: slow and salted. High-entropy secret the system generated: fast and
deterministic.

### How it travels

**In the JSON response body, for now.** The alternative — an `httpOnly` cookie —
is more secure: JavaScript cannot read it, so cross-site scripting cannot steal
it.

It is not chosen yet because the right configuration cannot be known:

- `SameSite` depends on whether the React client in 1.6 is served from the same
  origin as the API, which the Nginx configuration in 1.9 decides.
- `Secure` requires HTTPS, which does not exist until certbot in 1.9.
- Different origins would additionally require CORS with credentials and real
  CSRF protection.

Choosing now means guessing at a deployment topology that has not been built.

## Consequence

- Rotation makes `JWT_REFRESH_TTL` an **idle** timeout: every refresh issues a
  fresh 7 days, so an active user is never logged out.
- Presenting an already-retired token revokes **every** live token for that
  user. The server cannot tell the thief from the owner, so neither keeps
  anything; the owner re-authenticates with a password, which the thief lacks.
- The retire step is a conditional `updateMany` on `revokedAt: null`, not a read
  followed by a write. Two requests racing with the same token both pass the
  read; the database decides the winner and the loser is treated as reuse.
- **Known gap:** there is no absolute session lifetime. A thief who keeps
  refreshing slides the window, and nothing collides if the real user has
  stopped using the app. The usual fix is a `familyCreatedAt` on the token
  chain. Not built.
- **Revisit in 1.6**, when the client exists and the topology is known. Moving
  to a cookie is a breaking API change: login and refresh stop returning the
  token in the body, `RefreshDto` goes away, the httpyac files change, and CSRF
  protection arrives if the origins differ. Roughly an hour, mostly in an
  increment that is touching the client anyway.
