const express               = require("express");
const router                = express.Router();
const { analyzeLinkedIn }   = require("../services/linkedinService");

// ── POST /api/linkedin-analyze ────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { linkedinText, linkedinUrl, jobRole, resumeSkills = [] } = req.body;

    if (!linkedinText || linkedinText.trim().length < 50) {
      return res.status(400).json({ success: false, error: "LinkedIn profile text too short" });
    }

    const linkedinMetrics = analyzeLinkedIn({ linkedinText, jobRole, resumeSkills });

    console.log(`✅ LinkedIn analysis complete — overallScore: ${linkedinMetrics.overallLinkedInScore}`);
    res.json({ success: true, linkedinMetrics });

  } catch (err) {
    console.error("LinkedIn analyze error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;