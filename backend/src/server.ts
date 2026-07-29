import "dotenv/config";
import app from "./app.js";
import { logger } from "./utils/logger.js";
import { verifyMailConnection } from "./config/mail.js";
import { prisma } from "./prisma/client.js";
import { emailQueue } from "./queue/email.queue.js";
import { redisConnection } from "./config/bullmq.js";

const PORT = Number(process.env.PORT) || 5000;

await verifyMailConnection().then(() => {
  logger.info("SMTP connection verified successfully.");
}).catch((error) => {
  logger.error("Failed to verify SMTP connection:", error);
  process.exit(1);
});

const server = app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});

let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  logger.info("Server shutdown initiated", { signal });

  server.close(async (err) => {
    if (err) {
      logger.error("Failed to close HTTP server", err);
      process.exit(1);
    }

    logger.info("HTTP server closed");

    try {
      await prisma.$disconnect();
      logger.info("Prisma disconnected");

      await emailQueue.close();
      logger.info("Queue closed");

      await redisConnection.quit();
      logger.info("Redis connection closed");

      logger.info("Server shutdown complete");

      process.exit(0);
    } catch (error) {
      logger.error(
        "Server shutdown failed",
        error instanceof Error ? error : undefined
      );

      process.exit(1);
    }
  });
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});