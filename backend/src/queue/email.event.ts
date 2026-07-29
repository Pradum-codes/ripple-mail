import { QueueEvents } from "bullmq";
import { redisConnection } from "../config/bullmq.js";
import { EMAIL_QUEUE_NAME } from "./constatns.js";
import { logger } from "../utils/logger.js";

export const emailQueueEvents = new QueueEvents(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
});

emailQueueEvents.on("completed", ({ jobId }) => {
  logger.info("Queue event: job completed", {
    bullJobId: jobId,
  });
});

emailQueueEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error("Queue event: job failed", undefined, {
    bullJobId: jobId,
    failureReason: failedReason,
  });
});

emailQueueEvents.on("active", ({ jobId }) => {
  logger.info("Queue event: job active", {
    bullJobId: jobId,
  });
});

emailQueueEvents.on("waiting", ({ jobId }) => {
  logger.info("Queue event: job waiting", {
    bullJobId: jobId,
  });
});

emailQueueEvents.on("delayed", ({ jobId, delay }) => {
  logger.info("Queue event: job delayed", {
    bullJobId: jobId,
    delay,
  });
});
