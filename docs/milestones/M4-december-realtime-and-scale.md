# Milestone 4 — December: realtime, and why scaling breaks things

**Feature shipped:** live task updates and notifications across workspace members
**Infrastructure unlocked:** WebSocket proxying, horizontal scaling, Redis pub/sub, load balancing, zero-downtime deploys
**Done when:** you deploy while connected in two browser tabs and neither drops a message

---

> **Increments for this milestone get written at the start of the month**, not now. What the right steps are depends on how the previous milestone actually went. Planning them in August would be the documentation equivalent of pre-building. See `CLAUDE.md` for how to break a milestone down.

## Backend

Socket.IO gateway. JWT auth on the socket handshake — note this is *not* the same as HTTP auth and the difference matters. One room per workspace. Events on task create, update, delete.

---

## The breakage is the curriculum

Run two API containers. Realtime immediately breaks: a user connected to container A never receives an event emitted from container B.

Do not skip past this. Reproduce it, understand it, then fix it. Working through it teaches:

- Nginx `Upgrade` and `Connection` headers for WebSocket proxying — and why a normal reverse proxy config silently fails
- Nginx upstream with two backends, or an ALB with target groups
- Sticky sessions, and why they're a workaround rather than a fix
- **The Redis pub/sub adapter** — the actual fix, which makes app instances stateless
- Connection draining during deploys, which is now genuinely hard

*Concept focus:* stateful vs stateless services; what "horizontally scalable" actually requires.

---

## UI scope this month

Presence indicators, live-update transitions on task cards, notification bell with dropdown, connection status indicator, reconnection handling.

---

## Reflection

**What I built:**

**What broke, and why:**

**What I'd do differently:**

**What I still don't understand:**
