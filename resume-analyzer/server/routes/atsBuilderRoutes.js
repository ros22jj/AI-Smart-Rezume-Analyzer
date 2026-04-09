// // // // ══════════════════════════════════════════════════════════════
// // // // atsBuilderRoutes.js  — receives JSON (text pre-extracted on client)
// // // // POST   /api/ats-builder/build
// // // // GET    /api/ats-builder/history/:clerkUserId
// // // // GET    /api/ats-builder/pdf/:id
// // // // DELETE /api/ats-builder/:id
// // // // ══════════════════════════════════════════════════════════════

// // // const express            = require("express");
// // // const router             = express.Router();
// // // const ATSBuild           = require("../models/ATSBuild");
// // // const { buildATSResume } = require("../services/atsBuilderService");

// // // // ── POST /api/ats-builder/build ───────────────────────────────
// // // // Receives JSON body — client already extracted text from PDF/DOCX
// // // router.post("/build", async (req, res) => {
// // //   try {
// // //     const {
// // //       clerkUserId,
// // //       userName       = "",
// // //       userEmail      = "",
// // //       resumeText     = "",
// // //       resumeFileName = "",
// // //       jdText         = "",
// // //       githubUsername = "",
// // //     } = req.body;

// // //     // ── Validate ──────────────────────────────────────────
// // //     if (!clerkUserId) {
// // //       return res.status(400).json({ success: false, error: "clerkUserId required" });
// // //     }
// // //     if (!resumeText || resumeText.trim().length < 50) {
// // //       return res.status(400).json({ success: false, error: "Resume text is too short or empty." });
// // //     }
// // //     if (!jdText || jdText.trim().length < 20) {
// // //       return res.status(400).json({ success: false, error: "Job description is required." });
// // //     }

// // //     console.log(`🔨 ATS build: ${userName || clerkUserId} | ${resumeFileName} | GitHub: ${githubUsername || "none"}`);

// // //     // ── Build the ATS resume ──────────────────────────────
// // //     const result = await buildATSResume({
// // //       resumeText:     resumeText.trim(),
// // //       jdText:         jdText.trim(),
// // //       githubUsername: githubUsername.trim(),
// // //     });

// // //     // ── Save to MongoDB ───────────────────────────────────
// // //     const atsBuild = new ATSBuild({
// // //       clerkUserId,
// // //       userName,
// // //       userEmail,
// // //       originalResumeFileName: resumeFileName,
// // //       jdText:                 jdText.slice(0, 2000),
// // //       githubUsername:         githubUsername || "",
// // //       githubUsed:             result.githubUsed,
// // //       githubProjects:         result.githubProjects,
// // //       originalResumeText:     resumeText.slice(0, 5000),
// // //       generatedResumeText:    result.generatedResumeText.slice(0, 8000),
// // //       analytics:              result.analytics,
// // //       generatedPdfBase64:     result.pdfBase64,
// // //     });

// // //     await atsBuild.save();
// // //     console.log(`✅ ATS build saved ${atsBuild._id} — improvement: +${result.analytics.improvementPercent}pts`);

// // //     res.json({
// // //       success:        true,
// // //       id:             atsBuild._id,
// // //       resumeJSON:     result.resumeJSON,
// // //       analytics:      result.analytics,
// // //       githubUsed:     result.githubUsed,
// // //       githubProjects: result.githubProjects,
// // //       pdfBase64:      result.pdfBase64,
// // //     });

// // //   } catch (err) {
// // //     console.error("ATS builder error:", err.message);
// // //     res.status(500).json({ success: false, error: err.message });
// // //   }
// // // });

// // // // ── GET /api/ats-builder/history/:clerkUserId ─────────────────
// // // router.get("/history/:clerkUserId", async (req, res) => {
// // //   try {
// // //     const builds = await ATSBuild
// // //       .find({ clerkUserId: req.params.clerkUserId })
// // //       .sort({ createdAt: -1 })
// // //       .select("-generatedPdfBase64 -originalResumeText -generatedResumeText")
// // //       .limit(20);
// // //     res.json({ success: true, builds });
// // //   } catch (err) {
// // //     res.status(500).json({ success: false, error: err.message, builds: [] });
// // //   }
// // // });

