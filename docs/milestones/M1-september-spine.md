# Milestone 1 — September: the delivery spine

**Feature shipped:** register, login, task CRUD, board UI
**Infrastructure unlocked:** Docker, compose, CI, EC2, Nginx, TLS
**Done when:** a one-line copy change goes from PR to live production in under five minutes, without touching the server

---

## Why this shape

This month is deliberately thin on product and heavy on infrastructure. Only auth and task CRUD ship, but they ship *all the way* — real domain, HTTPS, automated pipeline.

It is the hardest and least satisfying month. Everything afterwards is an increment on a running system, which is the only way deployment becomes muscle memory rather than something looked up each time.

---

## Increments

### 1.1 — Repo scaffold
pnpm workspaces, folder structure, `.env.example`, `.gitignore` (verify `.env` is excluded *before* the first commit), README a stranger could follow, branch protection on `main`.

*Concept focus:* why a monorepo here; what branch protection buys a solo developer.

### 1.2 — Database and Prisma
Postgres in Docker locally. Prisma schema v1 — `User`, `RefreshToken`, `Task`, two enums. First migration. Prisma Studio to inspect.

*Concept focus:* migrations as versioned, committed artifacts. `migrate dev` vs `migrate deploy`.

### 1.3 — NestJS scaffold and config
App module, config module with schema-validated env vars, global validation pipe, Pino structured logging with request IDs.

*Concept focus:* fail-fast config. A missing `DATABASE_URL` should crash at boot with a clear message, not throw a null error on the first request at 2am.

### 1.4 — Auth module
Register, login, JWT access tokens, refresh token rotation with hashed storage, guards, `/auth/me`.

*Concept focus:* why refresh tokens are stored hashed, what rotation prevents, where a guard sits in the request lifecycle.

### 1.5 — Tasks module and health endpoint
CRUD with DTOs and class-validator, ownership enforcement, filtering by status / priority / search / overdue. `/health` with a real database probe, built now rather than later.

*Concept focus:* the health endpoint is load-bearing — Docker healthchecks, Nginx, and all future monitoring hang off it.

### 1.6 — Frontend
Vite scaffold, design tokens from `docs/design/ui-spec.md`, routing, auth pages, board view, task modal, TanStack Query wiring.

*Concept focus:* where the auth token lives and why; optimistic updates and rollback on failure.

### 1.7 — Containerise
Multi-stage Dockerfile for api (build → prune → slim runtime, non-root user). Multi-stage for web (build → static, served by Nginx). `.dockerignore` for both. `docker-compose.yml` with healthchecks and `depends_on` conditions.

*Concept focus:* image layers and cache invalidation, why non-root matters, why the build stage is discarded.

### 1.8 — CI
GitHub Actions on PR: install, lint, type-check, test, build. On merge to main: build and push tagged images to GHCR. Required status checks on the protected branch.

*Concept focus:* the deploy artifact is an image, not a git pull. Tagging strategy.

### 1.9 — Server and Nginx
EC2 instance, security groups, Docker installed, Nginx reverse proxy, TLS via certbot, DNS pointed at an Elastic IP.

**The first deploy is done by hand, step by step, with every command written down.** Those notes become `docs/runbook.md`, then the deploy script.

*Concept focus:* what a reverse proxy actually does; why TLS terminates at Nginx.

### 1.10 — Automated deploy and first rollback
Deploy workflow: pull image, run `migrate deploy`, restart, verify `/health`. Deploy three more times. Then roll back on purpose and confirm it works.

*Concept focus:* a rollback tested before it's needed is the only kind that counts.

---

## UI scope this month

Login, Register, Board (three status columns), Task detail modal, empty and loading states. Design tokens established. Nothing else — see `docs/design/ui-spec.md`.


---

## Increment notes

### 1.1 — Repo scaffold *(2026-08-29)*

