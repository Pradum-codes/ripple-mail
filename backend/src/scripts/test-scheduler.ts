import "dotenv/config";
import { EmailStatus } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { verifyMailConnection, smtpConfig } from "../config/mail.js";
import { emailQueue } from "../queue/email.queue.js";
import { emailQueueEvents } from "../queue/email.event.js";
import { CampaignService } from "../services/campaign.service.js";
import { EmailService } from "../services/email.service.js";
import { SchedulerService } from "../services/scheduler.service.js";
import { createCampaignSchema } from "../validators/campaign.validator.js";
import { emailWorker } from "../workers/email.worker.js";

const campaignService = new CampaignService();
const emailService = new EmailService();
const schedulerService = new SchedulerService();

async function getOrCreateCampaign() {
  const existingCampaign = await campaignService
    .listCampaigns({
      page: 1,
      limit: 1,
    })
    .then((result) => result.data[0] ?? null);

  if (existingCampaign) {
    return existingCampaign;
  }

  await prisma.user.upsert({
    where: {
      email: "scheduler-test-user@example.com",
    },
    update: {},
    create: {
      googleId: "scheduler-test-user",
      name: "Scheduler Test User",
      email: "scheduler-test-user@example.com",
    },
  });

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

  const input = createCampaignSchema.parse({
    senderId: String(sender.id),
    subject: "Scheduler service test campaign",
    body: "This campaign exists only to test scheduler queueing.",
    startTime: new Date(Date.now() + 2_000).toISOString(),
    delaySeconds: 2,
    hourlyLimit: 10,
    recipients: [smtpConfig.user],
  });

  return campaignService.createCampaign(input);
}

async function main(): Promise<void> {
  await verifyMailConnection();

  const campaign = await getOrCreateCampaign();
  const recipients = [smtpConfig.user, smtpConfig.user];
  const startTime = new Date(Date.now() + 2_000);
  const delaySeconds = 2;

  const createdJobs = await emailService.createJobs({
    campaignId: campaign.id,
    recipients,
    startTime,
  });

  console.log(`Created ${createdJobs.length} EmailJobs for campaign ${campaign.id}.`);

  const jobsToSchedule = await prisma.emailJob.findMany({
    where: {
      campaignId: campaign.id,
      status: EmailStatus.SCHEDULED,
      bullJobId: null,
      createdAt: {
        gte: new Date(Date.now() - 60_000),
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const summary = await schedulerService.scheduleJobs(
    jobsToSchedule,
    startTime,
    delaySeconds,
  );

  console.log("Queue job IDs:");
  console.log(summary.queueJobIds);

  for (const queueJobId of summary.queueJobIds) {
    const queueJob = await emailQueue.getJob(queueJobId);

    if (!queueJob) {
      throw new Error(`Queue job ${queueJobId} was not found after scheduling.`);
    }

    await queueJob.waitUntilFinished(emailQueueEvents, 30_000);
  }

  const finalEmailJobs = await prisma.emailJob.findMany({
    where: {
      id: {
        in: jobsToSchedule.map((job) => job.id),
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log("Final EmailJob statuses:");
  console.log(
    finalEmailJobs.map((job) => ({
      id: job.id,
      recipient: job.recipient,
      status: job.status,
      sentAt: job.sentAt,
      failureReason: job.failureReason,
    })),
  );
}

main()
  .catch((error) => {
    console.error("Scheduler service test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await emailWorker.close();
    await emailQueueEvents.close();
    await emailQueue.close();
    await prisma.$disconnect();
  });
