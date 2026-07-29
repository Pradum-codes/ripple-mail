import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";
import { logger } from "../utils/logger.js";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        message: "Validation failed",
        details: error.issues,
      },
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.status).json({
      success: false,
      error: {
        message: error.message,
        status: error.status,
        ...(error.code ? { code: error.code } : {}),
      },
    });
    return;
  }

  const unexpectedError =
    error instanceof Error ? error : new Error("Unknown application error");

  logger.error("Unhandled application error", unexpectedError);

  res.status(500).json({
    success: false,
    error: {
      message: "Internal server error",
      status: 500,
    },
  });
};
