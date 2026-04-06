































































// const express       = require("express");
// const path          = require("path");
// const fs            = require("fs");
// const cors          = require("cors");
// require("dotenv").config();

// const connectDB          = require("./config/db");
// const errorHandler       = require("./middleware/errorHandler");
// const logger             = require("./middleware/logger");

// const analysisRoutes     = require("./routes/analysisRoutes");
// const githubRoutes       = require("./routes/githubRoutes");
// const linkedinRoutes     = require("./routes/linkedinRoutes");
// const linkedinSaveRoutes = require("./routes/linkedinSaveRoutes");
// const rankingRoutes      = require("./routes/rankingRoutes");
// const statsRoutes        = require("./routes/statsRoutes");

// connectDB();

// const app = express();

// // ── Vercel fix: /tmp use karo production mein ────────────────
// const uploadDir = process.env.NODE_ENV === "production" ? "/tmp/uploads" : "./uploads";
// try {
//   if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
// } catch (e) {
//   console.log("Upload dir skipped:", e.message);
// }

// // ── FIXED CORS — allows both localhost and Vercel ─────────────
// app.use(cors({
//   origin: [
//     "http://localhost:5173",
//     "https://ai-smart-rezume-analyzer.vercel.app",
//     "https://ai-smart-rezume-analyzer-6zfbxok7f.vercel.app",
//   ],
//   credentials: true,
// }));

// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// app.use("/uploads", express.static(uploadDir));
// app.use(logger);

// app.use("/api/analysis",         analysisRoutes);
// app.use("/api/github-analyze",   githubRoutes);
// app.use("/api/linkedin-analyze", linkedinRoutes);
// app.use("/api/linkedin",         linkedinSaveRoutes);
// app.use("/api/rankings",         rankingRoutes);
// app.use("/api/stats",            statsRoutes);

// const mongoose = require("mongoose");
// app.get("/", (req, res) => {
//   res.json({
//     message:     "✅ ResumeAI Server running!",
//     mongoStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
//     githubAuth:  !!process.env.GITHUB_TOKEN,
//   });
// });

// app.use(errorHandler);

// // ── Vercel: export app; only listen locally ───────────────────
// if (process.env.NODE_ENV !== "production") {
//   const PORT = process.env.PORT || 5000;
//   app.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
//     console.log(`🔐 GitHub Auth: ${process.env.GITHUB_TOKEN ? "✅ Token found" : "⚠️  No token"}`);
//   });
// }
// module.exports = app;












const express       = require("express");
const path          = require("path");
const fs            = require("fs");
const cors          = require("cors");
require("dotenv").config();

const connectDB          = require("./config/db");
const errorHandler       = require("./middleware/errorHandler");
const logger             = require("./middleware/logger");

const analysisRoutes     = require("./routes/analysisRoutes");
const githubRoutes       = require("./routes/githubRoutes");
const linkedinRoutes     = require("./routes/linkedinRoutes");
const linkedinSaveRoutes   = require("./routes/linkedinSaveRoutes");
const linkedinScrapeRoutes = require("./routes/linkedinScrapeRoutes");
const rankingRoutes      = require("./routes/rankingRoutes");
const statsRoutes        = require("./routes/statsRoutes");

connectDB();

const app = express();

// ── Vercel fix: /tmp use karo production mein ────────────────
const uploadDir = process.env.NODE_ENV === "production" ? "/tmp/uploads" : "./uploads";
try {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
} catch (e) {
  console.log("Upload dir skipped:", e.message);
}

// ── FIXED CORS — allows both localhost and Vercel ─────────────
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

app.use("/api/analysis",         analysisRoutes);
app.use("/api/github-analyze",   githubRoutes);
app.use("/api/linkedin-analyze", linkedinRoutes);
app.use("/api/linkedin",         linkedinSaveRoutes);
app.use("/api/linkedin-scrape",  linkedinScrapeRoutes);
app.use("/api/rankings",         rankingRoutes);
app.use("/api/stats",            statsRoutes);

const mongoose = require("mongoose");
app.get("/", (req, res) => {
  res.json({
    message:     "✅ ResumeAI Server running!",
    mongoStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    githubAuth:  !!process.env.GITHUB_TOKEN,
  });
});

app.use(errorHandler);

// ── Vercel: export app; only listen locally ───────────────────
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔐 GitHub Auth: ${process.env.GITHUB_TOKEN ? "✅ Token found" : "⚠️  No token"}`);
  });
}
module.exports = app;