**What I built:** git repo on `main` with `.gitignore`, `.gitattributes` (LF
normalisation, since dev is Windows and CI/containers are Linux) and `.nvmrc`
landed in the first commit, before anything else. pnpm workspace globbing
`apps/*` with `api` and `web` as unscoped members. Node 22 and pnpm 11.24.0
pinned via `.nvmrc` and `packageManager`. README documenting only what exists.
Empty `.env.example`. Pushed to GitHub, `main` protected by a ruleset requiring
a pull request, blocking force-push and blocking deletion.

**What broke, and why:**

1. *Branch protection is not available on private repos on the free plan.* Made
   the repo private to avoid publishing an employer name, then hit a 403 from
   GitHub. Went public with the identifying line removed instead. The lesson:
   check what a platform decision costs before making it, not after.
2. *Softening a line in a new commit does not remove it from history.* The
   original wording was in all four commits and `git log -p` would have shown
   it on a public repo. Fixed with `git filter-branch --tree-filter`, which
   rewrote every SHA and required a force-push. Trivial at four commits;
   this is the same lesson as gitignoring `.env` before the first commit,
   arriving from the other direction.
3. *A GitHub ruleset silently defaulted `require_extra_approval_for_unattributed_changes`
   to `true`.* On a solo repo with an unverified commit email that would have
   made every PR unmergeable. Caught by reading back the effective rules
   instead of trusting the create call.

**What I would do differently:** Rather than setting `user.name` and `user.email`
by hand on this repo, set up a proper separation between my personal and work
GitHub identities from the start — separate SSH keys, and a git config that
selects the right identity automatically based on where the repo lives on disk.
Per-repo config works, but it depends on remembering every time, and the failure
is silent: commits land under the wrong name and I find out much later.
Everything else in this increment was new, and I learnt it by building it.


### 1.2a — Postgres in a container *(2026-09-12)*

**What I built:** `docker-compose.yml` at the repo root declaring one
`postgres:16` service. It replaces a `docker run` command that would otherwise
have existed only in my shell history, which is what makes "works on a clean
checkout" true rather than aspirational. Credentials are interpolated from
`.env` rather than hardcoded, even locally. Data lives in a **named** volume,
`task-manager-postgres-data`, not the anonymous one the Postgres image creates
on its own and orphans as soon as the container is removed. A `pg_isready`
healthcheck means `docker compose ps` reports *ready to accept connections*
rather than merely *running* — increment 1.7 will gate the API on it with
`depends_on: condition: service_healthy`. The image is pinned to the major
version: `latest` would silently roll to Postgres 17 one day and change SQL
semantics underneath me, while pinning the patch would mean never receiving
security fixes. `.env.example` gained `POSTGRES_USER`, `POSTGRES_PASSWORD`,
`POSTGRES_DB` and `DATABASE_URL`.

I proved the two commands do what I think they do rather than assuming: wrote
data, `docker compose down`, brought it back up, data still there; then
`docker compose down -v`, back up, empty database. That distinction is the
whole concept focus of this increment and it cost about four minutes to verify.

**What broke, and why:** Nothing. The increment went cleanly first time. Worth
recording as much as a failure would be — the reason it went cleanly is that
the concepts were talked through in the previous session and the file was
written once, deliberately, rather than assembled by trial and error.

**What I would do differently:** Little, on this evidence. The one thing I now
know and would otherwise have discovered at a bad moment: `POSTGRES_USER`,
`POSTGRES_PASSWORD` and `POSTGRES_DB` only take effect on the volume's *first*
start. Editing them in `.env` later changes nothing until the volume is
destroyed. That is harmless locally and would be a genuinely confusing hour on a
server, so the behaviour is commented in both `docker-compose.yml` and
`.env.example` rather than left to memory.


### 1.2b — Prisma and schema v1 *(2026-09-12)*

**What I built:** Prisma installed into `apps/api`, pinned to `^7.10.0`.
`schema.prisma` with three models — `User`, `RefreshToken`, `Task` — and two
Postgres enum types. UUID primary keys stored as native `uuid`, not text.
Refresh tokens stored as a hash with a nullable `revokedAt`, because rotation in
1.4 needs to know *when* a token was revoked, which a boolean cannot express.
`ON DELETE CASCADE` on both foreign keys, enforced by the database rather than
by application code. Tables mapped to `snake_case` while the models stay
PascalCase in TypeScript. No `workspaceId` — teams are Milestone 3.

