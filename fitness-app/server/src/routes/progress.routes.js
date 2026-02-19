import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getPRs, getWeeklyVolume } from "../controllers/progress.controller.js";

const router = express.Router();

router.get("/prs", requireAuth, getPRs);
router.get("/volume", requireAuth, getWeeklyVolume);

export default router;
