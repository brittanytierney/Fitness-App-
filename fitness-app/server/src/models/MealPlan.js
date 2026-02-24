// server/src/models/MealPlan.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const MealItemSchema = new Schema(
  {
    name: { type: String, default: "" },
    quantity: { type: String, default: "" }, // e.g., "200g", "1 cup"
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
  },
  { _id: false },
);

const MealSchema = new Schema(
  {
    name: { type: String, default: "" }, // Breakfast/Lunch/etc
    items: { type: [MealItemSchema], default: [] },
    notes: { type: String, default: "" },
  },
  { _id: false },
);

const MealDaySchema = new Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    meals: { type: [MealSchema], default: [] },
    dayNotes: { type: String, default: "" },
  },
  { _id: false },
);

const MealPlanSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: { type: String, default: "" },
    startDate: { type: String, default: "" }, // YYYY-MM-DD
    endDate: { type: String, default: "" }, // YYYY-MM-DD

    days: { type: [MealDaySchema], default: [] },

    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

// Helpful compound indexes for list views
MealPlanSchema.index({ userId: 1, startDate: -1 });
MealPlanSchema.index({ userId: 1, createdAt: -1 });

export const MealPlan = mongoose.model("MealPlan", MealPlanSchema);
