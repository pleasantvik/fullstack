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
- **Windows VBS must stay off on this machine** — Memory Integrity, kernel
  shadow stacks, and Windows Hello Enhanced Sign-in Security. That is a real
  reduction in two Windows defences, accepted deliberately, and it costs
  hypervisor-backed protection of biometric sign-in. Reversible; see below.
  Verify with `(Get-CimInstance Win32_ComputerSystem).HypervisorPresent` — must
  be `False`.

## Resolved 2026-09-26: giving VirtualBox the CPU back

For a month, guest boots hung intermittently — roughly one attempt in three,
stalling early in the kernel log with no further output. Every boot logged:

```
HM: HMR3Init: Attempting fall back to NEM: VT-x is not available
```

That message means *not available to VirtualBox*, not absent from the firmware.
Windows Virtualization-Based Security held the extensions, so VirtualBox ran
guests through Windows' Hyper-V API (NEM) instead of the CPU directly. `Win32_Processor`
reports `VirtualizationFirmwareEnabled: False` while that is true — a reading
caused by the problem, not evidence of it. **Do not "fix" this in the BIOS.**
VT-x is enabled; disabling it stops VirtualBox working entirely.

### Two wrong diagnoses, recorded because they were convincing

1. **"The host-only adapter causes it."** Two boots stalled at exactly the same
   instruction, right after the kernel renamed the host-only NIC. Compelling,
   and wrong — the practice VM has a single adapter and stalled at the same
   point. Removing it was still correct (it was never needed) but it treated a
   symptom.
2. **"The e1000 NIC emulation causes it."** Switching to `virtio-net` worked:
   the boot got past the NIC. It then hung after `Attached SCSI disk` instead.
   Change the device, and the stall simply moves to whatever the kernel does
   next. It was never a device.

The lesson both times: a hypothesis that explains the evidence is not the same
as a hypothesis that has been tested against a case it would fail.

### What actually fixed it

Four settings, all on the Windows host. Admin PowerShell, then reboot:

```powershell
$sc = 'HKLM:\SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios'
Set-ItemProperty -Path "$sc\WindowsHello"                    -Name Enabled -Value 0 -Type DWord
Set-ItemProperty -Path "$sc\HypervisorEnforcedCodeIntegrity" -Name Enabled -Value 0 -Type DWord
Set-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\DeviceGuard' `
                 -Name EnableVirtualizationBasedSecurity -Value 0 -Type DWord
bcdedit /set hypervisorlaunchtype off
```

The last one to fall was **Windows Hello Enhanced Sign-in Security**. Turning off
Memory Integrity alone is not enough: it removes the *service* using VBS while the
VBS platform keeps launching the hypervisor.

### Verifying

```powershell
(Get-CimInstance Win32_ComputerSystem).HypervisorPresent            # want False
(Get-CimInstance Win32_Processor).VirtualizationFirmwareEnabled     # want True
```

and in `%USERPROFILE%\VirtualBox VMs\<vm>\Logs\VBox.log`:

```
HM: Using VT-x implementation 3.0        <- fixed
HM: Attempting fall back to NEM          <- not fixed
```

The log is the authority. Symptoms were ambiguous for a month — three boots fine,
one hung, no pattern. One line in the log settled it in seconds.

### Reversing

Same four with the values inverted (`1`, `1`, `1`, `auto`), plus a reboot. Nothing
is deleted: the PIN and fingerprint enrolment are untouched, only whether they are
protected by VBS. Memory Integrity also has a UI toggle under Windows Security →
Device security → Core isolation.

### Expect Windows to undo one of these

Memory Integrity was switched off on 2026-08-30 and found **on again** on
2026-09-26, almost certainly re-enabled by a Windows update. If guests start
hanging again months from now, check
`DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity` first rather than
re-debugging from scratch.

### Unrelated cleanup this exposed

- A destroy that leaves an orphaned folder under `VirtualBox VMs\` blocks the next
  `vagrant up` with `VERR_ALREADY_EXISTS`. A suspended VM leaves a `.sav` file and
  the new import cannot claim the name. Delete the folder.
- SSH port collisions: see the pinned `forwarded_port` in the Vagrantfile.

## Revisit if


Windows VBS needs to be switched back on — for work policy, for Windows Hello
Enhanced Sign-in Security, or because an update forces it — or VirtualBox stops
being needed for anything else.

Any of those makes WSL2 the simpler choice. WSL2 was weighed on 2026-09-26 and
rejected only because freeing VT-x was available and also fixed the CentOS,
ubuntu and vprofile learning VMs. It is a real Linux kernel, so it would not
cost the production-parity argument that chose a VM in the first place — the
only thing lost would be `provision.sh` rehearsing the 1.9 EC2 bootstrap.
