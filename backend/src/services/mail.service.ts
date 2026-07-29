import type { SentMessageInfo } from "nodemailer";
import { smtpConfig, transporter } from "../config/mail.js";
import { logger } from "../utils/logger.js";

export interface SendEmailOptions {
  from?: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export class MailService {
  async sendEmail(options: SendEmailOptions): Promise<SentMessageInfo> {
    try {
      // Keep failure injection explicit and opt-in so worker failure persistence
      // can be tested without breaking SMTP startup verification.
      if (process.env.FORCE_MAIL_FAILURE === "true") {
        throw new Error("Intentional SMTP failure for testing");
      }

      // Keep the payload aligned with Nodemailer primitives so the service stays
      // portable across SMTP providers without coupling to a specific vendor.
      const info = await transporter.sendMail({
        from: options.from ?? smtpConfig.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      logger.info(
        `Email sent to ${options.to} with messageId ${String(info.messageId)}`,
      );

      return info;
    } catch (error) {
      const mailError =
        error instanceof Error ? error : new Error("Unknown email delivery error");

      logger.error(`Failed to send email to ${options.to}`, mailError);
      throw mailError;
    }
  }
}

export const mailService = new MailService();
