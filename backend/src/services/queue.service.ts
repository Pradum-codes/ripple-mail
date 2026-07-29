import { emailQueue, EmailJobData } from "../queue/email.queue.js";
import { JobsOptions } from "bullmq";

export class QueueService {
  static async addJob(
    name: string,
    data: EmailJobData,
    options?: JobsOptions
  ) {
    return emailQueue.add(name, data, options);
  }
  static async addDelayedJob(
    name: string,
    data: EmailJobData,
    delay: number
  ) {
    return emailQueue.add(name, data, {
      delay,
    });
  }
}