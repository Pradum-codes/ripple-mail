import { EmailStatus } from "@prisma/client";
import type { Job } from "bullmq";
import { DelayedError } from "bullmq";
import { prisma } from "../prisma/client.js";
import { mailService } from "../services/mail.service.js";
import type { RateLimiterService } from "../services/rate-limiter.service.js";
import { logger } from "../utils/logger.js";
import { sleep } from "../utils/sleep.js";
import { classifyEmailFailure, createPermanentEmailFailure } from "../utils/email-failure.js";

export type EmailWorkerJobData = {
  emailJobId: number;
  campaignId?: number;
};

type WorkerQueueConfig = {
  maxRetries: number;
  backoffDelayMs: number;
  emailDelayMs: number;
};

type EmailWorkerDependencies = {
  rateLimiterService?: Pick<RateLimiterService, "acquire">;
};

let defaultRateLimiterServicePromise:
  | Promise<Pick<RateLimiterService, "acquire">>
  | null = null;

async function getRateLimiterService(): Promise<Pick<RateLimiterService, "acquire">> {
  if (!defaultRateLimiterServicePromise) {
    defaultRateLimiterServicePromise = import(
      "../services/rate-limiter.service.js"
    ).then((module) => module.getRateLimiterService());
  }

  return defaultRateLimiterServicePromise;
}

export function getJobLogContext(
  job: Job<EmailWorkerJobData>,
  startedAt?: number,
  maxAttempts?: number,
  attemptNumber?: number,
) {
  return {
    bullJobId: String(job.id),
    emailJobId: job.data.emailJobId,
    campaignId: job.data.campaignId,
    attemptNumber: attemptNumber ?? job.attemptsMade + 1,
    maxAttempts: maxAttempts ?? job.opts.attempts ?? 1,
    ...(startedAt !== undefined
      ? { executionDurationMs: Date.now() - startedAt }
      : {}),
  };
}