The first migration is generated and committed at
`prisma/migrations/20260912213046_init/`, and the database now carries a
`_prisma_migrations` table with one row recording that it ran. That table is the
whole concept of this increment made concrete: the migration is a file in git,
and the database keeps its own record of which files it has already applied.

Three `db:*` scripts in `apps/api/package.json` wrap every Prisma command with
`dotenv-cli`, so the repo-root `.env` stays the single place the password lives.

**What broke, and why:**

1. *`pnpm add prisma` installed a release candidate.* Prisma publish
   `8.0.0-rc.14` under the `latest` dist-tag, and `latest` is what `pnpm add`
   asks for. I ended up with pre-release software and an unexplained 50 MB of
   Cloudflare and Rolldown packages. This is the same lesson as pinning
   `postgres:16` in 1.2a, arriving from a direction I wasn't watching — I
   pinned the database deliberately and then let the package manager choose
   for me five minutes later. ADR 0003 records the decision to stay on 7.x.
2. *Prisma 7 removed `url` from the datasource block.* The connection string now
   lives in `prisma.config.ts` and the schema describes only the shape of the
   database. A sensible change, and a reminder that a major version bump is a
   different tool wearing the same name.
3. *`pnpm approve-builds` silently declined Prisma's engine.* pnpm 10 onward
   blocks postinstall scripts by default, which is right — a postinstall is
   arbitrary code running at install time. I declined `@prisma/engines` without
   registering what it was for, so the query engine never downloaded and the
   client never generated. Migrations still worked, because Prisma 7 validates
   schemas with WebAssembly and needs no binary for that. The failure would have
   surfaced in 1.4 as a missing import, a month away from its cause. `pnpm
   install` does not re-run a script it previously skipped; `pnpm rebuild` does.

**What I would do differently:** Check what a version specifier actually
resolves to before committing it, rather than after. `npm view <pkg> dist-tags`
takes five seconds and would have caught the release candidate immediately —
the same shape as the `HypervisorPresent` check that would have saved an hour in
ADR 0002. Twice now the cost has been an avoidable detour, and both times the
missing step was one cheap command asking the system what is actually true
instead of assuming the default was sensible.

The other change: every Prisma command now goes through a named `db:*` script
rather than being typed directly. Three separate failures in this increment came
from running `prisma` bare without the environment it needs. Making the correct
form the only form removes the possibility.


### 1.3 — NestJS scaffold and config *(2026-10-05)*

Split into four slices: 1.3a scaffold and DI, 1.3b fail-fast config, 1.3c
PrismaService and connection lifecycle, 1.3d structured logging.

**What I built:** a NestJS 12 application in `apps/api`, ESM, that boots,
validates its environment before binding a port, holds exactly one Prisma
connection pool, and logs structured JSON.

*1.3a.* Nest installed and the scaffold hand-picked rather than generated in
place - `nest new` writes its own `package.json` and would have destroyed the
`db:*` scripts. Generated it into a throwaway directory instead, read it, and
copied across the four files that belonged. `AppModule` deliberately empty.

*1.3b.* One schema naming every environment variable the service needs, checked
during module initialisation. `class-validator` rather than Joi, because the
roadmap already commits to class-validator for DTOs in 1.5 and the global
`ValidationPipe` is built on it - two validation libraries doing the same job
would be a long-term tax. The presence of a default is the optionality marker:
`PORT` and `LOG_LEVEL` have one, `DATABASE_URL` does not, and `JWT_SECRET` in
1.4 must not.

*1.3c.* `PrismaService extends PrismaClient`, injected `ConfigService` so the
connection string is the validated one. Prisma 7 requires a driver adapter;
`PrismaPg` owns the pool. `$connect()` in `onModuleInit` rather than relying on
lazy connection, so a wrong password fails at boot - config validation proves
`DATABASE_URL` is well-formed, not that it works. `PrismaModule` is deliberately
not global, unlike `ConfigModule`: a module importing it is declaring that it
touches the database.

