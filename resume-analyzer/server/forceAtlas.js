const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;

  // Insert a test document into analyses
  await db.collection("analyses").insertOne({
    clerkUserId:    "test_user",
    userName:       "Test User",
    userEmail:      "test@test.com",
    resumeFileName: "test_resume.pdf",
    overallScore:   85,
    candidateName:  "Test Candidate",
    githubUsername: "testuser",
    githubMetrics:  { trustScore: 75 },
    linkedinMetrics:{},
    analysisData:   { verdict: "Test document — safe to delete" },
    createdAt:      new Date(),
  });

  // Insert a test document into linkedins
  await db.collection("linkedins").insertOne({
    clerkUserId:     "test_user",
    userName:        "Test User",
    userEmail:       "test@test.com",
    linkedinUrl:     "https://linkedin.com/in/test",
    jobRole:         "Developer",
    overallScore:    80,
    linkedinMetrics: { overallLinkedInScore: 80 },
    createdAt:       new Date(),
  });

  const analysesCount  = await db.collection("analyses").countDocuments();
  const linkedinsCount = await db.collection("linkedins").countDocuments();

  console.log("✅ Test documents inserted!");
  console.log("📦 Database:", db.databaseName);
  console.log("📄 analyses collection:", analysesCount, "documents");
  console.log("💼 linkedins collection:", linkedinsCount, "documents");
  console.log("");
  console.log("👉 Now go to Atlas and click Refresh");
  console.log("👉 Look for database:", db.databaseName);

  process.exit();
});