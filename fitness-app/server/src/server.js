import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

async function start() {
  try {
    const uri = process.env.DATABASE_URL;
    if (!uri)
      throw new Error("DATABASE_URL is missing (check Render env vars)");

    const commit = process.env.RENDER_GIT_COMMIT || "unknown";
    console.log("🚀 DEPLOY CHECK: commit =", commit);

    await connectDB(uri);

    const port = process.env.PORT || 5050;
    app.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();
