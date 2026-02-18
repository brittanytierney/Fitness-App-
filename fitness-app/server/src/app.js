// src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import workoutsRoutes from "./routes/workouts.routes.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  const ALLOWED = new Set(["http://localhost:5173", "http://127.0.0.1:5173"]);

  const corsOptions = {
    origin(origin, cb) {
      if (!origin) return cb(null, true); // curl/postman
      if (ALLOWED.has(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: false, // Bearer tokens, not cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions)); // Express 5-safe

  app.use(helmet());
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/health", (req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/workouts", workoutsRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
