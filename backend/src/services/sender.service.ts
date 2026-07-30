import type { Prisma, Sender } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { verifySmtpConnection } from "../config/mail.js";
import { AppError } from "../errors/AppError.js";
import { prisma } from "../prisma/client.js";
import type {
  CreateSenderInput,
  UpdateSenderInput,
} from "../validators/sender.validator.js";
import type { PaginatedResult, PaginationInput } from "./campaign.service.js";

const senderPublicSelect = {
  id: true,
  email: true,
  username: true,
  createdAt: true,
} satisfies Prisma.SenderSelect;

export type SenderResponse = Prisma.SenderGetPayload<{
  select: typeof senderPublicSelect;
}>;

export class SenderService {
  async listSenders(input: PaginationInput): Promise<PaginatedResult<SenderResponse>> {
    const { page, limit } = input;

    const [data, total] = await Promise.all([
      prisma.sender.findMany({
        select: senderPublicSelect,
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sender.count(),
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

  async getSender(id: number): Promise<SenderResponse | null> {
    return prisma.sender.findUnique({
      where: { id },
      select: senderPublicSelect,
    });
  }

  async createSender(input: CreateSenderInput): Promise<SenderResponse> {
    await this.verifyCredentials(input);

    try {
      return await prisma.sender.create({
        data: {
          email: input.email,
          smtpHost: input.smtpHost,
          smtpPort: input.smtpPort,
          username: input.username,
          password: input.password,
        },
        select: senderPublicSelect,
      });
    } catch (error) {
      throw this.mapPrismaError(error);
    }
  }

  async updateSender(id: number, input: UpdateSenderInput): Promise<SenderResponse> {
    const existingSender = await prisma.sender.findUnique({
      where: { id },
    });

    if (!existingSender) {
      throw new AppError("Sender not found", 404);
    }

    const mergedSender = {
      email: input.email ?? existingSender.email,
      smtpHost: input.smtpHost ?? existingSender.smtpHost,
      smtpPort: input.smtpPort ?? existingSender.smtpPort,
      username: input.username ?? existingSender.username,
      password: input.password ?? existingSender.password,
    };

    await this.verifyCredentials(mergedSender);

    try {
      return await prisma.sender.update({
        where: { id },
        data: input,
        select: senderPublicSelect,
      });
    } catch (error) {
      throw this.mapPrismaError(error);
    }
  }

  async deleteSender(id: number): Promise<void> {
    const existingSender = await prisma.sender.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!existingSender) {
      throw new AppError("Sender not found", 404);
    }

    try {
      await prisma.sender.delete({
        where: { id },
      });
    } catch (error) {
      throw this.mapPrismaError(error);
    }
  }

  private async verifyCredentials(sender: {
    smtpHost: string;
    smtpPort: number;
    username: string;
    password: string;
  }): Promise<void> {
    try {
      await verifySmtpConnection({
        host: sender.smtpHost,
        port: sender.smtpPort,
        user: sender.username,
        pass: sender.password,
      });
    } catch {
      throw new AppError("SMTP verification failed", 400, "SMTP_VERIFICATION_FAILED");
    }
  }

  private mapPrismaError(error: unknown): AppError {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return new AppError("A sender with this email already exists.", 409, "DUPLICATE_EMAIL");
      }

      if (error.code === "P2003") {
        return new AppError(
          "Cannot delete sender because it is still referenced by one or more campaigns.",
          409,
          "SENDER_IN_USE",
        );
      }
    }

    if (error instanceof AppError) {
      return error;
    }

    throw error;
  }
}
