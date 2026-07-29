import "dotenv/config";
import { prisma } from "../prisma/client.js";
import { CampaignService } from "../services/campaign.service.js";
import { createCampaignSchema } from "../validators/campaign.validator.js";

const campaignService = new CampaignService();

async function main(): Promise<void> {
  const user = await prisma.user.upsert({
    where: {
      email: "campaign-test-user@example.com",
    },
    update: {},
    create: {
      googleId: "campaign-test-user",
      name: "Campaign Test User",
      email: "campaign-test-user@example.com",
    },
  });

  const sender = await prisma.sender.upsert({
    where: {
      email: "campaign-test-sender@example.com",
    },
    update: {
      smtpHost: "smtp.ethereal.email",
      smtpPort: 587,
      username: "campaign-test-sender@example.com",
      password: "campaign-test-password",
    },
    create: {
      email: "campaign-test-sender@example.com",
      smtpHost: "smtp.ethereal.email",
      smtpPort: 587,
      username: "campaign-test-sender@example.com",
      password: "campaign-test-password",
    },
  });

  console.log(`Using user ${user.id} and sender ${sender.id} for campaign test.`);

  const input = createCampaignSchema.parse({
    senderId: String(sender.id),
    subject: "Campaign service test",
    body: "This is a temporary campaign persistence test.",
    startTime: new Date().toISOString(),
    delaySeconds: 300,
    hourlyLimit: 25,
    recipients: ["alice@example.com", "bob@example.com"],
  });

  const createdCampaign = await campaignService.createCampaign(input);
  console.log("Created campaign:");
  console.log(createdCampaign);

  const campaigns = await campaignService.listCampaigns({
    page: 1,
    limit: 10,
  });
  console.log("All campaigns:");
  console.log(campaigns);
}

main()
  .catch((error) => {
    console.error("Campaign service test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
