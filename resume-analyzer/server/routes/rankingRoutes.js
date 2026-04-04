const express = require("express");
const router  = express.Router();
const Ranking = require("../models/Ranking");
const { v4: uuidv4 } = require("uuid");

// ── POST /api/rankings/save ────────────────────────────────────
router.post("/save", async (req, res) => {
  try {
    const {
      clerkUserId, userName, userEmail,
      jobDescription, ranked, improvements,
    } = req.body;

    if (!ranked || ranked.length === 0) {
      return res.status(400).json({ success: false, error: "No ranked resumes provided" });
    }

    // ── Build resume entries array ─────────────────────────
    const resumeEntries = ranked.map((candidate, index) => {
      const rank          = index + 1;
      const ats           = candidate.atsResult || {};
      const gh            = candidate.githubMetrics || {};
      const li            = candidate.linkedinMetrics || {};
      const compositeScore = computeCompositeScore(candidate);

      return {
        fileName:        candidate.fileName        || "",
        candidateName:   ats.candidateName         || candidate.fileName || "",
        rank,
        compositeScore,
        atsScore:        ats.overallScore          || 0,
        githubScore:     gh.trustScore             ?? null,
        linkedinScore:   li.overallLinkedInScore   ?? null,
        githubUsername:  candidate.githubUsername  || "",
        skills:          candidate.skills          || [],
        improvements:    improvements?.[candidate.fileName] || [],
        // Full breakdowns
        atsScores:       ats.scores                || {},
        githubMetrics:   gh,
        linkedinMetrics: li,
        topStrengths:    ats.topStrengths          || [],
        verdict:         ats.verdict               || "",
      };
    });

    // ── Winner is rank 1 ──────────────────────────────────
    const winner = resumeEntries[0];

    const ranking = new Ranking({
      clerkUserId:    clerkUserId    || "guest",
      userName:       userName       || "",
      userEmail:      userEmail      || "",
      sessionId:      uuidv4(),
      jobDescription: jobDescription ? jobDescription.slice(0, 500) : "",
      totalResumes:   ranked.length,
      resumes:        resumeEntries,
      winner: {
        fileName:       winner.fileName,
        candidateName:  winner.candidateName,
        compositeScore: winner.compositeScore,
        atsScore:       winner.atsScore,
        githubScore:    winner.githubScore,
        githubUsername: winner.githubUsername,
      },
    });

    await ranking.save();
    console.log(`✅ Ranking saved — ${ranked.length} resumes — winner: ${winner.candidateName} (${winner.compositeScore})`);
    res.json({ success: true, ranking });

  } catch (err) {
    console.error("Ranking save error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/rankings/user/:clerkUserId ───────────────────────
// Returns all ranking sessions for a specific user
router.get("/user/:clerkUserId", async (req, res) => {
  try {
    const rankings = await Ranking.find({ clerkUserId: req.params.clerkUserId })
      .sort({ createdAt: -1 })
      .select("-resumes.atsScores -resumes.githubMetrics -resumes.linkedinMetrics"); // lightweight list
    res.json({ success: true, rankings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, rankings: [] });
  }
});

// ── GET /api/rankings/all ──────────────────────────────────────
// Returns all rankings (admin view)
router.get("/all", async (req, res) => {
  try {
    const rankings = await Ranking.find()
      .sort({ createdAt: -1 })
      .select("-resumes.atsScores -resumes.githubMetrics -resumes.linkedinMetrics");
    res.json({ success: true, rankings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, rankings: [] });
  }
});

// ── GET /api/rankings/:id ──────────────────────────────────────
// Returns full ranking session with all details
router.get("/:id", async (req, res) => {
  try {
    const ranking = await Ranking.findById(req.params.id);
    if (!ranking) return res.status(404).json({ success: false, error: "Ranking not found" });
    res.json({ success: true, ranking });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/rankings/:id ───────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    await Ranking.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/rankings/stats/:clerkUserId ──────────────────────
// Returns stats for a specific user
router.get("/stats/:clerkUserId", async (req, res) => {
  try {
    const rankings     = await Ranking.find({ clerkUserId: req.params.clerkUserId });
    const totalSessions = rankings.length;
    const totalResumes  = rankings.reduce((sum, r) => sum + r.totalResumes, 0);
    const avgWinnerScore = rankings.length
      ? Math.round(rankings.reduce((sum, r) => sum + r.winner.compositeScore, 0) / rankings.length)
      : 0;
    const bestWinner = rankings.reduce((best, r) => {
      return r.winner.compositeScore > (best?.compositeScore || 0) ? r.winner : best;
    }, null);

    res.json({
      success: true,
      totalSessions,
      totalResumes,
      avgWinnerScore,
      bestWinner,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Helper: compute composite score ───────────────────────────
function computeCompositeScore(candidate) {
  const atsScore = candidate.atsResult?.overallScore          ?? 0;
  const ghScore  = candidate.githubMetrics?.trustScore        ?? null;
  const liScore  = candidate.linkedinMetrics?.overallLinkedInScore ?? null;

  let total      = atsScore * 0.5;
  let denominator = 0.5;

  if (ghScore !== null) { total += ghScore * 0.3; denominator += 0.3; }
  if (liScore !== null) { total += liScore * 0.2; denominator += 0.2; }

  return Math.round(total / denominator);
}

module.exports = router;