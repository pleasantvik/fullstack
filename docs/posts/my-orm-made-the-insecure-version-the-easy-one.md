**Increment:** 1.5 — Tasks module and health endpoint
**Date drafted:** 2026-10-06
**Status:** draft

---

## LinkedIn

I added tasks to my API this week. Each one belongs to one person. Which means
every query has to answer two questions, not one:

**Who are you?** and **are you allowed to touch this particular thing?**

Those are different questions, and conflating them is how data leaks.

Picture a self-storage facility. You badge in at the gate and the barrier lifts.
The gate knows who you are. It does *not* decide which unit you may open — your
key does that, and it fits one door.

Now picture a facility where the gate is the only check. Badge in and every unit
opens. The only thing stopping you is not knowing which number is whose. So
somebody tries door 41. Then 42. Then 43.

The logs show a member who badged in correctly and opened some doors. Nothing
looks wrong anywhere.

The fix isn't better gate security. **Every door has to check the key.**

**Here's the part I didn't expect: my ORM makes the unsafe version the obvious
one.**

Prisma has `findUnique` for fetching by a unique field. Task ids are unique. So
you reach for it:

```
findUnique({ where: { id } })
```

Compiles. Fast. Looks exactly right. Hands any task to anyone who knows its id.

The safe version adds the owner:

```
findFirst({ where: { id, userId } })
```

But `findUnique` **cannot accept that** — it only takes unique fields, and
`userId` isn't unique. So the function whose name matches what you're doing is
the one that structurally forbids the ownership check. You have to know to reach
for the differently-named one.

Same for writes. `update` and `delete` take only unique `where` clauses, so
scoping them to an owner is impossible. You use `updateMany` and `deleteMany`
instead — and their return value is a **count**, which turns out to be the
ownership check:

```
const { count } = await updateMany({ where: { id, userId }, data })
if (count === 0) throw new NotFoundException()
```

Zero means no such task, or not yours. You can't tell which — and that's a
feature, see below.

I don't think this is a flaw in Prisma exactly. `findUnique` does what it says.
But **the ergonomic path and the safe path point in different directions**, and
that's worth knowing about any tool you use, because you reach for the ergonomic
one when you're tired.

**The second decision: 404 or 403?**

Someone asks for a task that's real but isn't theirs. Do you say "forbidden" or
"not found"?

403 is more truthful. It's also an oracle: it confirms the id exists. Enough
requests and you can count someone's tasks, or confirm whether an id you found
in a screenshot is live.

The rule I settled on: **403 when the caller already legitimately knows the
thing exists. 404 when knowing it exists is itself information.** "You're in
this team but not an admin" — 403, you already know the team exists. "This is a
stranger's private task" — 404. GitHub does the same for private repos.

And the implementation falls out of it for free: because ownership is inside the
query, it genuinely cannot distinguish "doesn't exist" from "not yours". The
private answer and the safe code are the same code.

**One more, which took thirty seconds to write and would have taken an hour to
find.**

I added an `?overdue=true` filter. The obvious way to convert a query parameter
to a boolean is the same mechanism I'd used for numbers and dates:

```
Boolean("false")   // true
```

Query values are strings, and every non-empty string is truthy. `?overdue=false`
would have switched the filter **on**. Not an error — the exact opposite of what
was asked, silently. And every happy-path test passes `true`, so nothing would
have caught it.

Next: the frontend, finally. Which means deciding where a token lives in a
browser — and that one has no comfortable answer.

#BuildInPublic #Security #NodeJS #Prisma

---

## X / Twitter

**1/**
Added tasks to my API. Each belongs to one person.

Which means every query answers two questions, not one:

**Who are you?**
**May you touch THIS thing?**

Conflating them is how data leaks 🧵

**2/**
Self-storage facility.

You badge in at the gate. Barrier lifts. The gate knows who you are.

It does NOT decide which unit opens. Your key does that, and it fits one door.

**3/**
Now imagine the gate is the only check.

Badge in → every unit opens.

Only thing stopping you is not knowing which number is whose.

So someone tries door 41. Then 42. Then 43.

**4/**
The logs show a member who badged in correctly and opened some doors.

Nothing looks wrong anywhere.

The fix isn't better gate security. **Every door checks the key.**

**5/**
Here's what I didn't expect:

**My ORM makes the unsafe version the obvious one.**

**6/**
Prisma has `findUnique` for fetching by a unique field.

Task ids are unique. So you reach for it:

    findUnique({ where: { id } })

Compiles. Fast. Looks right.

Hands any task to anyone who knows its id.

**7/**
Safe version adds the owner:

    findFirst({ where: { id, userId } })

But `findUnique` CANNOT accept that. It only takes unique fields. userId isn't
unique.

**8/**
So the function whose name matches what you're doing is the one that
structurally forbids the ownership check.

You have to know to reach for the differently-named one.

**9/**
Same for writes.

`update` and `delete` take only unique where clauses → can't scope to an owner.

Use `updateMany` / `deleteMany`. Their return value is a **count** — which
turns out to BE the ownership check:

    if (count === 0) throw new NotFoundException()

**10/**
Not really a flaw in Prisma. findUnique does what it says.

But **the ergonomic path and the safe path point in different directions.**

Worth knowing about any tool. You reach for the ergonomic one when you're tired.

**11/**
Second decision: someone asks for a task that's real but isn't theirs.

403 or 404?

**12/**
403 is more truthful. It's also an oracle — it confirms the id is real.

Enough requests and you can count someone's tasks, or confirm an id you found in
a screenshot is live.

**13/**
The rule I settled on:

**403** when the caller already legitimately knows it exists.
**404** when knowing it exists is itself information.

"In this team, not an admin" → 403.
"A stranger's private task" → 404.

GitHub does this for private repos.

**14/**
And the implementation falls out for free.

Ownership is inside the query, so it genuinely cannot tell "doesn't exist" from
"not yours".

The private answer and the safe code are the same code.

**15/**
Last one. Took 30 seconds to write, would have taken an hour to find.

Added an `?overdue=true` filter.

    Boolean("false")  // true

**16/**
Query values are strings. Every non-empty string is truthy.

`?overdue=false` would have switched the filter ON.

Not an error. The exact opposite of what was asked. Silently.

Every happy-path test passes `true`. Nothing would have caught it.

**17/**
Next: the frontend.

Which means deciding where a token lives in a browser.

That one has no comfortable answer.
