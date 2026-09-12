**Increment:** 1.2b — Prisma and schema v1
**Date drafted:** 2026-09-12
**Status:** draft

---

## LinkedIn

I spent a careful ten minutes deciding not to use `postgres:latest`.

Then I typed `pnpm add prisma` and installed a release candidate without
noticing.

**What happened.** I'd just written a Docker Compose file and thought hard about
the image tag. `latest` would silently roll to Postgres 17 one day and change SQL
semantics underneath me. So I pinned to `postgres:16` — the major version, so
patches and security fixes still arrive but the SQL contract doesn't move.

Five minutes later I installed Prisma with no version at all. The download
included Cloudflare's `workerd`, `rolldown`, and 50 MB of things a database
toolkit has no business needing. That's when I looked:

    $ npm view prisma dist-tags
    latest: 8.0.0-rc.14      ← what I got
    prev:   7.10.0           ← the last stable release

`latest` is not a promise. It's a **label a maintainer applied**, and Prisma have
pointed it at a release candidate. My package manager asked for `latest` because
that's the default, and did exactly as it was told.

**The part that stings** isn't the wasted twenty minutes. It's that I had the
right instinct, applied it deliberately to one dependency, and then failed to
apply it to the next one — because in the second case a default made the decision
for me and never asked.

There's a version of this I keep relearning: **the dangerous choice is rarely the
one you think about. It's the one you don't notice you're making.**

**Two more things from the same increment.**

*A major version is a different tool wearing the same name.* Prisma 7 removed the
connection URL from the schema file entirely — it lives in a config file now, so
the schema describes only the shape of the database and never where it is. Better
design. Also a breaking change I walked straight into because I was writing from
memory rather than reading what I'd installed.

*My package manager blocked a script and I waved it through.* pnpm now refuses to
run install-time scripts unless you approve each package by name. Good — a
postinstall is arbitrary code executing before you've run a line of what you
installed, and it's a favourite route for a compromised package. I declined
Prisma's without registering what it did. The engine never downloaded, the client
never generated, and that failure would have surfaced a month later as a missing
import, nowhere near its cause.

**What I actually built**, underneath all that: three tables, two enum types, and
my first migration — a SQL file, generated, committed to git, and replayed
against production in December exactly as written. The database keeps its own
record of which migrations it has already applied, so the deploy step knows what
is left to do. A migration is an artifact, not a command.

Next: NestJS, and a config module that refuses to boot without the environment
variables it needs.

#DevOps #BuildInPublic #Postgres #Prisma #SupplyChain

---

## X / Twitter

**1/**
I spent ten careful minutes deciding not to use postgres:latest.

Then installed a release candidate five minutes later without noticing 🧵

**2/**
Context: I'd just pinned my database image to postgres:16.

Reasoning: `latest` silently becomes Postgres 17 one day and changes SQL
semantics under me. Pin the major, still get security patches.

Deliberate. Correct. Felt good about it.

**3/**
Then:

    pnpm add prisma

No version. Download includes Cloudflare workerd, rolldown, 50MB of stuff a
database toolkit shouldn't need.

So I looked.

**4/**
    $ npm view prisma dist-tags
    latest: 8.0.0-rc.14   ← what I got
    prev:   7.10.0        ← last stable

`latest` isn't a promise.

It's a label a maintainer applied. They pointed it at a release candidate.

**5/**
What stings isn't the 20 wasted minutes.

It's that I had the right instinct, applied it on purpose to one dependency, then
missed it on the next — because a default decided for me and never asked.

**6/**
The dangerous choice is rarely the one you think about.

It's the one you don't notice you're making.

**7/**
Two more from the same hour.

**A major version is a different tool wearing the same name.**

Prisma 7 removed the connection URL from the schema file. It's in a config file
now — schema describes shape, config describes location.

Better design. Still walked into it.

**8/**
**My package manager blocked a script and I waved it through.**

pnpm won't run install-time scripts unless you approve each package.

Right call — a postinstall is arbitrary code running before you've executed
anything you installed.

**9/**
I declined Prisma's without reading what it did.

Engine never downloaded → client never generated.

Would have surfaced a month later as a missing import. Nowhere near the cause.

**10/**
What I actually built under all that:

3 tables, 2 enum types, first migration.

A SQL file. Generated, committed to git, replayed against prod in December
exactly as written.

A migration is an artifact, not a command.

**11/**
Next: NestJS, and a config module that refuses to boot without the env vars it
needs.

Better to crash at startup than to throw null at 2am.