// // // // ── GET /api/ats-builder/pdf/:id ─────────────────────────────
// // // router.get("/pdf/:id", async (req, res) => {
// // //   try {
// // //     const build = await ATSBuild
// // //       .findById(req.params.id)
// // //       .select("generatedPdfBase64 originalResumeFileName");

// // //     if (!build || !build.generatedPdfBase64) {
// // //       return res.status(404).json({ success: false, error: "PDF not found" });
// // //     }

// // //     const buf  = Buffer.from(build.generatedPdfBase64, "base64");
// // //     const name = (build.originalResumeFileName || "resume").replace(/\.[^/.]+$/, "");
// // //     res.setHeader("Content-Type",        "application/pdf");
// // //     res.setHeader("Content-Disposition", `attachment; filename="${name}_ATS_Optimised.pdf"`);
// // //     res.send(buf);
// // //   } catch (err) {
// // //     res.status(500).json({ success: false, error: err.message });
// // //   }
// // // });

// // // // ── DELETE /api/ats-builder/:id ───────────────────────────────
// // // router.delete("/:id", async (req, res) => {
// // //   try {
// // //     await ATSBuild.findByIdAndDelete(req.params.id);
// // //     res.json({ success: true });
// // //   } catch (err) {
// // //     res.status(500).json({ success: false, error: err.message });
// // //   }
// // // });

// // // module.exports = router;




































// // // ══════════════════════════════════════════════════════════════
// // // atsBuilderRoutes.js  — receives JSON (text pre-extracted on client)
// // // POST   /api/ats-builder/build
// // // GET    /api/ats-builder/history/:clerkUserId
// // // GET    /api/ats-builder/pdf/:id
// // // DELETE /api/ats-builder/:id
// // // ══════════════════════════════════════════════════════════════

// // const express            = require("express");
// // const router             = express.Router();
// // const ATSBuild           = require("../models/ATSBuild");
// // const { buildATSResume } = require("../services/atsBuilderService");

// // // ── POST /api/ats-builder/build ───────────────────────────────
// // // Receives JSON body — client already extracted text from PDF/DOCX
// // router.post("/build", async (req, res) => {
// //   try {
// //     const {
// //       clerkUserId,
// //       userName       = "",
// //       userEmail      = "",
// //       resumeText     = "",
// //       resumeFileName = "",
// //       jdText         = "",
// //       githubUsername = "",
// //       groqApiKey     = "",
// //     } = req.body;

// //     // Use key from request body first (sent by client), then server env
// //     if (groqApiKey) process.env.GROQ_API_KEY = groqApiKey;

// //     // ── Validate ──────────────────────────────────────────
// //     if (!clerkUserId) {
// //       return res.status(400).json({ success: false, error: "clerkUserId required" });
// //     }
// //     if (!resumeText || resumeText.trim().length < 50) {
// //       return res.status(400).json({ success: false, error: "Resume text is too short or empty." });
// //     }
// //     if (!jdText || jdText.trim().length < 20) {
// //       return res.status(400).json({ success: false, error: "Job description is required." });
// //     }

// //     console.log(`🔨 ATS build: ${userName || clerkUserId} | ${resumeFileName} | GitHub: ${githubUsername || "none"}`);

// //     // ── Build the ATS resume ──────────────────────────────
// //     const result = await buildATSResume({
// //       resumeText:     resumeText.trim(),
// //       jdText:         jdText.trim(),
// //       githubUsername: githubUsername.trim(),
// //       groqApiKey:     groqApiKey,
// //     });

