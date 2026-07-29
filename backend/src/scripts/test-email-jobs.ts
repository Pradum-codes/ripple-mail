import "dotenv/config";
import { prisma } from "../prisma/client.js";
import { CampaignService } from "../services/campaign.service.js";
import { EmailService } from "../services/email.service.js";
import { createCampaignSchema } from "../validators/campaign.validator.js";

const campaignService = new CampaignService();
const emailService = new EmailService();

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
      email: "email-jobs-test-user@example.com",
    },
    update: {},
    create: {
      googleId: "email-jobs-test-user",
      name: "Email Jobs Test User",
      email: "email-jobs-test-user@example.com",
    },
  });

  const sender = await prisma.sender.upsert({
    where: {
      email: "email-jobs-test-sender@example.com",
    },
    update: {
      smtpHost: "smtp.ethereal.email",
      smtpPort: 587,
      username: "email-jobs-test-sender@example.com",
      password: "email-jobs-test-password",
    },
    create: {
      email: "email-jobs-test-sender@example.com",
      smtpHost: "smtp.ethereal.email",
      smtpPort: 587,
      username: "email-jobs-test-sender@example.com",
      password: "email-jobs-test-password",
    },
  });

  const input = createCampaignSchema.parse({
    senderId: String(sender.id),
    subject: "Email job service test campaign",
    body: "This campaign exists only to test EmailJob persistence.",
    startTime: new Date().toISOString(),
    delaySeconds: 0,
    hourlyLimit: 10,
    recipients: ["alpha@example.com"],
  });

  return campaignService.createCampaign(input);
}

async function main(): Promise<void> {
  const campaign = await getOrCreateCampaign();
  const recipients = [
    "alice@example.com",
    "bob@example.com",
    "charlie@example.com",
  ];

  const createdJobs = await emailService.createJobs({
    campaignId: campaign.id,
    recipients,
    startTime: campaign.startTime,
  });

  console.log(`Created ${createdJobs.length} email jobs for campaign ${campaign.id}.`);

  const scheduledJobs = await emailService.listScheduled({
    page: 1,
    limit: 10,
  });
  const sentJobs = await emailService.listSent({
    page: 1,
    limit: 10,
  });
  const failedJobs = await emailService.listFailed({
    page: 1,
    limit: 10,
  });

  console.log("Scheduled jobs:");
  console.log(scheduledJobs);

  console.log("Sent jobs:");
  console.log(sentJobs);

  console.log("Failed jobs:");
  console.log(failedJobs);
}

main()
  .catch((error) => {
    console.error("Email job service test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
