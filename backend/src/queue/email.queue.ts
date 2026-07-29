import { Queue } from "bullmq";
import { bullmqConfig, redisConnection } from "../config/bullmq.js";
import { EMAIL_QUEUE_NAME } from "./constatns.js";

export interface EmailJobData {
  emailJobId: number;
  campaignId?: number;
}

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
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
