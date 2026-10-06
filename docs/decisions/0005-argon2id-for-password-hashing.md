# 0005 — argon2id for password hashing, via prebuilt binaries

**Date:** 2026-10-05
**Status:** Accepted

## Context

Increment 1.4a stores passwords. The requirement is a salted, deliberately slow,
one-way hash — not a fast general-purpose one like SHA-256, which is designed to
hash large files quickly and therefore to be guessed quickly too.

Two choices follow: which algorithm, and which package.

## Options

**bcrypt** — 1999, extremely battle-tested, one tuning knob. Silently truncates
input at 72 bytes, so a long passphrase is no stronger than its first 72
characters. Resists GPU cracking only somewhat.

**argon2id** — won the 2015 Password Hashing Competition, and the current
recommendation for new systems. Memory-hard by design, which is what actually
defeats the GPU hardware attackers use. Three tuning parameters rather than one:
more control, more ways to misconfigure.

Separately, for packaging: the `argon2` npm package is a C++ addon compiled at
install time by node-gyp. `@node-rs/argon2` ships prebuilt Rust binaries per
platform, including musl for Alpine.

## Decision

**argon2id**, via **`@node-rs/argon2`**, at OWASP's minimum parameters:
`memoryCost: 19456` (19 MiB), `timeCost: 2`, `parallelism: 1`.

Prebuilt binaries because increment 1.7 builds a multi-stage Docker image, and
native addons compiled in a build stage can fail in a slimmer runtime stage. A
prebuilt binary sidesteps a class of problem rather than solving it later.

A note on the choice, recorded honestly: bcrypt was already familiar and argon2
was not. Picking the unfamiliar one is legitimate on a learning project, but it
is a real tradeoff — there is less hard-won experience to fall back on when it
misbehaves.

## Consequence

- The parameters live inside the hash string itself
  (`$argon2id$v=19$m=19456,t=2,p=1$...`), so raising them later does not
  invalidate existing passwords. Old hashes verify with their own parameters.
- 19 MiB per hash with `parallelism: 1` is a capacity figure, not just a
  security one: a hundred concurrent logins is 1.9 GB of memory in flight. It
  will need revisiting before load testing in Milestone 5.
- `MaxLength(128)` on every password field is load-bearing, not cosmetic.
  Hashing is the most expensive thing an unauthenticated endpoint does.
- This decision does **not** extend to refresh tokens. Those are hashed with
  SHA-256 — see ADR 0006 — because the reasoning that makes argon2 right for
  passwords makes it wrong for high-entropy random values.
