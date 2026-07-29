import "dotenv/config";
import { EmailStatus } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { mailService } from "../services/mail.service.js";
import { processEmailWorkerJob, type EmailWorkerJobData } from "../workers/email.processor.js";

type FakeEmailJob = {
  id: number;
  campaignId: number;
  recipient: string;
  scheduledAt: Date;
  sentAt: Date | null;
  status: EmailStatus;
  failureReason: string | null;
  retryCount: number;
  campaign: {
    id: number;
    subject: string;
    body: string;
    sender: {
      id: number;
      email: string;
    };
  };
};

type FakeJob = {
  id: string;
  data: EmailWorkerJobData;
  attemptsMade: number;
  opts: {
    attempts?: number;
  };
};

const queueConfigBase = {
  maxRetries: 3,
  backoffDelayMs: 5_000,
};

const prismaEmailJob = prisma.emailJob as unknown as {
  findUnique: (args: { where: { id: number } }) => Promise<FakeEmailJob | null>;
  update: (args: {
    where: { id: number };
    data: Partial<FakeEmailJob>;
  }) => Promise<FakeEmailJob>;
};

const originalFindUnique = prismaEmailJob.findUnique.bind(prismaEmailJob);
const originalUpdate = prismaEmailJob.update.bind(prismaEmailJob);
const originalSendEmail = mailService.sendEmail.bind(mailService);

const store = new Map<number, FakeEmailJob>();
const sendTimestamps: number[] = [];

function installMocks() {
  prismaEmailJob.findUnique = async ({ where }) => store.get(where.id) ?? null;
  prismaEmailJob.update = async ({ where, data }) => {
    const current = store.get(where.id);
    if (!current) {
      throw new Error(`EmailJob ${where.id} not found`);
    }

    const updated = {
      ...current,
      ...data,
    };
    store.set(where.id, updated);
    return updated;
  };

  mailService.sendEmail = async () => {
    sendTimestamps.push(Date.now());
    return {
      messageId: `delay-message-${sendTimestamps.length}`,
      accepted: [],
      rejected: [],
      pending: [],
      response: "250 OK",
    } as never;
  };
}

function restoreMocks() {
  prismaEmailJob.findUnique = originalFindUnique;
  prismaEmailJob.update = originalUpdate;
  mailService.sendEmail = originalSendEmail;
}

function createEmailJob(id: number, senderId: number, recipient: string): FakeEmailJob {
  return {
    id,
    campaignId: senderId + 1_000,
    recipient,
    scheduledAt: new Date(),
    sentAt: null,
    status: EmailStatus.SCHEDULED,
    failureReason: null,
    retryCount: 0,
    campaign: {
      id: senderId + 1_000,
      subject: `Delay test ${senderId}`,
      body: "This email exercises configurable spacing.",
      sender: {
        id: senderId,
        email: `sender-${senderId}@example.com`,
      },
    },
  };
}

function createJob(emailJob: FakeEmailJob, jobId: string): FakeJob {
  return {
    id: jobId,
    data: {
      emailJobId: emailJob.id,
      campaignId: emailJob.campaignId,
    },
    attemptsMade: 0,
    opts: {
      attempts: queueConfigBase.maxRetries,
    },
  };
}

async function runBatch(emailDelayMs: number, senderId: number) {
  store.clear();
  sendTimestamps.length = 0;

  const rateLimiterService = {
    async acquire() {
      return {
        allowed: true,
        currentCount: 1,
        limit: 999,
        remaining: 998,
        key: `rate:${senderId}:test`,
        nextAvailableAt: new Date().toISOString(),
      };
    },
  };

  const jobs = Array.from({ length: 3 }, (_, index) => {
    const emailJob = createEmailJob(index + senderId, senderId, `delay-${index + 1}@example.com`);
    store.set(emailJob.id, emailJob);
    return createJob(emailJob, `delay-bull-${index + 1}`);
  });

  for (const job of jobs) {
    await processEmailWorkerJob(job as never, {
      ...queueConfigBase,
      emailDelayMs,
    }, {
      rateLimiterService,
    });
  }

  const gaps = sendTimestamps.slice(1).map((timestamp, index) => timestamp - sendTimestamps[index]);
  return {
    sendCount: sendTimestamps.length,
    gaps,
  };
}

async function main(): Promise<void> {
  installMocks();

  try {
    const zeroDelay = await runBatch(0, 401);
    if (zeroDelay.sendCount !== 3 || zeroDelay.gaps.some((gap) => gap > 250)) {
      throw new Error(
        `Zero-delay scenario failed: sendCount=${zeroDelay.sendCount}, gaps=${zeroDelay.gaps.join(",")}`,
      );
    }

    const oneSecondDelay = await runBatch(1_000, 402);
    if (
      oneSecondDelay.sendCount !== 3 ||
      oneSecondDelay.gaps.some((gap) => gap < 900)
    ) {
      throw new Error(
        `1s-delay scenario failed: sendCount=${oneSecondDelay.sendCount}, gaps=${oneSecondDelay.gaps.join(",")}`,
      );
    }

    console.log(
      JSON.stringify({
        zeroDelay: "passed",
        oneSecondDelay: "passed",
        observedGapsMs: oneSecondDelay.gaps,
      }),
    );
  } finally {
    restoreMocks();
  }
}

main().catch((error) => {
  console.error("Email delay test failed:", error);
  process.exitCode = 1;
});
