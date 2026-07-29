# Backend API

Base URL:

```text
/api
```

## Standard Error Format

Application errors return:

```json
{
  "success": false,
  "error": {
    "message": "Campaign not found",
    "status": 404
  }
}
```

Validation errors return:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "path": ["subject"],
        "message": "subject is required"
      }
    ]
  }
}
```

## Campaigns

### Create Campaign

```http
POST /api/campaigns
```

Request body:

```json
{
  "senderId": "1",
  "subject": "Welcome to ReachInbox",
  "body": "Hello, this is a scheduled campaign.",
  "startTime": "2026-07-29T12:00:00.000Z",
  "delaySeconds": 60,
  "hourlyLimit": 100,
  "recipients": [
    "alice@example.com",
    "bob@example.com"
  ]
}
```

Success response:

```json
{
  "campaignId": 1,
  "jobsCreated": 2
}
```

Validation rules:

- `senderId`: required non-empty string
- `subject`: required non-empty string
- `body`: required non-empty string
- `startTime`: required ISO 8601 datetime string
- `delaySeconds`: required integer, minimum `0`
- `hourlyLimit`: required integer, greater than `0`
- `recipients`: required array with at least one valid email address

### List Campaigns

```http
GET /api/campaigns?page=1&limit=10&senderId=1
```

Query parameters:

- `page`: optional, defaults to `1`
- `limit`: optional, defaults to `10`
- `senderId`: optional positive integer filter

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

### Get Campaign

```http
GET /api/campaigns/:id
```

Returns a single campaign by numeric ID.

- `200` when found
- `404` when the campaign does not exist

## Emails

### List Scheduled Emails

```http
GET /api/emails/scheduled?page=1&limit=10&campaignId=12
```

Returns paginated `EmailJob` records with status `SCHEDULED`, ordered by `scheduledAt` ascending.

### List Sent Emails

```http
GET /api/emails/sent?page=1&limit=10&campaignId=12
```

Returns paginated `EmailJob` records with status `SENT`, ordered by newest first.

### List Failed Emails

```http
GET /api/emails/failed?page=1&limit=10&campaignId=12
```

Returns paginated `EmailJob` records with status `FAILED`, ordered by newest first.

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

Query parameters:

- `page`: optional, defaults to `1`
- `limit`: optional, defaults to `10`
- `campaignId`: optional positive integer filter

## Health

### Health Check

```http
GET /api/health
```

Healthy response:

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

If PostgreSQL, Redis, or the queue is unavailable, the endpoint returns a degraded response and a non-success status code.

## Notes

- Campaign creation persists the campaign, creates one `EmailJob` per recipient, and schedules BullMQ jobs.
- The worker loads campaign and sender data from the database when processing queued email jobs.
- Pagination defaults to `page=1` and `limit=10` across list endpoints.
