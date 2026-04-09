// ══════════════════════════════════════════════════════════════
// mentorRoutes.js
// POST /api/mentor/start        — start session, get initial insights
// POST /api/mentor/chat         — send message, get AI reply
// GET  /api/mentor/history/:uid — all sessions for user
// GET  /api/mentor/:id          — single session with all messages
// GET  /api/mentor/pdf/:id      — download chat as PDF
// DELETE /api/mentor/:id        — delete session
// ══════════════════════════════════════════════════════════════

"use strict";

const express    = require("express");
const router     = express.Router();
const PDFDocument = require("pdfkit");
const MentorChat = require("../models/MentorChat");

// ── Groq helper (same pattern as rest of codebase) ────────────
async function groqCall(messages, apiKey, maxTokens = 1200) {
  const key = apiKey || process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not set.");

  const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      let res;
      try {
        res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${key}`,
          },
          body: JSON.stringify({ model, messages, temperature: 0.5, max_tokens: maxTokens }),
        });
      } catch (e) {
        throw new Error("Network error: " + e.message);
      }

      if (res.ok) {
        const data = await res.json();
        const txt  = data?.choices?.[0]?.message?.content || "";
        if (txt.length > 10) return txt;
        break;
      }
      if (res.status === 429) {
        const wait = (attempt + 1) * 12000;
        console.warn(`Groq 429, waiting ${wait / 1000}s...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      let msg = `Groq ${res.status}`;
      try { const b = await res.json(); msg = b?.error?.message || msg; } catch {}
      console.warn(`Groq error on ${model}: ${msg}`);
      break;
    }
  }
  throw new Error("Groq API unavailable. Please try again.");
}

function parseJSON(raw) {
  try {
    let clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const s = clean.indexOf("{"), e = clean.lastIndexOf("}");
    if (s === -1 || e === -1) return null;
    clean = clean.slice(s, e + 1);
    try { return JSON.parse(clean); } catch {}
    return JSON.parse(clean.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]"));
  } catch { return null; }
}

// ── Build the system prompt for the mentor ────────────────────
function buildSystemPrompt(resumeText, jdText, insights) {
  return `You are an expert AI career mentor and coach with 20 years of experience in tech hiring, career development, and skills coaching.

CANDIDATE'S RESUME SUMMARY:
${resumeText.slice(0, 1500)}

TARGET JOB DESCRIPTION:
${jdText.slice(0, 800)}

ANALYSIS OF THIS CANDIDATE:
- Target Role: ${insights.targetRole || "Software Engineer"}
- Experience Level: ${insights.experienceLevel || "Mid-level"}
- Current JD Fit Score: ${insights.overallFitScore}/100
- Skills they HAVE: ${(insights.presentSkills || []).slice(0, 10).join(", ")}
- Skills they're MISSING for this JD: ${(insights.missingSkills || []).slice(0, 10).join(", ")}
- Keyword gaps: ${(insights.keywordGaps || []).slice(0, 8).join(", ")}
- Possible career paths: ${(insights.careerPaths || []).join(", ")}

YOUR ROLE AS MENTOR:
1. Be warm, encouraging and specific — never generic
2. When listing skills to learn, always include HOW to learn them (specific resources, projects, timelines)
3. Give actionable steps, not vague advice
4. Reference their ACTUAL resume details and the JD when giving advice
5. For every missing skill, suggest: best free resource + a project idea to practice it
6. Help them understand realistic career timelines
7. Keep responses focused and well-structured with clear sections
8. Use markdown formatting: **bold**, bullet points, numbered lists
9. Never repeat the same advice twice in a conversation
10. If asked about salary, interview prep, or career paths — give real, specific advice`;
}

