import { logger } from "../utils/logger.js";

export type RateLimitAcquireResult = {
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining?: number;
  retryAfterMs?: number;
  key: string;
  nextAvailableAt?: string;
};

type RedisEvalClient = {
  eval(
    script: string,
    numKeys: number,
    ...args: Array<string | number>
  ): Promise<unknown>;
};

const RATE_LIMIT_WINDOW_BUFFER_MS = 5_000;

const RATE_LIMIT_SCRIPT = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local windowTtlMs = tonumber(ARGV[2])

local current = tonumber(redis.call("GET", key) or "0")

if current >= limit then
  local ttl = redis.call("PTTL", key)
  if ttl < 0 then
    redis.call("PEXPIRE", key, windowTtlMs)
    ttl = redis.call("PTTL", key)
  end

  return {0, current, 0, ttl}
end

local newCount = redis.call("INCR", key)
local ttl = redis.call("PTTL", key)
if newCount == 1 or ttl < 0 then
  redis.call("PEXPIRE", key, windowTtlMs)
  ttl = redis.call("PTTL", key)
end

local remaining = limit - newCount
return {1, newCount, remaining, ttl}
`;

function formatUtcHour(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");

  return `${year}-${month}-${day}-${hour}`;
}

function getNextHourWindow(date: Date): { nextHourAtMs: number; retryAfterMs: number } {
  const nextHourAtMs = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours() + 1,
    0,
    0,
    0,
  );

  const retryAfterMs = Math.max(
    nextHourAtMs - date.getTime() + RATE_LIMIT_WINDOW_BUFFER_MS,
    0,
  );

  return {
    nextHourAtMs,
    retryAfterMs,
  };
}

function parseLuaResult(result: unknown): [number, number, number, number] {
  if (!Array.isArray(result) || result.length < 4) {
    throw new Error("Unexpected rate limiter Redis response");
  }

  return [
    Number(result[0]),
    Number(result[1]),
    Number(result[2]),
    Number(result[3]),
  ];
}

export class RateLimiterService {
  constructor(
    private readonly client: RedisEvalClient,
    private readonly maxEmailsPerHour: number,
    private readonly windowBufferMs = RATE_LIMIT_WINDOW_BUFFER_MS,
  ) {}

  buildKey(senderId: number | string, now = new Date()): string {
    return `rate:${String(senderId)}:${formatUtcHour(now)}`;
  }

  async acquire(senderId: number | string): Promise<RateLimitAcquireResult> {
    const now = new Date();
    const key = this.buildKey(senderId, now);
    const { nextHourAtMs, retryAfterMs } = getNextHourWindow(now);
    const windowTtlMs = retryAfterMs;

    logger.info("Rate limit check", {
      senderId,
      key,
      limit: this.maxEmailsPerHour,
      nextAvailableAt: new Date(nextHourAtMs + this.windowBufferMs).toISOString(),
    });

    const result = await this.client.eval(
      RATE_LIMIT_SCRIPT,
      1,
      key,
      this.maxEmailsPerHour,
      windowTtlMs,
    );

    const [allowedFlag, currentCount, remaining, ttlMs] = parseLuaResult(result);
    const allowed = allowedFlag === 1;
    const effectiveRetryAfterMs = allowed ? undefined : (ttlMs > 0 ? ttlMs : windowTtlMs);

    if (allowed) {
      logger.info("Rate limit counter incremented", {
        senderId,
        key,
        currentCount,
        remaining,
        limit: this.maxEmailsPerHour,
        nextAvailableAt: new Date(nextHourAtMs + this.windowBufferMs).toISOString(),
      });
    }

    return {
      allowed,
      currentCount,
      limit: this.maxEmailsPerHour,
      remaining: allowed ? remaining : undefined,
      retryAfterMs: effectiveRetryAfterMs,
      key,
      nextAvailableAt: new Date(nextHourAtMs + this.windowBufferMs).toISOString(),
    };
  }
}

let defaultRateLimiterServicePromise: Promise<Pick<RateLimiterService, "acquire">> | null =
  null;

export async function getRateLimiterService(): Promise<Pick<RateLimiterService, "acquire">> {
  if (!defaultRateLimiterServicePromise) {
    defaultRateLimiterServicePromise = (async () => {
      const { bullmqConfig, redisConnection } = await import("../config/bullmq.js");
      return new RateLimiterService(
        redisConnection,
        bullmqConfig.worker.maxEmailsPerHour,
      );
    })();
  }

  return defaultRateLimiterServicePromise;
}
