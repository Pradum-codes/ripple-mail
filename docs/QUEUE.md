# Queue Design

## Queue Name

```
emailQueue
```

---

# Queue Flow

```
API

↓

BullMQ Queue

↓

Redis

↓

Worker

↓

SMTP

↓

Database
```

---

# Job Payload

```ts
{
    emailJobId: string;

    campaignId: string;

    senderId: string;

    recipient: string;

    subject: string;

    body: string;
}
```

---

# Job Lifecycle

```
Delayed

↓

Waiting

↓

Active

↓

Completed
```

or

```
Delayed

↓

Waiting

↓

Active

↓

Failed
```

---

# Worker Responsibilities

Worker does the following

1. Receive Job

2. Fetch EmailJob

3. Verify Status

4. Check Rate Limit

5. Send Email

6. Update Status

7. Complete Job

---

# Rate Limiting

Redis Key

```
rate:<senderId>:YYYY-MM-DD-HH
```

Example

```
rate:abc123:2026-07-29-13
```

Worker

```
Read Counter

↓

Counter < Limit ?

↓

Yes

Increment

↓

Send

No

↓

Move Job

Next Hour
```

---

# Concurrency

Configured through

```
WORKER_CONCURRENCY
```

BullMQ Worker processes multiple jobs in parallel.

---

# Retry Strategy

Retries

```
3
```

Backoff

```
Exponential
```

Worker retries only temporary failures.

Permanent failures update EmailJob status.

---

# Idempotency

Worker checks EmailJob status before sending.

Already SENT

↓

Ignore Job

This guarantees one email is never sent twice.