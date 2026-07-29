import type { Campaign, Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError.js";
import { prisma } from "../prisma/client.js";
import type { CreateCampaignInput } from "../validators/campaign.validator.js";

export type PaginationInput = {
  page: number;
  limit: number;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export class CampaignService {
  async createCampaign(input: CreateCampaignInput): Promise<Campaign> {
    const defaultUser = await prisma.user.findFirst({
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
      },
    });

    if (!defaultUser) {
      throw new AppError(
        "Cannot create campaign because no User record exists yet.",
        400,
      );
    }

    return prisma.campaign.create({
      data: {
        userId: defaultUser.id,
        senderId: Number(input.senderId),
        subject: input.subject,
        body: input.body,
        startTime: new Date(input.startTime),
        delaySeconds: 0,
        hourlyLimit: input.hourlyLimit,
        totalRecipients: 0,
      },
    });
  }

  async listCampaigns(input: PaginationInput & { senderId?: number }): Promise<PaginatedResult<Campaign>> {
    const { page, limit, senderId } = input;
    const where: Prisma.CampaignWhereInput = senderId
      ? { senderId }
      : {};

    const [data, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.campaign.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getCampaign(id: number): Promise<Campaign | null> {
    return prisma.campaign.findUnique({
      where: { id },
    });
  }
}
