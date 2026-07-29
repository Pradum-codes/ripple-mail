import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Backend is running",
  });
});

export default app;