**Increment:** 1.2a — Postgres in a container
**Date drafted:** 2026-09-12
**Status:** draft

---

## LinkedIn

My database now runs in a container, and the most useful thing I learnt this
week was the difference between two commands that look almost identical.

    docker compose down      stops everything. My data is fine.
    docker compose down -v   stops everything. My data is gone.

Two characters. No confirmation prompt. No undo.

That sounds like a trap, and it is — but it's a deliberate one, and
understanding why it exists is the actual lesson.

**A container is disposable. Its data must not be.**

Containers are designed to be thrown away and recreated — that's the whole
point of them. But a database's entire job is to remember things. So the data
can't live inside the container; it lives in a *volume*, which is storage that
Docker manages separately and outlives any container attached to it.

**The trap is the volume you get by accident.**

If you don't say where the data goes, the Postgres image creates one for you
anyway — an *anonymous* volume, named something like `f3a91c...`. It works
perfectly. It also gets orphaned the moment you remove the container, and
you're left with an unlabelled blob of disk you'll never dare delete because
you can't tell what's in it.

So I named mine. `task-manager-postgres-data`. One line of config, and now the
storage has an obvious owner:

    volumes:
      - postgres_data:/var/lib/postgresql/data

Then I tested it properly rather than assuming: put data in, `down`, back up,
data still there. `down -v`, back up, fresh empty database. Now I know which
command I'm typing and why.

**Two other things I'd have got wrong by default:**

*"Running" is not the same as "ready".* A Postgres container reports itself as
up several seconds before it will actually accept a connection. If another
service starts in that gap, it crashes on a database that is right there and
simply isn't listening yet. A healthcheck running `pg_isready` reports the
second thing, not the first — so Compose can tell the difference, and later on
my API can wait for it.

*`postgres:latest` is not a version.* It's a moving pointer. One day it quietly
becomes Postgres 17 and something subtle changes underneath me. I pinned to
`postgres:16` — the major version, so the SQL semantics are fixed, but patch
releases and security fixes still arrive.

None of this is hard. All of it is the kind of thing you only learn by getting
it wrong at an inconvenient moment — or by reading the manual before you need
it, which is cheaper.

Next: Prisma, the schema, and my first migration.

#DevOps #Docker #PostgreSQL #BuildInPublic

---

## X / Twitter

**1/**
My database runs in a container now.

Best thing I learnt: two commands that look identical and aren't 🧵

**2/**
    docker compose down
    → stops everything. Data is fine.

    docker compose down -v
    → stops everything. Data is gone.

Two characters. No prompt. No undo.

**3/**
Why the trap exists:

Containers are meant to be thrown away and recreated.
A database is meant to remember things.

So the data can't live in the container. It lives in a volume — storage Docker
manages separately, which outlives the container.

**4/**
The real trap isn't the flag. It's the volume you get by accident.

Don't say where data goes and Postgres makes one anyway — an *anonymous* volume
called something like f3a91c...

Works fine. Gets orphaned when the container is removed.

**5/**
Now you have an unlabelled blob of disk you'll never delete, because you can't
tell what's in it.

So I named mine:

    volumes:
      - postgres_data:/var/lib/postgresql/data

task-manager-postgres-data. Obvious owner.

**6/**
Then I actually tested it instead of assuming:

data in → down → up → still there ✅
down -v → up → empty database ✅

Now I know which command I'm typing.

**7/**
Two more things I'd have got wrong by default.

**8/**
"Running" ≠ "ready".

Postgres reports up seconds before it accepts connections. Anything starting in
that gap crashes on a database that's right there and just isn't listening yet.

A pg_isready healthcheck reports the second thing.

**9/**
postgres:latest isn't a version. It's a moving pointer.

One day it silently becomes Postgres 17 and something subtle shifts under you.

Pinned to postgres:16 — SQL semantics fixed, security patches still arrive.

**10/**
None of this is hard.

All of it is the kind of thing you learn by getting it wrong at a bad moment —
or by reading first, which is cheaper.

Next: Prisma, schema, first migration.
