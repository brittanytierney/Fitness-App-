// server/src/app.js
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import workoutsRoutes from "./routes/workouts.routes.js";
import progressRoutes from "./routes/progress.routes.js";
import mealPlansRoutes from "./routes/mealPlans.routes.js";
import adminRoutes from "./routes/admin.routes.js";

import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/workouts", workoutsRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/meal-plans", mealPlansRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
