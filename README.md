# Email Job Scheduler

A full-stack email scheduling application built as part of the ReachInbox Software Development Intern assignment.

The project allows users to schedule emails for future delivery using a REST API and a background job processing system powered by BullMQ and Redis.

## Tech Stack

### Backend

- Node.js
- Express 5
- TypeScript
- PostgreSQL
- Prisma ORM
- Redis
- BullMQ *(to be integrated in later phases)*

### Frontend

- React
- TypeScript
- Vite

---

## Development Setup

### Prerequisites

- Node.js 24+
- npm
- PostgreSQL 16+
- Redis

---

## Backend Setup

```bash
cd backend

npm install
```

Create a `.env` file.

Example:

```env
PORT=5000
NODE_ENV=development

DATABASE_URL="postgresql://username:password@localhost:5432/reachinbox_db"

REDIS_HOST=localhost
REDIS_PORT=6379
```

Start the backend:

```bash
npm run dev
```

Backend runs on:

```
http://localhost:5000
```

---

## Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

## Database

This project uses PostgreSQL together with Prisma ORM.

Current status:

- PostgreSQL configured
- Prisma configured
- Prisma Client generated

Database schema implementation begins in the next phase.

---

## Redis

Redis is configured as the message broker for BullMQ.

Current status:

- Redis installed
- Redis connection verified

Queue implementation begins in a later phase.

---

## Documentation

Additional design documents are available in the `docs/` directory.

- [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [DATABASE.md](./docs/DATABASE.md)
- [API.md](./docs/API.md)
- [QUEUE.md](./docs/QUEUE.md)

---
