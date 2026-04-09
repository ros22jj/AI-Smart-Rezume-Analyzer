const express    = require("express");
const path       = require("path");
const fs         = require("fs");
const cors       = require("cors");
require("dotenv").config();
// Fallback: load client .env so VITE_GROQ_API_KEY works locally without duplicating keys
if (!process.env.GROQ_API_KEY) {
  const clientEnvPath = require("path").join(__dirname, "../client/.env");
  const clientLocalPath = require("path").join(__dirname, "../client/.env.local");
  require("dotenv").config({ path: clientEnvPath, override: false });
  require("dotenv").config({ path: clientLocalPath, override: false });
  if (process.env.VITE_GROQ_API_KEY) {
    process.env.GROQ_API_KEY = process.env.VITE_GROQ_API_KEY;
  }
}

const connectDB      = require("./config/db");
const errorHandler   = require("./middleware/errorHandler");
const logger         = require("./middleware/logger");

const analysisRoutes     = require("./routes/analysisRoutes");
const githubRoutes       = require("./routes/githubRoutes");
const linkedinRoutes     = require("./routes/linkedinRoutes");
const linkedinSaveRoutes = require("./routes/linkedinSaveRoutes");
const atsBuilderRoutes   = require("./routes/atsBuilderRoutes");
const rankingRoutes      = require("./routes/rankingRoutes");
const statsRoutes        = require("./routes/statsRoutes");

connectDB();

const app = express();

// Vercel: use /tmp in production
const uploadDir = process.env.NODE_ENV === "production" ? "/tmp/uploads" : "./uploads";
try {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
} catch (e) {
  console.log("Upload dir skipped:", e.message);
}

// CORS
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://ai-smart-rezume-analyzer.vercel.app",
    "https://ai-smart-rezume-analyzer-6zfbxok7f.vercel.app",
  ],
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(uploadDir));
app.use(logger);

// Routes
app.use("/api/analysis",         analysisRoutes);
app.use("/api/github-analyze",   githubRoutes);
app.use("/api/linkedin-analyze", linkedinRoutes);
app.use("/api/linkedin",         linkedinSaveRoutes);
app.use("/api/ats-builder",      atsBuilderRoutes);
app.use("/api/rankings",         rankingRoutes);
app.use("/api/stats",            statsRoutes);

const mongoose = require("mongoose");
app.get("/", (req, res) => {
  res.json({
    message:     "✅ ResumeAI Server running!",
    mongoStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    githubAuth:  !!process.env.GITHUB_TOKEN,
    routes:      ["/api/analysis","/api/github-analyze","/api/linkedin-analyze","/api/linkedin","/api/ats-builder","/api/rankings","/api/stats"],
  });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server on port ${PORT}`);
    console.log(`🔐 GROQ_API_KEY: ${process.env.GROQ_API_KEY ? "✅ found in server .env" : "⚠️  Not in server .env — client will pass it at runtime (OK)"}`);
    console.log(`🔐 GitHub token: ${process.env.GITHUB_TOKEN ? "✅ found" : "⚠️ not set (GitHub enrichment disabled)"}`);
  });
}

module.exports = app;