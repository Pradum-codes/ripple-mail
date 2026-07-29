import { Queue } from "bullmq";
import { redisConnection } from "../config/bullmq.js";
import { EMAIL_QUEUE_NAME } from "./constatns.js";

export interface EmailJobData {
  message: string;
}

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});