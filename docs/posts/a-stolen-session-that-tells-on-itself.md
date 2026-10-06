**Increment:** 1.4 — Auth module
**Date drafted:** 2026-10-06
**Status:** draft

---

## LinkedIn

Here's a thing about JWTs that took me a while to properly absorb: **you cannot
log anybody out.**

A JWT is signed, not stored. Your server checks the signature and the expiry and
that's the whole conversation — there's no list to remove it from, no row to
delete. If one leaks into a log file or a browser extension, it works until it
expires and there is nothing you can do about it.

Which leaves you with one lever: make them expire fast. Mine last fifteen
minutes.

But nobody will use an app that logs them out every fifteen minutes. So you need
a second credential — long-lived, and one you *can* cancel. That means a row in
a database, and this week I built it.

**The part I found genuinely clever is what happens when one gets stolen.**

Think of a members' club that hands out single-use entry slips. You hand one in,
you're let in, and you're given a fresh slip for next time.

Now someone photographs your slip in the queue. They get there first, hand in
their copy, and walk in with a fresh slip of their own.

You arrive and hand in yours. The doorman checks the ledger: that slip was used
forty minutes ago. **There are two copies in circulation — and he cannot tell
which of you is the member.** You're both holding a piece of paper.

So he can't adjudicate. He can only invalidate. He cancels the entire book and
you come to the desk with ID.

The thief got one evening. Without the ledger, they'd have had unlimited
evenings and nobody would ever have found out.

**In code that means:** every refresh issues a new token and retires the old
one. If a retired token is ever presented again, every live token for that user
is revoked — including ones issued seconds earlier to whoever refreshed
successfully.

The test that proves it isn't the obvious one. "The old token stops working" is
just rotation; an expired token does that too. The test that matters is that a
**valid, unexpired, never-used token also dies** — killed as collateral because
something else in its chain was replayed. Watching that return 401 was the
moment the whole thing clicked.

The real user re-authenticates with their password. The thief doesn't have one.

**Second thing I got wrong first, and it surprised me.**

I hash passwords with argon2 — deliberately slow, deliberately memory-hungry,
because the entire job is making guessing expensive.

So I reached for argon2 to hash the refresh tokens too. Consistent, right?

Wrong, for two reasons.

Argon2 is slow because **passwords are guessable**. People pick words. The
slowness buys time against a dictionary. A refresh token is 32 bytes from a
cryptographic random generator — there is no dictionary, and no amount of
hardware brute-forces 256 bits. The slowness buys nothing and costs every user
19 MB of memory per login.

And argon2 **salts** every hash, so the same input hashes differently each time.
That's exactly what you want for passwords — and it makes lookup impossible. To
check a token I'd have to read every row and verify each one individually.

So refresh tokens get SHA-256. Fast, deterministic, an indexed column.

**The right hash depends on what you're hashing.** Low-entropy secret a human
chose: slow and salted. High-entropy secret your system generated: fast and
deterministic. "Use the strong one everywhere" is the wrong instinct, and it
took me a minute to see why.

Next: tasks. Which means ownership — and the first time "are you allowed to
touch *this particular thing*" becomes a different question from "who are you".

#DevOps #BuildInPublic #Security #NodeJS

---

## X / Twitter

**1/**
A thing about JWTs that took me a while to absorb:

**You cannot log anybody out.** 🧵

**2/**
A JWT is signed, not stored.

Server checks signature + expiry. That's the whole conversation.

No list to remove it from. No row to delete.

Leaks into a log file? It works until it expires and you can do nothing.

**3/**
One lever: make them expire fast. Mine last 15 minutes.

But nobody uses an app that logs them out every 15 minutes.

So you need a second credential. Long-lived, and one you CAN cancel.

That means a database row.

**4/**
The clever part is what happens when one gets stolen.

**5/**
Picture a club handing out single-use entry slips.

Hand one in → you're let in → you get a fresh slip for next time.

**6/**
Someone photographs your slip in the queue.

They get there first, hand in the copy, walk in with a fresh slip of their own.

**7/**
You arrive. Hand yours in.

Doorman checks the ledger: used 40 minutes ago.

Two copies exist. And he **cannot tell which of you is the member.**

You're both holding a piece of paper.

**8/**
He can't adjudicate. He can only invalidate.

Cancel the whole book. Come to the desk with ID.

Thief gets one evening.

Without the ledger: unlimited evenings, nobody ever finds out.

**9/**
In code:

Every refresh issues a new token and retires the old one.

Present a retired token → every live token for that user is revoked. Including
ones issued seconds ago to whoever refreshed successfully.

**10/**
The test that proves it isn't the obvious one.

"Old token stops working" = rotation. An expired token does that too.

**11/**
The test that matters:

A **valid, unexpired, never-used** token also dies.

Killed as collateral because something else in its chain was replayed.

Watching that 401 was the moment it clicked.

**12/**
Second thing I got wrong first 👇

**13/**
I hash passwords with argon2. Deliberately slow, memory-hungry — the job is
making guessing expensive.

So I reached for argon2 on refresh tokens too. Consistent, right?

Wrong. Twice over.

**14/**
Argon2 is slow because **passwords are guessable**. People pick words. Slowness
buys time against a dictionary.

A refresh token is 32 random bytes. No dictionary. Nothing brute-forces 256 bits.

The slowness buys nothing and costs 19MB per login.

**15/**
And argon2 **salts** every hash — same input, different output each time.

Perfect for passwords. Makes lookup impossible.

I'd have to read every row and verify each one individually.

**16/**
So: refresh tokens get SHA-256. Fast, deterministic, indexed column.

**The right hash depends on what you're hashing.**

Human-chosen secret → slow + salted.
System-generated random → fast + deterministic.

**17/**
"Use the strong one everywhere" is the wrong instinct.

Took me a minute to see why.

**18/**
Next: tasks.

Which means ownership — the first time "are you allowed to touch THIS thing" is
a different question from "who are you".
