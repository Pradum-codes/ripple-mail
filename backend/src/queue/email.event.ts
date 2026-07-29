import { QueueEvents } from "bullmq";
import { redisConnection } from "../config/bullmq.js";
import { EMAIL_QUEUE_NAME } from "./constatns.js";
import { logger } from "../utils/logger.js";

export const emailQueueEvents = new QueueEvents(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
});

emailQueueEvents.on("completed", ({ jobId }) => {
  logger.info(`Job ${jobId} completed`);
});

emailQueueEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error(`Job ${jobId} failed: ${failedReason}`);
});

emailQueueEvents.on("active", ({ jobId }) => {
  logger.info(`Job ${jobId} is now active`);
});

emailQueueEvents.on("waiting", ({ jobId }) => {
  logger.info(`Job ${jobId} entered waiting state`);
});