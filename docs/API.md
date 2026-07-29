# REST API

Base URL

```
/api
```

---

# Authentication

Google OAuth

```
GET /auth/google

GET /auth/google/callback

POST /auth/logout
```

---

# Campaign APIs

## Schedule Email Campaign

```
POST /campaigns
```

Request

```json
{
  "senderId":"uuid",
  "subject":"Hello",
  "body":"Welcome",
  "startTime":"ISO_DATE",
  "delaySeconds":2,
  "hourlyLimit":200,
  "recipients":[
      "a@test.com",
      "b@test.com"
  ]
}
```

Response

```json
{
  "campaignId":"uuid",
  "jobsCreated":2
}
```

---

## List Campaigns

```
GET /campaigns
```

---

## Get Campaign

```
GET /campaigns/:id
```

---

# Email Jobs

## Scheduled Emails

```
GET /emails/scheduled
```

Returns

```
Recipient

Subject

Scheduled Time

Status
```

---

## Sent Emails

```
GET /emails/sent
```

Returns

```
Recipient

Subject

Sent Time

Status
```

---

## Failed Emails

(Optional)

```
GET /emails/failed
```

---

# Health Check

```
GET /health
```

Returns

```
API

Database

Redis

Queue
```