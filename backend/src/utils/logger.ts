type LogLevel = "INFO" | "WARN" | "ERROR";

type LogMetadata = Record<string, unknown>;

const isDevelopment = process.env.NODE_ENV !== "production";

// ANSI color codes
const colors = {
  INFO: "\x1b[32m",  // Green
  WARN: "\x1b[33m",  // Yellow
  ERROR: "\x1b[31m", // Red
  RESET: "\x1b[0m",
};

function log(level: LogLevel, message: string, data?: LogMetadata) {
  const timestamp = new Date().toISOString();

  // Development: Human-readable logs
  if (isDevelopment) {
    const color = colors[level];

    console.log(
      `${color}[${timestamp}] ${level.padEnd(5)}${colors.RESET} ${message}`
    );

    if (data && Object.keys(data).length > 0) {
      console.dir(data, {
        depth: null,
        colors: true,
      });
    }

    return;
  }

  // Production: Structured JSON logs
  const entry = {
    level,
    message,
    timestamp,
    ...(data ? { data } : {}),
  };

  if (level === "ERROR") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info(message: string, data?: LogMetadata) {
    log("INFO", message, data);
  },

  warn(message: string, data?: LogMetadata) {
    log("WARN", message, data);
  },

  error(message: string, error?: Error, data?: LogMetadata) {
    if (error) {
      log("ERROR", message, {
        ...data,
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
      });
    } else {
      log("ERROR", message, data);
    }
  },
};