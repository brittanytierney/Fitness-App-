// server/src/controllers/workouts.controller.js
import { WorkoutDay } from "../models/WorkoutDay.js";

export async function getWorkoutDay(req, res, next) {
  try {
    const userId = req.userId; // ✅ ONLY source of truth
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

export async function upsertWorkoutDay(req, res, next) {
  try {
    const userId = req.userId; // ✅ ONLY source of truth
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
