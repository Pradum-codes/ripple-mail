import "dotenv/config";
import { Worker } from "bullmq";
import { bullmqConfig, redisConnection } from "../../config/bullmq.js";
import { prisma } from "../../prisma/client.js";
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
  const workerCount = 4;
  const jobsPerWorker = 100;
  const totalJobs = workerCount * jobsPerWorker;
  const fixture = await createLoadFixture({
    jobCount: totalJobs,
    tag: "multi-worker",
    subject: "Load simulation: multi-worker",
    body: "This message is part of a multi-worker load simulation.",
  });

  const queueName = buildLoadQueueName("multi-worker");
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

  const workerCounts = new Map<string, number>();
  const workers = Array.from({ length: workerCount }, (_, index) => {
    const workerLabel = `worker-${index + 1}`;
    workerCounts.set(workerLabel, 0);

    return new Worker(
      queueName,
      async (job) => {
        await processEmailWorkerJob(
          job,
          {
            ...bullmqConfig.queue,
            emailDelayMs: 0,
          },
          {
            rateLimiterService: allowAllRateLimiter,
          },
        );

        workerCounts.set(workerLabel, (workerCounts.get(workerLabel) ?? 0) + 1);
      },
      {
        connection: redisConnection,
        concurrency: 1,
      },
    );
  });

  const startedAt = Date.now();
  let counts = await getQueueCounts(queue);
  let completedEvents = 0;
  let failedEvents = 0;

  try {
    await Promise.all([
      ...workers.map((worker) => worker.waitUntilReady()),
      queueEvents.waitUntilReady(),
    ]);

    queueEvents.on("completed", () => {
      completedEvents += 1;
    });

    queueEvents.on("failed", () => {
      failedEvents += 1;
    });

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

    counts = await waitForQueueState(queue, (currentCounts) => {
      return (
        completedEvents >= createdJobs &&
        currentCounts.waiting === 0 &&
        currentCounts.active === 0 &&
        currentCounts.delayed === 0
      );
    });
    const executionTimeMs = Date.now() - startedAt;

    const workerBreakdown = Array.from(workerCounts.entries())
      .map(([label, count]) => `${label}=${count}`)
      .join(", ");

    printLoadSummary({
      simulation: "Multi Worker",
      jobsCreated: createdJobs,
      completed: completedEvents,
      delayed: counts.delayed,
      failed: failedEvents,
      waiting: counts.waiting,
      active: counts.active,
      executionTimeMs,
      workers: workerCount,
      concurrency: 1,
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
          label: "Worker Breakdown",
          value: workerBreakdown,
        },
        {
          label: "Queue Name",
          value: queueName,
        },
      ],
    });
  } finally {
    queueEvents.removeAllListeners();
    await Promise.all(workers.map((worker) => worker.close()));
    await queueEvents.close();
    await queue.obliterate({ force: true });
    mockMail.restore();
    await fixture.cleanup();
    await prisma.$disconnect();
  }
}

runSimulation().catch((error) => {
  console.error("Multi-worker simulation failed:", error);
  process.exitCode = 1;
});
