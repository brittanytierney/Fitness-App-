import mongoose from "mongoose";

const setSchema = new mongoose.Schema(
  {
    reps: { type: Number, required: true, min: 0, max: 1000 },
    weight: { type: Number, required: true, min: 0, max: 5000 },
    restSeconds: { type: Number, required: true, min: 0, max: 36000 },
    completedAt: { type: Date, default: null },
  },
  { _id: true },
);

const entrySchema = new mongoose.Schema(
  {
    exerciseName: { type: String, required: true, trim: true, maxlength: 100 },
    sets: { type: [setSchema], default: [] },
    notes: { type: String, default: "", maxlength: 2000 },
  },
  { _id: true },
);

const workoutDaySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "User",
    },
    date: { type: String, required: true, index: true }, // "YYYY-MM-DD"
    workoutType: { type: String, default: "", maxlength: 50 },
    entries: { type: [entrySchema], default: [] },
  },
  { timestamps: true },
);

// One doc per user per day
workoutDaySchema.index({ userId: 1, date: 1 }, { unique: true });

export const WorkoutDay = mongoose.model("WorkoutDay", workoutDaySchema);
