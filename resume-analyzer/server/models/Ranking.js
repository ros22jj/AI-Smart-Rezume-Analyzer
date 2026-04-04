const mongoose = require("mongoose");

const resumeEntrySchema = new mongoose.Schema({
  fileName:       { type: String, default: "" },
  candidateName:  { type: String, default: "" },
  rank:           { type: Number, default: 0 },
  compositeScore: { type: Number, default: 0 },
  atsScore:       { type: Number, default: 0 },
  githubScore:    { type: Number, default: null },
  linkedinScore:  { type: Number, default: null },
  githubUsername: { type: String, default: "" },
  skills:         { type: [String], default: [] },
  improvements:   { type: [String], default: [] },
  // Full breakdowns
  atsScores:      { type: Object, default: {} },
  githubMetrics:  { type: Object, default: {} },
  linkedinMetrics:{ type: Object, default: {} },
  topStrengths:   { type: [String], default: [] },
  verdict:        { type: String, default: "" },
}, { _id: false });

const rankingSchema = new mongoose.Schema({
  clerkUserId:    { type: String, required: true },
  userName:       { type: String, default: "" },
  userEmail:      { type: String, default: "" },
  sessionId:      { type: String, required: true, unique: true },
  jobDescription: { type: String, default: "" },
  totalResumes:   { type: Number, default: 0 },
  resumes:        { type: [resumeEntrySchema], default: [] },
  winner: {
    fileName:       { type: String, default: "" },
    candidateName:  { type: String, default: "" },
    compositeScore: { type: Number, default: 0 },
    atsScore:       { type: Number, default: 0 },
    githubScore:    { type: Number, default: null },
    githubUsername: { type: String, default: "" },
  },
  createdAt: { type: Date, default: Date.now },
});

// Index for fast user-based queries
rankingSchema.index({ clerkUserId: 1, createdAt: -1 });

module.exports = mongoose.model("Ranking", rankingSchema);