// //     // ── Save to MongoDB ───────────────────────────────────
// //     const atsBuild = new ATSBuild({
// //       clerkUserId,
// //       userName,
// //       userEmail,
// //       originalResumeFileName: resumeFileName,
// //       jdText:                 jdText.slice(0, 2000),
// //       githubUsername:         githubUsername || "",
// //       githubUsed:             result.githubUsed,
// //       githubProjects:         result.githubProjects,
// //       originalResumeText:     resumeText.slice(0, 5000),
// //       generatedResumeText:    result.generatedResumeText.slice(0, 8000),
// //       analytics:              result.analytics,
// //       generatedPdfBase64:     result.pdfBase64,
// //     });

// //     await atsBuild.save();
// //     console.log(`✅ ATS build saved ${atsBuild._id} — improvement: +${result.analytics.improvementPercent}pts`);

// //     res.json({
// //       success:        true,
// //       id:             atsBuild._id,
// //       resumeJSON:     result.resumeJSON,
// //       analytics:      result.analytics,
// //       githubUsed:     result.githubUsed,
// //       githubProjects: result.githubProjects,
// //       pdfBase64:      result.pdfBase64,
// //     });

// //   } catch (err) {
// //     console.error("ATS builder error:", err.message);
// //     res.status(500).json({ success: false, error: err.message });
// //   }
// // });

// // // ── GET /api/ats-builder/history/:clerkUserId ─────────────────
// // router.get("/history/:clerkUserId", async (req, res) => {
// //   try {
// //     const builds = await ATSBuild
// //       .find({ clerkUserId: req.params.clerkUserId })
// //       .sort({ createdAt: -1 })
// //       .select("-generatedPdfBase64 -originalResumeText -generatedResumeText")
// //       .limit(20);
// //     res.json({ success: true, builds });
// //   } catch (err) {
// //     res.status(500).json({ success: false, error: err.message, builds: [] });
// //   }
// // });

// // // ── GET /api/ats-builder/pdf/:id ─────────────────────────────
// // router.get("/pdf/:id", async (req, res) => {
// //   try {
// //     const build = await ATSBuild
// //       .findById(req.params.id)
// //       .select("generatedPdfBase64 originalResumeFileName");

// //     if (!build || !build.generatedPdfBase64) {
// //       return res.status(404).json({ success: false, error: "PDF not found" });
// //     }

// //     const buf  = Buffer.from(build.generatedPdfBase64, "base64");
// //     const name = (build.originalResumeFileName || "resume").replace(/\.[^/.]+$/, "");
// //     res.setHeader("Content-Type",        "application/pdf");
// //     res.setHeader("Content-Disposition", `attachment; filename="${name}_ATS_Optimised.pdf"`);
// //     res.send(buf);
// //   } catch (err) {
// //     res.status(500).json({ success: false, error: err.message });
// //   }
// // });

// // // ── DELETE /api/ats-builder/:id ───────────────────────────────
// // router.delete("/:id", async (req, res) => {
// //   try {
// //     await ATSBuild.findByIdAndDelete(req.params.id);
// //     res.json({ success: true });
// //   } catch (err) {
// //     res.status(500).json({ success: false, error: err.message });
// //   }
// // });

// // module.exports = router;
























































// // ══════════════════════════════════════════════════════════════
// // atsBuilderRoutes.js  — receives JSON (text pre-extracted on client)
// // POST   /api/ats-builder/build
// // GET    /api/ats-builder/history/:clerkUserId
// // GET    /api/ats-builder/pdf/:id
// // DELETE /api/ats-builder/:id
// // ══════════════════════════════════════════════════════════════

// const express            = require("express");
// const router             = express.Router();
// const ATSBuild           = require("../models/ATSBuild");
// const { buildATSResume } = require("../services/atsBuilderService");

// // ── POST /api/ats-builder/build ───────────────────────────────
// // Receives JSON body — client already extracted text from PDF/DOCX
// router.post("/build", async (req, res) => {
//   try {
//     const {
//       clerkUserId,
//       userName       = "",
//       userEmail      = "",
//       resumeText     = "",
//       resumeFileName = "",
//       jdText         = "",
//       githubUsername = "",
//       groqApiKey     = "",
//     } = req.body;

