const mongoose = require("mongoose");

const atsBuildSchema = new mongoose.Schema({
  // User info
  clerkUserId:      { type: String, required: true },
  userName:         { type: String, default: "" },
  userEmail:        { type: String, default: "" },

  // Input files metadata
  originalResumeFileName: { type: String, default: "" },
  jdText:                 { type: String, default: "" },
  jdFileName:             { type: String, default: "" }, // if uploaded as file

  // GitHub info used
  githubUsername:   { type: String, default: "" },
  githubUsed:       { type: Boolean, default: false },
  githubProjects:   { type: [String], default: [] },

  // The original resume text (extracted)
  originalResumeText: { type: String, default: "" },

  // The generated ATS resume
  generatedResumeText: { type: String, default: "" },

  // What was added/changed (analytics)
  analytics: {
    addedSkills:        { type: [String], default: [] },
    addedKeywords:      { type: [String], default: [] },
    addedProjects:      { type: [String], default: [] },
    addedAchievements:  { type: [String], default: [] },
    addedCertifications:{ type: [String], default: [] },
    enhancedSections:   { type: [String], default: [] },
    originalATSScore:   { type: Number,   default: 0  },
    newATSScore:        { type: Number,   default: 0  },
    improvementPercent: { type: Number,   default: 0  },
    totalChanges:       { type: Number,   default: 0  },
    sourceBreakdown: {
      fromGitHub:       { type: Number, default: 0 },
      fromOriginalResume:{ type: Number, default: 0 },
      aiGenerated:      { type: Number, default: 0 },
    },
  },

  // PDF stored as base64 (for download)
  generatedPdfBase64: { type: String, default: "" },

  createdAt: { type: Date, default: Date.now },
});

atsBuildSchema.index({ clerkUserId: 1, createdAt: -1 });

module.exports = mongoose.model("ATSBuild", atsBuildSchema);



