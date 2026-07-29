type LogLevel = "INFO" | "WARN" | "ERROR";

function log(level: LogLevel, message: string) {
  console.log(`[${level}] ${message}`);
}

export const logger = {
  info(message: string) {
    log("INFO", message);
  },

  warn(message: string) {
    log("WARN", message);
  },

  error(message: string, error?: Error) {
    if (error) {
      console.error(`[${"ERROR"}] ${message}`, error);
    } else {
      log("ERROR", message);
    }
  },
};