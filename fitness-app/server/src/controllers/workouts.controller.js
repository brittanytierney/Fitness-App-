// server/src/controllers/workouts.controller.js
import { WorkoutDay } from "../models/WorkoutDay.js";

/**
 * GET /api/workouts/day?date=YYYY-MM-DD
 * Returns:
 *  - if exists: { date, workoutType, entries }
 *  - if none:   { date, workoutType: "", entries: [] }
 */
export async function getWorkoutDay(req, res, next) {
  try {
    const userId = req.userId;
    const date = String(req.query.date || "");

    if (!date) {
      return res.status(400).json({ message: "date is required" });
    }

    const doc = await WorkoutDay.findOne({ userId, date }).lean();

    if (!doc) {
      return res.json({ date, workoutType: "", entries: [] });
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
 */
export async function upsertWorkoutDay(req, res, next) {
  try {
    const userId = req.userId;
    const date = String(req.params.date || "");

    if (!date) {
      return res.status(400).json({ message: "date is required" });
    }

    const workoutType =
      typeof req.body?.workoutType === "string" ? req.body.workoutType : "";
    const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];

    const updated = await WorkoutDay.findOneAndUpdate(
      { userId, date },
      { $set: { workoutType, entries } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    return res.json({
      date: updated.date,
      workoutType: updated.workoutType || "",
      entries: Array.isArray(updated.entries) ? updated.entries : [],
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/workouts/recent?limit=30
 * Returns: { days: [{ date, workoutType, exerciseCount, exerciseNames }] }
 *
 * IMPORTANT: Your routes expect this function name:
 *   listRecentWorkoutDays
 */
export async function listRecentWorkoutDays(req, res, next) {
  try {
    // Fix stale History/Dashboard caused by 304 caching
    res.set("Cache-Control", "no-store");

    const userId = req.userId;
    const limitRaw = req.query.limit;
    const limit = Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : 30;

    const docs = await WorkoutDay.find({ userId })
      .sort({ date: -1 })
      .limit(limit)
      .select("date workoutType entries")
      .lean();

    const days = docs.map((d) => {
      const entries = Array.isArray(d.entries) ? d.entries : [];
      const exerciseNames = entries
        .map((e) => String(e?.exerciseName || "").trim())
        .filter(Boolean);

      return {
        date: d.date,
        workoutType: d.workoutType || "",
        exerciseCount: entries.length,
        exerciseNames,
      };
    });

    return res.json({ days });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/workouts/range?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns: { days: [{ date, workoutType, exerciseCount, exerciseNames }] }
 */
export async function listWorkoutDaysInRange(req, res, next) {
  try {
    res.set("Cache-Control", "no-store");

    const userId = req.userId;
    const from = String(req.query.from || "");
    const to = String(req.query.to || "");

    if (!from || !to) {
      return res.status(400).json({ message: "from and to are required" });
    }

    const docs = await WorkoutDay.find({
      userId,
      date: { $gte: from, $lte: to },
    })
      .sort({ date: 1 })
      .select("date workoutType entries")
      .lean();

    const days = docs.map((d) => {
      const entries = Array.isArray(d.entries) ? d.entries : [];
      const exerciseNames = entries
        .map((e) => String(e?.exerciseName || "").trim())
        .filter(Boolean);

      return {
        date: d.date,
        workoutType: d.workoutType || "",
        exerciseCount: entries.length,
        exerciseNames,
      };
    });

    return res.json({ days });
  } catch (err) {
    next(err);
  }
}
