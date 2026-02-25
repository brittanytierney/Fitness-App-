import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

import app from "./app.js";
import { connectDB } from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function start() {
  try {
    const uri = process.env.DATABASE_URL;
    if (!uri)
      throw new Error("DATABASE_URL is missing (check Render env vars)");

    console.log("🧭 server.js path:", __filename);
    console.log("🧭 cwd:", process.cwd());
    console.log(
      "🚀 DEPLOY COMMIT:",
      process.env.RENDER_GIT_COMMIT || "unknown",
    );

    await connectDB(uri);

    const port = process.env.PORT || 5050;
    app.listen(port, () => console.log(`✅ Server running on port ${port}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();
