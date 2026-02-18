// src/routes/auth.routes.js
import { Router } from "express";
import { signup, login } from "../controllers/auth.controller.js";

const router = Router();

// Public routes (NO requireAuth here)
router.post("/signup", signup);
router.post("/login", login);

export default router;
