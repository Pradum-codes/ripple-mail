# Database Design

## Overview

The database stores all business data required by the application.

BullMQ queue state is **not stored here**.

---

# ER Diagram

```text
User
│
├────────────┐
│            │
│        Campaign
│            │
│            │ 1:N
│        EmailJob
│
└────────────┐
          Sender
```

---

# User

Authenticated Google user.

| Field | Type |
|--------|------|
| id | UUID |
| googleId | String |
| name | String |
| email | String (Unique) |
| avatar | String |
| createdAt | DateTime |

---

# Sender

Represents SMTP credentials.

| Field | Type |
|--------|------|
| id | UUID |
| email | String |
| smtpHost | String |
| smtpPort | Int |
| username | String |
| password | String |
| createdAt | DateTime |

---

# Campaign

Represents one scheduling request.

One uploaded CSV = One Campaign.

| Field | Type |
|--------|------|
| id | UUID |
| userId | FK |
| senderId | FK |
| subject | String |
| body | Text |
| startTime | DateTime |
| delaySeconds | Int |
| hourlyLimit | Int |
| totalRecipients | Int |
| createdAt | DateTime |

Relationships

```
Campaign

↓

Many EmailJobs
```

---

# EmailJob

Represents exactly one recipient.

| Field | Type |
|--------|------|
| id | UUID |
| campaignId | FK |
| recipient | String |
| scheduledAt | DateTime |
| sentAt | DateTime? |
| bullJobId | String |
| status | ENUM |
| failureReason | Text |
| retryCount | Int |
| createdAt | DateTime |

---

# Status Enum

```
SCHEDULED

PROCESSING

SENT

FAILED
```

---

# Why Campaign + EmailJob?
Instead of duplicating subject/body for every recipient, Campaign stores shared information while EmailJob tracks individual delivery.
This keeps the schema normalized and easier to query.