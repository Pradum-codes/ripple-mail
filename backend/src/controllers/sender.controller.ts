import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import { SenderService } from "../services/sender.service.js";
import {
  createSenderSchema,
  updateSenderSchema,
} from "../validators/sender.validator.js";

export class SenderController {
  private readonly senderService = new SenderService();

  listSenders = async (req: Request, res: Response): Promise<void> => {
    const page = this.parsePositiveInteger(req.query.page, 1, "page");
    const limit = this.parsePositiveInteger(req.query.limit, 10, "limit");

    const senders = await this.senderService.listSenders({
      page,
      limit,
    });

    res.json(senders);
  };

  getSender = async (req: Request, res: Response): Promise<void> => {
    const senderId = this.parseId(req.params.id);
    const sender = await this.senderService.getSender(senderId);

    if (!sender) {
      throw new AppError("Sender not found", 404);
    }

    res.json(sender);
  };

  createSender = async (req: Request, res: Response): Promise<void> => {
    const input = createSenderSchema.parse(req.body);
    const sender = await this.senderService.createSender(input);

    res.status(201).json(sender);
  };

  updateSender = async (req: Request, res: Response): Promise<void> => {
    const senderId = this.parseId(req.params.id);
    const input = updateSenderSchema.parse(req.body);
    const sender = await this.senderService.updateSender(senderId, input);

    res.json(sender);
  };

  deleteSender = async (req: Request, res: Response): Promise<void> => {
    const senderId = this.parseId(req.params.id);

    await this.senderService.deleteSender(senderId);

    res.status(204).send();
  };

  private parseId(value: string | string[]): number {
    if (Array.isArray(value)) {
      throw new AppError("A valid sender ID is required.", 400);
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new AppError("A valid sender ID is required.", 400);
    }

    return parsed;
  }

  private parsePositiveInteger(
    value: unknown,
    fallback: number,
    fieldName: string,
  ): number {
    if (value === undefined) {
      return fallback;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new AppError(`${fieldName} must be a positive integer.`, 400);
    }

    return parsed;
  }
}