//     // Use key from request body first (sent by client), then server env
//     if (groqApiKey) process.env.GROQ_API_KEY = groqApiKey;

//     // ── Validate ──────────────────────────────────────────
//     if (!clerkUserId) {
//       return res.status(400).json({ success: false, error: "clerkUserId required" });
//     }
//     if (!resumeText || resumeText.trim().length < 50) {
//       return res.status(400).json({ success: false, error: "Resume text is too short or empty." });
//     }
//     if (!jdText || jdText.trim().length < 20) {
//       return res.status(400).json({ success: false, error: "Job description is required." });
//     }

//     console.log(`🔨 ATS build: ${userName || clerkUserId} | ${resumeFileName} | GitHub: ${githubUsername || "none"}`);

//     // ── Build the ATS resume ──────────────────────────────
//     const result = await buildATSResume({
//       resumeText:     resumeText.trim(),
//       jdText:         jdText.trim(),
//       githubUsername: githubUsername.trim(),
//       groqApiKey:     groqApiKey,
//     });

//     // ── Save to MongoDB ───────────────────────────────────
//     const atsBuild = new ATSBuild({
//       clerkUserId,
//       userName,
//       userEmail,
//       originalResumeFileName: resumeFileName,
//       jdText:                 jdText.slice(0, 2000),
//       githubUsername:         githubUsername || "",
//       githubUsed:             result.githubUsed,
//       githubProjects:         result.githubProjects,
//       originalResumeText:     resumeText.slice(0, 5000),
//       generatedResumeText:    result.generatedResumeText.slice(0, 8000),
//       analytics:              result.analytics,
//       generatedPdfBase64:     result.pdfBase64,
//     });

//     await atsBuild.save();
//     console.log(`✅ ATS build saved ${atsBuild._id} — improvement: +${result.analytics.improvementPercent}pts`);

//     res.json({
//       success:        true,
//       id:             atsBuild._id,
//       resumeJSON:     result.resumeJSON,
//       analytics:      result.analytics,
//       githubUsed:     result.githubUsed,
//       githubProjects: result.githubProjects,
//       pdfBase64:      result.pdfBase64,
//     });

//   } catch (err) {
//     console.error("ATS builder error:", err.message);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// // ── GET /api/ats-builder/history/:clerkUserId ─────────────────
// router.get("/history/:clerkUserId", async (req, res) => {
//   try {
//     const builds = await ATSBuild
//       .find({ clerkUserId: req.params.clerkUserId })
//       .sort({ createdAt: -1 })
//       .select("-generatedPdfBase64 -originalResumeText -generatedResumeText")
//       .limit(20);
//     res.json({ success: true, builds });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message, builds: [] });
//   }
// });

// // ── GET /api/ats-builder/pdf/:id ─────────────────────────────
// router.get("/pdf/:id", async (req, res) => {
//   try {
//     const build = await ATSBuild
//       .findById(req.params.id)
//       .select("generatedPdfBase64 originalResumeFileName");

//     if (!build || !build.generatedPdfBase64) {
//       return res.status(404).json({ success: false, error: "PDF not found" });
//     }

//     const buf  = Buffer.from(build.generatedPdfBase64, "base64");
//     const name = (build.originalResumeFileName || "resume").replace(/\.[^/.]+$/, "");
//     res.setHeader("Content-Type",        "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename="${name}_ATS_Optimised.pdf"`);
//     res.send(buf);
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// // ── DELETE /api/ats-builder/:id ───────────────────────────────
// router.delete("/:id", async (req, res) => {
//   try {
//     await ATSBuild.findByIdAndDelete(req.params.id);
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// module.exports = router;









































