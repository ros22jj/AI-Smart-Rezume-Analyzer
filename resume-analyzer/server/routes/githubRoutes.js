const express              = require("express");
const router               = express.Router();
const { analyzeGitHub }    = require("../services/githubService");

// ── POST /api/github-analyze ───────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { githubUsername, resumeSkills = [], resumeProjects = [], claimedYears = 0 } = req.body;

    if (!githubUsername) {
      return res.status(400).json({ success: false, error: "GitHub username required" });
    }

    const githubMetrics = await analyzeGitHub({
      githubUsername,
      resumeSkills,
      resumeProjects,
      claimedYears,
    });

    console.log(`✅ GitHub analysis complete for @${githubUsername} — trustScore: ${githubMetrics.trustScore}`);
    res.json({ success: true, githubMetrics });

  } catch (err) {
    console.error("GitHub analyze error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;