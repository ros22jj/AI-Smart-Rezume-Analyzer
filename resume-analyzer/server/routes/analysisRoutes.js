// const express  = require("express");
// const router   = express.Router();
// const multer   = require("multer");
// const path     = require("path");
// const Analysis = require("../models/Analysis");

// // ── Multer setup ───────────────────────────────────────────────
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, "./uploads"),
//   filename:    (req, file, cb) => cb(null, Date.now() + "_" + file.originalname),
// });
// const upload = multer({ storage });

// // ── POST /api/analysis/save ────────────────────────────────────
// router.post("/save", upload.single("resume"), async (req, res) => {
//   try {
//     const {
//       clerkUserId, userName, userEmail, resumeFileName,
//       overallScore, candidateName, analysisData,
//       githubUsername, githubMetrics,
//     } = req.body;

//     const resumeFilePath = req.file ? `/uploads/${req.file.filename}` : "";

//     const analysis = new Analysis({
//       clerkUserId:    clerkUserId    || "unknown",
//       userName:       userName       || "",
//       userEmail:      userEmail      || "",
//       resumeFileName: resumeFileName || "",
//       resumeFilePath,
//       githubUsername: githubUsername || "",
//       githubMetrics:  githubMetrics  ? JSON.parse(githubMetrics) : {},
//       overallScore:   Number(overallScore) || 0,
//       candidateName:  candidateName  || "",
//       analysisData:   typeof analysisData === "string" ? JSON.parse(analysisData) : analysisData,
//     });

//     await analysis.save();
//     res.json({ success: true, analysis });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// // ── GET /api/analysis/all ──────────────────────────────────────
// router.get("/all", async (req, res) => {
//   try {
//     const analyses = await Analysis.find().sort({ createdAt: -1 });
//     res.json({ success: true, analyses });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message, analyses: [] });
//   }
// });

// // ── GET /api/analysis/user/:clerkUserId ───────────────────────
// router.get("/user/:clerkUserId", async (req, res) => {
//   try {
//     const analyses = await Analysis.find({ clerkUserId: req.params.clerkUserId }).sort({ createdAt: -1 });
//     res.json({ success: true, analyses });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message, analyses: [] });
//   }
// });

// // ── GET /api/analysis/:id ──────────────────────────────────────
// router.get("/:id", async (req, res) => {
//   try {
//     const analysis = await Analysis.findById(req.params.id);
//     if (!analysis) return res.status(404).json({ success: false, error: "Not found" });
//     res.json({ success: true, analysis });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// // ── DELETE /api/analysis/:id ───────────────────────────────────
// router.delete("/:id", async (req, res) => {
//   try {
//     await Analysis.findByIdAndDelete(req.params.id);
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// module.exports = router;






















const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const path     = require("path");
const Analysis = require("../models/Analysis");

// ── Multer setup ───────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads"),
  filename:    (req, file, cb) => cb(null, Date.now() + "_" + file.originalname),
});
const upload = multer({ storage });

// ── POST /api/analysis/save ────────────────────────────────────
router.post("/save", upload.single("resume"), async (req, res) => {
  try {
    const {
      clerkUserId, userName, userEmail, resumeFileName,
      overallScore, candidateName, analysisData,
      githubUsername, githubMetrics, linkedinMetrics,
    } = req.body;

    const resumeFilePath = req.file ? `/uploads/${req.file.filename}` : "";

    const analysis = new Analysis({
      clerkUserId:     clerkUserId     || "unknown",
      userName:        userName        || "",
      userEmail:       userEmail       || "",
      resumeFileName:  resumeFileName  || "",
      resumeFilePath,
      githubUsername:  githubUsername  || "",
      githubMetrics:   githubMetrics   ? JSON.parse(githubMetrics)   : {},
      linkedinMetrics: linkedinMetrics ? JSON.parse(linkedinMetrics) : {},
      overallScore:    Number(overallScore) || 0,
      candidateName:   candidateName   || "",
      analysisData:    typeof analysisData === "string" ? JSON.parse(analysisData) : analysisData,
    });

    await analysis.save();
    res.json({ success: true, analysis });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/analysis/all ──────────────────────────────────────
router.get("/all", async (req, res) => {
  try {
    const analyses = await Analysis.find().sort({ createdAt: -1 });
    res.json({ success: true, analyses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, analyses: [] });
  }
});

// ── GET /api/analysis/user/:clerkUserId ───────────────────────
router.get("/user/:clerkUserId", async (req, res) => {
  try {
    const analyses = await Analysis.find({ clerkUserId: req.params.clerkUserId }).sort({ createdAt: -1 });
    res.json({ success: true, analyses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, analyses: [] });
  }
});

// ── GET /api/analysis/:id ──────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    if (!analysis) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, analysis });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/analysis/:id ───────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    await Analysis.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;