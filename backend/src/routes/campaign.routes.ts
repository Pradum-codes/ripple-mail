import { Router } from "express";
import { CampaignController } from "../controllers/campaign.controller.js";

const router = Router();
const campaignController = new CampaignController();

router.post("/", campaignController.createCampaign);
router.get("/", campaignController.listCampaigns);
router.get("/:id", campaignController.getCampaign);

export default router;
