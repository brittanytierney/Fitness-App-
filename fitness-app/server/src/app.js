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
 * - specific Vercel URL (your current one)
 * - ANY *.vercel.app (so preview/regen URLs don't break auth)
 *
 * IMPORTANT:
 * If you later add a custom domain, add it here too.
 */
const ALLOWLIST = new Set([
  "http://localhost:5173",
  "https://fitness-icojvffws-brittany-tierneys-projects.vercel.app",
]);

function isAllowedOrigin(origin) {
  if (!origin) return true; // allow curl/postman/server-to-server

  if (ALLOWLIST.has(origin)) return true;

  // Allow any Vercel preview/prod deploy URL
  // Examples:
  // https://whatever.vercel.app
  // https://project-name-user.vercel.app
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "https:") return false;
    if (hostname.endsWith(".vercel.app")) return true;
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
  }),
);

// Respond to preflight
app.options("*", cors());

app.use(express.json());

/**
 * Health check endpoint to verify correct deploy + commit
 */
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
