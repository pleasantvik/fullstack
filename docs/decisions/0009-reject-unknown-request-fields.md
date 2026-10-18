# 0009 — Reject unknown request fields

**Date:** 2026-10-18
**Status:** Proposed — decide and implement at the start of 1.7

## Context

The global `ValidationPipe` runs with `whitelist: true`: properties with no
decorator on the DTO are **stripped** before the handler sees them. That is what
keeps `userId` out of task bodies (1.5).

In 1.6g the first version of the done checkbox sent `PATCH /tasks/:id` with
`{ "done": true }`. The API has `status`, not `done`. The field was stripped,
`updateMany` ran with an empty `data`, and the API answered **200 with the task
unchanged**. Nothing anywhere reported a problem - not the network tab, not the
logs. It was reproduced on purpose to confirm.

## Options

**Keep stripping (`whitelist: true` only).** Tolerant: an older or newer client
sending an extra field still works. The cost is that a misspelt or misremembered
field is a silent no-op, and a PATCH whose every field is unknown succeeds
having done nothing.

**Reject (`whitelist: true, forbidNonWhitelisted: true`).** An unknown property
becomes a **400** naming it ("property done should not exist"). Mistakes fail
loudly at the first request. The cost is strictness: every client must send
exactly the contract. It applies to query strings too, so an unknown query
parameter (a cache-buster such as `?_=123`) would also be a 400.

**Also reject empty PATCH bodies.** Independent of the above: `{}` is never a
meaningful update and could answer 400.

## Recommendation

**Reject unknown fields, and reject an empty PATCH.** There is one client, owned
by the same person, so tolerance buys nothing today, and the bug it hid cost
real debugging time. `userId` stays protected - it becomes a 400 instead of
being dropped, which is more honest about what happened.

Revisit if a public or versioned API ever has clients that cannot be updated in
step with the server.

## Consequences

- The API's 400 responses become part of the frontend's error handling: a 400 on
  a mutation is a bug in our own client, not a user mistake, and should be
  visible in development.
- httpyac request files must send exactly the DTO fields.
- Query parameters are held to the same rule - no ad-hoc parameters.
