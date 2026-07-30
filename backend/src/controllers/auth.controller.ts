import { Request, Response } from "express";
import { authService } from "../services/auth.service.js";

class AuthController {
  async googleLogin(req: Request, res: Response) {
    try {
      const { credential } = req.body;

      const authResponse = await authService.authenticate(
        credential
      );

      return res.status(200).json(authResponse);
    } catch (error) {
      return res.status(401).json({
        message: "Authentication failed",
      });
    }
  }
}

export const authController = new AuthController();