**Increment:** dev environment (ADR 0002), between 1.1 and 1.2
**Date drafted:** 2026-08-30
**Status:** draft

---

## LinkedIn

I haven't written a line of application code yet and I've already spent a
session debugging my own laptop. Worth every minute.

The plan was simple: run Postgres in Docker. On Windows that normally means
Docker Desktop. But I already use VirtualBox and Vagrant daily for learning
Linux, so I put Docker inside a dedicated Ubuntu VM instead — same OS as the
EC2 box I'll deploy to later, and the provisioning script doubles as a rehearsal
for that server.

Then the VM started hanging on boot. Intermittently. Same config, same command,
different outcome.

What I found:

**Windows had quietly taken the CPU's virtualisation hardware.** Windows 11
enables Virtualization-Based Security by default. VBS runs a hypervisor, and a
CPU's virtualisation extensions can only have one owner. VirtualBox couldn't get
them, so it fell back to running my VMs *through* Windows' hypervisor — a slower
path that occasionally deadlocks during guest boot.

My VirtualBox VMs had been on that path for months. I'd never noticed, because
"a bit slow" doesn't announce itself.

**The error message meant the opposite of what it looked like.** VirtualBox
logged `VT-x is not available`. I assumed that meant virtualisation was off in
the BIOS. It wasn't — it means *not available to VirtualBox*, because something
else already holds it. Windows even reports `VirtualizationFirmwareEnabled:
False` while a hypervisor is running, precisely because a hypervisor is running.

**I recorded a decision with a reason I never checked.** My architecture
decision record said I'd avoided Docker Desktop because it would enable Hyper-V
and slow my VMs down. Plausible, matched the symptoms, and false — Hyper-V was
already on. One command would have told me. I corrected the record in place and
left the wrong reasoning visible rather than deleting it, because a decision log
that hides being wrong isn't worth keeping.

**Symptoms were ambiguous. The log wasn't.** Three boots worked, one hung. No
pattern. One line in VirtualBox's own log settled it in seconds. Measure, don't
infer — I say that at work and still didn't do it here for an hour.

Next: Postgres in a container, Prisma schema, first migration. Actual code.

#DevOps #BuildInPublic #Virtualization #Debugging

---

## X / Twitter

**1/**
Haven't written a line of app code yet. Already spent a session debugging my own
laptop.

Worth it. Here's what a hanging VM taught me 🧵

**2/**
Plan: run Postgres in Docker.

On Windows that's usually Docker Desktop. But I already use VirtualBox + Vagrant
daily, so I put Docker inside a dedicated Ubuntu VM — same OS as the EC2 box I'll
deploy to later.

Then it started hanging on boot. Intermittently.

**3/**
Cause: Windows 11 enables Virtualization-Based Security by default.

VBS runs a hypervisor. A CPU's virtualisation extensions can only have ONE owner.

VirtualBox couldn't get them, so it ran my VMs *through* Windows' hypervisor —
slower, and it occasionally deadlocks on boot.

**4/**
My VMs had been on that slow path for months.

I never noticed. "A bit slow" doesn't announce itself.

**5/**
The error message meant the opposite of what it looked like.

`VT-x is not available`

I read: virtualisation is off in BIOS.
It meant: not available *to VirtualBox* — something else already holds it.

Windows even reports VirtualizationFirmwareEnabled: False *because* a hypervisor
is running.

**6/**
Worst part: I'd written an architecture decision record explaining why I avoided
Docker Desktop — "it would enable Hyper-V and slow my VMs."

Plausible. Matched the symptoms. Completely false. Hyper-V was already on.

One command would have told me.

**7/**
I corrected the record in place and left the wrong reasoning visible.

A decision log that hides having been wrong isn't worth keeping.

**8/**
Symptoms: ambiguous. 3 boots fine, 1 hung, no pattern.
The log: one line, unambiguous.

Measure, don't infer. I say this at work and still didn't do it here for an hour.

**9/**
Next: Postgres in a container, Prisma schema, first migration.

Actual code.