// ══════════════════════════════════════════════════════════════
// POST /api/mentor/start
// Body: { clerkUserId, userName, userEmail, resumeText, resumeFileName, jdText, groqApiKey }
// Returns: { success, sessionId, insights, welcomeMessage }
// ══════════════════════════════════════════════════════════════
router.post("/start", async (req, res) => {
  try {
    const {
      clerkUserId, userName = "", userEmail = "",
      resumeText = "", resumeFileName = "", jdText = "",
      groqApiKey = "",
    } = req.body;

    if (!clerkUserId) return res.status(400).json({ success: false, error: "clerkUserId required" });
    if (!resumeText || resumeText.trim().length < 50)
      return res.status(400).json({ success: false, error: "Resume text required (min 50 chars)" });
    if (!jdText || jdText.trim().length < 20)
      return res.status(400).json({ success: false, error: "Job description required" });

    // ── Step 1: Extract career insights ───────────────────
    const insightPrompt = `Analyze this resume against the job description. Return ONLY valid JSON.

RESUME:
${resumeText.slice(0, 2000)}

JOB DESCRIPTION:
${jdText.slice(0, 800)}

Return this exact JSON:
{
  "missingSkills": ["skill1","skill2","skill3","skill4","skill5"],
  "presentSkills": ["skill1","skill2","skill3","skill4","skill5"],
  "keywordGaps": ["keyword1","keyword2","keyword3"],
  "careerPaths": ["path1","path2","path3"],
  "experienceLevel": "Junior/Mid/Senior",
  "targetRole": "exact role title from JD",
  "overallFitScore": 65,
  "topStrengths": ["strength1","strength2","strength3"],
  "criticalGaps": ["gap1","gap2","gap3"],
  "estimatedTimeToReady": "3-6 months with focused learning"
}`;

    const insightRaw = await groqCall(
      [
        { role: "system", content: "You are a career analysis expert. Return only valid JSON." },
        { role: "user",   content: insightPrompt },
      ],
      groqApiKey, 800
    );

    const insights = parseJSON(insightRaw) || {
      missingSkills: [], presentSkills: [], keywordGaps: [],
      careerPaths: [], experienceLevel: "Mid-level",
      targetRole: "Software Engineer", overallFitScore: 60,
      topStrengths: [], criticalGaps: [], estimatedTimeToReady: "3-6 months",
    };

    // ── Step 2: Generate welcome message ──────────────────
    const welcomePrompt = `${buildSystemPrompt(resumeText, jdText, insights)}

This is the START of a mentorship session. Write a personalized welcome message that:
1. Addresses the candidate by analyzing their background
2. States their current fit score (${insights.overallFitScore}/100) and what it means
3. Lists their TOP 3 strengths from their resume (be specific, reference real details)
4. Lists the TOP 3 most critical missing skills for this specific JD
5. Gives them an encouraging roadmap overview
6. Ends by asking what they want to focus on first

Be warm, specific, and actionable. Use markdown formatting. Keep it under 400 words.`;

    const welcomeMsg = await groqCall(
      [
        { role: "system", content: "You are an expert AI career mentor. Be warm, specific and actionable." },
        { role: "user",   content: welcomePrompt },
      ],
      groqApiKey, 1000
    );

    // ── Step 3: Save session to MongoDB ───────────────────
    const session = new MentorChat({
      clerkUserId, userName, userEmail,
      resumeFileName, jdText: jdText.slice(0, 2000),
      resumeText: resumeText.slice(0, 4000),
      insights: {
        missingSkills:   insights.missingSkills   || [],
        presentSkills:   insights.presentSkills   || [],
        careerPaths:     insights.careerPaths     || [],
        keywordGaps:     insights.keywordGaps     || [],
        experienceLevel: insights.experienceLevel || "",
        targetRole:      insights.targetRole      || "",
        overallFitScore: insights.overallFitScore || 0,
      },
      messages: [{ role: "assistant", content: welcomeMsg }],
      totalMessages: 1,
    });

    await session.save();
    console.log(`✅ Mentor session started: ${session._id} for ${userName || clerkUserId}`);

    res.json({
      success: true,
      sessionId:      session._id,
      insights:       { ...insights, estimatedTimeToReady: insights.estimatedTimeToReady },
      welcomeMessage: welcomeMsg,
    });

  } catch (err) {
    console.error("Mentor start error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/mentor/chat
// Body: { sessionId, message, groqApiKey }
// Returns: { success, reply }
// ══════════════════════════════════════════════════════════════
router.post("/chat", async (req, res) => {
  try {
    const { sessionId, message, groqApiKey = "" } = req.body;

    if (!sessionId) return res.status(400).json({ success: false, error: "sessionId required" });
    if (!message || message.trim().length === 0)
      return res.status(400).json({ success: false, error: "Message cannot be empty" });

    // Load session
    const session = await MentorChat.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, error: "Session not found" });

    // Build conversation history for Groq (last 12 messages to stay within context)
    const systemPrompt = buildSystemPrompt(session.resumeText, session.jdText, session.insights);
    const recentMessages = session.messages.slice(-12).map(m => ({
      role:    m.role,
      content: m.content,
    }));

    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...recentMessages,
      { role: "user",   content: message.trim() },
    ];

    // Get AI reply
    const reply = await groqCall(groqMessages, groqApiKey, 1200);

    // Save both messages to session
    session.messages.push({ role: "user",      content: message.trim() });
    session.messages.push({ role: "assistant", content: reply });
    session.totalMessages = session.messages.length;
    session.updatedAt     = new Date();
    await session.save();

    res.json({ success: true, reply });

  } catch (err) {
    console.error("Mentor chat error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /api/mentor/history/:clerkUserId
// ══════════════════════════════════════════════════════════════
router.get("/history/:clerkUserId", async (req, res) => {
  try {
    const sessions = await MentorChat
      .find({ clerkUserId: req.params.clerkUserId })
      .sort({ updatedAt: -1 })
      .select("-messages -resumeText")
      .limit(20);
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, sessions: [] });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /api/mentor/:id  — full session with messages
// ══════════════════════════════════════════════════════════════
router.get("/:id", async (req, res) => {
  try {
    const session = await MentorChat.findById(req.params.id).select("-resumeText");
    if (!session) return res.status(404).json({ success: false, error: "Session not found" });
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /api/mentor/pdf/:id  — download full chat as PDF
// ══════════════════════════════════════════════════════════════
router.get("/pdf/:id", async (req, res) => {
  try {
    const session = await MentorChat.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, error: "Session not found" });

    const doc  = new PDFDocument({ margin: 50, size: "A4" });
    const bufs = [];
    doc.on("data", c => bufs.push(c));
    doc.on("end",  () => {
      const buf  = Buffer.concat(bufs);
      const name = `Career_Mentorship_Chat_${new Date(session.createdAt).toISOString().slice(0,10)}.pdf`;
      res.setHeader("Content-Type",        "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
      res.send(buf);
    });

    const PW   = doc.page.width - 100;
    const safe = s => (s || "").replace(/[^\x00-\x7F]/g, "");

    // ── Cover page ──
    doc.rect(0, 0, doc.page.width, 120).fill("#0f0c29");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(22)
      .text("Career Mentorship Chat Report", 50, 30);
    doc.fillColor("#c4b5fd").font("Helvetica").fontSize(12)
      .text(`Candidate: ${safe(session.userName || "User")}`, 50, 60);
    doc.fillColor("#93c5fd").font("Helvetica").fontSize(10)
      .text(`Role: ${safe(session.insights.targetRole)} | Fit Score: ${session.insights.overallFitScore}/100 | Messages: ${session.totalMessages}`, 50, 80);
    doc.fillColor("#6ee7b7").font("Helvetica").fontSize(9)
      .text(`Session date: ${new Date(session.createdAt).toLocaleDateString("en-IN", { year:"numeric",month:"long",day:"numeric" })}`, 50, 100);

    doc.y = 140;

    // ── Insights summary ──
    doc.fillColor("#1e3a5f").font("Helvetica-Bold").fontSize(12).text("CAREER INSIGHTS SUMMARY");
    doc.moveTo(50, doc.y + 2).lineTo(50 + PW, doc.y + 2).strokeColor("#2563eb").lineWidth(0.8).stroke();
    doc.moveDown(0.5);

    const insightRow = (label, val, color = "#374151") => {
      doc.fillColor("#6b7280").font("Helvetica").fontSize(9)
        .text(label + ": ", { continued: true });
      doc.fillColor(color).font("Helvetica-Bold").fontSize(9)
        .text(safe(String(val)), { lineGap: 3 });
    };

    insightRow("Target Role",        session.insights.targetRole,      "#2563eb");
    insightRow("Experience Level",   session.insights.experienceLevel, "#374151");
    insightRow("Overall Fit Score",  `${session.insights.overallFitScore}/100`,
      session.insights.overallFitScore >= 70 ? "#059669" : session.insights.overallFitScore >= 50 ? "#d97706" : "#dc2626");
    insightRow("Skills Present",     (session.insights.presentSkills || []).join(", "), "#059669");
    insightRow("Skills to Develop",  (session.insights.missingSkills || []).join(", "), "#dc2626");
    insightRow("Career Paths",       (session.insights.careerPaths   || []).join(", "), "#7c3aed");

    doc.moveDown(1);

    // ── Conversation ──
    doc.fillColor("#1e3a5f").font("Helvetica-Bold").fontSize(12).text("FULL MENTORSHIP CONVERSATION");
    doc.moveTo(50, doc.y + 2).lineTo(50 + PW, doc.y + 2).strokeColor("#2563eb").lineWidth(0.8).stroke();
    doc.moveDown(0.5);

    session.messages.forEach((msg, i) => {
      const isUser  = msg.role === "user";
      const boxCol  = isUser ? "#eff6ff" : "#f0fdf4";
      const txtCol  = isUser ? "#1e40af" : "#065f46";
      const label   = isUser ? "YOU" : "AI MENTOR";
      const time    = new Date(msg.timestamp).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });

      // Label
      doc.fillColor(isUser ? "#2563eb" : "#059669")
        .font("Helvetica-Bold").fontSize(8)
        .text(`${label}  ${time}`, { lineGap: 2 });

      // Strip markdown for PDF
      const cleanContent = safe(msg.content)
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/#{1,3}\s/g, "")
        .replace(/`(.+?)`/g, "$1")
        .trim();

      // Message box
      const msgY    = doc.y;
      const lineH   = 11;
      const lines   = Math.ceil(cleanContent.length / 90) + (cleanContent.match(/\n/g) || []).length;
      const boxH    = Math.max(lines * lineH, 20) + 10;

      doc.rect(50, msgY, PW, boxH).fill(boxCol);
      doc.fillColor(txtCol).font("Helvetica").fontSize(8.5)
        .text(cleanContent, 56, msgY + 5, { width: PW - 12, lineGap: 2 });

      doc.y = msgY + boxH + 8;

      // Page overflow check
      if (doc.y > doc.page.height - 80) doc.addPage();
    });

    // Footer
    doc.moveDown(1);
    doc.fillColor("#9ca3af").font("Helvetica").fontSize(8)
      .text(`Generated by ResumeAI Career Mentor  |  ${new Date().toLocaleDateString()}`, { align: "center" });

    doc.end();

  } catch (err) {
    console.error("Mentor PDF error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// DELETE /api/mentor/:id
// ══════════════════════════════════════════════════════════════
router.delete("/:id", async (req, res) => {
  try {
    await MentorChat.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;




