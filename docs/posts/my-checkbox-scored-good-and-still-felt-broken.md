**Increment:** 1.6 — Frontend
**Date drafted:** 2026-10-18
**Status:** draft

---

## LinkedIn

My task app's "done" checkbox scored **56 ms** on INP - comfortably "good" by
Google's Core Web Vitals. It also felt broken.

INP, Interaction to Next Paint, measures how long the browser takes to paint
*something* after you click. Mine painted fast. It just painted a checkbox that
was still empty.

The tick only appeared after two network round trips: save the change, then
re-fetch the list. On a throttled mobile profile that was **~450 ms** of a click
appearing to do nothing. The main thread sat idle the whole time, so nothing on
it could be optimised - the metric and the experience were measuring different
things.

The fix was an **optimistic update**: write the tick into the client-side cache
first, send the request alongside, and undo it if the server refuses. Click to
tick went from ~450 ms to **under 50 ms**. INP barely moved, because INP was
never the problem.

The undo turned out to be the interesting part. My first version took a
snapshot of the whole list and restored it on failure - which meant that if you
ticked two rows quickly and the first save failed, it also erased your second
tick. It now remembers and restores only the one task that changed. I forced
the failure with DevTools request blocking to watch the rollback happen, and
found the error message rendering at the top of a 100-row table, where nobody
who clicked row 60 would ever see it. It's a toast now.

Three more things this month taught me, all by measuring rather than reading:

- **Never profile the dev server.** Development: 40 requests, 7 MB, LCP 9 s.
  Production build: 5 requests, 155 kB, 1.7 s. A dev trace once showed a 1.4 s
  re-render that takes 5 ms in production - I nearly "fixed" it.
- **Find your LCP element before optimising.** Mine was a "Logged in as..." line,
  not the task table. Making the table load sooner would not have moved LCP at
  all.
- **Round trips cost more than bytes.** A 571-byte request took longer than a
  24 kB font.

Next: putting it all in containers.

#WebPerformance #CoreWebVitals #React #BuildInPublic

---

## X / Twitter

**1/**
My checkbox scored 56 ms on INP. "Good" by Core Web Vitals.

It also felt broken. 🧵

**2/**
INP = time from your click to the browser's next paint.

Mine painted fast. It painted a checkbox that was still empty.

**3/**
The tick waited for two round trips: save, then re-fetch the list.

~450 ms of a click doing nothing, with an idle main thread.

Nothing to optimise there. The metric and the experience measured different things.

**4/**
Fix: optimistic update.

Write the tick into the client cache first, send the request alongside, undo it if the server says no.

Click to tick: ~450 ms → under 50 ms.

INP barely moved. It was never the problem.

**5/**
The undo was the interesting bit.

v1 restored a snapshot of the whole list on failure. Tick two rows fast, first save fails → your second tick vanishes too.

Now it restores only the task that changed.

**6/**
Forced a failure with DevTools request blocking to watch it.

The error rendered above a 100-row table. Click row 60 and you'd never see it.

It's a toast now.

**7/**
Also learnt this month, by measuring:

Dev server: 40 requests, 7 MB, LCP 9 s
Production build: 5 requests, 155 kB, 1.7 s

Never profile dev.

**8/**
Find your LCP element first. Mine was a "Logged in as…" line, not the table.

And round trips beat bytes: a 571-byte request was slower than a 24 kB font.

Next: containers.
