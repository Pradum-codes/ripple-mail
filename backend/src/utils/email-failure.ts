import { UnrecoverableError } from "bullmq";

export type EmailFailureKind = "retryable" | "non-retryable";

export type EmailFailureClassification = {
  kind: EmailFailureKind;
  reason: string;
  message: string;
  code?: string;
  responseCode?: number;
};

const RETRYABLE_ERROR_CODES = new Set([
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "EPIPE",
  "ESOCKET",
  "EAI_AGAIN",
]);

const NON_RETRYABLE_ERROR_CODES = new Set([
  "EAUTH",
]);

function normalizeError(error: unknown): Error & {
  code?: string;
  responseCode?: number;
  response?: string;
  command?: string;
} {
  if (error instanceof Error) {
    return error as Error & {
      code?: string;
      responseCode?: number;
      response?: string;
      command?: string;
    };
  }

  return new Error(typeof error === "string" ? error : "Unknown email failure");
}

function isRetryableSmtpResponseCode(responseCode: number): boolean {
  return responseCode >= 400 && responseCode < 500;
}

function isPermanentSmtpResponseCode(responseCode: number): boolean {
  return responseCode >= 500;
}

function matchesAny(message: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(message));
}

export function classifyEmailFailure(error: unknown): EmailFailureClassification {
  const normalizedError = normalizeError(error);
  const message = normalizedError.message.trim();
  const lowerMessage = message.toLowerCase();
  const code = normalizedError.code;
  const responseCode = normalizedError.responseCode;

  if (typeof responseCode === "number") {
    if (isPermanentSmtpResponseCode(responseCode)) {
      return {
        kind: "non-retryable",
        reason: "SMTP permanent rejection",
        message,
        code,
        responseCode,
      };
    }

    if (isRetryableSmtpResponseCode(responseCode)) {
      return {
        kind: "retryable",
        reason: "SMTP temporary rejection",
        message,
        code,
        responseCode,
      };
    }
  }

  if (code && RETRYABLE_ERROR_CODES.has(code)) {
    return {
      kind: "retryable",
      reason: "Transient SMTP/network failure",
      message,
      code,
      responseCode,
    };
  }

  if (code && NON_RETRYABLE_ERROR_CODES.has(code)) {
    return {
      kind: "non-retryable",
      reason: "SMTP authentication failure",
      message,
      code,
      responseCode,
    };
  }

  if (
    matchesAny(lowerMessage, [
      /timeout/,
      /timed out/,
      /connection reset/,
      /network/i,
      /temporary failure/i,
      /try again/i,
    ])
  ) {
    return {
      kind: "retryable",
      reason: "Transient SMTP/network failure",
      message,
      code,
      responseCode,
    };
  }

  if (
    matchesAny(lowerMessage, [
      /invalid recipient/,
      /invalid email/,
      /invalid address/,
      /email format/,
      /recipient rejected/,
      /mailbox unavailable/,
      /bad recipient/,
      /authentication failed/,
      /invalid login/,
      /bad credentials/,
      /invalid smtp configuration/,
      /missing smtp/,
      /sender email missing/,
      /missing sender/,
      /unsupported authentication/,
      /invalid host/,
    ])
  ) {
    return {
      kind: "non-retryable",
      reason: "Permanent SMTP/configuration failure",
      message,
      code,
      responseCode,
    };
  }

  if (matchesAny(lowerMessage, [/5\d\d/, /permanent/i])) {
    return {
      kind: "non-retryable",
      reason: "SMTP permanent rejection",
      message,
      code,
      responseCode,
    };
  }

  return {
    kind: "retryable",
    reason: "Unknown transport failure",
    message,
    code,
    responseCode,
  };
}

export function createPermanentEmailFailure(error: unknown): UnrecoverableError {
  const classification = classifyEmailFailure(error);
  return new UnrecoverableError(classification.message);
}
