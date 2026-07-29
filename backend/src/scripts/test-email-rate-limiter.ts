import "dotenv/config";
import { EmailStatus } from "@prisma/client";
import { DelayedError } from "bullmq";
import { prisma } from "../prisma/client.js";
import { mailService } from "../services/mail.service.js";
import { RateLimiterService } from "../services/rate-limiter.service.js";
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
  token: string;
  data: EmailWorkerJobData;
  attemptsMade: number;
  opts: {
    attempts?: number;
  };
  moveToDelayed(timestamp: number, token?: string): Promise<void>;
};

type RateLimitEntry = {
  count: number;
  expiresAtMs: number;
};

class InMemoryRedis {
  private readonly entries = new Map<string, RateLimitEntry>();

  async eval(
    _script: string,
    _numKeys: number,
    ...args: Array<string | number>
  ): Promise<unknown> {
    const key = String(args[0]);
    const limit = Number(args[1]);
    const ttlMs = Number(args[2]);
    const now = Date.now();
    const existing = this.entries.get(key);

    if (existing && existing.expiresAtMs <= now) {
      this.entries.delete(key);
    }

    const current = this.entries.get(key)?.count ?? 0;

    if (current >= limit) {
      const expiresAtMs = this.entries.get(key)?.expiresAtMs ?? now + ttlMs;
      this.entries.set(key, {
        count: current,
        expiresAtMs,
      });

      return [0, current, 0, Math.max(expiresAtMs - now, 0)];
    }

    const entry = this.entries.get(key);
    const nextCount = current + 1;
    const expiresAtMs = entry?.expiresAtMs && entry.expiresAtMs > now ? entry.expiresAtMs : now + ttlMs;
    this.entries.set(key, {
      count: nextCount,
      expiresAtMs,
    });

    return [1, nextCount, limit - nextCount, Math.max(expiresAtMs - now, 0)];
  }
}

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

const queueConfig = {
  maxRetries: 3,
  backoffDelayMs: 5_000,
  emailDelayMs: 0,
};

const rateLimitLimit = 3;
const sharedRedis = new InMemoryRedis();
const rateLimiterService = new RateLimiterService(
  sharedRedis as never,
  rateLimitLimit,
  5_000,
);

const store = new Map<number, FakeEmailJob>();
const delayedJobs: Array<{ jobId: string; emailJobId: number; timestamp: number }> = [];
let sendCount = 0;

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
    sendCount += 1;
    return {
      messageId: `fake-message-${sendCount}`,
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
      subject: `Rate limit test ${senderId}`,
      body: "This email exercises rate limiting.",
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
    token: `token-${jobId}`,
    data: {
      emailJobId: emailJob.id,
      campaignId: emailJob.campaignId,
    },
    attemptsMade: 0,
    opts: {
      attempts: queueConfig.maxRetries,
    },
    async moveToDelayed(timestamp: number) {
      delayedJobs.push({
        jobId,
        emailJobId: emailJob.id,
        timestamp,
      });
    },
  };
}

async function runJob(job: FakeJob) {
  try {
    await processEmailWorkerJob(job as never, queueConfig, {
      rateLimiterService,
    });
    return "completed";
  } catch (error) {
    if (error instanceof DelayedError) {
      return "delayed";
    }

    throw error;
  }
}

async function scenarioSequentialLimit() {
  sendCount = 0;
  delayedJobs.length = 0;
  store.clear();

  const senderId = 101;
  const jobs = Array.from({ length: 5 }, (_, index) => {
    const emailJob = createEmailJob(index + 1, senderId, `seq-${index + 1}@example.com`);
    store.set(emailJob.id, emailJob);
    return createJob(emailJob, `seq-bull-${index + 1}`);
  });

  const outcomes: string[] = [];
  for (const job of jobs) {
    outcomes.push(await runJob(job));
  }

  const completed = outcomes.filter((outcome) => outcome === "completed").length;
  const delayed = outcomes.filter((outcome) => outcome === "delayed").length;

  if (completed !== 3 || delayed !== 2 || sendCount !== 3 || delayedJobs.length !== 2) {
    throw new Error(
      `Scenario 1 failed: expected 3 completed, 2 delayed, 3 sends, 2 delay moves. Got completed=${completed}, delayed=${delayed}, sends=${sendCount}, delayMoves=${delayedJobs.length}.`,
    );
  }
}

async function scenarioConcurrentWorkers() {
  sendCount = 0;
  delayedJobs.length = 0;
  store.clear();

  const senderId = 202;
  const jobs = Array.from({ length: 5 }, (_, index) => {
    const emailJob = createEmailJob(index + 10, senderId, `concurrent-${index + 1}@example.com`);
    store.set(emailJob.id, emailJob);
    return createJob(emailJob, `concurrent-bull-${index + 1}`);
  });

  const outcomes = await Promise.all(jobs.map((job) => runJob(job)));
  const completed = outcomes.filter((outcome) => outcome === "completed").length;
  const delayed = outcomes.filter((outcome) => outcome === "delayed").length;

  if (completed !== 3 || delayed !== 2 || sendCount !== 3 || delayedJobs.length !== 2) {
    throw new Error(
      `Scenario 2 failed: expected 3 completed, 2 delayed, 3 sends, 2 delay moves. Got completed=${completed}, delayed=${delayed}, sends=${sendCount}, delayMoves=${delayedJobs.length}.`,
    );
  }
}

async function scenarioRestartPersistence() {
  sendCount = 0;
  delayedJobs.length = 0;
  store.clear();

  const senderId = 303;
  const primingJobs = Array.from({ length: 3 }, (_, index) => {
    const emailJob = createEmailJob(index + 20, senderId, `restart-${index + 1}@example.com`);
    store.set(emailJob.id, emailJob);
    return createJob(emailJob, `restart-prime-${index + 1}`);
  });

  for (const job of primingJobs) {
    const outcome = await runJob(job);
    if (outcome !== "completed") {
      throw new Error("Scenario 3 failed while priming the quota.");
    }
  }

  const restartedRateLimiter = new RateLimiterService(
    sharedRedis as never,
    rateLimitLimit,
    5_000,
  );
  const persistedEmailJob = createEmailJob(99, senderId, "restart-after@example.com");
  store.set(persistedEmailJob.id, persistedEmailJob);
  const restartedJob = createJob(persistedEmailJob, "restart-after-bull");

  const outcome = await processEmailWorkerJob(restartedJob as never, queueConfig, {
    rateLimiterService: restartedRateLimiter,
  }).then(
    () => "completed",
    (error) => {
      if (error instanceof DelayedError) {
        return "delayed";
      }

      throw error;
    },
  );

  if (outcome !== "delayed" || delayedJobs.length !== 1) {
    throw new Error(
      `Scenario 3 failed: expected persisted quota to delay the next job after restart. Outcome=${outcome}, delayMoves=${delayedJobs.length}.`,
    );
  }
}

async function main(): Promise<void> {
  installMocks();

  try {
    await scenarioSequentialLimit();
    await scenarioConcurrentWorkers();
    await scenarioRestartPersistence();

    console.log(
      JSON.stringify({
        scenario1: "passed",
        scenario2: "passed",
        scenario3: "passed",
        rateLimitKeyExample: "rate:303:YYYY-MM-DD-HH",
      }),
    );
  } finally {
    restoreMocks();
  }
}

main().catch((error) => {
  console.error("Rate limiter simulation failed:", error);
  process.exitCode = 1;
});
