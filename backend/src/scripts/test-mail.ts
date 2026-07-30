import "dotenv/config";
import nodemailer from "nodemailer";
import { smtpConfig, verifyMailConnection } from "../config/mail.js";
import { mailService } from "../services/mail.service.js";
import { logger } from "../utils/logger.js";

async function runMailTest(): Promise<void> {
  try {
    logger.info("Starting isolated SMTP email test...");

    await verifyMailConnection();

    const info = await mailService.sendEmail({
      sender: {
        id: 0,
        email: smtpConfig.user,
        smtpHost: smtpConfig.host,
        smtpPort: smtpConfig.port,
        username: smtpConfig.user,
        password: smtpConfig.pass,
      },
      to: smtpConfig.user,
      subject: "SMTP configuration test",
      text: "This is a temporary SMTP verification email sent outside BullMQ.",
      html: `
        <p>This is a temporary SMTP verification email sent outside BullMQ.</p>
        <p>If you can preview this in Ethereal, the SMTP setup is working.</p>
      `,
    });

    logger.info(`SMTP test messageId: ${info.messageId}`);
    logger.info(`SMTP test accepted recipients: ${info.accepted.join(", ") || "None"}`);
    logger.info(`SMTP test rejected recipients: ${info.rejected.join(", ") || "None"}`);
    logger.info(`SMTP test response: ${info.response}`);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    logger.info(`Ethereal preview URL: ${previewUrl ?? "Not available for this transport"}`);
  } catch (error) {
    const mailError =
      error instanceof Error ? error : new Error("Unknown SMTP test failure");

    logger.error("Isolated SMTP email test failed", mailError);
    process.exitCode = 1;
  }
}

void runMailTest();
