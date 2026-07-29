import "dotenv/config";
import { bullmqConfig } from "../../config/bullmq.js";
import { prisma } from "../../prisma/client.js";
import { processEmailWorkerJob } from "../../workers/email.processor.js";
import { installMockMailService } from "./mock-mail.service.js";
import { createLoadFixture } from "./load-fixtures.js";
import {
  addLoadJobs,
  buildLoadQueueName,
  createLoadQueue,
  createLoadQueueEvents,
  getQueueCounts,
  waitForQueueState,
} from "./load-queue.js";
import { printLoadSummary } from "./load-summary.js";
import { Worker } from "bullmq";
import { redisConnection } from "../../config/bullmq.js";

async function main(): Promise<void> {
  const fixture = await createLoadFixture({
    jobCount: 1_000,
    tag: "large-queue",
    subject: "Load simulation: large queue",
    body: "This message is part of a queue load simulation.",
  });

  const queueName = buildLoadQueueName("large-queue");
  const queue = createLoadQueue(queueName);
  const queueEvents = createLoadQueueEvents(queueName);
  const mockMail = installMockMailService({
    minDelayMs: 10,
    maxDelayMs: 20,
  });

  const allowAllRateLimiter = {
    async acquire(senderId: number | string) {
      return {
        allowed: true,
        currentCount: 1,
        limit: Number.MAX_SAFE_INTEGER,
        remaining: Number.MAX_SAFE_INTEGER - 1,
        key: `mock-rate:${String(senderId)}`,
        nextAvailableAt: new Date().toISOString(),
      };
    },
  };

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
          rateLimiterService: allowAllRateLimiter,
        },
      ),
    {
      connection: redisConnection,
      concurrency: bullmqConfig.worker.concurrency,
    },
  );

  const enqueueStartedAt = Date.now();
  let enqueueDurationMs = 0;
  let counts = await getQueueCounts(queue);
  let completedEvents = 0;
  let failedEvents = 0;

  try {
    await Promise.all([worker.waitUntilReady(), queueEvents.waitUntilReady()]);

    queueEvents.on("completed", () => {
      completedEvents += 1;
    });

    queueEvents.on("failed", () => {
      failedEvents += 1;
    });

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

    enqueueDurationMs = Date.now() - enqueueStartedAt;

    counts = await waitForQueueState(queue, (currentCounts) => {
      return (
        completedEvents >= createdJobs &&
        currentCounts.waiting === 0 &&
        currentCounts.active === 0 &&
        currentCounts.delayed === 0
      );
    });

    const executionTimeMs = Date.now() - enqueueStartedAt;

    printLoadSummary({
      simulation: "Large Queue",
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
          label: "Mock Sends",
          value: mockMail.sendCount,
        },
        {
          label: "Duplicate Sends",
          value: mockMail.duplicateSendCount,
        },
        {
          label: "Queue Name",
          value: queueName,
        },
      ],
    });
  } finally {
    queueEvents.removeAllListeners();
    await worker.close();
    await queueEvents.close();
    await queue.obliterate({ force: true });
    mockMail.restore();
    await fixture.cleanup();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Large queue simulation failed:", error);
  process.exitCode = 1;
});
