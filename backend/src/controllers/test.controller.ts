import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import { QueueService } from "../services/queue.service.js";

export const addTestJob = async (
  req: Request,
  res: Response
): Promise<void> => {
  const emailJobId = Number(req.body?.emailJobId);

  if (!Number.isInteger(emailJobId) || emailJobId <= 0) {
    throw new AppError("A valid emailJobId is required.", 400);
  }

  const job = await QueueService.addDelayedJob(
    "test-email",
    {
      emailJobId,
    },
    60_000
  );
  res.status(201).json({
    success: true,
    jobId: job.id,
    message: "Test job added successfully.",
  });
};
