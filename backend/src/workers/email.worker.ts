import { EmailStatus } from "@prisma/client";
import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/bullmq.js";
import { prisma } from "../prisma/client.js";
import { EMAIL_QUEUE_NAME } from "../queue/constatns.js";
import { mailService } from "../services/mail.service.js";
import { logger } from "../utils/logger.js";

type EmailWorkerJobData = {
  emailJobId: number;
};

export const emailWorker = new Worker<EmailWorkerJobData>(
  EMAIL_QUEUE_NAME,
  async (job: Job<EmailWorkerJobData>) => {
    const { emailJobId } = job.data;
    const emailJob = await prisma.emailJob.findUnique({
      where: { id: emailJobId },
      include: {
        campaign: {
          include: {
            sender: true,
          },
        },
      },
    });

    if (!emailJob) {
      const errorMessage = `EmailJob ${emailJobId} not found for BullMQ job ${String(job.id)}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      if (!emailJob.campaign.sender.email) {
        throw new Error("Sender email missing");
      }

      logger.info(
        `Processing EmailJob ${emailJobId} (BullMQ job ${job.id})`
      );

      const info = await mailService.sendEmail({
        from: emailJob.campaign.sender.email,
        to: emailJob.recipient,
        subject: emailJob.campaign.subject,
        text: emailJob.campaign.body,
      });

      const sentAt = new Date();

      const updatedEmailJob = await prisma.emailJob.update({
        where: { id: emailJob.id },
        data: {
          status: EmailStatus.SENT,
          sentAt,
        },
      });

      logger.info(
        `Email sent for emailJobId=${updatedEmailJob.id}, messageId=${info.messageId}, sentAt=${updatedEmailJob.sentAt?.toISOString() ?? sentAt.toISOString()}`,
      );
    } catch (error) {
      const failureReason =
        error instanceof Error ? error.message : "Unknown email worker failure";

      await prisma.emailJob.update({
        where: { id: emailJob.id },
        data: {
          status: EmailStatus.FAILED,
          failureReason,
        },
      });

      logger.error(
        `Email delivery failed for emailJobId=${emailJob.id}, failureReason=${failureReason}`,
      );

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);
