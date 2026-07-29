import { EmailStatus, type EmailJob, type Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import type { PaginatedResult, PaginationInput } from "./campaign.service.js";

export class EmailService {
  async createJobs(input: {
    campaignId: number;
    recipients: string[];
    startTime: Date;
  }): Promise<EmailJob[]> {
    const { campaignId, recipients, startTime } = input;

    if (recipients.length === 0) {
      return [];
    }

    await prisma.emailJob.createMany({
      data: recipients.map((recipient) => ({
        campaignId,
        recipient,
        scheduledAt: startTime,
        status: EmailStatus.SCHEDULED,
      })),
    });

    return prisma.emailJob.findMany({
      where: {
        campaignId,
        scheduledAt: startTime,
        status: EmailStatus.SCHEDULED,
        recipient: {
          in: recipients,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  async listScheduled(input: PaginationInput & { campaignId?: number }): Promise<PaginatedResult<EmailJob>> {
    return this.listByStatus(EmailStatus.SCHEDULED, input, {
      scheduledAt: "asc",
    });
  }

  async listSent(input: PaginationInput & { campaignId?: number }): Promise<PaginatedResult<EmailJob>> {
    return this.listByStatus(EmailStatus.SENT, input, {
      createdAt: "desc",
    });
  }

  async listFailed(input: PaginationInput & { campaignId?: number }): Promise<PaginatedResult<EmailJob>> {
    return this.listByStatus(EmailStatus.FAILED, input, {
      createdAt: "desc",
    });
  }

  private async listByStatus(
    status: EmailStatus,
    input: PaginationInput & { campaignId?: number },
    orderBy: Prisma.EmailJobOrderByWithRelationInput,
  ): Promise<PaginatedResult<EmailJob>> {
    const { page, limit, campaignId } = input;
    const where: Prisma.EmailJobWhereInput = {
      status,
      ...(campaignId ? { campaignId } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.emailJob.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.emailJob.count({ where }),
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
}
