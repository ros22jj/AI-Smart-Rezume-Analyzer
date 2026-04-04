const mongoose = require("mongoose");

const linkedinSchema = new mongoose.Schema({
  clerkUserId:      { type: String, default: "guest" },
  userName:         { type: String, default: "" },
  userEmail:        { type: String, default: "" },
  linkedinUrl:      { type: String, default: "" },
  jobRole:          { type: String, default: "" },
  overallScore:     { type: Number, default: 0 },
  linkedinMetrics:  { type: Object, default: {} },
  resumeScore:      { type: Number, default: null },
  createdAt:        { type: Date,   default: Date.now },
});

module.exports = mongoose.model("LinkedIn", linkedinSchema);