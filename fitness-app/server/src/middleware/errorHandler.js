// src/middleware/errorHandler.js
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  console.error(err); // prints full stack in terminal

  const status = Number(err.status || err.statusCode || 500);
  const message = err.message || "Server error";

  res.status(status).json({ message });
}
