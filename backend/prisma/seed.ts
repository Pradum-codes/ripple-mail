import { PrismaClient, EmailStatus } from "@prisma/client";
import { logger } from "../src/utils/logger.js";

declare const process: {
  exit(code?: number): never;
};

const prisma = new PrismaClient();

async function main() {
  logger.info("🌱 Seeding database...");

  // -----------------------
  // User
  // -----------------------
  const user = await prisma.user.upsert({
    where: {
      email: "pradum@example.com",
    },
    update: {},
    create: {
      googleId: "google-123456789",
      name: "Pradum",
      email: "pradum@example.com",
      avatar: "https://i.pravatar.cc/300",
    },
  });

  // -----------------------
  // Sender
  // -----------------------
  const sender = await prisma.sender.upsert({
    where: {
      email: "marketing@example.com",
    },
    update: {},
    create: {
      email: "marketing@example.com",
      smtpHost: "smtp.gmail.com",
      smtpPort: 587,
      username: "marketing@example.com",
      password: "sample-app-password",
    },
  });

  // -----------------------
  // Campaign
  // -----------------------
  const campaign = await prisma.campaign.create({
    data: {
      userId: user.id,
      senderId: sender.id,
      subject: "Welcome to Ripple Mail",
      body: "Hello {{name}}, this is a test email.",
      startTime: new Date(),
      delaySeconds: 60,
      hourlyLimit: 100,
      totalRecipients: 3,
    },
  });

  // -----------------------
  // Email Jobs
  // -----------------------
  const now = new Date();

  await prisma.emailJob.createMany({
    data: [
      {
        campaignId: campaign.id,
        recipient: "alice@example.com",
        scheduledAt: now,
        status: EmailStatus.SCHEDULED,
      },
      {
        campaignId: campaign.id,
        recipient: "bob@example.com",
        scheduledAt: new Date(now.getTime() + 60_000),
        status: EmailStatus.SCHEDULED,
      },
      {
        campaignId: campaign.id,
        recipient: "charlie@example.com",
        scheduledAt: new Date(now.getTime() + 120_000),
        status: EmailStatus.SCHEDULED,
      },
    ],
  });

  logger.info("✅ Database seeded successfully!");
}

main()
  .catch((error) => {
    logger.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });