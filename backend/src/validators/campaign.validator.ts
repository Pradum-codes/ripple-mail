import { z } from "zod";

export const createCampaignSchema = z.object({
  senderId: z.string().trim().min(1, "senderId is required"),

  subject: z.string().trim().min(1, "subject is required"),

  body: z.string().trim().min(1, "body is required"),

  startTime: z.iso.datetime({
    message: "startTime must be a valid ISO datetime",
  }),

  delaySeconds: z
    .int()
    .min(0, "delaySeconds must be >= 0"),

  hourlyLimit: z
    .int()
    .positive("hourlyLimit must be greater than 0"),

  recipients: z
    .array(z.email())
    .min(1, "At least one recipient is required"),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;