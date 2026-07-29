import { Queue, QueueEvents, type JobsOptions } from "bullmq";
import { bullmqConfig, redisConnection } from "../../config/bullmq.js";
import { EMAIL_QUEUE_NAME } from "../../queue/constatns.js";
import type { EmailJobData } from "../../queue/email.queue.js";

export type QueueCounts = {
  waiting: number;
  active: number;
  completed: number;
  delayed: number;
  failed: number;
};

export function buildLoadQueueName(tag: string): string {
  return `${EMAIL_QUEUE_NAME}-load-${tag}-${Date.now()}`;
}

export function createLoadQueue(queueName: string): Queue<EmailJobData> {
  return new Queue<EmailJobData>(queueName, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: bullmqConfig.queue.maxRetries,
      backoff: {
        type: "exponential",
        delay: bullmqConfig.queue.backoffDelayMs,
      },
      removeOnComplete: bullmqConfig.queue.removeOnComplete,
      removeOnFail: bullmqConfig.queue.removeOnFail,
    },
  });
}

export function createLoadQueueEvents(queueName: string): QueueEvents {
  return new QueueEvents(queueName, {
    connection: redisConnection,
  });
}

export async function addLoadJobs(
  queue: Queue<EmailJobData>,
  jobs: Array<{
    name: string;
    data: EmailJobData;
    opts?: JobsOptions;
  }>,
): Promise<number> {
  const createdJobs = await queue.addBulk(jobs);
  return createdJobs.length;
}

export async function getQueueCounts(queue: Queue<EmailJobData>): Promise<QueueCounts> {
  const counts = await queue.getJobCounts(
    "waiting",
    "active",
    "completed",
    "delayed",
    "failed",
  );

  return {
    waiting: counts.waiting ?? 0,
    active: counts.active ?? 0,
    completed: counts.completed ?? 0,
    delayed: counts.delayed ?? 0,
    failed: counts.failed ?? 0,
  };
}

export async function waitForQueueDrain(
  queue: Queue<EmailJobData>,
  expectedCompleted: number,
  timeoutMs = 180_000,
  pollMs = 250,
): Promise<QueueCounts> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const counts = await getQueueCounts(queue);

    if (
      counts.completed >= expectedCompleted &&
      counts.waiting === 0 &&
      counts.active === 0 &&
      counts.delayed === 0
    ) {
      return counts;
    }

    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  const counts = await getQueueCounts(queue);
  throw new Error(
    `Timed out waiting for queue drain. counts=${JSON.stringify(counts)}`,
  );
}

export async function waitForQueueState(
  queue: Queue<EmailJobData>,
  predicate: (counts: QueueCounts) => boolean,
  timeoutMs = 90_000,
  pollMs = 250,
): Promise<QueueCounts> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const counts = await getQueueCounts(queue);

    if (predicate(counts)) {
      return counts;
    }

    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  const counts = await getQueueCounts(queue);
  throw new Error(`Timed out waiting for queue state. counts=${JSON.stringify(counts)}`);
}
