import { WorkoutDay } from "../models/WorkoutDay.js";

function isValidYYYYMMDD(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function normalizeName(s) {
  return String(s || "").trim();
}

function isCountableSet(set, requireCompleted = false) {
  if (!set) return false;
  const reps = Number(set.reps || 0);
  const weight = Number(set.weight || 0);

  if (reps <= 0) return false;
  if (requireCompleted && !set.completedAt) return false;

  // weight can be 0 for bodyweight movements; allow it
  return true;
}

function calcE1RM(weight, reps) {
  // Epley formula: 1RM = w * (1 + reps/30)
  const w = Number(weight || 0);
  const r = Number(reps || 0);
  if (w <= 0 || r <= 0) return 0;
  return w * (1 + r / 30);
}

/**
 * GET /api/progress/prs
 * Optional query:
 *  - requireCompleted=1  (only count sets with completedAt)
 *
 * Returns:
 * {
 *   prs: [
 *     { exerciseName, bestWeight, bestWeightReps, bestE1RM, bestE1RMSet: {weight,reps,date} }
 *   ]
 * }
 */
export async function getPRs(req, res, next) {
  try {
    res.set("Cache-Control", "no-store");

    const userId = req.userId;
    const requireCompleted = String(req.query.requireCompleted || "") === "1";

    // Pull all workout days for user (lean)
    // If this grows large later, we can add date cutoffs or incremental aggregation.
    const docs = await WorkoutDay.find({ userId })
      .select("date entries")
      .lean();

    const byExercise = new Map(); // name -> stats

    for (const day of docs) {
      const date = day.date;
      const entries = Array.isArray(day.entries) ? day.entries : [];

      for (const entry of entries) {
        const name = normalizeName(entry?.exerciseName);
        if (!name) continue;

        const sets = Array.isArray(entry?.sets) ? entry.sets : [];
        for (const s of sets) {
          if (!isCountableSet(s, requireCompleted)) continue;

          const reps = Number(s.reps || 0);
          const weight = Number(s.weight || 0);
          const e1rm = calcE1RM(weight, reps);

          const cur = byExercise.get(name) || {
            exerciseName: name,
            bestWeight: 0,
            bestWeightReps: 0,
            bestE1RM: 0,
            bestE1RMSet: { weight: 0, reps: 0, date: "" },
          };

          // Best weight (tie-breaker: higher reps)
          if (
            weight > cur.bestWeight ||
            (weight === cur.bestWeight && reps > cur.bestWeightReps)
          ) {
            cur.bestWeight = weight;
            cur.bestWeightReps = reps;
          }

          // Best estimated 1RM (store the set and date)
          if (e1rm > cur.bestE1RM) {
            cur.bestE1RM = e1rm;
            cur.bestE1RMSet = { weight, reps, date };
          }

          byExercise.set(name, cur);
        }
      }
    }

    const prs = [...byExercise.values()].sort(
      (a, b) => b.bestE1RM - a.bestE1RM,
    );

    return res.json({ prs });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/progress/volume?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Optional query:
 *  - requireCompleted=1
 *
 * Returns:
 * { weeks: [{ weekStart, totalSets, totalReps, totalVolume }] }
 *
 * weekStart is YYYY-MM-DD for Monday of that week.
 */
export async function getWeeklyVolume(req, res, next) {
  try {
    res.set("Cache-Control", "no-store");

    const userId = req.userId;
    const from = String(req.query.from || "");
    const to = String(req.query.to || "");
    const requireCompleted = String(req.query.requireCompleted || "") === "1";

    if (!isValidYYYYMMDD(from) || !isValidYYYYMMDD(to)) {
      return res
        .status(400)
        .json({ message: "from and to are required (YYYY-MM-DD)" });
    }

    const docs = await WorkoutDay.find({
      userId,
      date: { $gte: from, $lte: to },
    })
      .select("date entries")
      .lean();

    // helper: get Monday for a date string
    function weekStartMonday(dateStr) {
      const [y, m, d] = dateStr.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      const day = dt.getDay(); // 0 Sun..6 Sat
      // convert to Monday-based offset
      const diff = (day === 0 ? -6 : 1) - day;
      dt.setDate(dt.getDate() + diff);
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }

    const buckets = new Map(); // weekStart -> totals

    for (const day of docs) {
      const wk = weekStartMonday(day.date);
      const entries = Array.isArray(day.entries) ? day.entries : [];

      let totalSets = 0;
      let totalReps = 0;
      let totalVolume = 0;

      for (const entry of entries) {
        const sets = Array.isArray(entry?.sets) ? entry.sets : [];
        for (const s of sets) {
          if (!isCountableSet(s, requireCompleted)) continue;

          const reps = Number(s.reps || 0);
          const weight = Number(s.weight || 0);

          totalSets += 1;
          totalReps += reps;
          totalVolume += reps * weight; // simple tonnage
        }
      }

      const cur = buckets.get(wk) || {
        weekStart: wk,
        totalSets: 0,
        totalReps: 0,
        totalVolume: 0,
      };

      cur.totalSets += totalSets;
      cur.totalReps += totalReps;
      cur.totalVolume += totalVolume;

      buckets.set(wk, cur);
    }

    const weeks = [...buckets.values()].sort((a, b) =>
      a.weekStart < b.weekStart ? -1 : 1,
    );

    return res.json({ weeks });
  } catch (err) {
    next(err);
  }
}
