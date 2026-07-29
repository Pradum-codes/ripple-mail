import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/bullmq.js";
import { EmailJobData } from "../queue/email.queue.js";
import { EMAIL_QUEUE_NAME } from "../queue/constatns.js";
import { logger } from "../utils/logger.js";

export const emailWorker = new Worker<EmailJobData>(
  EMAIL_QUEUE_NAME,
  async (job: Job<EmailJobData>) => {
    logger.info("--------------------------------");
    logger.info(`Processing Job: ${job.name}`);
    logger.info(`Job ID: ${job.id}`);
    console.log("Payload:", job.data);
    logger.info("--------------------------------");  
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);