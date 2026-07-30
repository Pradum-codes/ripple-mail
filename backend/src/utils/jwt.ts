import jwt from "jsonwebtoken";
import { authConfig } from "../config/auth.js";

export interface JwtPayload {
  userId: number;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiresIn,
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, authConfig.jwtSecret) as JwtPayload;
}