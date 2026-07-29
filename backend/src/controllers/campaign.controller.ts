import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import { CampaignService } from "../services/campaign.service.js";
import { EmailService } from "../services/email.service.js";
import { SchedulerService } from "../services/scheduler.service.js";
import { createCampaignSchema } from "../validators/campaign.validator.js";

export class CampaignController {
  private readonly campaignService = new CampaignService();
  private readonly emailService = new EmailService();
  private readonly schedulerService = new SchedulerService();

  createCampaign = async (req: Request, res: Response): Promise<void> => {
    const input = createCampaignSchema.parse(req.body);
    const campaign = await this.campaignService.createCampaign(input);
    const emailJobs = await this.emailService.createJobs({
      campaignId: campaign.id,
      recipients: input.recipients,
      startTime: new Date(input.startTime),
    });

    await this.schedulerService.scheduleJobs(
      emailJobs,
      new Date(input.startTime),
      input.delaySeconds,
    );

    res.status(201).json({
      campaignId: campaign.id,
      jobsCreated: emailJobs.length,
    });
  };

  listCampaigns = async (req: Request, res: Response): Promise<void> => {
    const page = this.parsePositiveInteger(req.query.page, 1, "page");
    const limit = this.parsePositiveInteger(req.query.limit, 10, "limit");
    const senderId = this.parseOptionalPositiveInteger(req.query.senderId, "senderId");

    const campaigns = await this.campaignService.listCampaigns({
      page,
      limit,
      senderId,
    });

    res.json(campaigns);
  };

  getCampaign = async (req: Request, res: Response): Promise<void> => {
    const campaignId = Number(req.params.id);

    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      throw new AppError("A valid campaign ID is required.", 400);
    }

    const campaign = await this.campaignService.getCampaign(campaignId);

    if (!campaign) {
      throw new AppError("Campaign not found", 404);
    }

    res.json(campaign);
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
