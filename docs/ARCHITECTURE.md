# Architecture — EJS

## 1. Overview

This project implements a production-inspired email scheduling system that lets users schedule emails for future delivery while ensuring reliability, persistence, and scalability.

The scheduler uses **BullMQ** with **Redis** as the persistent job queue. Unlike cron-based schedulers, delayed queue jobs survive application restarts.

## 2. Goals

The system must:

- Schedule emails for future delivery
- Persist scheduled jobs across restarts
- Prevent duplicate sends (idempotency)
- Support configurable concurrency
- Enforce configurable hourly rate limits
- Support a configurable delay between emails
- Provide a dashboard for scheduling and monitoring
- Simulate SMTP delivery using Ethereal Email

## 3. High-level Architecture

```text
React Frontend
    ↓
REST API (Express)
    ↓
PostgreSQL (business data)      BullMQ (job scheduler)
                ↓
               Redis
                ↓
            BullMQ Worker
                ↓
         SMTP (Ethereal)
```

## 4. Component Responsibilities

- Frontend: Google OAuth, schedule emails, upload recipient lists, view scheduled/sent emails and status updates. The frontend never talks directly to Redis or BullMQ.
- Backend API: Authentication, validation, persist business data (Postgres), create queue jobs, return responses. The backend does not send emails directly.
- PostgreSQL: Source of truth (Users, Campaigns, EmailJobs, Senders).
- BullMQ: Schedule and execute delayed jobs, manage retries, and recover jobs after restarts (stores queue metadata in Redis).
- Redis: Stores delayed/waiting/active/failed/completed jobs and rate-limiting counters — not the primary database.
- Worker: Listens for jobs, enforces rate limits, sends email, updates the database, and retries failed jobs. Workers run independently from the API server.

## 5. Request Lifecycle

Scheduling flow:

1. Client calls `POST /api/emails/schedule`
2. Express validates request
3. Store campaign and email jobs in PostgreSQL
4. Add jobs to BullMQ queue
5. Return success

Sending flow:

1. BullMQ delay expires
2. Worker receives the job
3. Worker checks rate limit
   - If not allowed: re-schedule the job
   - If allowed: send via SMTP
4. Update database and mark job completed

## 6. Persistence Strategy

- Business data lives in PostgreSQL (campaigns, email metadata, status, sender info).
- Queue state lives in Redis via BullMQ. Delayed jobs remain in Redis across API/worker/machine restarts and resume when workers reconnect.

## 7. Email Scheduling Strategy

Each recipient is an independent queue job. Example:

Campaign recipients: alice@example.com, bob@example.com, charlie@example.com
Start time: 12:00:00, delay per recipient: 2s → jobs scheduled at 12:00:00, 12:00:02, 12:00:04.

Advantages: individual retries, per-recipient status tracking, scalability, and simple queue design.

## 8. Queue Design

- Queue name: `emailQueue`
- Job payload (minimal fields required by the worker):

```ts
{
  emailJobId: string;
  campaignId: string;
  recipient: string;
  senderId: string;
  subject: string;
  body: string;
}
```

Large datasets remain in PostgreSQL; the queue payload is intentionally small.

## 9. Concurrency

BullMQ workers process multiple jobs concurrently. Configure via environment variable, e.g. `WORKER_CONCURRENCY=5`.

## 10. Delay Between Emails

Configurable spacing between sends, e.g. `EMAIL_DELAY_MS=2000`. When scheduling, increment each recipient's scheduled timestamp by that delay.

## 11. Hourly Rate Limiting

The scheduler enforces hourly limits, e.g. `MAX_EMAILS_PER_HOUR=200`. Redis stores counters per sender per hour (e.g. `rate:sender123:2026-07-29-13`).

Algorithm (simplified):

1. Read counter
2. If counter < limit → increment counter and send
3. Else → move job to next hour (no email is dropped)

## 12. Idempotency

Each EmailJob row is unique and referenced by the BullMQ job. Worker should check the database status before sending (skip if already SENT) to prevent duplicate sends.

## 13. Error Handling

Common failures: SMTP, Redis, database, or worker crashes.

Recovery strategies:

- SMTP failures: retry
- Redis interruptions: worker reconnects
- Database outages: job fails and retries
- Worker crash: BullMQ resumes processing after restart

## 14. Database Model

User → Campaign → EmailJob → Sender

- User: authenticated Google users
- Campaign: scheduling request (subject, body, start time, delay, hourly limit)
- EmailJob: one row per recipient (recipient, status, scheduled time, sent time, failure reason)
- Sender: SMTP credentials; supports multiple senders

## 15. Folder Structure

Backend (example):

```
backend/
  src/
    config/
    controllers/
    routes/
    services/
    queue/
    workers/
    middleware/
    utils/
    types/
    prisma/
  app.ts
  server.ts
```

Frontend (example):

```
frontend/
  src/
    components/
    pages/
    hooks/
    services/
    context/
    types/
    utils/
```

## 16. Technology Stack

- Backend: Node.js, Express, TypeScript, BullMQ, Redis, PostgreSQL, Prisma, Nodemailer, Passport, Google OAuth
- Frontend: React, TypeScript, Tailwind CSS, Axios, React Router
- Infrastructure: Redis, PostgreSQL

## 17. Design Principles

- Separation of concerns
- Single responsibility
- Queue-based asynchronous processing
- Persistent scheduling
- Idempotent processing
- Horizontal worker scalability
- Configurable runtime behavior
- Stateless API layer

## 18. Future Improvements

Potential enhancements:

- Multiple BullMQ workers
- Dead Letter Queue (DLQ)
- Queue dashboard (Bull Board)
- Email templates
- Priority queues
- Distributed scheduler
- Sender rotation
- Bounce tracking
- Webhook delivery status
- Metrics & monitoring (Prometheus + Grafana)
- Kubernetes deployment
- Multi-tenant support

## 19. Summary

The architecture separates concerns into four layers: frontend (UI), backend API (validation and persistence), BullMQ + Redis (reliable scheduling), and workers (asynchronous delivery). PostgreSQL is the source of truth; Redis is used for queue management and rate limiting. This design ensures reliable scheduling, persistence across restarts, configurable throughput, and clear separation between API and background processing.