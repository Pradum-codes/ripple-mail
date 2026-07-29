import type { EmailJob } from "@prisma/client";
import { QueueService } from "./queue.service.js";

const EMAIL_JOB_NAME = "test-email";

export type ScheduleJobsSummary = {
  scheduledCount: number;
  queueJobIds: string[];
};

export class SchedulerService {
  async scheduleJobs(
    jobs: Pick<EmailJob, "id" | "campaignId">[],
    startTime: Date,
    delaySeconds: number,
  ): Promise<ScheduleJobsSummary> {
    const queueJobs = await Promise.all(
      jobs.map((job, index) => {
        const scheduledTime = new Date(
          startTime.getTime() + index * delaySeconds * 1000,
        );
        const delay = Math.max(scheduledTime.getTime() - Date.now(), 0);

        return QueueService.addDelayedJob(
          EMAIL_JOB_NAME,
          {
            emailJobId: job.id,
            campaignId: job.campaignId,
          },
          delay,
        );
      }),
    );

    return {
      scheduledCount: queueJobs.length,
      queueJobIds: queueJobs
        .map((job) => job.id)
        .filter((jobId): jobId is string => typeof jobId === "string"),
    };
  }
}
