import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import { EmailService } from "../services/email.service.js";

export class EmailController {
  private readonly emailService = new EmailService();

  listScheduled = async (req: Request, res: Response): Promise<void> => {
    const page = this.parsePositiveInteger(req.query.page, 1, "page");
    const limit = this.parsePositiveInteger(req.query.limit, 10, "limit");
    const campaignId = this.parseOptionalPositiveInteger(req.query.campaignId, "campaignId");
    const scheduledEmails = await this.emailService.listScheduled({
      page,
      limit,
      campaignId,
    });
    res.json(scheduledEmails);
  };

  listSent = async (req: Request, res: Response): Promise<void> => {
    const page = this.parsePositiveInteger(req.query.page, 1, "page");
    const limit = this.parsePositiveInteger(req.query.limit, 10, "limit");
    const campaignId = this.parseOptionalPositiveInteger(req.query.campaignId, "campaignId");
    const sentEmails = await this.emailService.listSent({
      page,
      limit,
      campaignId,
    });
    res.json(sentEmails);
  };

  listFailed = async (req: Request, res: Response): Promise<void> => {
    const page = this.parsePositiveInteger(req.query.page, 1, "page");
    const limit = this.parsePositiveInteger(req.query.limit, 10, "limit");
    const campaignId = this.parseOptionalPositiveInteger(req.query.campaignId, "campaignId");
    const failedEmails = await this.emailService.listFailed({
      page,
      limit,
      campaignId,
    });
    res.json(failedEmails);
  };

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

  private parseOptionalPositiveInteger(
    value: unknown,
    fieldName: string,
  ): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new AppError(`${fieldName} must be a positive integer.`, 400);
    }

    return parsed;
  }
}