*1.3d.* pino via `nestjs-pino`, so framework logs become JSON too. A UUID
request id that adopts an upstream `X-Request-Id` if one exists - which matters
once Nginx is in front in 1.9 and a load balancer in Milestone 4 - and echoes it
back to the caller. `authorization` and `cookie` headers redacted, because
without that every authenticated request from 1.4 would write its bearer token
to disk and, in Milestone 5, to a log aggregator.

**What broke, and why:**

1. *An installer prompt nearly signed the project up to a telemetry vendor.*
   `nest new` asks "Would you like to set up @nestjs/observe?" and the answer
   defaults to yes. It wires a commercial SaaS into `AppModule` and `main.ts`,
   wanting an account key. Observability is Milestone 5 and self-hosted - the
   whole point is building it. Caught only because the scaffold was generated
   into `/tmp` to be read rather than used.
2. *`latest` disagreed with the toolchain.* npm's `latest` for TypeScript is
   7.0.2; `@nestjs/cli` depends on `~6.0.2`. Caught **before** installing this
   time, by checking rather than assuming - which is the habit ADR 0003 cost me
   a detour to learn three weeks ago.
3. *An unrelated install silently deleted the Prisma client.* The legacy
   `prisma-client-js` generator writes into `node_modules/.prisma`, so
   `pnpm add @prisma/adapter-pg` destroyed it. The error -
   `Module '"@prisma/client"' has no exported member 'PrismaClient'` - describes
   a missing export, not a deleted directory, so it reads like a version
   problem. ADR 0004 records the switch to the `prisma-client` generator with
   output inside the source tree.
4. *`prisma generate` wrote editor config I never asked for.* It fetches AI-agent
   skill files from GitHub and creates `.agents/`, `.claude/`, `.windsurf/` and
   `skills-lock.json`, unconditionally, with no opt-out in 7.10.0. A code
   generation step making a network call and writing config for editors I don't
   use. Gitignored; the unused two deleted.
5. *The shutdown log vanished in development.* After 1.3d,
   `Database connection closed` stopped appearing on Ctrl+C. Two candidate
   causes: the hook had stopped running, or the log was being lost. Tested it by
   removing the variable - ran with `NODE_ENV=production`, which disables the
   `pino-pretty` transport - and the line reappeared. `pino-pretty` runs in a
   worker thread and the main thread exits before it flushes. Dev-only and
   cosmetic; production has no transport, so 1.10 will still see the drain.
   Left as is, deliberately.

**What I would do differently:** *(Adedayo - this section is mine to rewrite)*

The thread running through four of those five is the same: **a tool made a
decision on my behalf and did not say so.** A default-yes prompt, a dist-tag
pointing at a pre-release, a generator writing into a directory that another
command owns, a build step fetching from the network. None of them were bugs.
All of them were defaults, and a default is a decision someone else made and
chose not to mention.

The habit that catches all four is the same one ADR 0002 and ADR 0003 already
pointed at from different directions: before accepting what a tool gives you,
spend five seconds asking what it actually did. `npm view <pkg> dist-tags`.
Generate into a throwaway directory and read it. `git status` after any command
that writes files.

Two process changes this increment, both mine to ask for and worth keeping:
one file at a time with an explanation before moving on, and - where a pattern
has already been taught once - instructions instead of code, so I write it
myself. The second one found a real gap immediately: I could place a module in
an `imports` array correctly but described the failure as "it won't build",
when it builds perfectly and fails at boot.


### 1.4 — Auth module *(2026-10-06)*

Split into four slices plus two additions that are not on the roadmap: httpyac
request files and OpenAPI docs.

**What I built:** register, login, a global guard, `/auth/me`, and refresh token
rotation with reuse detection.

*1.4a.* argon2id via `@node-rs/argon2` at OWASP's minimum parameters, prebuilt
rather than compiled so the Docker build in 1.7 needs no node-gyp. ADR 0005. The
first DTO, which finally made the `ValidationPipe` from 1.3b do something.
Uniqueness enforced by the Postgres index and surfaced by catching P2002, not by
a check-then-act read that would race.

