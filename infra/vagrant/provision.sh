#!/usr/bin/env bash
#
# Fit-out for the task-manager development VM.
#
# Runs as root on first `vagrant up`. Re-runnable with `vagrant provision`.
# Deliberately close to what increment 1.9 will run on a fresh EC2 instance,
# so this doubles as a rehearsal for the real thing.

set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

echo "==> base packages"
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg git

echo "==> docker engine, from Docker's apt repository"
# Not Ubuntu's docker.io package: it lags behind and ships Compose v1, whose
# `docker-compose` command behaves differently from the `docker compose` v2
# plugin the compose file is written against.
install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
fi

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -qq
apt-get install -y -qq \
  docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# Without this, every docker command needs sudo. Takes effect on next login.
usermod -aG docker vagrant

echo "==> node 22 and pnpm"
# Node lives in the VM, not only in containers: pnpm, the Prisma CLI and the
# Nest dev server all run outside the containers.
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
apt-get install -y -qq nodejs
corepack enable

echo "==> github cli"
if [ ! -f /etc/apt/keyrings/githubcli.gpg ]; then
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    | gpg --dearmor -o /etc/apt/keyrings/githubcli.gpg
  chmod a+r /etc/apt/keyrings/githubcli.gpg
fi
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli.gpg] \
https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list
apt-get update -qq
apt-get install -y -qq gh

echo
echo "==> provisioned"
docker --version
docker compose version
node --version
pnpm --version
git --version
gh --version | head -1
echo
echo "Next: vagrant ssh, then clone the repo into ~/task-manager"
