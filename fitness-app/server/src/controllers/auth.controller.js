// src/controllers/auth.controller.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";

const signupSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, underscore"),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(8).max(100),
});

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}

export async function signup(req, res, next) {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const { username, password } = parsed.data;

    // Enforce cap of 30 "user" accounts (owner not counted)
    const limit = Number(process.env.USER_LIMIT || 30);
    const userCount = await User.countDocuments({ role: "user" });
    if (userCount >= limit) {
      return res
        .status(403)
        .json({ error: `User limit reached (${limit}). Contact the owner.` });
    }

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      username: username.toLowerCase(),
      passwordHash,
      role: "user",
    });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: {
        _id: user._id.toString(),
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const { username, password } = parsed.data;

    const user = await User.findOne({
      username: username.toLowerCase(),
      isActive: true,
    });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user);

    return res.json({
      token,
      user: {
        _id: user._id.toString(),
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}
