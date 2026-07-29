import "dotenv/config";
import "./queue/email.event.js";
import "./workers/email.worker.js";
import { logger } from "./utils/logger.js";
import { emailWorker } from "./workers/email.worker.js";
import { emailQueueEvents } from "./queue/email.event.js";
import { redisConnection } from "./config/bullmq.js";

logger.info("Email Worker started.");

async function shutdown(signal: string) {
  logger.info(`${signal} received. Shutting down gracefully...`);

  try {
    await emailWorker.close();
    logger.info("Worker closed.");

    await emailQueueEvents.close();
    logger.info("QueueEvents closed.");

    await redisConnection.quit();
    logger.info("Redis connection closed.");

    logger.info("Shutdown complete.");

    process.exit(0);
  } catch (error) {
    logger.error(`Shutdown failed: ${error}`);

    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));