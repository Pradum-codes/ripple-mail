import { z } from "zod";

const emailSchema = z.email({
  message: "email must be a valid email address",
});

const smtpHostSchema = z
  .string()
  .trim()
  .min(1, "smtpHost is required");

const smtpPortSchema = z
  .int()
  .min(1, "smtpPort must be a positive integer")
  .max(65535, "smtpPort must be between 1 and 65535");

const usernameSchema = z
  .string()
  .trim()
  .min(1, "username is required");

const passwordSchema = z
  .string()
  .min(1, "password is required");

export const createSenderSchema = z.object({
  email: emailSchema,
  smtpHost: smtpHostSchema,
  smtpPort: smtpPortSchema,
  username: usernameSchema,
  password: passwordSchema,
});

export const updateSenderSchema = createSenderSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateSenderInput = z.infer<typeof createSenderSchema>;
export type UpdateSenderInput = z.infer<typeof updateSenderSchema>;
