import type { Request, Response } from "express";
import { prisma } from "../prisma/client.js";
import { redisConnection } from "../config/bullmq.js";
import { emailQueue } from "../queue/email.queue.js";

type ServiceState = "up" | "down";

export class HealthController {
  getHealth = async (_req: Request, res: Response): Promise<void> => {
    const services = {
      database: "down" as ServiceState,
      redis: "down" as ServiceState,
      queue: "down" as ServiceState,
    };

    let overallStatus = "ok";

    try {
      await prisma.$queryRaw`SELECT 1`;
      services.database = "up";
    } catch {
      overallStatus = "degraded";
    }

    try {
      const redisResponse = await redisConnection.ping();
      services.redis = redisResponse === "PONG" ? "up" : "down";
      if (services.redis !== "up") {
        overallStatus = "degraded";
      }
    } catch {
      overallStatus = "degraded";
    }

    try {
      await emailQueue.waitUntilReady();
      services.queue = "up";
    } catch {
      overallStatus = "degraded";
    }

    const statusCode =
      overallStatus === "ok" ? 200 : services.database === "down" || services.redis === "down" || services.queue === "down" ? 503 : 200;

    res.status(statusCode).json({
      status: overallStatus,
      services,
      timestamp: new Date().toISOString(),
    });
  };
}
