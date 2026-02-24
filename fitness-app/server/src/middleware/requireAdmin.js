// server/src/middleware/requireAdmin.js
export function requireAdmin(req, res, next) {
  // Assumes requireAuth already ran and set req.role
  if (req.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}
