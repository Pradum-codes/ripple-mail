import type { StringValue } from "ms";

export const authConfig = {
  googleClientId: process.env.GOOGLE_CLIENT_ID as string,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as StringValue,
};
if (!authConfig.googleClientId) {
  throw new Error("GOOGLE_CLIENT_ID is missing");
}

if (!authConfig.jwtSecret) {
  throw new Error("JWT_SECRET is missing");
}