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
