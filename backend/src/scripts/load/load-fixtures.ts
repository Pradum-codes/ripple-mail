import { prisma } from "../../prisma/client.js";

type LoadFixtureJob = {
  id: number;
  recipient: string;
};

export type LoadFixture = {
  userId: number;
  senderId: number;
  campaignId: number;
  jobs: LoadFixtureJob[];
  cleanup(): Promise<void>;
};

type CreateLoadFixtureOptions = {
  jobCount: number;
  tag: string;
  subject: string;
  body: string;
};

export async function createLoadFixture(
  options: CreateLoadFixtureOptions,
): Promise<LoadFixture> {
  const uniqueSuffix = `${options.tag}-${Date.now()}`;

  const user = await prisma.user.create({
    data: {
      googleId: `load-${uniqueSuffix}`,
      name: `Load Test ${options.tag}`,
      email: `load-${uniqueSuffix}@example.com`,
    },
  });

  const sender = await prisma.sender.create({
    data: {
      email: `sender-${uniqueSuffix}@example.com`,
      smtpHost: "localhost",
      smtpPort: 587,
      username: `sender-${uniqueSuffix}`,
      password: "mock-password",
    },
  });

  const campaign = await prisma.campaign.create({
    data: {
      userId: user.id,
      senderId: sender.id,
      subject: options.subject,
      body: options.body,
      startTime: new Date(),
      delaySeconds: 0,
      hourlyLimit: options.jobCount,
      totalRecipients: options.jobCount,
    },
  });

  const jobRows = Array.from({ length: options.jobCount }, (_, index) => ({
    campaignId: campaign.id,
    recipient: `${options.tag}-${index + 1}-${uniqueSuffix}@example.com`,
    scheduledAt: new Date(),
  }));

  await prisma.emailJob.createMany({
    data: jobRows,
  });

  const jobs = await prisma.emailJob.findMany({
    where: {
      campaignId: campaign.id,
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      recipient: true,
    },
  });

  return {
    userId: user.id,
    senderId: sender.id,
    campaignId: campaign.id,
    jobs,
    async cleanup() {
      await prisma.emailJob.deleteMany({
        where: {
          campaignId: campaign.id,
        },
      });
      await prisma.campaign.deleteMany({
        where: {
          id: campaign.id,
        },
      });
      await prisma.sender.deleteMany({
        where: {
          id: sender.id,
        },
      });
      await prisma.user.deleteMany({
        where: {
          id: user.id,
        },
      });
    },
  };
}
