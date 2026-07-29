import { Router } from "express";
import { EmailController } from "../controllers/email.controller.js";

const router = Router();
const emailController = new EmailController();

router.get("/scheduled", emailController.listScheduled);
router.get("/sent", emailController.listSent);
router.get("/failed", emailController.listFailed);

export default router;
