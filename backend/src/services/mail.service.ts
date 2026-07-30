import type { SentMessageInfo } from "nodemailer";
import { createSmtpTransport } from "../config/mail.js";
import { logger } from "../utils/logger.js";

export type SenderSmtpCredentials = {
  id: number;
  email: string;
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
};

export type SendEmailContext = {
  campaignId?: number;
  emailJobId?: number;
  senderId?: number;
  senderEmail?: string;
  recipientEmail: string;
};

export interface SendEmailOptions {
  sender: SenderSmtpCredentials;
  to: string;
  subject: string;
  text: string;
  html?: string;
  context?: SendEmailContext;
}

export class MailService {
  async sendEmail(options: SendEmailOptions): Promise<SentMessageInfo> {
    const { sender, context } = options;

    if (!sender.smtpHost || !sender.smtpHost.trim()) {
      throw new Error("Missing SMTP configuration for sender host");
    }

    if (!Number.isInteger(sender.smtpPort) || sender.smtpPort <= 0) {
      throw new Error("Missing SMTP configuration for sender port");
    }

    if (!sender.username || !sender.username.trim()) {
      throw new Error("Missing SMTP configuration for sender username");
    }

    if (!sender.password || !sender.password.trim()) {
      throw new Error("Missing SMTP configuration for sender password");
    }

    if (!sender.email || !sender.email.trim()) {
      throw new Error("Sender email missing");
    }

    const transporter = createSmtpTransport({
      host: sender.smtpHost,
      port: sender.smtpPort,
      user: sender.username,
      pass: sender.password,
    });

    try {
      // Keep failure injection explicit and opt-in so worker failure persistence
      // can be tested without breaking SMTP startup verification.
      if (process.env.FORCE_MAIL_FAILURE === "true") {
        throw new Error("Intentional SMTP failure for testing");
      }

      // Keep the payload aligned with Nodemailer primitives so the service stays
      // portable across SMTP providers without coupling to a specific vendor.
      logger.info("Sending email via sender SMTP", {
        campaignId: context?.campaignId,
        emailJobId: context?.emailJobId,
        senderId: context?.senderId ?? sender.id,
        senderEmail: context?.senderEmail ?? sender.email,
        recipientEmail: context?.recipientEmail ?? options.to,
      });

      const info = await transporter.sendMail({
        from: sender.email,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      logger.info(
        `Email sent to ${options.to} with messageId ${String(info.messageId)}`,
        {
          campaignId: context?.campaignId,
          emailJobId: context?.emailJobId,
          senderId: context?.senderId ?? sender.id,
          senderEmail: context?.senderEmail ?? sender.email,
          recipientEmail: context?.recipientEmail ?? options.to,
        },
      );

      return info;
    } catch (error) {
      const mailError =
        error instanceof Error ? error : new Error("Unknown email delivery error");

      logger.error(
        `Failed to send email to ${options.to}`,
        mailError,
        {
          campaignId: context?.campaignId,
          emailJobId: context?.emailJobId,
          senderId: context?.senderId ?? sender.id,
          senderEmail: context?.senderEmail ?? sender.email,
          recipientEmail: context?.recipientEmail ?? options.to,
        },
      );
      throw mailError;
    } finally {
      transporter.close();
    }
  }
}

export const mailService = new MailService();
