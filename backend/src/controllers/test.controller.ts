import { Request, Response } from "express";
import { QueueService } from "../services/queue.service.js";

export const addTestJob = async (
  req: Request,
  res: Response
): Promise<void> => {
  // const job = await QueueService.addJob("test-email", {
  //   message: "Hello from BullMQ!",
  // });

  const job = await QueueService.addDelayedJob(
    "test-email",
    {
        message: "Delayed BullMQ Job"
    },
    60_000
  );
  res.status(201).json({
    success: true,
    jobId: job.id,
    message: "Test job added successfully.",
  });
};

