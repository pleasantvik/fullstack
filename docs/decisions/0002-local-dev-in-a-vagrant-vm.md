# 0002 — Local development runs inside a Vagrant VM

**Date:** 2026-08-29
**Status:** Accepted

## Context

Increment 1.2 onward needs Docker locally: Postgres now, Redis and a worker in
Milestone 2, multiple API instances in Milestone 4, Prometheus and Grafana in
Milestone 5.

Development is on Windows 11. Docker Desktop on Windows runs containers inside
a WSL2 virtual machine, and WSL2 requires the Hyper-V hypervisor. Once Hyper-V
owns the CPU virtualisation extensions, VirtualBox can no longer use them
directly — it still runs, via Hyper-V's API, but noticeably slower.

VirtualBox and Vagrant are already in use on this machine for learning Linux,
with working CentOS and Ubuntu boxes. Degrading them is a real cost, not a
hypothetical one.

## Options

1. **Docker Desktop on Windows.** Simplest to install. Enables Hyper-V and
   degrades the existing VirtualBox VMs.
2. **WSL2 + Docker Engine, no Desktop.** Lighter than Docker Desktop, same
   Hyper-V problem.
3. **Docker Engine inside a dedicated Vagrant VM.** No Hyper-V. Reuses tooling
   already understood. More layers between editor and database.
4. **Hosted Postgres (Neon, Supabase).** No local install at all. Breaks the
   "works on a clean checkout" guarantee, requires a network connection to do
   any work, and skips the Docker learning that Milestone 1 exists for.

## Choice

**Option 3.** A dedicated Vagrant VM, defined in `infra/vagrant/`, separate
from the existing learning VMs.

Ubuntu 22.04 rather than CentOS Stream, because increment 1.9 deploys to an
Ubuntu EC2 instance and the commands should match. CentOS Stream is a rolling
preview of RHEL rather than a stable server target.

The code is cloned inside the VM at `~/task-manager` and edited through VS Code
Remote-SSH. The default `/vagrant` synced folder is disabled: VirtualBox shared
folders do not propagate inotify events, which silently breaks Vite hot reload
and Nest watch mode, and they make Docker build contexts slow.

## Consequence

**Gained**

- Docker runs on a real Linux kernel, matching production rather than approximating it
- The existing VirtualBox learning environment is untouched
- `provision.sh` is close to what 1.9 will run on a fresh EC2 instance, so the
  local setup rehearses the deploy
- Everything is Linux from day one: no CRLF surprises, no Windows path quirks

**Given up**

- Two clones of the repo. The Windows one exists only to run `vagrant up`;
  all work happens in the VM. This must be documented in the README or it is
  confusing to anyone else.
- Two layers of port forwarding, container to VM to Windows. A mistake here
  produces `connection refused` with nothing in any log.
- RAM. 4GB now, rising to 6-8GB by Milestone 4.
- `vagrant destroy` deletes uncommitted work. GitHub is the source of truth,
  not the VM.

## Revisit if

VirtualBox stops being needed for anything else, at which point Docker Desktop
or WSL2 becomes simpler and this layer can be removed.
