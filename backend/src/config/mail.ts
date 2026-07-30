import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "../utils/logger.js";

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

export type SmtpVerificationInput = {
  host: string;
  port: number;
  user: string;
  pass: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required SMTP environment variable: ${name}`);
  }

  return value.trim();
}

function parseSmtpPort(value: string): number {
  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`SMTP_PORT must be a positive integer. Received: ${value}`);
  }

  return port;
}

function parseSmtpSecure(value: string): boolean {
  const normalized = value.trim().toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  throw new Error(
    `SMTP_SECURE must be either "true" or "false". Received: ${value}`,
  );
}

function loadSmtpConfig(): SmtpConfig {
  const host = getRequiredEnv("SMTP_HOST");
  const port = parseSmtpPort(getRequiredEnv("SMTP_PORT"));
  const secure = parseSmtpSecure(getRequiredEnv("SMTP_SECURE"));
  const user = getRequiredEnv("SMTP_USER");
  const pass = getRequiredEnv("SMTP_PASS");
  const from = getRequiredEnv("SMTP_FROM");

  return {
    host,
    port,
    secure,
    user,
    pass,
    from,
  };
}

export const smtpConfig = loadSmtpConfig();

export function isSecureSmtpPort(port: number): boolean {
  return port === 465;
}

export function createSmtpTransport(
  config: SmtpVerificationInput,
  secure = isSecureSmtpPort(config.port),
): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

export async function verifyMailConnection(): Promise<void> {
  const verificationTransporter = createSmtpTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    user: smtpConfig.user,
    pass: smtpConfig.pass,
  }, smtpConfig.secure);

  try {
    await verificationTransporter.verify();
    logger.info(
      `SMTP connection verified for ${smtpConfig.host}:${smtpConfig.port} (${smtpConfig.from})`,
    );
  } catch (error) {
    const mailError =
      error instanceof Error ? error : new Error("Unknown SMTP verification error");

    logger.error(
      `Failed to verify SMTP connection for ${smtpConfig.host}:${smtpConfig.port}`,
      mailError,
    );

    throw mailError;
  } finally {
    verificationTransporter.close();
  }
}

export async function verifySmtpConnection(
  config: SmtpVerificationInput,
): Promise<void> {
  const verificationTransporter = createSmtpTransport(config);

  try {
    await verificationTransporter.verify();
  } catch (error) {
    const mailError =
      error instanceof Error ? error : new Error("Unknown SMTP verification error");

    logger.error(
      `Failed to verify SMTP connection for ${config.host}:${config.port}`,
      mailError,
    );

    throw mailError;
  } finally {
    verificationTransporter.close();
  }
}
