// server/src/controllers/mealPlans.controller.js
import mongoose from "mongoose";
import { MealPlan } from "../models/MealPlan.js";
import { User } from "../models/User.js";

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function safeString(v) {
  return typeof v === "string" ? v : "";
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function normalizeMealPlanPayload(body) {
  const title = safeString(body?.title);
  const startDate = safeString(body?.startDate);
  const endDate = safeString(body?.endDate);
  const notes = safeString(body?.notes);

  const days = safeArray(body?.days).map((d) => ({
    date: safeString(d?.date),
    dayNotes: safeString(d?.dayNotes),
    meals: safeArray(d?.meals).map((m) => ({
      name: safeString(m?.name),
      notes: safeString(m?.notes),
      items: safeArray(m?.items).map((it) => ({
        name: safeString(it?.name),
        quantity: safeString(it?.quantity),
        calories: Number(it?.calories || 0),
        protein: Number(it?.protein || 0),
        carbs: Number(it?.carbs || 0),
        fat: Number(it?.fat || 0),
      })),
    })),
  }));

  return { title, startDate, endDate, notes, days };
}

/**
 * USER: GET /api/meal-plans
 * Lists meal plans for the logged-in user
 */
export async function listMyMealPlans(req, res, next) {
  try {
    res.set("Cache-Control", "no-store");
    const userId = req.userId;

    const docs = await MealPlan.find({ userId })
      .sort({ startDate: -1, createdAt: -1 })
      .select(
        "title startDate endDate notes createdAt updatedAt createdByUserId",
      )
      .lean();

    return res.json({ mealPlans: docs });
  } catch (err) {
    next(err);
  }
}

/**
 * USER: GET /api/meal-plans/:id
 * Gets one meal plan if it belongs to logged-in user
 */
export async function getMyMealPlan(req, res, next) {
  try {
    res.set("Cache-Control", "no-store");
    const userId = req.userId;
    const id = String(req.params.id || "");

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid meal plan id" });
    }

    const doc = await MealPlan.findOne({ _id: id, userId }).lean();
    if (!doc) return res.status(404).json({ message: "Meal plan not found" });

    return res.json({ mealPlan: doc });
  } catch (err) {
    next(err);
  }
}

/**
 * ADMIN: GET /api/admin/users?query=...
 * Minimal user search for meal plan assignment
 */
export async function adminSearchUsers(req, res, next) {
  try {
    res.set("Cache-Control", "no-store");

    const query = safeString(req.query.query).trim();
    const limitRaw = req.query.limit;
    const limit = Number.isFinite(Number(limitRaw))
      ? Math.min(Number(limitRaw), 50)
      : 20;

    const filter = query
      ? {
          $or: [
            { username: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find(filter)
      .sort({ username: 1 })
      .limit(limit)
      .select("_id username email role")
      .lean();

    return res.json({ users });
  } catch (err) {
    next(err);
  }
}

/**
 * ADMIN: GET /api/admin/users/:userId/meal-plans
 * List meal plans for a specific user
 */
export async function adminListUserMealPlans(req, res, next) {
  try {
    res.set("Cache-Control", "no-store");
    const userIdParam = String(req.params.userId || "");

    if (!isValidObjectId(userIdParam)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const docs = await MealPlan.find({ userId: userIdParam })
      .sort({ startDate: -1, createdAt: -1 })
      .select(
        "title startDate endDate notes createdAt updatedAt createdByUserId",
      )
      .lean();

    return res.json({ mealPlans: docs });
  } catch (err) {
    next(err);
  }
}

/**
 * ADMIN: GET /api/admin/users/:userId/meal-plans/:id
 */
export async function adminGetUserMealPlan(req, res, next) {
  try {
    res.set("Cache-Control", "no-store");

    const userIdParam = String(req.params.userId || "");
    const id = String(req.params.id || "");

    if (!isValidObjectId(userIdParam)) {
      return res.status(400).json({ message: "Invalid userId" });
    }
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid meal plan id" });
    }

    const doc = await MealPlan.findOne({ _id: id, userId: userIdParam }).lean();
    if (!doc) return res.status(404).json({ message: "Meal plan not found" });

    return res.json({ mealPlan: doc });
  } catch (err) {
    next(err);
  }
}

/**
 * ADMIN: POST /api/admin/users/:userId/meal-plans
 * Create a new meal plan for a user
 */
export async function adminCreateMealPlan(req, res, next) {
  try {
    res.set("Cache-Control", "no-store");

    const userIdParam = String(req.params.userId || "");
    if (!isValidObjectId(userIdParam)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const payload = normalizeMealPlanPayload(req.body);

    const created = await MealPlan.create({
      userId: userIdParam,
      createdByUserId: req.userId,
      ...payload,
    });

    return res.status(201).json({ mealPlan: created.toObject() });
  } catch (err) {
    next(err);
  }
}

/**
 * ADMIN: PUT /api/admin/users/:userId/meal-plans/:id
 * Update an existing meal plan (belongs to that user)
 */
export async function adminUpdateMealPlan(req, res, next) {
  try {
    res.set("Cache-Control", "no-store");

    const userIdParam = String(req.params.userId || "");
    const id = String(req.params.id || "");

    if (!isValidObjectId(userIdParam)) {
      return res.status(400).json({ message: "Invalid userId" });
    }
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid meal plan id" });
    }

    const payload = normalizeMealPlanPayload(req.body);

    const updated = await MealPlan.findOneAndUpdate(
      { _id: id, userId: userIdParam },
      { $set: payload },
      { new: true },
    ).lean();

    if (!updated)
      return res.status(404).json({ message: "Meal plan not found" });

    return res.json({ mealPlan: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * ADMIN: DELETE /api/admin/users/:userId/meal-plans/:id
 */
export async function adminDeleteMealPlan(req, res, next) {
  try {
    res.set("Cache-Control", "no-store");

    const userIdParam = String(req.params.userId || "");
    const id = String(req.params.id || "");

    if (!isValidObjectId(userIdParam)) {
      return res.status(400).json({ message: "Invalid userId" });
    }
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid meal plan id" });
    }

    const deleted = await MealPlan.findOneAndDelete({
      _id: id,
      userId: userIdParam,
    }).lean();
    if (!deleted)
      return res.status(404).json({ message: "Meal plan not found" });

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
