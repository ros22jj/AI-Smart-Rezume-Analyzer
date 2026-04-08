// const mongoose = require("mongoose");

// const analysisSchema = new mongoose.Schema({
//   clerkUserId:    { type: String, required: true },
//   userName:       { type: String, default: "" },
//   userEmail:      { type: String, default: "" },
//   resumeFileName: { type: String, default: "" },
//   resumeFilePath: { type: String, default: "" },
//   overallScore:   { type: Number, default: 0 },
//   candidateName:  { type: String, default: "" },
//   githubUsername: { type: String, default: "" },
//   githubMetrics:  { type: Object, default: {} },
//   analysisData:   { type: Object, default: {} },
//   createdAt:      { type: Date,   default: Date.now },
// });

// module.exports = mongoose.model("Analysis", analysisSchema);








  const mongoose = require("mongoose");

  const analysisSchema = new mongoose.Schema({
    clerkUserId:    { type: String, required: true },
    userName:       { type: String, default: "" },
    userEmail:      { type: String, default: "" },
    resumeFileName: { type: String, default: "" },
    resumeFilePath: { type: String, default: "" },
    overallScore:   { type: Number, default: 0 },
    candidateName:  { type: String, default: "" },
    githubUsername: { type: String, default: "" },
    githubMetrics:   { type: Object, default: {} },
    linkedinMetrics: { type: Object, default: {} },  // ← added
    analysisData:    { type: Object, default: {} },
    createdAt:      { type: Date,   default: Date.now },
  });

  module.exports = mongoose.model("Analysis", analysisSchema);