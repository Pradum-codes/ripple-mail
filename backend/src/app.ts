import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import campaignRoutes from "./routes/campaign.routes.js";
import emailRoutes from "./routes/email.routes.js";
import healthRoutes from "./routes/health.routes.js";
import testRoutes from "./routes/test.route.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));

app.use(express.json());

app.use("/api/campaigns", campaignRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/health", healthRoutes);
app.use("/test", testRoutes);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Backend is running",
  });
});

app.use(errorMiddleware);

export default app;
