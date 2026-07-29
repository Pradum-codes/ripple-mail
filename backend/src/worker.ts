import "dotenv/config";
import "./queue/email.event.js";
import "./workers/email.worker.js";
import { logger } from "./utils/logger.js";
import { emailWorker } from "./workers/email.worker.js";
import { emailQueueEvents } from "./queue/email.event.js";
import { bullmqConfig, redisConnection } from "./config/bullmq.js";

logger.info("Worker started", {
  queueName: "email-queue",
  concurrency: bullmqConfig.worker.concurrency,
  maxRetries: bullmqConfig.queue.maxRetries,
  backoffDelayMs: bullmqConfig.queue.backoffDelayMs,
  emailDelayMs: bullmqConfig.worker.emailDelayMs,
  maxEmailsPerHour: bullmqConfig.worker.maxEmailsPerHour,
});

let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  logger.info("Worker shutdown initiated", { signal });

  try {
    await emailWorker.close();
    logger.info("Worker closed");

    await emailQueueEvents.close();
    logger.info("QueueEvents closed");

    await redisConnection.quit();
    logger.info("Redis connection closed");

    logger.info("Worker shutdown complete");

    process.exit(0);
  } catch (error) {
    logger.error(
      "Worker shutdown failed",
      error instanceof Error ? error : undefined,
      { signal }
    );

    process.exit(1);
  }
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});