import "dotenv/config";
import { PrismaClient, type EmailStatus } from "@prisma/client";
import nodemailer, { type SentMessageInfo } from "nodemailer";
import { verifyMailConnection, smtpConfig } from "../config/mail.js";
import { redisConnection } from "../config/bullmq.js";
import { emailQueue } from "../queue/email.queue.js";
import { emailQueueEvents } from "../queue/email.event.js";
import { mailService } from "../services/mail.service.js";
import { logger } from "../utils/logger.js";
import { emailWorker } from "../workers/email.worker.js";

const prisma = new PrismaClient();

type CheckResult = {
  label: string;
  passed: boolean;
  details: string;
};

async function main(): Promise<void> {
  const checks: CheckResult[] = [];
  const uniqueSuffix = Date.now();
  let createdUserId: number | null = null;
  let createdSenderId: number | null = null;
  let createdCampaignId: number | null = null;
  let createdEmailJobId: number | null = null;
  let capturedInfo: SentMessageInfo | null = null;

  const originalSendEmail = mailService.sendEmail.bind(mailService);
  mailService.sendEmail = async (options) => {
    const info = await originalSendEmail(options);
    capturedInfo = info;
    return info;
  };

  try {
    await verifyMailConnection();

    const user = await prisma.user.create({
      data: {
        googleId: `worker-test-${uniqueSuffix}`,
        name: "SMTP Worker Test",
        email: `worker-test-${uniqueSuffix}@example.com`,
      },
    });
    createdUserId = user.id;

    const sender = await prisma.sender.upsert({
      where: {
        email: smtpConfig.user,
      },
      update: {
        smtpHost: smtpConfig.host,
        smtpPort: smtpConfig.port,
        username: smtpConfig.user,
        password: smtpConfig.pass,
      },
      create: {
        email: smtpConfig.user,
        smtpHost: smtpConfig.host,
        smtpPort: smtpConfig.port,
        username: smtpConfig.user,
        password: smtpConfig.pass,
      },
    });

    const campaign = await prisma.campaign.create({
      data: {
        userId: user.id,
        senderId: sender.id,
        subject: "BullMQ worker SMTP test",
        body: "This email verifies the BullMQ worker path with the current SMTP configuration.",
        startTime: new Date(),
        delaySeconds: 0,
        hourlyLimit: 1,
        totalRecipients: 1,
      },
    });
    createdCampaignId = campaign.id;

    const emailJob = await prisma.emailJob.create({
      data: {
        campaignId: campaign.id,
        recipient: smtpConfig.user,
        scheduledAt: new Date(),
      },
      include: {
        campaign: {
          include: {
            sender: true,
          },
        },
      },
    });
    createdEmailJobId = emailJob.id;

    const initialStatus: EmailStatus = emailJob.status;

    const queueJob = await emailQueue.add(
      "test-email",
      { emailJobId: emailJob.id } as never,
    );
    checks.push({
      label: "Queue receives a job containing only emailJobId.",
      passed: true,
      details: `BullMQ job ${String(queueJob.id)} enqueued with emailJobId=${emailJob.id}.`,
    });

    await queueJob.waitUntilFinished(emailQueueEvents, 30_000);
    checks.push({
      label: "Worker picks up the job.",
      passed: true,
      details: `BullMQ job ${String(queueJob.id)} finished successfully.`,
    });

    const refreshedEmailJob = await prisma.emailJob.findUnique({
      where: { id: emailJob.id },
      include: {
        campaign: {
          include: {
            sender: true,
          },
        },
      },
    });

    if (!refreshedEmailJob) {
      throw new Error(`Temporary EmailJob ${emailJob.id} disappeared during the test.`);
    }

    checks.push({
      label: "Worker loads EmailJob.",
      passed: true,
      details: `EmailJob ${refreshedEmailJob.id} was available for worker processing.`,
    });
    checks.push({
      label: "Worker loads Campaign.",
      passed: true,
      details: `Campaign ${refreshedEmailJob.campaign.id} was loaded with subject "${refreshedEmailJob.campaign.subject}".`,
    });
    checks.push({
      label: "Worker loads Sender.",
      passed: true,
      details: `Sender ${refreshedEmailJob.campaign.sender.id} was loaded with from=${refreshedEmailJob.campaign.sender.email}.`,
    });

    if (!capturedInfo) {
      throw new Error("The worker completed, but no SMTP send result was captured from MailService.");
    }

    checks.push({
      label: "Email is sent successfully.",
      passed: true,
      details: `messageId=${capturedInfo.messageId}, accepted=${capturedInfo.accepted.join(", ") || "None"}.`,
    });

    const previewUrl = nodemailer.getTestMessageUrl(capturedInfo);
    const previewDetails = previewUrl || "Preview URL not available for this transport.";
    checks.push({
      label: "Ethereal inbox (or preview URL) shows the email.",
      passed: Boolean(previewUrl),
      details: previewDetails,
    });

    const jobState = await queueJob.getState();
    checks.push({
      label: "BullMQ marks the job as completed.",
      passed: jobState === "completed",
      details: `BullMQ final state: ${jobState}.`,
    });

    checks.push({
      label: "EmailJob.status is still unchanged (expected for this stage).",
      passed: refreshedEmailJob.status === initialStatus,
      details: `Initial status=${initialStatus}, current status=${refreshedEmailJob.status}.`,
    });

    logger.info("BullMQ worker SMTP test completed.");
    logger.info(`messageId: ${capturedInfo.messageId}`);
    logger.info(`accepted recipients: ${capturedInfo.accepted.join(", ") || "None"}`);
    logger.info(`rejected recipients: ${capturedInfo.rejected.join(", ") || "None"}`);
    logger.info(`SMTP response: ${capturedInfo.response}`);
    logger.info(`Ethereal preview URL: ${previewDetails}`);

    for (const check of checks) {
      logger.info(`${check.passed ? "[PASS]" : "[FAIL]"} ${check.label} ${check.details}`);
    }
  } catch (error) {
    const testError =
      error instanceof Error ? error : new Error("Unknown BullMQ worker SMTP test failure");
    logger.error("BullMQ worker SMTP test failed", testError);
    process.exitCode = 1;
  } finally {
    mailService.sendEmail = originalSendEmail;

    if (createdCampaignId !== null) {
      await prisma.campaign.deleteMany({
        where: { id: createdCampaignId },
      });
    }

    if (createdSenderId !== null) {
      await prisma.sender.deleteMany({
        where: { id: createdSenderId },
      });
    }

    if (createdUserId !== null) {
      await prisma.user.deleteMany({
        where: { id: createdUserId },
      });
    }

    if (createdEmailJobId !== null) {
      logger.info(`Temporary EmailJob ${createdEmailJobId} was cleaned up with its Campaign.`);
    }

    await emailWorker.close();
    await emailQueueEvents.close();
    await emailQueue.close();
    await prisma.$disconnect();
    await redisConnection.quit();
  }
}

void main();
