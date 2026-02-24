// server/src/routes/admin.routes.js
import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import {
  adminSearchUsers,
  adminListUserMealPlans,
  adminGetUserMealPlan,
  adminCreateMealPlan,
  adminUpdateMealPlan,
  adminDeleteMealPlan,
} from "../controllers/mealPlans.controller.js";

const router = express.Router();

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

// Search users
router.get("/users", adminSearchUsers);

// Meal plan management per user
router.get("/users/:userId/meal-plans", adminListUserMealPlans);
router.get("/users/:userId/meal-plans/:id", adminGetUserMealPlan);
router.post("/users/:userId/meal-plans", adminCreateMealPlan);
router.put("/users/:userId/meal-plans/:id", adminUpdateMealPlan);
router.delete("/users/:userId/meal-plans/:id", adminDeleteMealPlan);

export default router;
