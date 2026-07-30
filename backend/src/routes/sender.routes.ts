import { Router } from "express";
import { SenderController } from "../controllers/sender.controller.js";

const router = Router();
const senderController = new SenderController();

router.get("/", senderController.listSenders);
router.get("/:id", senderController.getSender);
router.post("/", senderController.createSender);
router.patch("/:id", senderController.updateSender);
router.delete("/:id", senderController.deleteSender);

export default router;
