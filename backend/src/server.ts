import "dotenv/config";
import app from "./app.js";
import { logger } from "./utils/logger.js";

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});