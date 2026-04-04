const express   = require("express");
const router    = express.Router();
const LinkedIn  = require("../models/LinkedIn");

// ── POST /api/linkedin/save ────────────────────────────────────
router.post("/save", async (req, res) => {
  try {
    const {
      clerkUserId, userName, userEmail,
      linkedinUrl, jobRole, linkedinMetrics, resumeScore,
    } = req.body;

    if (!linkedinMetrics || Object.keys(linkedinMetrics).length === 0) {
      return res.status(400).json({ success: false, error: "No LinkedIn metrics provided" });
    }

    const linkedin = new LinkedIn({
      clerkUserId:     clerkUserId    || "guest",
      userName:        userName       || "",
      userEmail:       userEmail      || "",
      linkedinUrl:     linkedinUrl    || "",
      jobRole:         jobRole        || "",
      overallScore:    linkedinMetrics.overallLinkedInScore || 0,
      linkedinMetrics: linkedinMetrics,
      resumeScore:     resumeScore    || null,
    });

    await linkedin.save();
    console.log("✅ LinkedIn analysis saved — score:", linkedin.overallScore);
    res.json({ success: true, linkedin });

  } catch (err) {
    console.error("LinkedIn save error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/linkedin/all ──────────────────────────────────────
router.get("/all", async (req, res) => {
  try {
    const linkedins = await LinkedIn.find().sort({ createdAt: -1 });
    res.json({ success: true, linkedins });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, linkedins: [] });
  }
});

// ── GET /api/linkedin/user/:clerkUserId ───────────────────────
router.get("/user/:clerkUserId", async (req, res) => {
  try {
    const linkedins = await LinkedIn.find({ clerkUserId: req.params.clerkUserId }).sort({ createdAt: -1 });
    res.json({ success: true, linkedins });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, linkedins: [] });
  }
});

// ── GET /api/linkedin/:id ──────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const linkedin = await LinkedIn.findById(req.params.id);
    if (!linkedin) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, linkedin });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/linkedin/:id ───────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    await LinkedIn.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;