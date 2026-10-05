**Increment:** 1.3 — NestJS scaffold and config
**Date drafted:** 2026-10-05
**Status:** draft

---

## LinkedIn

The project generator asked whether I wanted observability. Distributed tracing,
metrics, alarms, free tier. I said yes, obviously.

It wired a commercial SaaS into my application's root module, with a placeholder
for an account key, and told me where to sign up.

I only noticed because I'd generated the scaffold into a throwaway directory
specifically to **read** it rather than use it — my project already had its own
`package.json`, and the generator would have overwritten it. So instead of a
working app I had fifteen files to go through, and one of them had a third party
in it.

That's the whole lesson, and it isn't about that library — which is a perfectly
reasonable product that I'd just rather not be signed up to by a default.

**A default is a decision someone else made and chose not to mention.**

The same thing happened three more times in one afternoon.

**My package manager handed me a version that didn't fit.** `npm view typescript
dist-tags` says `latest: 7.0.2`. The Nest CLI depends on `~6.0.2`. Install the
default and your compiler and your build tool disagree about the language.
Twenty seconds of checking, caught before installing — which is only because
exactly this had bitten me three weeks earlier with a different package, where I
didn't check.

**An unrelated install silently deleted my database client.** Prisma's legacy
generator writes its output *inside* `node_modules`. So adding a package — any
package — wipes it. The error that surfaces is `Module '@prisma/client' has no
exported member 'PrismaClient'`, which reads like a version problem or a bad
import. It isn't. The directory it points at was deleted by `pnpm add`, three
weeks after it was created. Fixed by moving generated output into my own source
tree where installs can't reach it.

**A code generator made a network call and wrote editor config.** Running
`prisma generate` fetched AI-agent instruction files from GitHub and created
`.agents/`, `.claude/` and `.windsurf/` directories in my project. Three
editors, two of which I don't use. No prompt, no flag to disable it, no mention
in the output.

None of these are bugs. Every one is a default. And the common feature is that
**nothing went wrong at the moment the decision was made** — the app ran, the
install succeeded, the generator reported success.

The habit that catches all four costs about five seconds: before accepting what
a tool gives you, ask what it actually did. Check what a version resolves to.
Generate into a throwaway directory and read it first. Run `git status` after
any command that writes files.

**What I actually built**, underneath all that: a backend that refuses to start
if its environment is wrong — naming the variable, before it binds a port rather
than on the first request at 2am. One database connection pool for the whole
process, opened at startup and returned on shutdown, instead of every class
quietly opening its own until the database starts refusing connections. And
structured logs where every line produced while handling a request carries the
same id, so one request's story can be pulled out of thousands of interleaved
lines.

It serves no routes yet. A request to `/` returns 404. That's correct — the
scaffolding goes up before the building does.

Next: auth. Register, login, and refresh tokens that can actually be revoked.

#DevOps #BuildInPublic #NestJS #TypeScript

---

## X / Twitter

**1/**
The generator asked if I wanted observability. Free tier, tracing, metrics.

I said yes, obviously.

It wired a commercial SaaS into my root module and asked me to sign up 🧵

**2/**
I only caught it because I'd generated the scaffold into a throwaway dir to
READ it, not use it.

My project already had a package.json the generator would have overwritten.

So I got 15 files to review instead of a working app. One had a third party in it.

**3/**
Not a criticism of that library. It's a fine product.

The lesson is the shape of it:

**A default is a decision someone else made and chose not to mention.**

**4/**
Same thing, three more times that afternoon.

**5/**
`npm view typescript dist-tags` → latest: 7.0.2
Nest CLI depends on → ~6.0.2

Install the default and your compiler and your build tool disagree about the
language.

Caught it in 20 seconds — only because the identical thing bit me 3 weeks ago
with a different package.

**6/**
An unrelated install silently deleted my database client.

Prisma's legacy generator writes INSIDE node_modules.

So `pnpm add <anything>` wipes it.

**7/**
The error you get:

    Module '@prisma/client' has no exported
    member 'PrismaClient'

Reads like a version problem. Reads like a bad import.

It's neither. The directory was deleted by an install, 3 weeks after it was
created.

Fix: generate into my own source tree, where installs can't reach.

**8/**
`prisma generate` made a network call and wrote editor config.

Fetched AI-agent instruction files from GitHub. Created .agents/, .claude/ and
.windsurf/ in my repo.

Three editors. I use one. No prompt, no flag to disable.

**9/**
None of these are bugs. Every one is a default.

And the common feature: nothing went wrong when the decision was made.

The app ran. The install succeeded. The generator said ✔.

**10/**
The habit that catches all four costs ~5 seconds:

→ check what a version actually resolves to
→ generate into a throwaway dir and read it first
→ `git status` after anything that writes files

Ask what the tool actually did.

**11/**
What I built under all that:

A backend that refuses to start if its env is wrong — naming the variable,
before binding a port. Not at 2am on the first request.

**12/**
One connection pool for the whole process. Opened at startup, returned at
shutdown.

The alternative is every class quietly opening its own until Postgres starts
refusing connections — and the error reads like the database is too small.

**13/**
Structured logs where every line from one request carries the same id.

So you can pull one request's story out of thousands of interleaved lines.

Hospital wristband, basically.

**14/**
It serves no routes. GET / returns 404.

Correct. Scaffolding goes up before the building does.

Next: auth. Register, login, and refresh tokens that can actually be revoked.
