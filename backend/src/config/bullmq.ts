import { Redis } from "ioredis";
import { logger } from "../utils/logger.js";

function getNumberEnv(
  name: string,
  fallback: number,
  options: { min?: number; integer?: boolean } = {},
): number {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue.trim() === "") {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue)) {
    throw new Error(`${name} must be a valid number. Received: ${rawValue}`);
  }

  if (options.integer && !Number.isInteger(parsedValue)) {
    throw new Error(`${name} must be an integer. Received: ${rawValue}`);
  }

  if (options.min !== undefined && parsedValue < options.min) {
    throw new Error(`${name} must be >= ${options.min}. Received: ${rawValue}`);
  }

  return parsedValue;
}

export type BullmqConfig = {
  redis: {
    host: string;
    port: number;
  };
  worker: {
    concurrency: number;
    emailDelayMs: number;
    maxEmailsPerHour: number;
  };
  queue: {
    maxRetries: number;
    backoffDelayMs: number;
    removeOnComplete: number;
    removeOnFail: number;
  };
};

export const bullmqConfig: BullmqConfig = {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: getNumberEnv("REDIS_PORT", 6379, { min: 1, integer: true }),
  },
  worker: {
    concurrency: getNumberEnv("WORKER_CONCURRENCY", 1, {
      min: 1,
      integer: true,
    }),
    emailDelayMs: getNumberEnv("EMAIL_DELAY_MS", 0, {
      min: 0,
      integer: true,
    }),
    maxEmailsPerHour: getNumberEnv("MAX_EMAILS_PER_HOUR", 100, {
      min: 1,
      integer: true,
    }),
  },
  queue: {
    maxRetries: getNumberEnv("MAX_RETRIES", 3, {
      min: 1,
      integer: true,
    }),
    backoffDelayMs: getNumberEnv("BACKOFF_DELAY_MS", 5000, {
      min: 0,
      integer: true,
    }),
    removeOnComplete: 100,
    removeOnFail: 500,
  },
};

export const redisConnection = new Redis({
  host: bullmqConfig.redis.host,
  port: bullmqConfig.redis.port,
  maxRetriesPerRequest: null,
});

redisConnection.on("connect", () => {
  logger.info("Connected to Redis", {
    host: bullmqConfig.redis.host,
    port: bullmqConfig.redis.port,
  });
});

redisConnection.on("ready", () => {
  logger.info("Redis is ready", {
    host: bullmqConfig.redis.host,
    port: bullmqConfig.redis.port,
  });
});

redisConnection.on("error", (err: Error) => {
  logger.error("Redis Error:", err);
});

redisConnection.on("close", () => {
  logger.info("Redis connection closed", {
    host: bullmqConfig.redis.host,
    port: bullmqConfig.redis.port,
  });
});
