import { Router } from "express";
import { addTestJob } from "../controllers/test.controller.js";

const router = Router();

router.post("/job", addTestJob);

export default router;