*1.4b.* `JwtModule.registerAsync` taking the secret and lifetime from the
validated manifest. Verification runs unconditionally against a throwaway hash
when the email is unknown, so an absent user costs the same as a present one -
a mitigation rather than a guarantee, since registration already leaks
enumeration by design. One 401 and one message for both failure modes. The
payload carries `sub` and nothing else.

*1.4c.* The guard registered via `APP_GUARD` so every route is protected by
default, with `@Public()` as the opt-out - my choice, on the grounds that I would
rather wrongly protect a public route and hear about it than wrongly expose a
private one and not. It looks the user up rather than trusting the token's
claims, so a deleted account stops working immediately.

*1.4d.* Rotation and reuse detection. The increment this one existed for.
`refresh_tokens` finally used. SHA-256 rather than argon2, for reasons that are
the exact inverse of 1.4a's - ADR 0006. The retire step is a conditional
`updateMany` rather than a read then a write.

*Off-roadmap.* httpyac request files, committed, replacing ad-hoc curl - for the
same reason `docker-compose.yml` replaced a `docker run` command in 1.2a. And
`@nestjs/swagger` with the CLI plugin, so schemas are inferred from the DTOs
rather than restated. Both deliberate additions, neither in the plan.

**What broke, and why:**

1. *I wrote `/auth/me` so the client supplied its own id.* The handler took an
   `id` parameter and the request body carried one. It compiles, and it is a
   security bug: anyone could pass someone else's id and read their account.
   That bug class is called insecure direct object reference, and 1.5 is full of
   the same shape. The right version is shorter, because the guard had already
   done the work. I knew what the endpoint should do and could not write it -
   the gap was `createParamDecorator`, which is a convention you have to have
   seen, not derived.
2. *A parameter with no decorator is `undefined`.* Nest cannot guess where a
   handler argument comes from. That one rule would have caught the bug above
   without knowing anything about guards.
3. *I hardcoded a placeholder JWT secret while stuck on the module wiring.* It
   worked, and it would have been committed to a public repo. Worth noticing how
   it happened: not carelessness, but needing *something* in the slot to make
   progress. Which is the argument for `JWT_SECRET` having no default - the app
   cannot start on a placeholder.
4. *`inject: [AuthService]` in the JwtModule factory.* Circular:
   `AuthService` needs `JwtService`, which the factory builds. Nest would have
   reported it against `AuthModule`, where nothing looks wrong.
5. *An empty `JWT_SECRET=` in `.env` stopped the app at boot.* The first time
   fail-fast caught a real mistake rather than one I made deliberately to test
   it. `@IsNotEmpty()` is what caught it; an empty value is not a missing one.
6. *pnpm blocked installs twice over undecided build scripts.* `protobufjs` via
   httpyac's gRPC support, and `@scarf/scarf` via `@nestjs/swagger` - the latter
   being install-time analytics that reports to a third party. Both declined and
   recorded. An undecided script is not neutral: pnpm fails the install until
   you answer.

**What I would do differently:** *(Adedayo - this section is mine to rewrite)*

The thing worth keeping is the shape of the `/auth/me` mistake. Every wiring
error in this project so far has been the same: it compiles, it runs, and it is
wrong at runtime with no warning. A missing `.js`, a provider absent from
`providers`, a configured logger never passed to `useLogger`, a handler
parameter with no decorator. The habit that catches all of them is asking, of
any piece of wiring, *"what would tell me if I got this wrong?"* - and when the
answer is "nothing", testing the failing case rather than the passing one.

That is also what the two negative tests in `auth.http` are for. A passing
`/auth/me` says nothing about whether the route is protected.

Two process changes, both mine to ask for and worth keeping. Instructions
instead of code where a pattern has already been taught once - which found the
`/auth/me` gap immediately, where reading correct code would have hidden it. And
far fewer comments: explanation belongs in the conversation, not in a file I
have to read past every day afterwards.


---

## Reflection

*Fill in at the end of the milestone.*

**What I built:**

**What broke, and why:**

**What I'd do differently:**

**What I still don't understand:**
