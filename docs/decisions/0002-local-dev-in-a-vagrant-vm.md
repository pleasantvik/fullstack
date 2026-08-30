# 0002 — Local development runs inside a Vagrant VM

**Date:** 2026-08-29
**Status:** Accepted
**Amended:** 2026-08-29 — the original rationale was factually wrong. See
*Correction* below. The decision stands; the reason for it does not.

## Context

Increment 1.2 onward needs Docker locally: Postgres now, Redis and a worker in
Milestone 2, multiple API instances in Milestone 4, Prometheus and Grafana in
Milestone 5.

Development is on Windows 11. VirtualBox and Vagrant are already in daily use on
this machine for learning Linux, with working CentOS and Ubuntu boxes.

## Correction

The version of this ADR merged in PR #2 claimed Docker Desktop was rejected
because it "requires Hyper-V, and Hyper-V degrades the VirtualBox VMs already
used on this machine."

**That was false.** Windows 11 Core Isolation → Memory Integrity had already
enabled Virtualization-Based Security on this machine, so the hypervisor was
active before any of this work started, and VirtualBox 7.2.6 was already running
on its slower Hyper-V backend. Docker Desktop would not have caused the problem;
it was already the situation.

It surfaced as an intermittent guest boot hang: the VM provisioned cleanly on
first build, then froze at 7.4 seconds into kernel boot on an identical rebuild.
Same configuration, different outcome — a race on the Hyper-V backend, not a
configuration error. Memory Integrity has since been turned off, returning the
CPU's virtualisation hardware to VirtualBox.

The lesson is worth more than the decision: the argument was plausible, matched
the symptoms, and was never checked. `HypervisorPresent` would have taken
five seconds to query.

## Options

1. **Docker Desktop on Windows.** Simplest to install. Runs containers in a
   WSL2 VM. A genuinely close call, and closer than the original ADR admitted.
2. **WSL2 + Docker Engine, no Desktop.** Lighter than Docker Desktop, same
   shape of solution.
3. **Docker Engine inside a dedicated Vagrant VM.** Reuses tooling already
   understood. More layers between editor and database.
4. **Hosted Postgres (Neon, Supabase).** No local install at all. Breaks the
   "works on a clean checkout" guarantee, needs a network connection to do any
   work, and skips the Docker learning that Milestone 1 exists for.

## Choice

**Option 3.** A dedicated Vagrant VM, defined in `infra/vagrant/`, separate from
the existing learning VMs.

The reasons that actually hold, none of which depend on Hyper-V:

- **Parity with production.** Docker runs on a real Linux kernel, the same as
  the EC2 instance in increment 1.9, rather than an approximation of one.
- **`provision.sh` rehearses the deploy.** Installing Docker Engine on Ubuntu is
  very close to what 1.9 does on a fresh EC2 instance. The local setup is
  practice for the real one.
- **Linux from day one.** No CRLF surprises, no Windows path quirks, no gap
  between the developer machine and CI.
- **It reuses tooling already being learned**, so the layer is not new overhead.

Ubuntu 22.04 rather than CentOS Stream, because 1.9 deploys to an Ubuntu EC2
instance and the commands should match. CentOS Stream is a rolling preview of
RHEL rather than a stable server target.

Code is cloned inside the VM at `~/task-manager` and edited through VS Code
Remote-SSH. The default `/vagrant` synced folder is disabled: VirtualBox shared
folders do not propagate inotify events, which silently breaks Vite hot reload
and Nest watch mode, and they make Docker build contexts slow.

## Consequence

**Gained**

- Docker on a real Linux kernel, matching production
- `provision.sh` doubles as rehearsal for the 1.9 EC2 bootstrap
- Everything Linux from day one

**Given up**

- Two clones of the repo. The host one exists only to run `vagrant up`; all work
  happens in the VM. Documented in the README, or it confuses anyone else.
- Two layers of port forwarding, container to VM to host. A mistake here gives
  `connection refused` with nothing in any log.
- RAM. 4GB now, rising to 6-8GB by Milestone 4.
- `vagrant destroy` deletes uncommitted work. GitHub is the source of truth.
- **Memory Integrity must stay off on this machine.** That is a real reduction
  in one Windows defence, accepted deliberately. Verify with
  `(Get-CimInstance Win32_ComputerSystem).HypervisorPresent` — must be `False`.

## Known constraint: VirtualBox runs on the NEM backend

VirtualBox on this machine cannot get the CPU's virtualisation extensions
directly. It falls back to NEM, running guests through Windows' Hyper-V API:

```
HM: HMR3Init: Attempting fall back to NEM: VT-x is not available
```

That message means *not available to VirtualBox*, not absent from the firmware.
Windows Virtualization-Based Security holds the extensions.

Already switched off, and none of it was enough:

- Memory Integrity / HVCI
- Kernel shadow stacks
- `EnableVirtualizationBasedSecurity` in the registry (verified `0` after reboot)
- `bcdedit /set hypervisorlaunchtype off` (verified `Off` after reboot)

What still holds VBS on is **Windows Hello Enhanced Sign-in Security**
(`DeviceGuard\Scenarios\WindowsHello\Enabled = 1`). Disabling it can take
biometric login with it, which is a daily cost for a background benefit.
Deliberately not done.

**Consequence:** guest boots occasionally hang, and everything runs somewhat
slower. Remedy is `vagrant reload`. If a destroy leaves an orphaned folder in
`VirtualBox VMs\`, delete it before the next `vagrant up` — a suspended VM
leaves a `.sav` file behind and the next import cannot claim the name.

Do not "fix" this by touching VT-x in the BIOS. It is enabled; disabling it
would stop VirtualBox working entirely.

## Revisit if


Memory Integrity needs to be switched back on, or VirtualBox stops being needed
for anything else. Either would make Docker Desktop or WSL2 the simpler choice
and this layer removable.
