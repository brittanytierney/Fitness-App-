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

/**
 * CORS allowlist
 * - localhost dev
 * - your current Vercel deployment
 * - ANY *.vercel.app (previews + regenerated prod URLs)
 */
const ALLOWLIST = new Set([
  "http://localhost:5173",
  "https://fitness-icojvffws-brittany-tierneys-projects.vercel.app",
]);

function isAllowedOrigin(origin) {
  if (!origin) return true; // curl/postman/server-to-server

  if (ALLOWLIST.has(origin)) return true;

  // Allow any https://*.vercel.app
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") return false;
    if (url.hostname.endsWith(".vercel.app")) return true;
  } catch {
    return false;
  }

  return false;
}

const corsOptions = {
  origin: (origin, cb) => {
    if (isAllowedOrigin(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

/**
 * IMPORTANT:
 * Using "*" breaks on your deployed router/path-to-regexp stack.
 * Regex /.*/ is safe and matches all paths for OPTIONS.
 */
app.options(/.*/, cors(corsOptions));

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "fitness-app-backend",
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