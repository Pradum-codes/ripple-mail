import "dotenv/config";
import { Worker } from "bullmq";
import { bullmqConfig, redisConnection } from "../../config/bullmq.js";
import { prisma } from "../../prisma/client.js";
import { RateLimiterService } from "../../services/rate-limiter.service.js";
import { processEmailWorkerJob } from "../../workers/email.processor.js";
import { createLoadFixture } from "./load-fixtures.js";
import { installMockMailService } from "./mock-mail.service.js";
import {
  addLoadJobs,
  buildLoadQueueName,
  createLoadQueue,
  createLoadQueueEvents,
  getQueueCounts,
  waitForQueueState,
} from "./load-queue.js";
import { printLoadSummary } from "./load-summary.js";

async function runSimulation(): Promise<void> {
  const senderLimit = 10;
  const totalJobs = 50;
  const fixture = await createLoadFixture({
    jobCount: totalJobs,
    tag: "rate-limit",
    subject: "Load simulation: rate limit",
    body: "This message is part of a rate-limit load simulation.",
  });

  const queueName = buildLoadQueueName("rate-limit");
  const queue = createLoadQueue(queueName);
  const queueEvents = createLoadQueueEvents(queueName);
  const mockMail = installMockMailService({
    minDelayMs: 10,
    maxDelayMs: 20,
  });
  const rateLimiterService = new RateLimiterService(redisConnection, senderLimit);
  const rateLimitKey = rateLimiterService.buildKey(fixture.senderId);

  await redisConnection.del(rateLimitKey);

  let firstCurrentTime: string | null = null;
  let firstNextAllowedTime: string | null = null;
  let firstDelayMs: number | null = null;
  let delayedCount = 0;
  let completedEvents = 0;
  let failedEvents = 0;

  const worker = new Worker(
    queueName,
    (job) =>
      processEmailWorkerJob(
        job,
        {
          ...bullmqConfig.queue,
          emailDelayMs: 0,
        },
        {
          rateLimiterService,
        },
      ),
    {
      connection: redisConnection,
      concurrency: bullmqConfig.worker.concurrency,
    },
  );

  queueEvents.on("delayed", ({ delay }) => {
    delayedCount += 1;
    if (firstDelayMs === null) {
      const currentTimeMs = Date.now();
      firstCurrentTime = new Date(currentTimeMs).toISOString();
      firstNextAllowedTime = new Date(delay).toISOString();
      firstDelayMs = Math.max(delay - currentTimeMs, 0);
    }
  });

  queueEvents.on("completed", () => {
    completedEvents += 1;
  });

  queueEvents.on("failed", () => {
    failedEvents += 1;
  });

  const startedAt = Date.now();

  try {
    await Promise.all([worker.waitUntilReady(), queueEvents.waitUntilReady()]);

    const enqueueStartedAt = Date.now();
    const createdJobs = await addLoadJobs(
      queue,
      fixture.jobs.map((job) => ({
        name: "load-email",
        data: {
          emailJobId: job.id,
          campaignId: fixture.campaignId,
        },
      })),
    );
    const enqueueDurationMs = Date.now() - enqueueStartedAt;

    const counts = await waitForQueueState(
      queue,
      (currentCounts) =>
        completedEvents >= senderLimit &&
        currentCounts.delayed >= totalJobs - senderLimit &&
        currentCounts.waiting === 0 &&
        currentCounts.active === 0,
    );

    const redisCounterValueRaw = await redisConnection.get(rateLimitKey);
    const redisCounterValue = redisCounterValueRaw ? Number(redisCounterValueRaw) : 0;
    const executionTimeMs = Date.now() - startedAt;

    printLoadSummary({
      simulation: "Rate Limiting",
      jobsCreated: createdJobs,
      completed: completedEvents,
      delayed: counts.delayed,
      failed: failedEvents,
      waiting: counts.waiting,
      active: counts.active,
      executionTimeMs,
      workers: 1,
      concurrency: bullmqConfig.worker.concurrency,
      enqueueDurationMs,
      extraFields: [
        {
          label: "Sent Count",
          value: counts.completed,
        },
        {
          label: "Delayed Count",
          value: delayedCount,
        },
        {
          label: "Redis Counter Value",
          value: redisCounterValue,
        },
        {
          label: "Current Time",
          value: firstCurrentTime ?? "unknown",
        },
        {
          label: "Next Allowed Time",
          value: firstNextAllowedTime ?? "unknown",
        },
        {
          label: "Delay (ms)",
          value: `${firstDelayMs ?? 0} ms`,
        },
        {
          label: "Queue Name",
          value: queueName,
        },
        {
          label: "Rate Limit Key",
          value: rateLimitKey,
        },
        {
          label: "Mock Sends",
          value: mockMail.sendCount,
        },
      ],
    });
  } finally {
    queueEvents.removeAllListeners();
    await worker.close();
    await queueEvents.close();
    await queue.obliterate({ force: true });
    await redisConnection.del(rateLimitKey);
    mockMail.restore();
    await fixture.cleanup();
    await prisma.$disconnect();
  }
}

runSimulation().catch((error) => {
  console.error("Rate limit simulation failed:", error);
  process.exitCode = 1;
});