// ══════════════════════════════════════════════════════════════
// atsBuilderRoutes.js  — receives JSON (text pre-extracted on client)
// POST   /api/ats-builder/build
// GET    /api/ats-builder/history/:clerkUserId
// GET    /api/ats-builder/pdf/:id
// DELETE /api/ats-builder/:id
// ══════════════════════════════════════════════════════════════

const express            = require("express");
const router             = express.Router();
const ATSBuild           = require("../models/ATSBuild");
const { buildATSResume } = require("../services/atsBuilderService");

// ── POST /api/ats-builder/build ───────────────────────────────
// Receives JSON body — client already extracted text from PDF/DOCX
router.post("/build", async (req, res) => {
  try {
    const {
      clerkUserId,
      userName       = "",
      userEmail      = "",
      resumeText     = "",
      resumeFileName = "",
      jdText         = "",
      githubUsername = "",
      groqApiKey     = "",
    } = req.body;

    // Use key from request body first (sent by client), then server env
    if (groqApiKey) process.env.GROQ_API_KEY = groqApiKey;

    // ── Validate ──────────────────────────────────────────
    if (!clerkUserId) {
      return res.status(400).json({ success: false, error: "clerkUserId required" });
    }
    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ success: false, error: "Resume text is too short or empty." });
    }
    if (!jdText || jdText.trim().length < 20) {
      return res.status(400).json({ success: false, error: "Job description is required." });
    }

    console.log(`🔨 ATS build: ${userName || clerkUserId} | ${resumeFileName} | GitHub: ${githubUsername || "none"}`);

    // ── Build the ATS resume ──────────────────────────────
    const result = await buildATSResume({
      resumeText:     resumeText.trim(),
      jdText:         jdText.trim(),
      githubUsername: githubUsername.trim(),
      groqApiKey:     groqApiKey,
    });

    // ── Save to MongoDB ───────────────────────────────────
    const atsBuild = new ATSBuild({
      clerkUserId,
      userName,
      userEmail,
      originalResumeFileName: resumeFileName,
      jdText:                 jdText.slice(0, 2000),
      githubUsername:         githubUsername || "",
      githubUsed:             result.githubUsed,
      githubProjects:         result.githubProjects,
      originalResumeText:     resumeText.slice(0, 5000),
      generatedResumeText:    result.generatedResumeText.slice(0, 8000),
      analytics:              result.analytics,
      generatedPdfBase64:     result.pdfBase64,
    });

    await atsBuild.save();
    console.log(`✅ ATS build saved ${atsBuild._id} — improvement: +${result.analytics.improvementPercent}pts`);

    res.json({
      success:        true,
      id:             atsBuild._id,
      resumeJSON:     result.resumeJSON,
      analytics:      result.analytics,
      githubUsed:     result.githubUsed,
      githubProjects: result.githubProjects,
      pdfBase64:      result.pdfBase64,
    });

  } catch (err) {
    console.error("ATS builder error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/ats-builder/history/:clerkUserId ─────────────────
router.get("/history/:clerkUserId", async (req, res) => {
  try {
    const builds = await ATSBuild
      .find({ clerkUserId: req.params.clerkUserId })
      .sort({ createdAt: -1 })
      .select("-generatedPdfBase64 -originalResumeText -generatedResumeText")
      .limit(20);
    res.json({ success: true, builds });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, builds: [] });
  }
});

// ── GET /api/ats-builder/pdf/:id ─────────────────────────────
router.get("/pdf/:id", async (req, res) => {
  try {
    const build = await ATSBuild
      .findById(req.params.id)
      .select("generatedPdfBase64 originalResumeFileName");

    if (!build || !build.generatedPdfBase64) {
      return res.status(404).json({ success: false, error: "PDF not found" });
    }

    const buf  = Buffer.from(build.generatedPdfBase64, "base64");
    const name = (build.originalResumeFileName || "resume").replace(/\.[^/.]+$/, "");
    res.setHeader("Content-Type",        "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${name}_ATS_Optimised.pdf"`);
    res.send(buf);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/ats-builder/:id ───────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    await ATSBuild.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;