export async function processEmailWorkerJob(
  job: Job<EmailWorkerJobData>,
  queueConfig: WorkerQueueConfig,
  dependencies: EmailWorkerDependencies = {},
) {
  const startedAt = Date.now();
  const maxAttempts = job.opts.attempts ?? queueConfig.maxRetries;
  const currentAttempt = job.attemptsMade + 1;
  const configuredDelayMs = queueConfig.emailDelayMs;

  logger.info("Worker job received", getJobLogContext(job, undefined, maxAttempts));

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
    logger.warn("EmailJob not found for BullMQ job", {
      ...getJobLogContext(job, startedAt, maxAttempts),
      emailJobId,
    });
    return;
  }

  if (emailJob.status === EmailStatus.SENT) {
    logger.info("Email already sent, skipping duplicate worker execution", {
      ...getJobLogContext(job, startedAt, maxAttempts),
      senderId: emailJob.campaign.sender.id,
      emailJobId: emailJob.id,
      recipient: emailJob.recipient,
      emailJobStatus: emailJob.status,
    });
    return;
  }

  const rateLimiterService =
    dependencies.rateLimiterService ?? (await getRateLimiterService());
  const rateLimitResult = await rateLimiterService.acquire(
    emailJob.campaign.sender.id,
  );

  if (!rateLimitResult.allowed) {
    const retryAfterMs = rateLimitResult.retryAfterMs ?? 0;
    const currentTime = new Date();
    const nextAllowedAtMs = currentTime.getTime() + retryAfterMs;
    const nextAllowedAt = new Date(nextAllowedAtMs).toISOString();

    logger.warn("Hourly rate limit reached", {
      ...getJobLogContext(job, startedAt, maxAttempts),
      senderId: emailJob.campaign.sender.id,
      emailJobId: emailJob.id,
      recipient: emailJob.recipient,
      currentTime: currentTime.toISOString(),
      currentCount: rateLimitResult.currentCount,
      limit: rateLimitResult.limit,
      nextAllowedAt,
      delayMs: retryAfterMs,
    });

    await job.moveToDelayed(nextAllowedAtMs, job.token);

    logger.info("BullMQ job rescheduled after rate limit", {
      ...getJobLogContext(job, startedAt, maxAttempts),
      senderId: emailJob.campaign.sender.id,
      emailJobId: emailJob.id,
      recipient: emailJob.recipient,
      currentTime: currentTime.toISOString(),
      currentCount: rateLimitResult.currentCount,
      limit: rateLimitResult.limit,
      nextAllowedAt,
      delayMs: retryAfterMs,
    });

    throw new DelayedError();
  }

  try {
    await prisma.emailJob.update({
      where: { id: emailJob.id },
      data: {
        status: EmailStatus.PROCESSING,
      },
    });

    logger.info("Email marked PROCESSING", {
      ...getJobLogContext(job, startedAt, maxAttempts),
      senderId: emailJob.campaign.sender.id,
      emailJobId: emailJob.id,
      recipient: emailJob.recipient,
      emailJobStatus: EmailStatus.PROCESSING,
    });

    if (!emailJob.campaign.sender.email) {
      throw new Error("Sender email missing");
    }

    logger.info("Sending email", {
      ...getJobLogContext(job, startedAt, maxAttempts),
      senderId: emailJob.campaign.sender.id,
      emailJobId: emailJob.id,
      recipient: emailJob.recipient,
      sender: emailJob.campaign.sender.email,
      subject: emailJob.campaign.subject,
    });

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

    logger.info("Email successfully sent", {
      ...getJobLogContext(job, startedAt, maxAttempts),
      emailJobId: emailJob.id,
      recipient: emailJob.recipient,
      messageId: info.messageId,
      sentAt: updatedEmailJob.sentAt?.toISOString() ?? sentAt.toISOString(),
      senderId: emailJob.campaign.sender.id,
    });

    logger.info("Email send spacing configured", {
      ...getJobLogContext(job, startedAt, maxAttempts),
      emailJobId: emailJob.id,
      senderId: emailJob.campaign.sender.id,
      delayDurationMs: configuredDelayMs,
    });

    if (configuredDelayMs > 0) {
      logger.info("Email send delay starting", {
        ...getJobLogContext(job, startedAt, maxAttempts),
        emailJobId: emailJob.id,
        senderId: emailJob.campaign.sender.id,
        delayDurationMs: configuredDelayMs,
      });

      await sleep(configuredDelayMs);

      logger.info("Email send delay ended", {
        ...getJobLogContext(job, startedAt, maxAttempts),
        emailJobId: emailJob.id,
        senderId: emailJob.campaign.sender.id,
        delayDurationMs: configuredDelayMs,
      });
    }
  } catch (error) {
    const classification = classifyEmailFailure(error);
    const failureReason = classification.message;
    const willRetry = currentAttempt < maxAttempts;

    if (classification.kind === "retryable") {
      logger.warn("Retryable email failure", {
        ...getJobLogContext(job, startedAt, maxAttempts),
        campaignId: emailJob.campaignId,
        senderId: emailJob.campaign.sender.id,
        recipient: emailJob.recipient,
        errorType: classification.reason,
        errorMessage: failureReason,
        willRetry,
      });

      if (willRetry) {
        logger.info("Retry scheduled", {
          ...getJobLogContext(job, startedAt, maxAttempts),
          campaignId: emailJob.campaignId,
          senderId: emailJob.campaign.sender.id,
          recipient: emailJob.recipient,
          errorType: classification.reason,
          errorMessage: failureReason,
          retryAttemptNumber: currentAttempt + 1,
          backoffDelayMs: queueConfig.backoffDelayMs,
        });
      }

      throw error instanceof Error ? error : new Error(failureReason);
    }

    await prisma.emailJob.update({
      where: { id: emailJob.id },
      data: {
        status: EmailStatus.FAILED,
        failureReason,
      },
    });

    logger.error("Permanent email failure", error instanceof Error ? error : undefined, {
      ...getJobLogContext(job, startedAt, maxAttempts),
      campaignId: emailJob.campaignId,
      senderId: emailJob.campaign.sender.id,
      recipient: emailJob.recipient,
      errorType: classification.reason,
      errorMessage: failureReason,
      willRetry: false,
    });

    throw createPermanentEmailFailure(error);
  }
}

export async function finalizeRetryableEmailFailure(
  job: Job<EmailWorkerJobData>,
  error: Error,
  queueConfig: WorkerQueueConfig,
) {
  const maxAttempts = job.opts.attempts ?? queueConfig.maxRetries;
  const attemptNumber = job.attemptsMade;
  const retriesExhausted = attemptNumber >= maxAttempts;
  const classification = classifyEmailFailure(error);

  if (classification.kind !== "retryable" || !retriesExhausted) {
    return false;
  }

  const emailJob = await prisma.emailJob.findUnique({
    where: { id: job.data.emailJobId },
    select: {
      id: true,
      recipient: true,
      campaignId: true,
      status: true,
      campaign: {
        select: {
          sender: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!emailJob) {
    logger.warn("Retry exhaustion finalizer could not find EmailJob", {
      ...getJobLogContext(job, undefined, maxAttempts, attemptNumber),
      errorType: classification.reason,
      errorMessage: classification.message,
    });
    return false;
  }

  if (emailJob.status === EmailStatus.FAILED) {
    return false;
  }

  await prisma.emailJob.update({
    where: { id: emailJob.id },
    data: {
      status: EmailStatus.FAILED,
      failureReason: classification.message,
    },
  });

  logger.error("Retries exhausted", error, {
    ...getJobLogContext(job, undefined, maxAttempts, attemptNumber),
    emailJobId: emailJob.id,
    senderId: emailJob.campaign.sender.id,
    recipient: emailJob.recipient,
    errorType: classification.reason,
    errorMessage: classification.message,
  });

  logger.info("Final FAILED update", {
    ...getJobLogContext(job, undefined, maxAttempts, attemptNumber),
    emailJobId: emailJob.id,
    senderId: emailJob.campaign.sender.id,
    recipient: emailJob.recipient,
    errorType: classification.reason,
    errorMessage: classification.message,
  });

  return true;
}
