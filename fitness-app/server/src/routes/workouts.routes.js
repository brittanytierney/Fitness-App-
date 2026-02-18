// server/src/routes/workouts.routes.js
import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  getWorkoutDay,
  upsertWorkoutDay,
  listRecentWorkoutDays,
} from "../controllers/workouts.controller.js";

const router = express.Router();

// protect all routes below
router.use(requireAuth);

// GET /api/workouts/day?date=YYYY-MM-DD
router.get("/day", getWorkoutDay);

// PUT /api/workouts/day/:date
router.put("/day/:date", upsertWorkoutDay);

// GET /api/workouts/recent?limit=30
router.get("/recent", listRecentWorkoutDays);

export default router;
