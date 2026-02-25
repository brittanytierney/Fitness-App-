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

const ALLOWLIST = new Set([
  "http://localhost:5173",
  "https://fitness-icojvffws-brittany-tierneys-projects.vercel.app",
]);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (ALLOWLIST.has(origin)) return true;

  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") return false;
    if (url.hostname.endsWith(".vercel.app")) return true;
  } catch {
    return false;
  }

  return false;
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (isAllowedOrigin(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  }),
);

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    commit: process.env.RENDER_GIT_COMMIT || "unknown",
    time: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/workouts", workoutsRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/meal-plans", mealPlansRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
