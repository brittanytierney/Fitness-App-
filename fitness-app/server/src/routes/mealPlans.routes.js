// server/src/routes/mealPlans.routes.js
import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  getMyMealPlan,
  listMyMealPlans,
} from "../controllers/mealPlans.controller.js";

const router = express.Router();

router.get("/", requireAuth, listMyMealPlans);
router.get("/:id", requireAuth, getMyMealPlan);

export default router;
