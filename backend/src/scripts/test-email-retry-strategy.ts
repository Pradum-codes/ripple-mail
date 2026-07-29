import "dotenv/config";
import { EmailStatus } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { mailService } from "../services/mail.service.js";
import {
  finalizeRetryableEmailFailure,
  processEmailWorkerJob,
  type EmailWorkerJobData,
} from "../workers/email.processor.js";
import { logger } from "../utils/logger.js";

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

const queueConfig = {
  maxRetries: 3,
  backoffDelayMs: 1_000,
  emailDelayMs: 0,
};

const store = new Map<number, FakeEmailJob>();
const capturedLogs: Array<{ level: string; message: string }> = [];

const prismaEmailJob = prisma.emailJob as unknown as {
  findUnique: (args: { where: { id: number } }) => Promise<FakeEmailJob | null>;
  update: (args: { where: { id: number }; data: Partial<FakeEmailJob> }) => Promise<FakeEmailJob>;
};

const originalFindUnique = prismaEmailJob.findUnique.bind(prismaEmailJob);
const originalUpdate = prismaEmailJob.update.bind(prismaEmailJob);
const originalSendEmail = mailService.sendEmail.bind(mailService);
const originalLoggerInfo = logger.info.bind(logger);
const originalLoggerWarn = logger.warn.bind(logger);
const originalLoggerError = logger.error.bind(logger);

function fakeJob(emailJobId: number, attemptsMade: number, jobId: string): FakeJob {
  return {
    id: jobId,
    data: {
      emailJobId,
      campaignId: store.get(emailJobId)?.campaignId,
    },
    attemptsMade,
    opts: {
      attempts: queueConfig.maxRetries,
    },
  };
}

function installInMemoryStore() {
  prismaEmailJob.findUnique = async ({ where }) => store.get(where.id) ?? null;
  prismaEmailJob.update = async ({ where, data }) => {
    const currentJob = store.get(where.id);
    if (!currentJob) {
      throw new Error(`EmailJob ${where.id} not found`);
    }

    const updatedJob = {
      ...currentJob,
      ...data,
    };

    store.set(where.id, updatedJob);
    return updatedJob;
  };
}

function captureLogs() {
  logger.info = ((message: string) => {
    capturedLogs.push({ level: "INFO", message });
  }) as typeof logger.info;
  logger.warn = ((message: string) => {
    capturedLogs.push({ level: "WARN", message });
  }) as typeof logger.warn;
  logger.error = ((message: string) => {
    capturedLogs.push({ level: "ERROR", message });
  }) as typeof logger.error;
}

function restoreMocks() {
  prismaEmailJob.findUnique = originalFindUnique;
  prismaEmailJob.update = originalUpdate;
  mailService.sendEmail = originalSendEmail;
  logger.info = originalLoggerInfo;
  logger.warn = originalLoggerWarn;
  logger.error = originalLoggerError;
}

async function createEmailJob(id: number, recipient: string): Promise<FakeEmailJob> {
  const emailJob: FakeEmailJob = {
    id,
    campaignId: 101,
    recipient,
    scheduledAt: new Date(),
    sentAt: null,
    status: EmailStatus.SCHEDULED,
    failureReason: null,
    retryCount: 0,
    campaign: {
      id: 101,
      subject: "Phase 6.3 retry test",
      body: "This email exercises retry handling.",
      sender: {
        email: "sender@example.com",
      },
    },
  };

  store.set(id, emailJob);
  return emailJob;
}

async function runTemporaryTimeoutScenario() {
  const emailJob = await createEmailJob(1, "timeout@example.com");
  mailService.sendEmail = async () => {
    throw new Error("ETIMEDOUT: SMTP timeout");
  };

  try {
    await processEmailWorkerJob(fakeJob(emailJob.id, 0, "bull-timeout-1") as never, queueConfig);
  } catch {
    // Expected retryable failure.
  }

  if (store.get(emailJob.id)?.status !== EmailStatus.PROCESSING) {
    throw new Error("Scenario 1 failed: retryable timeout should not mark FAILED on first attempt.");
  }

  try {
    await processEmailWorkerJob(fakeJob(emailJob.id, 1, "bull-timeout-2") as never, queueConfig);
  } catch {
    // Expected retryable failure.
  }

  await finalizeRetryableEmailFailure(
    fakeJob(emailJob.id, 3, "bull-timeout-final") as never,
    new Error("ETIMEDOUT: SMTP timeout"),
    queueConfig,
  );

  if (store.get(emailJob.id)?.status !== EmailStatus.FAILED) {
    throw new Error("Scenario 1 failed: retries exhausted should end in FAILED.");
  }
}

async function runInvalidRecipientScenario() {
  const emailJob = await createEmailJob(2, "invalid@example.com");
  mailService.sendEmail = async () => {
    throw new Error("550 Invalid recipient address");
  };

  try {
    await processEmailWorkerJob(fakeJob(emailJob.id, 0, "bull-invalid-1") as never, queueConfig);
    throw new Error("Scenario 2 failed: invalid recipient should throw.");
  } catch (error) {
    if (!(error instanceof Error) || error.name !== "UnrecoverableError") {
      throw new Error("Scenario 2 failed: invalid recipient should fail fast.");
    }
  }

  if (store.get(emailJob.id)?.status !== EmailStatus.FAILED) {
    throw new Error("Scenario 2 failed: invalid recipient should mark FAILED immediately.");
  }
}

async function runExhaustedRetryLoggingScenario() {
  capturedLogs.length = 0;

  const emailJob = await createEmailJob(3, "exhausted@example.com");
  store.set(emailJob.id, {
    ...emailJob,
    status: EmailStatus.PROCESSING,
  });

  const retryError = new Error("ETIMEDOUT: SMTP timeout");
  await finalizeRetryableEmailFailure(
    fakeJob(emailJob.id, 3, "bull-exhausted") as never,
    retryError,
    queueConfig,
  );

  const hasRetriesExhaustedLog = capturedLogs.some((entry) => entry.message === "Retries exhausted");
  const hasFinalFailedLog = capturedLogs.some((entry) => entry.message === "Final FAILED update");

  if (!hasRetriesExhaustedLog || !hasFinalFailedLog) {
    throw new Error("Scenario 3 failed: expected exhaustion logs were not emitted.");
  }

  if (store.get(emailJob.id)?.status !== EmailStatus.FAILED) {
    throw new Error("Scenario 3 failed: exhausted retry should end in FAILED.");
  }
}

async function main(): Promise<void> {
  installInMemoryStore();
  captureLogs();

  try {
    await runTemporaryTimeoutScenario();
    await runInvalidRecipientScenario();
    await runExhaustedRetryLoggingScenario();

    console.log(
      JSON.stringify({
        scenario1: "passed",
        scenario2: "passed",
        scenario3: "passed",
      }),
    );
  } finally {
    restoreMocks();
  }
}

main().catch((error) => {
  console.error("Retry strategy test failed:", error);
  process.exitCode = 1;
});
