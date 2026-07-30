# REST API

Base URL

```text
/api
```

## Error Format

Application errors:

```json
{
  "success": false,
  "error": {
    "message": "Campaign not found",
    "status": 404
  }
}
```

Validation errors:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "path": ["recipients", 0],
        "message": "Invalid email address"
      }
    ]
  }
}
```

## Campaign APIs

### Create Campaign

```http
POST /api/campaigns
```

Request body:

```json
{
  "senderId": "1",
  "subject": "Hello",
  "body": "Welcome",
  "startTime": "2026-07-29T12:00:00.000Z",
  "delaySeconds": 2,
  "hourlyLimit": 200,
  "recipients": [
    "a@test.com",
    "b@test.com"
  ]
}
```

Response:

```json
{
  "campaignId": 1,
  "jobsCreated": 2
}
```

### List Campaigns

```http
GET /api/campaigns?page=1&limit=10&senderId=1
```

Response:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 1
  }
}
```

Supported query params:

- `page`
- `limit`
- `senderId`

### Get Campaign

```http
GET /api/campaigns/:id
```

## Sender APIs

### Create Sender

```http
POST /api/senders
```

Request body:

```json
{
  "email": "ops@example.com",
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "username": "ops@example.com",
  "password": "app-password"
}
```

Response:

```json
{
  "id": 1,
  "email": "ops@example.com",
  "username": "ops@example.com",
  "createdAt": "2026-07-30T10:15:00.000Z"
}
```

Validation rules:

- `email` must be a valid email address
- `smtpHost` is required
- `smtpPort` must be an integer from `1` to `65535`
- `username` is required
- `password` is required

SMTP verification:

- `POST /api/senders` verifies SMTP credentials before insert
- `PATCH /api/senders/:id` verifies the merged sender config before update
- Failed verification returns `400` with code `SMTP_VERIFICATION_FAILED`

### List Senders

```http
GET /api/senders?page=1&limit=10
```

Response:

```json
{
  "data": [
    {
      "id": 1,
      "email": "ops@example.com",
      "username": "ops@example.com",
      "createdAt": "2026-07-30T10:15:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### Get Sender

```http
GET /api/senders/:id
```

### Update Sender

```http
PATCH /api/senders/:id
```

Example request body:

```json
{
  "smtpHost": "smtp.office365.com",
  "smtpPort": 587,
  "username": "ops@example.com",
  "password": "new-app-password"
}
```

### Delete Sender

```http
DELETE /api/senders/:id
```

Responses:

- `204` on success
- `404` if not found
- `409` if the sender is referenced by campaigns

## Email Jobs

### Scheduled Emails

```http
GET /api/emails/scheduled?page=1&limit=10&campaignId=12
```

### Sent Emails

```http
GET /api/emails/sent?page=1&limit=10&campaignId=12
```

### Failed Emails

```http
GET /api/emails/failed?page=1&limit=10&campaignId=12
```

All email list endpoints return:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 1
  }
}
```

Supported query params:

- `page`
- `limit`
- `campaignId`

## Health Check

```http
GET /api/health
```

Response:

```json
{
  "status": "ok",
  "services": {
    "database": "up",
    "redis": "up",
    "queue": "up"
  },
  "timestamp": "2026-07-29T18:30:00.000Z"
}
```
