import { Worker } from "bullmq";
import { bullmqConfig, redisConnection } from "../config/bullmq.js";
import { EMAIL_QUEUE_NAME } from "../queue/constatns.js";
import {
  finalizeRetryableEmailFailure,
  processEmailWorkerJob,
  type EmailWorkerJobData,
} from "./email.processor.js";
import { logger } from "../utils/logger.js";

const workerQueueConfig = {
  ...bullmqConfig.queue,
  emailDelayMs: bullmqConfig.worker.emailDelayMs,
};

export const emailWorker = new Worker<EmailWorkerJobData>(
  EMAIL_QUEUE_NAME,
  (job) => processEmailWorkerJob(job, workerQueueConfig),
  {
    connection: redisConnection,
    concurrency: bullmqConfig.worker.concurrency,
  }
);

emailWorker.on("failed", (job, error) => {
  if (!job || !error) {
    return;
  }

  void finalizeRetryableEmailFailure(job, error, workerQueueConfig).catch((hookError) => {
    logger.error("Failed to finalize exhausted retry", hookError instanceof Error ? hookError : undefined, {
      bullJobId: String(job.id),
      emailJobId: job.data.emailJobId,
    });
  });
});
