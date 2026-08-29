# Milestone 3 — November: team sharing and the consequences of real data

**Feature shipped:** workspaces, member invites, shared tasks, role-based permissions
**Infrastructure unlocked:** live-data migrations, staging environment, backups, Terraform
**Done when:** staging can be destroyed, rebuilt with Terraform, restored from last night's backup, and used to rehearse the migration before production

---

> **Increments for this milestone get written at the start of the month**, not now. What the right steps are depends on how the previous milestone actually went. Planning them in August would be the documentation equivalent of pre-building. See `CLAUDE.md` for how to break a milestone down.

## Backend

`Workspace`, `Membership`, a role enum. Every task query now filters by workspace membership. Permission guards.

You will write an N+1 query here and it will be slow. Find it with Prisma query logging. Fix it. That sequence — write it, measure it, fix it — is the lesson, so don't let Claude prevent the mistake.

---

## The migration is the point

Adding `workspaceId` to a table that already has live rows cannot be done in one step without downtime or data loss. The correct sequence:

1. **Expand** — add the column nullable, deploy
2. **Backfill** — create a personal workspace per existing user, populate the column, deploy
3. **Contract** — make the column required, deploy

Three deploys for one feature. This is the expand-migrate-contract pattern and it's among the most useful things in the whole roadmap.

---

## Which forces everything else

**A staging environment.** You need somewhere to rehearse. That means a second identical server — which is exactly when Terraform stops being theoretical.

**Terraform:** VPC, security groups, EC2, Elastic IP, DNS. Remote state in S3 with DynamoDB locking. Two environments from one module with different variables.

**Backups:** automated `pg_dump` to S3 on a schedule, and a restore you actually test. Untested backups are decorations.

*Concept focus:* infrastructure as code vs. servers as pets; environment parity; why the rehearsal matters more than the plan.

---

## UI scope this month

Workspace switcher, member list, invite modal, role badges, permission-aware disabled states, "you don't have access" empty state.

---

## Reflection

**What I built:**

**What broke, and why:**

**What I'd do differently:**

**What I still don't understand:**
