# Milestone 5 — January: seeing inside the system

**Feature shipped:** search across tasks and attachments; workspace activity feed
**Infrastructure unlocked:** metrics, dashboards, alerting, log aggregation, load testing
**Done when:** "what's slow, and why" is answered from a dashboard rather than a guess

---

> **Increments for this milestone get written at the start of the month**, not now. What the right steps are depends on how the previous milestone actually went. Planning them in August would be the documentation equivalent of pre-building. See `CLAUDE.md` for how to break a milestone down.

## Backend

Proper indexes. Cursor-based pagination (and understanding why offset pagination degrades). Postgres full-text search with a GIN index.

Measure before and after with `EXPLAIN ANALYZE`. Write the numbers down. The habit of measuring rather than assuming is the real deliverable here.

---

## Infrastructure

- **Prometheus + Grafana**, or a hosted equivalent. Metrics that matter: request rate, error rate, p95 latency, queue depth, connection pool usage.
- **Alerting** on health check failure and error rate, routed somewhere you'll actually see it
- **Log aggregation** so you stop reading logs over SSH
- **Slow query logging** enabled in Postgres
- **Load testing** with k6 — find the point where it falls over, then find out why

---

## Drills — final week

Do these deliberately, under time pressure, and write incident notes as if someone else needed them.

1. Restore the database from backup into staging
2. Roll back a bad deploy
3. Kill a container in production and observe what happens
4. Fill a queue faster than the worker drains it and watch the metrics

---

## UI scope this month

Search bar with results, filters panel, activity feed, and a polish pass on every empty, loading, and error state in the app.

---

## Closing reflection

**What I can do now that I couldn't in September:**

**What I still want to learn:**

**What I'd tell someone starting this:**
