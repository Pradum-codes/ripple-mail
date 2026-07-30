import { OAuth2Client } from "google-auth-library";
import { authConfig } from "../config/auth.js";
import { GoogleUserPayload } from "../types/auth.types.js";
import { prisma } from "../prisma/client.js";
import { generateToken } from "../utils/jwt.js";
import { AuthResponse } from "../types/auth.types.js";

class AuthService {
  private googleClient: OAuth2Client;

  constructor() {
    this.googleClient = new OAuth2Client(authConfig.googleClientId);
  }

  async verifyGoogleToken(
    credential: string
  ): Promise<GoogleUserPayload> {
    const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: authConfig.googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error("Invalid Google token");
    }

    return {
      googleId: payload.sub,
      email: payload.email!,
      name: payload.name!,
      avatar: payload.picture ?? null,
    };
  }

  async findOrCreateUser(googleUser: GoogleUserPayload) {
    let user = await prisma.user.findUnique({
      where: {
        googleId: googleUser.googleId,
      },
    });

    if (user) {
      return user;
    }

    user = await prisma.user.create({
      data: {
        googleId: googleUser.googleId,
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.avatar,
      },
    });

    return user;
  }

  async authenticate(
    credential: string
  ): Promise<AuthResponse> {
    const googleUser = await this.verifyGoogleToken(credential);

    const user = await this.findOrCreateUser(googleUser);

    const token = generateToken({
      userId: user.id,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      token,
    };
  }
}

export const authService = new AuthService();