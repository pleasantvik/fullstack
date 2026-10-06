# 0007 — 404, not 403, for resources you do not own

**Date:** 2026-10-06
**Status:** Accepted

## Context

Increment 1.5 adds tasks, each owned by one user. A request for a task id that
exists but belongs to somebody else needs an answer.

## Options

**403 Forbidden** — "this is real, and you may not have it." Truthful, and more
helpful when debugging a genuine bug in your own client.

**404 Not Found** — "there is nothing here." Indistinguishable from an id that
was never issued.

## Decision

**404.**

A 403 confirms the id is real. Enough of them and a caller can count another
user's tasks, confirm whether an id found in a screenshot or a log is live, and
map activity. None of that is information worth giving away for free.

The rule applied: **403 when the caller already legitimately knows the resource
exists; 404 when knowing it exists is itself information.** "You are in this
team but are not an admin" is a 403 — membership is already known. "This is a
stranger's private task" is a 404. GitHub does the same for private
repositories.

Implementation follows from the decision rather than the other way round:

    findFirst({ where: { id, userId } })
    updateMany({ where: { id, userId } })
    deleteMany({ where: { id, userId } })

Ownership is part of the query, so a task belonging to someone else is never
selected. The query **cannot** distinguish "no such task" from "not yours", so
404 is the only answer it is able to give — the safe shape and the private
answer are the same shape.

Returning 403 would have required finding out whether the task exists
independently of whether it is yours: a `findUnique` by id, then a comparison.
That is the fetch-then-check pattern, one forgotten `if` away from a leak, on
every endpoint that touches a task by id.

## Consequence

- Debugging own-client bugs is slightly harder: a 404 does not distinguish a
  wrong id from a wrong user. Request ids in the logs (1.3d) cover this.
- The same answer must be given consistently. A single endpoint that returns
  403 re-opens the oracle for every id, because a caller can route the question
  through whichever endpoint is most informative.
- Prisma pushes the other way. `findUnique`, `update` and `delete` accept only
  unique fields in `where`, so the obvious call for "fetch by id" cannot be
  scoped to an owner. The safe versions - `findFirst`, `updateMany`,
  `deleteMany` - are the less obvious ones, and `updateMany`/`deleteMany`
  return a count that doubles as the ownership check.
