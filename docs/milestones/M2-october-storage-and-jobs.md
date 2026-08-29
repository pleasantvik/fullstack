# Milestone 2 — October: attachments, then background jobs

**Features shipped:** file attachments on tasks; thumbnail generation and due-date emails
**Infrastructure unlocked:** S3, IAM, secrets management; Redis, BullMQ, a second deployable service
**Done when:** api and worker deploy independently and neither drops an in-flight job

---

## Increments

### 2.1 — Storage abstraction, local disk only
`Attachment` model and migration. A `StorageService` interface with a local-disk implementation. Upload and download endpoints. File type and size validation.

No S3 yet — deliberately. Get the application side correct against something you can inspect with `ls`, so that when cloud storage breaks in 2.3 you know the problem is the cloud, not your code.

*Concept focus:* why an interface rather than calling the storage SDK directly from the controller.

### 2.2 — Attachment UI
Drop zone in the task modal, file list with size and type, upload progress, delete, failure state with retry. Still against local disk.

*Concept focus:* multipart uploads from the browser, progress events, what happens to a half-finished upload.

### 2.3 — S3 bucket and the second implementation
Private bucket, CORS policy scoped to your domain. An S3 implementation of the same `StorageService` interface. Access keys in env vars for now. Swap implementations with one environment variable and confirm nothing else changes.

*Concept focus:* this is the payoff for 2.1 — the interface means the swap touches one line of config.

### 2.4 — Presigned URLs
Move uploads and downloads off your API entirely. The browser talks straight to S3; your API only issues short-lived signed URLs.

*Concept focus:* why routing file bytes through your API doesn't scale, and what a signature actually authorises.

### 2.5 — Instance role, and killing the access keys
Attach an IAM role to the EC2 instance, remove the access keys from the environment, confirm it still works, then **delete the keys in the AWS console**.

Doing it in this order — keys first, role second — is the point. You'll understand what instance roles are for because you'll have felt the problem they solve.

*Concept focus:* least privilege; credentials that can't leak because they don't exist.

### 2.6 — Secrets audit
Write down where every secret lives: GitHub Actions secrets, server runtime, local `.env`. One short table in `docs/runbook.md`. Add a bucket lifecycle rule to expire orphaned uploads.

*Concept focus:* you cannot rotate a secret you can't find.

### 2.7 — Redis and the first job
Redis in compose. BullMQ producer in the API. Thumbnail generation for image attachments, consumed by a worker running as a separate process — but still inside the API container for now.

*Concept focus:* the sync/async boundary. What belongs in the request, what belongs in a queue.

### 2.8 — The worker becomes its own service
Own Dockerfile, own compose service, own entry in the CI build matrix, own step in the deploy script. Deploy an API change and a worker change independently.

**This is the increment October exists for.** Everything before it is setup.

*Concept focus:* what "deployable unit" means, and why your pipeline had to grow.

### 2.9 — Graceful shutdown, retries, dead letters
The worker finishes its current job on SIGTERM before exiting. Retries with exponential backoff. A dead-letter queue for jobs that never succeed. Idempotent handlers, so a retried job doesn't double-process.

Test it: start a long job, deploy mid-flight, confirm nothing is lost.

*Concept focus:* at-least-once delivery, and why idempotency is not optional once you have retries.

### 2.10 — Scheduled work
A repeatable job that emails you when a task is due tomorrow.

*Concept focus:* repeatable jobs versus cron on the server, and what happens when two instances both think they should run it.

---

## UI scope this month

Attachment drop zone in the task modal, file list with size and type, upload progress, image thumbnail grid, toast when a background job completes. Error states for failed uploads.

---

## Reflection

**What I built:**

**What broke, and why:**

**What I'd do differently:**

**What I still don't understand:**
