const express  = require("express");
const router   = express.Router();
const Analysis = require("../models/Analysis");

// ── GET /api/stats ─────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const totalResumes = await Analysis.countDocuments();
    const uniqueUsers  = await Analysis.distinct("clerkUserId");
    const avgResult    = await Analysis.aggregate([
      { $group: { _id: null, avg: { $avg: "$overallScore" } } },
    ]);

    res.json({
      success:      true,
      totalResumes,
      totalUsers:   uniqueUsers.length,
      avgScore:     avgResult[0]?.avg?.toFixed(1) || 0,
    });
  } catch (err) {
    res.status(500).json({
      success: false, error: err.message,
      totalResumes: 0, totalUsers: 0, avgScore: 0,
    });
  }
});

module.exports = router;