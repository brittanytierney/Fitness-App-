// server/src/controllers/workouts.controller.js
import { WorkoutDay } from "../models/WorkoutDay.js";

/**
 * GET /api/workouts/day?date=YYYY-MM-DD
 * Protected: requireAuth must set req.userId
 */
export async function getWorkoutDay(req, res, next) {
  try {
    const userId = req.userId; // ✅ never use req.auth.sub
    const date = String(req.query.date || "").trim();

    if (!userId) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    if (!date) {
      const err = new Error("Missing required query param: date");
      err.status = 400;
      throw err;
    }

    const doc = await WorkoutDay.findOne({ userId, date }).lean();

    // If no doc exists yet, return an empty day (don’t create until user saves)
    if (!doc) {
      return res.json({
        date,
        workoutType: "",
        entries: [],
      });
    }

    return res.json({
      date: doc.date,
      workoutType: doc.workoutType || "",
      entries: Array.isArray(doc.entries) ? doc.entries : [],
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/workouts/day/:date
 * Body: { workoutType: string, entries: array }
 * Upserts workout day by (userId + date)
 */
export async function upsertWorkoutDay(req, res, next) {
  try {
    const userId = req.userId; // ✅ never use req.auth.sub
    const date = String(req.params.date || "").trim();

    if (!userId) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    if (!date) {
      const err = new Error("Missing required param: date");
      err.status = 400;
      throw err;
    }

    const workoutType =
      typeof req.body.workoutType === "string"
        ? req.body.workoutType.trim()
        : "";

    const entries = Array.isArray(req.body.entries) ? req.body.entries : [];

    // Minimal guard: entries must be objects if provided
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (!e || typeof e !== "object") {
        const err = new Error(`Invalid entry at index ${i}`);
        err.status = 400;
        throw err;
      }
    }

    const doc = await WorkoutDay.findOneAndUpdate(
      { userId, date },
      { $set: { userId, date, workoutType, entries } },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    return res.json({
      date: doc.date,
      workoutType: doc.workoutType || "",
      entries: Array.isArray(doc.entries) ? doc.entries : [],
    });
  } catch (err) {
    next(err);
  }
}
export async function listRecentWorkoutDays(req, res, next) {
  try {
    const userId = req.userId;
    if (!userId) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const limit = Math.min(Number(req.query.limit || 30), 100);

    const days = await WorkoutDay.find({ userId })
      .sort({ date: -1 })
      .limit(limit)
      .select("date workoutType entries")
      .lean();

    // lightweight summary
    const summarized = days.map((d) => ({
      date: d.date,
      workoutType: d.workoutType || "",
      exerciseCount: Array.isArray(d.entries) ? d.entries.length : 0,
    }));

    res.json({ days: summarized });
  } catch (err) {
    next(err);
  }
}
