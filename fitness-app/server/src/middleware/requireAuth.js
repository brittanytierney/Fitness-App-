import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  console.log("AUTH HEADER:", req.headers.authorization); // ✅ HERE

  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      const err = new Error("Missing or invalid Authorization header");
      err.status = 401;
      throw err;
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload.sub || payload.userId || payload._id;

    if (!userId) {
      const err = new Error("Token payload missing user id");
      err.status = 401;
      throw err;
    }

    req.userId = userId;
    req.role = payload.role || "user";
    next();
  } catch (e) {
    const err = new Error("Unauthorized");
    err.status = 401;
    next(err);
  }
}