import type { SentMessageInfo } from "nodemailer";
import {
  mailService,
  type MailService,
  type SendEmailOptions,
} from "../../services/mail.service.js";

type MockMailOptions = {
  minDelayMs: number;
  maxDelayMs: number;
};

type MockMailHandle = {
  sendCount: number;
  duplicateSendCount: number;
  restore(): void;
};

function randomDelayMs(minDelayMs: number, maxDelayMs: number): number {
  if (maxDelayMs <= minDelayMs) {
    return minDelayMs;
  }

  return Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1)) + minDelayMs;
}

function createMockMessageInfo(to: string): SentMessageInfo {
  return {
    accepted: [to],
    rejected: [],
    pending: [],
    envelope: {
      from: "mock@example.com",
      to: [to],
    },
    messageId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    response: "250 Mock message accepted",
  };
}

export function installMockMailService(
  options: MockMailOptions,
): MockMailHandle {
  let sendCount = 0;
  let duplicateSendCount = 0;
  const sentRecipients = new Set<string>();

  const originalSendEmail = mailService.sendEmail.bind(mailService);

  mailService.sendEmail = async function mockSendEmail(
    payload: SendEmailOptions,
  ): Promise<SentMessageInfo> {
    sendCount += 1;

    if (sentRecipients.has(payload.to)) {
      duplicateSendCount += 1;
    } else {
      sentRecipients.add(payload.to);
    }

    const delayMs = randomDelayMs(options.minDelayMs, options.maxDelayMs);

    if (delayMs > 0) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }

    return createMockMessageInfo(payload.to);
  } as MailService["sendEmail"];

  return {
    get sendCount() {
      return sendCount;
    },
    get duplicateSendCount() {
      return duplicateSendCount;
    },
    restore() {
      mailService.sendEmail = originalSendEmail;
    },
  };
}
