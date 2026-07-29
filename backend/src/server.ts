import "dotenv/config";
import app from "./app.js";
import { logger } from "./utils/logger.js";
import { verifyMailConnection } from "./config/mail.js";

const PORT = Number(process.env.PORT) || 5000;

await verifyMailConnection().then(() => {
  logger.info("SMTP connection verified successfully.");
}).catch((error) => {
  logger.error("Failed to verify SMTP connection:", error);
  process.exit(1);
});

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});