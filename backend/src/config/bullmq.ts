import { Redis } from "ioredis";
import { logger } from "../utils/logger.js";

export const redisConnection = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  maxRetriesPerRequest: null,
});

redisConnection.on("connect", () => {
  logger.info("Connected to Redis");
});

redisConnection.on("ready", () => {
  logger.info("Redis is ready");
});

redisConnection.on("error", (err: Error) => {
  logger.error("Redis Error:", err);
});

redisConnection.on("close", () => {
  logger.info("Redis connection closed");
});