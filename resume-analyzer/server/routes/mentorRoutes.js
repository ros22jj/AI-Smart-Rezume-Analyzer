// // // ══════════════════════════════════════════════════════════════
// // // mentorRoutes.js — Career Mentor API
// // // POST /api/mentor/start   → create session with resume + JD
// // // POST /api/mentor/chat    → send a message, get AI reply
// // // GET  /api/mentor/history/:sessionId  → fetch full chat
// // // GET  /api/mentor/pdf/:sessionId      → download chat as PDF
// // // DELETE /api/mentor/:sessionId        → delete session
// // // ══════════════════════════════════════════════════════════════

// // const express    = require("express");
// // const router     = express.Router();
// // const { v4: uuidv4 } = require("uuid");
// // const PDFDocument = require("pdfkit");
// // const MentorChat  = require("../models/MentorChat");
// // const fetch = require("node-fetch");

// // // ── Groq helper with retry + model fallback ──────────────────
// // async function callGroq({ apiKey, messages, systemPrompt, maxTokens = 1000 }) {
// //   const key = apiKey || process.env.GROQ_API_KEY;
// //   if (!key) throw new Error("GROQ_API_KEY not configured");

// //   const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

// //   for (const model of models) {
// //     for (let attempt = 1; attempt <= 2; attempt++) {
// //       try {
// //         const body = {
// //           model,
// //           max_tokens: maxTokens,
// //           messages: systemPrompt
// //             ? [{ role: "system", content: systemPrompt }, ...messages]
// //             : messages,
// //         };

// //         const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
// //           method: "POST",
// //           headers: {
// //             "Content-Type":  "application/json",
// //             "Authorization": `Bearer ${key}`,
// //           },
// //           body: JSON.stringify(body),
// //         });

// //         if (!res.ok) {
// //           const errText = await res.text();
// //           // Rate limited — try next model
// //           if (res.status === 429) break;
// //           throw new Error(`Groq error ${res.status}: ${errText}`);
// //         }

// //         const data = await res.json();
// //         return data.choices?.[0]?.message?.content?.trim() || "";
// //       } catch (err) {
// //         if (attempt === 2) {
// //           console.warn(`⚠️ Groq model ${model} failed: ${err.message}`);
// //           break; // try next model
// //         }
// //         await new Promise((r) => setTimeout(r, 1000 * attempt));
// //       }
// //     }
// //   }

// //   throw new Error("All Groq models failed. Please check your API key and try again.");
// // }

// // // ── Build career context from resume text ────────────────────
// // function extractCareerContext(resumeText, jobDescription) {
// //   const text = resumeText.toLowerCase();

// //   const skills = [];
// //   const techList = [
// //     "javascript","typescript","python","java","react","node.js","express",
// //     "mongodb","postgresql","mysql","redis","docker","kubernetes","aws","azure",
// //     "gcp","git","html","css","vue","angular","next.js","graphql","rest api",
// //     "c++","c#","go","rust","flutter","swift","kotlin","tensorflow","pytorch",
// //     "machine learning","deep learning","sql","linux","ci/cd","terraform",
// //   ];
// //   techList.forEach((t) => { if (text.includes(t)) skills.push(t); });

// //   const hasExperience = /experience|work history|employment/i.test(resumeText);
// //   const hasEducation  = /education|university|college|degree|b\.tech|bachelor/i.test(resumeText);
// //   const hasProjects   = /project|built|developed|created/i.test(resumeText);

// //   // Rough YOE estimation
// //   const yearMatches = resumeText.match(/\b(20\d{2})\b/g) || [];
// //   const years       = yearMatches.map(Number).filter((y) => y >= 2010 && y <= new Date().getFullYear());
// //   const estimatedYOE = years.length >= 2
// //     ? Math.min(new Date().getFullYear() - Math.min(...years), 15)
// //     : 0;

// //   return {
// //     skills: skills.slice(0, 15),
// //     hasExperience, hasEducation, hasProjects,
// //     estimatedYOE,
// //     jobTitle: jobDescription
// //       ? jobDescription.match(/(?:job title|position|role)[:\s]+([^\n.]+)/i)?.[1]?.trim() || ""
// //       : "",
// //   };
// // }

// // // ── Build system prompt for mentor ──────────────────────────
// // function buildSystemPrompt(careerContext, resumeText, jobDescription) {
// //   const { skills, estimatedYOE, jobTitle } = careerContext;

// //   return `You are an expert AI Career Mentor with deep expertise in tech recruiting, resume optimization, and career development. You are having a one-on-one mentoring session with a candidate.

// // CANDIDATE PROFILE:
// // - Resume Skills: ${skills.join(", ") || "Not specified"}
// // - Estimated Experience: ~${estimatedYOE} year(s)
// // ${jobTitle ? `- Target Role: ${jobTitle}` : ""}
// // ${jobDescription ? `\nTARGET JOB DESCRIPTION (first 800 chars):\n${jobDescription.slice(0, 800)}` : ""}

// // RESUME SUMMARY (first 1500 chars):
// // ${resumeText.slice(0, 1500)}

// // YOUR ROLE:
// // - Give honest, specific, actionable career advice
// // - Focus on practical steps the candidate can take TODAY
// // - Be warm, encouraging but brutally honest about gaps
// // - Reference their actual skills and experience in your answers
// // - Keep responses concise (3-5 sentences max unless a detailed breakdown is asked)
// // - Use bullet points sparingly, only when listing multiple items
// // - Never make up information about the candidate — base everything on their resume`;
// // }

// // // ══════════════════════════════════════════════════════════════
// // // POST /api/mentor/start
// // // Body: { resumeText, jobDescription OR jdText (optional),
// // //         clerkUserId, userName, userEmail, groqApiKey }
// // // ══════════════════════════════════════════════════════════════
// // router.post("/start", async (req, res) => {
// //   try {
// //     const {
// //       resumeText,
// //       // Accept both field names — old code sent "jdText", new sends "jobDescription"
// //       jobDescription, jdText,
// //       clerkUserId = "guest", userName = "", userEmail = "",
// //       groqApiKey,
// //     } = req.body;

// //     // JD is always optional
// //     const resolvedJD = (jobDescription || jdText || "").trim();

// //     if (!resumeText || resumeText.trim().length < 50) {
// //       return res.status(400).json({ success: false, error: "Resume text is too short. Please provide a proper resume." });
// //     }

// //     const sessionId     = uuidv4();
// //     const trimmedResume = resumeText.trim().slice(0, 4000);
// //     const trimmedJD     = resolvedJD.slice(0, 2000);
// //     const careerContext = extractCareerContext(trimmedResume, trimmedJD);

// //     // Generate a personalised welcome message
// //     const systemPrompt = buildSystemPrompt(careerContext, trimmedResume, trimmedJD);
// //     const welcomeMsg   = await callGroq({
// //       apiKey: groqApiKey,
// //       messages: [{
// //         role: "user",
// //         content: `I've just uploaded my resume${trimmedJD ? " and a job description I'm targeting" : ""}. Please give me a brief, encouraging welcome and your top 2-3 observations about my profile. End with one focused question to start our session.`,
// //       }],
// //       systemPrompt,
// //       maxTokens: 400,
// //     });

// //     // Persist session
// //     const session = new MentorChat({
// //       sessionId,
// //       clerkUserId,
// //       userName,
// //       userEmail,
// //       resumeText:    trimmedResume,
// //       jobDescription: trimmedJD,
// //       careerContext,
// //       messages: [{ role: "assistant", content: welcomeMsg }],
// //     });
// //     await session.save();

// //     console.log(`✅ Mentor session created: ${sessionId} — user: ${clerkUserId}`);
// //     res.json({
// //       success: true,
// //       sessionId,
// //       welcomeMessage: welcomeMsg,
// //       careerContext,
// //     });

// //   } catch (err) {
// //     console.error("Mentor /start error:", err.message);
// //     res.status(500).json({ success: false, error: err.message });
// //   }
// // });

// // // ══════════════════════════════════════════════════════════════
// // // POST /api/mentor/chat
// // // Body: { sessionId, message, groqApiKey }
// // // ══════════════════════════════════════════════════════════════
// // router.post("/chat", async (req, res) => {
// //   try {
// //     const { sessionId, message, groqApiKey } = req.body;

// //     if (!sessionId) return res.status(400).json({ success: false, error: "sessionId required" });
// //     if (!message  ) return res.status(400).json({ success: false, error: "message required" });

// //     const session = await MentorChat.findOne({ sessionId });
// //     if (!session) return res.status(404).json({ success: false, error: "Session not found. Please start a new session." });

// //     // Build conversation history (last 12 messages to stay within context)
// //     const recentMessages = session.messages.slice(-12).map((m) => ({
// //       role:    m.role,
// //       content: m.content,
// //     }));
// //     recentMessages.push({ role: "user", content: message });

// //     const systemPrompt = buildSystemPrompt(
// //       session.careerContext,
// //       session.resumeText,
// //       session.jobDescription
// //     );

// //     const reply = await callGroq({
// //       apiKey: groqApiKey,
// //       messages: recentMessages,
// //       systemPrompt,
// //       maxTokens: 600,
// //     });

// //     // Save both user message and assistant reply
// //     session.messages.push({ role: "user",      content: message });
// //     session.messages.push({ role: "assistant", content: reply   });
// //     await session.save();

// //     res.json({ success: true, reply, sessionId });

// //   } catch (err) {
// //     console.error("Mentor /chat error:", err.message);
// //     res.status(500).json({ success: false, error: err.message });
// //   }
// // });

// // // ══════════════════════════════════════════════════════════════
// // // GET /api/mentor/history/:sessionId
// // // ══════════════════════════════════════════════════════════════
// // router.get("/history/:sessionId", async (req, res) => {
// //   try {
// //     const session = await MentorChat.findOne({ sessionId: req.params.sessionId });
// //     if (!session) return res.status(404).json({ success: false, error: "Session not found" });

// //     res.json({
// //       success:       true,
// //       sessionId:     session.sessionId,
// //       messages:      session.messages,
// //       careerContext: session.careerContext,
// //       createdAt:     session.createdAt,
// //     });
// //   } catch (err) {
// //     res.status(500).json({ success: false, error: err.message });
// //   }
// // });

// // // ══════════════════════════════════════════════════════════════
// // // GET /api/mentor/pdf/:sessionId
// // // ══════════════════════════════════════════════════════════════
// // router.get("/pdf/:sessionId", async (req, res) => {
// //   try {
// //     const session = await MentorChat.findOne({ sessionId: req.params.sessionId });
// //     if (!session) return res.status(404).json({ success: false, error: "Session not found" });

// //     const doc = new PDFDocument({ margin: 50, size: "A4" });
// //     res.setHeader("Content-Type", "application/pdf");
// //     res.setHeader(
// //       "Content-Disposition",
// //       `attachment; filename="career-mentor-session-${session.sessionId.slice(0, 8)}.pdf"`
// //     );
// //     doc.pipe(res);

// //     // ── Header ──
// //     doc.fontSize(22).font("Helvetica-Bold").text("Career Mentor Session", { align: "center" });
// //     doc.moveDown(0.3);
// //     doc.fontSize(11).font("Helvetica").fillColor("#555555")
// //       .text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, { align: "center" });
// //     if (session.userName) {
// //       doc.text(`Candidate: ${session.userName}`, { align: "center" });
// //     }
// //     doc.moveDown(1);

// //     // ── Career context box ──
// //     if (session.careerContext?.skills?.length) {
// //       doc.fontSize(13).font("Helvetica-Bold").fillColor("#1a1a1a").text("Profile Summary");
// //       doc.moveDown(0.3);
// //       doc.fontSize(10).font("Helvetica").fillColor("#333333")
// //         .text(`Skills: ${session.careerContext.skills.join(", ")}`);
// //       doc.text(`Estimated Experience: ~${session.careerContext.estimatedYOE} year(s)`);
// //       if (session.careerContext.jobTitle) {
// //         doc.text(`Target Role: ${session.careerContext.jobTitle}`);
// //       }
// //       doc.moveDown(1);
// //     }

// //     // ── Divider ──
// //     doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cccccc").lineWidth(1).stroke();
// //     doc.moveDown(0.8);

// //     // ── Messages ──
// //     doc.fontSize(14).font("Helvetica-Bold").fillColor("#1a1a1a").text("Conversation");
// //     doc.moveDown(0.6);

// //     session.messages.forEach((msg, i) => {
// //       const isAssistant = msg.role === "assistant";
// //       doc.fontSize(10).font("Helvetica-Bold")
// //         .fillColor(isAssistant ? "#1d4ed8" : "#374151")
// //         .text(isAssistant ? "Career Mentor" : "You");
// //       doc.fontSize(10).font("Helvetica").fillColor("#1a1a1a")
// //         .text(msg.content, { width: 495 });
// //       if (i < session.messages.length - 1) {
// //         doc.moveDown(0.8);
// //       }
// //     });

// //     doc.moveDown(1.5);
// //     doc.fontSize(9).fillColor("#888888").text("Generated by ResumeAI Career Mentor", { align: "center" });

// //     doc.end();
// //   } catch (err) {
// //     console.error("Mentor /pdf error:", err.message);
// //     res.status(500).json({ success: false, error: err.message });
// //   }
// // });

// // // ══════════════════════════════════════════════════════════════
// // // DELETE /api/mentor/:sessionId
// // // ══════════════════════════════════════════════════════════════
// // router.delete("/:sessionId", async (req, res) => {
// //   try {
// //     await MentorChat.findOneAndDelete({ sessionId: req.params.sessionId });
// //     res.json({ success: true });
// //   } catch (err) {
// //     res.status(500).json({ success: false, error: err.message });
// //   }
// // });

// // module.exports = router;



























// // ══════════════════════════════════════════════════════════════
// // mentorRoutes.js — Career Mentor API
// // Uses native fetch (Node 18+ / Vercel) — NO node-fetch import
// //
// // POST   /api/mentor/start        — start session
// // POST   /api/mentor/chat         — send message, get reply
// // GET    /api/mentor/history/:sid — fetch full chat
// // GET    /api/mentor/pdf/:sid     — download chat as PDF
// // DELETE /api/mentor/:sid         — delete session
// // ══════════════════════════════════════════════════════════════

// "use strict";

// const express     = require("express");
// const router      = express.Router();
// const { v4: uuidv4 } = require("uuid");
// const PDFDocument = require("pdfkit");
// const MentorChat  = require("../models/MentorChat");

// // ─────────────────────────────────────────────────────────────
// // Groq helper — uses Node 18 native fetch (NO node-fetch needed)
// // Vercel serverless runs Node 18+ which has global fetch built in.
// // ─────────────────────────────────────────────────────────────
// async function callGroq({ apiKey, messages, systemPrompt, maxTokens = 600 }) {
//   const key = apiKey || process.env.GROQ_API_KEY;
//   if (!key) {
//     throw new Error(
//       "GROQ_API_KEY missing. Add it to Vercel → Settings → Environment Variables on your server project."
//     );
//   }

//   const allMessages = systemPrompt
//     ? [{ role: "system", content: systemPrompt }, ...messages]
//     : messages;

//   // Try small fast model first, fall back to larger model
//   const models = ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"];

//   for (const model of models) {
//     for (let attempt = 1; attempt <= 3; attempt++) {
//       let res;
//       try {
//         res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//           method: "POST",
//           headers: {
//             "Content-Type":  "application/json",
//             "Authorization": `Bearer ${key}`,
//           },
//           body: JSON.stringify({ model, messages: allMessages, max_tokens: maxTokens }),
//         });
//       } catch (netErr) {
//         throw new Error("Network error reaching Groq API: " + netErr.message);
//       }

//       if (res.ok) {
//         const data = await res.json();
//         const text = data?.choices?.[0]?.message?.content?.trim() || "";
//         if (text.length > 5) return text;
//         break; // empty response — try next model
//       }

//       if (res.status === 429) {
//         const waitMs = attempt * 8000;
//         console.warn(`Groq 429 on ${model}, waiting ${waitMs / 1000}s...`);
//         await new Promise((r) => setTimeout(r, waitMs));
//         continue;
//       }

//       let errMsg = `HTTP ${res.status}`;
//       try { const b = await res.json(); errMsg = b?.error?.message || errMsg; } catch {}
//       console.warn(`Groq failed on ${model}: ${errMsg}`);
//       break; // try next model
//     }
//   }

//   throw new Error("Groq API unavailable. Please try again in a moment.");
// }

// // ─────────────────────────────────────────────────────────────
// // Extract career context from resume text (pure JS, no API)
// // ─────────────────────────────────────────────────────────────
// function extractCareerContext(resumeText, jobDescription) {
//   const lower = (resumeText || "").toLowerCase();

//   const techList = [
//     "javascript","typescript","python","java","react","node.js","express","mongodb",
//     "postgresql","mysql","redis","docker","kubernetes","aws","azure","gcp","git",
//     "html","css","vue","angular","next.js","graphql","rest api","c++","c#","go",
//     "rust","flutter","swift","kotlin","tensorflow","pytorch","machine learning",
//     "deep learning","sql","linux","ci/cd","terraform","power bi","tableau",
//     "excel","pandas","numpy","scikit-learn","data analysis","nlp","nlp-based",
//   ];
//   const skills = techList.filter((t) => lower.includes(t)).slice(0, 15);

//   const yearMatches = (resumeText || "").match(/\b(20\d{2})\b/g) || [];
//   const years = yearMatches
//     .map(Number)
//     .filter((y) => y >= 2010 && y <= new Date().getFullYear());
//   const estimatedYOE =
//     years.length >= 2 ? Math.min(new Date().getFullYear() - Math.min(...years), 15) : 0;

//   const jdTitleMatch = jobDescription
//     ? jobDescription.match(/(?:job title|position|role|hiring|looking for)[:\s]+([^\n.]{3,60})/i)
//     : null;
//   const jobTitle = jdTitleMatch ? jdTitleMatch[1].trim() : "";

//   return {
//     skills,
//     estimatedYOE,
//     jobTitle,
//     hasExperience: /experience|work history|employment|intern/i.test(resumeText),
//     hasEducation:  /education|university|college|degree|b\.tech|bachelor|master/i.test(resumeText),
//     hasProjects:   /project|built|developed|created/i.test(resumeText),
//   };
// }

// // ─────────────────────────────────────────────────────────────
// // Build the system prompt used on every Groq call
// // ─────────────────────────────────────────────────────────────
// function buildSystemPrompt(careerContext, resumeText, jobDescription) {
//   const { skills, estimatedYOE, jobTitle } = careerContext || {};
//   return `You are an expert AI Career Mentor. Be warm, direct, and specific — always reference the candidate's actual resume.

// CANDIDATE SNAPSHOT:
// - Skills detected: ${(skills || []).join(", ") || "none detected"}
// - Estimated experience: ~${estimatedYOE || 0} year(s)
// ${jobTitle ? `- Target role: ${jobTitle}` : ""}
// ${jobDescription ? `\nJOB DESCRIPTION:\n${jobDescription.slice(0, 600)}` : ""}

// RESUME (first 1200 chars):
// ${(resumeText || "").slice(0, 1200)}

// RESPONSE RULES:
// - Be specific — cite real details from the resume
// - Keep responses to 2-4 short paragraphs (no walls of text)
// - Give actionable advice the candidate can act on today
// - Use plain bullet lines only when listing 3+ items
// - Never invent skills or experience not in the resume`;
// }

// // ══════════════════════════════════════════════════════════════
// // POST /api/mentor/start
// // ══════════════════════════════════════════════════════════════
// router.post("/start", async (req, res) => {
//   try {
//     const {
//       resumeText,
//       jobDescription, // CareerMentor.jsx sends this
//       jdText,         // old field name — kept for backwards compat
//       clerkUserId = "guest",
//       userName    = "",
//       userEmail   = "",
//       groqApiKey,
//     } = req.body;

//     // JD is OPTIONAL — accept either field name
//     const resolvedJD = (jobDescription || jdText || "").trim();

//     if (!resumeText || resumeText.trim().length < 50) {
//       return res.status(400).json({
//         success: false,
//         error:
//           "Resume text is too short. Please upload your resume or paste the text (minimum 50 characters).",
//       });
//     }

//     const trimmedResume = resumeText.trim().slice(0, 4000);
//     const trimmedJD     = resolvedJD.slice(0, 2000);
//     const careerContext = extractCareerContext(trimmedResume, trimmedJD);
//     const sessionId     = uuidv4();

//     const systemPrompt = buildSystemPrompt(careerContext, trimmedResume, trimmedJD);
//     const welcomeMsg = await callGroq({
//       apiKey: groqApiKey,
//       systemPrompt,
//       messages: [{
//         role: "user",
//         content: trimmedJD
//           ? "I've uploaded my resume and a job description I'm targeting. Give me a short warm welcome, share 2-3 honest observations about my profile vs this role, then ask me one question to start."
//           : "I've uploaded my resume. Give me a short warm welcome, share 2-3 honest observations about my profile, then ask me one question to start our session.",
//       }],
//       maxTokens: 500,
//     });

//     const session = new MentorChat({
//       sessionId,
//       clerkUserId,
//       userName,
//       userEmail,
//       resumeText:     trimmedResume,
//       jobDescription: trimmedJD,
//       careerContext,
//       messages: [{ role: "assistant", content: welcomeMsg }],
//     });
//     await session.save();

//     console.log(`✅ Mentor session created: ${sessionId} | ${clerkUserId}`);
//     res.json({ success: true, sessionId, welcomeMessage: welcomeMsg, careerContext });

//   } catch (err) {
//     console.error("Mentor /start error:", err.message);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// // ══════════════════════════════════════════════════════════════
// // POST /api/mentor/chat
// // ══════════════════════════════════════════════════════════════
// router.post("/chat", async (req, res) => {
//   try {
//     const { sessionId, message, groqApiKey } = req.body;

//     if (!sessionId) return res.status(400).json({ success: false, error: "sessionId required" });
//     if (!message)   return res.status(400).json({ success: false, error: "message required" });

//     const session = await MentorChat.findOne({ sessionId });
//     if (!session) {
//       return res.status(404).json({
//         success: false,
//         error: "Session not found. Please start a new mentoring session.",
//       });
//     }

//     const systemPrompt = buildSystemPrompt(
//       session.careerContext,
//       session.resumeText,
//       session.jobDescription
//     );

//     const history = session.messages.slice(-12).map((m) => ({
//       role: m.role, content: m.content,
//     }));
//     history.push({ role: "user", content: message.trim() });

//     const reply = await callGroq({ apiKey: groqApiKey, systemPrompt, messages: history, maxTokens: 700 });

//     session.messages.push({ role: "user",      content: message.trim() });
//     session.messages.push({ role: "assistant", content: reply });
//     await session.save();

//     res.json({ success: true, reply, sessionId });

//   } catch (err) {
//     console.error("Mentor /chat error:", err.message);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// // ══════════════════════════════════════════════════════════════
// // GET /api/mentor/history/:sessionId
// // ══════════════════════════════════════════════════════════════
// router.get("/history/:sessionId", async (req, res) => {
//   try {
//     const session = await MentorChat.findOne({ sessionId: req.params.sessionId });
//     if (!session) return res.status(404).json({ success: false, error: "Session not found" });
//     res.json({
//       success: true,
//       sessionId: session.sessionId,
//       messages:  session.messages,
//       careerContext: session.careerContext,
//       createdAt: session.createdAt,
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// // ══════════════════════════════════════════════════════════════
// // GET /api/mentor/pdf/:sessionId
// // ══════════════════════════════════════════════════════════════
// router.get("/pdf/:sessionId", async (req, res) => {
//   try {
//     const session = await MentorChat.findOne({ sessionId: req.params.sessionId });
//     if (!session) return res.status(404).json({ success: false, error: "Session not found" });

//     const doc = new PDFDocument({ margin: 50, size: "A4" });
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="mentor-${session.sessionId.slice(0, 8)}.pdf"`
//     );
//     doc.pipe(res);

//     doc.fontSize(20).font("Helvetica-Bold").text("AI Career Mentor Session", { align: "center" });
//     doc.moveDown(0.4);
//     doc.fontSize(10).font("Helvetica").fillColor("#555")
//       .text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), { align: "center" });
//     if (session.userName) doc.text(`Candidate: ${session.userName}`, { align: "center" });
//     doc.moveDown(1);

//     if (session.careerContext?.skills?.length) {
//       doc.fontSize(12).font("Helvetica-Bold").fillColor("#111").text("Profile Summary");
//       doc.moveDown(0.3);
//       doc.fontSize(9).font("Helvetica").fillColor("#333")
//         .text(`Skills: ${session.careerContext.skills.join(", ")}`);
//       if (session.careerContext.estimatedYOE)
//         doc.text(`Experience: ~${session.careerContext.estimatedYOE} year(s)`);
//       if (session.careerContext.jobTitle)
//         doc.text(`Target Role: ${session.careerContext.jobTitle}`);
//       doc.moveDown(0.8);
//     }

//     doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#ccc").lineWidth(1).stroke();
//     doc.moveDown(0.6);
//     doc.fontSize(12).font("Helvetica-Bold").fillColor("#111").text("Conversation");
//     doc.moveDown(0.5);

//     (session.messages || []).forEach((msg, i) => {
//       const isMentor = msg.role === "assistant";
//       doc.fontSize(9).font("Helvetica-Bold")
//         .fillColor(isMentor ? "#1d4ed8" : "#374151")
//         .text(isMentor ? "Career Mentor" : "You");
//       doc.fontSize(9).font("Helvetica").fillColor("#111")
//         .text((msg.content || "").replace(/[^\x00-\x7F]/g, ""), { width: 495, lineGap: 2 });
//       if (i < session.messages.length - 1) doc.moveDown(0.7);
//     });

//     doc.moveDown(2);
//     doc.fontSize(8).fillColor("#aaa").text("Generated by ResumeAI · AI Career Mentor", { align: "center" });
//     doc.end();

//   } catch (err) {
//     console.error("Mentor /pdf error:", err.message);
//     if (!res.headersSent) res.status(500).json({ success: false, error: err.message });
//   }
// });

// // ══════════════════════════════════════════════════════════════
// // DELETE /api/mentor/:sessionId
// // ══════════════════════════════════════════════════════════════
// router.delete("/:sessionId", async (req, res) => {
//   try {
//     await MentorChat.findOneAndDelete({ sessionId: req.params.sessionId });
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// module.exports = router;   




















































































// ══════════════════════════════════════════════════════════════
// mentorRoutes.js — Career Mentor API with Redis
//
// ✅ Rate limiting  — prevents Groq API abuse
// ✅ Session cache  — Redis cache for active chat sessions
// ✅ Native fetch   — no node-fetch (Node 18 / Vercel)
// ══════════════════════════════════════════════════════════════

"use strict";

const express     = require("express");
const router      = express.Router();
const { v4: uuidv4 } = require("uuid");
const PDFDocument = require("pdfkit");
const MentorChat  = require("../models/MentorChat");
const { createRateLimiter, sessionCache } = require("../middleware/redisMiddleware");

// ══════════════════════════════════════════════════════════════
// Groq — native fetch, retry on 429, model fallback
// ══════════════════════════════════════════════════════════════
async function callGroq({ apiKey, messages, systemPrompt, maxTokens = 600 }) {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error(
      "GROQ_API_KEY missing. Add it to Vercel → Settings → Environment Variables."
    );
  }

  const allMessages = systemPrompt
    ? [{ role: "system", content: systemPrompt }, ...messages]
    : messages;

  const models = ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"];

  for (const model of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      let res;
      try {
        res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${key}`,
          },
          body: JSON.stringify({ model, messages: allMessages, max_tokens: maxTokens }),
        });
      } catch (netErr) {
        throw new Error("Network error reaching Groq: " + netErr.message);
      }

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim() || "";
        if (text.length > 5) return text;
        break;
      }

      if (res.status === 429) {
        const waitMs = attempt * 8000;
        console.warn(`Groq 429 on ${model}, waiting ${waitMs / 1000}s...`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      let errMsg = `HTTP ${res.status}`;
      try { const b = await res.json(); errMsg = b?.error?.message || errMsg; } catch {}
      console.warn(`Groq failed on ${model}: ${errMsg}`);
      break;
    }
  }

  throw new Error("Groq API unavailable. Please try again in a moment.");
}

// ══════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════
function extractCareerContext(resumeText, jobDescription) {
  const lower = (resumeText || "").toLowerCase();

  const techList = [
    "javascript","typescript","python","java","react","node.js","express","mongodb",
    "postgresql","mysql","redis","docker","kubernetes","aws","azure","gcp","git",
    "html","css","vue","angular","next.js","graphql","rest api","c++","c#","go",
    "rust","flutter","swift","kotlin","tensorflow","pytorch","machine learning",
    "deep learning","sql","linux","ci/cd","terraform","power bi","tableau",
    "excel","pandas","numpy","scikit-learn","data analysis","nlp",
  ];
  const skills = techList.filter((t) => lower.includes(t)).slice(0, 15);

  const yearMatches = (resumeText || "").match(/\b(20\d{2})\b/g) || [];
  const years = yearMatches
    .map(Number)
    .filter((y) => y >= 2010 && y <= new Date().getFullYear());
  const estimatedYOE =
    years.length >= 2 ? Math.min(new Date().getFullYear() - Math.min(...years), 15) : 0;

  const jdTitleMatch = jobDescription
    ? jobDescription.match(/(?:job title|position|role|hiring|looking for)[:\s]+([^\n.]{3,60})/i)
    : null;
  const jobTitle = jdTitleMatch ? jdTitleMatch[1].trim() : "";

  return {
    skills, estimatedYOE, jobTitle,
    hasExperience: /experience|work history|employment|intern/i.test(resumeText),
    hasEducation:  /education|university|college|degree|b\.tech|bachelor|master/i.test(resumeText),
    hasProjects:   /project|built|developed|created/i.test(resumeText),
  };
}

function buildSystemPrompt(careerContext, resumeText, jobDescription) {
  const { skills, estimatedYOE, jobTitle } = careerContext || {};
  return `You are an expert AI Career Mentor. Be warm, direct, and specific — always reference the candidate's actual resume.

CANDIDATE SNAPSHOT:
- Skills: ${(skills || []).join(", ") || "none detected"}
- Experience: ~${estimatedYOE || 0} year(s)
${jobTitle ? `- Target role: ${jobTitle}` : ""}
${jobDescription ? `\nJOB DESCRIPTION:\n${jobDescription.slice(0, 600)}` : ""}

RESUME (first 1200 chars):
${(resumeText || "").slice(0, 1200)}

RULES: Be specific. Keep replies to 2-4 short paragraphs. Give actionable advice. Never invent skills not in the resume.`;
}

// ══════════════════════════════════════════════════════════════
// POST /api/mentor/start
// Rate limited: 3 starts per user per minute
// ══════════════════════════════════════════════════════════════
router.post("/start", createRateLimiter("mentor_start"), async (req, res) => {
  try {
    const {
      resumeText,
      jobDescription, jdText,   // accept both field names
      clerkUserId = "guest",
      userName    = "",
      userEmail   = "",
      groqApiKey,
    } = req.body;

    const resolvedJD = (jobDescription || jdText || "").trim();

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        error: "Resume text is too short (minimum 50 chars). Please upload your resume or paste the text.",
      });
    }

    const trimmedResume = resumeText.trim().slice(0, 4000);
    const trimmedJD     = resolvedJD.slice(0, 2000);
    const careerContext = extractCareerContext(trimmedResume, trimmedJD);
    const sessionId     = uuidv4();

    const systemPrompt = buildSystemPrompt(careerContext, trimmedResume, trimmedJD);
    const welcomeMsg = await callGroq({
      apiKey: groqApiKey,
      systemPrompt,
      messages: [{
        role: "user",
        content: trimmedJD
          ? "I've uploaded my resume and a job description. Give me a short warm welcome, share 2-3 honest observations about my fit for this role, then ask me one focused question to start."
          : "I've uploaded my resume. Give me a short warm welcome, share 2-3 honest observations about my profile, then ask me one focused question to start our session.",
      }],
      maxTokens: 500,
    });

    // ── Save to MongoDB ─────────────────────────────────────
    const session = new MentorChat({
      sessionId, clerkUserId, userName, userEmail,
      resumeText: trimmedResume, jobDescription: trimmedJD,
      careerContext,
      messages: [{ role: "assistant", content: welcomeMsg }],
    });
    await session.save();

    // ── Cache in Redis ──────────────────────────────────────
    await sessionCache.set(sessionId, session);

    console.log(`✅ Mentor session: ${sessionId} | ${clerkUserId}`);
    res.json({ success: true, sessionId, welcomeMessage: welcomeMsg, careerContext });

  } catch (err) {
    console.error("Mentor /start error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/mentor/chat
// Rate limited: 20 messages per user per minute
// Session served from Redis cache — MongoDB only on cache miss
// ══════════════════════════════════════════════════════════════
router.post("/chat", createRateLimiter("mentor_chat"), async (req, res) => {
  try {
    const { sessionId, message, groqApiKey } = req.body;

    if (!sessionId) return res.status(400).json({ success: false, error: "sessionId required" });
    if (!message)   return res.status(400).json({ success: false, error: "message required" });

    // ── Try Redis cache first ───────────────────────────────
    let session = await sessionCache.get(sessionId);
    let fromCache = !!session;

    // ── Cache miss → load from MongoDB ──────────────────────
    if (!session) {
      session = await MentorChat.findOne({ sessionId });
      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Session not found. Please start a new mentoring session.",
        });
      }
      console.log(`📦 Session ${sessionId} loaded from MongoDB (cache miss)`);
    } else {
      console.log(`⚡ Session ${sessionId} loaded from Redis cache`);
    }

    const systemPrompt = buildSystemPrompt(
      session.careerContext,
      session.resumeText,
      session.jobDescription
    );

    const history = (session.messages || []).slice(-12).map((m) => ({
      role: m.role, content: m.content,
    }));
    history.push({ role: "user", content: message.trim() });

    const reply = await callGroq({ apiKey: groqApiKey, systemPrompt, messages: history, maxTokens: 700 });

    // ── Append new messages ─────────────────────────────────
    const newUserMsg      = { role: "user",      content: message.trim() };
    const newAssistantMsg = { role: "assistant", content: reply };

    if (!session.messages) session.messages = [];
    session.messages.push(newUserMsg);
    session.messages.push(newAssistantMsg);

    // ── Update Redis cache (always) ─────────────────────────
    await sessionCache.set(sessionId, session);

    // ── Persist to MongoDB ──────────────────────────────────
    // If session came from cache, we need a real Mongoose doc to save
    if (fromCache) {
      await MentorChat.findOneAndUpdate(
        { sessionId },
        { $push: { messages: { $each: [newUserMsg, newAssistantMsg] } } }
      );
    } else {
      session.messages.push(newUserMsg);
      session.messages.push(newAssistantMsg);
      await session.save();
    }

    res.json({ success: true, reply, sessionId });

  } catch (err) {
    console.error("Mentor /chat error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /api/mentor/history/:sessionId
// ══════════════════════════════════════════════════════════════
router.get("/history/:sessionId", async (req, res) => {
  try {
    // Try cache first
    let session = await sessionCache.get(req.params.sessionId);
    if (!session) {
      session = await MentorChat.findOne({ sessionId: req.params.sessionId });
    }
    if (!session) return res.status(404).json({ success: false, error: "Session not found" });

    res.json({
      success: true,
      sessionId:     session.sessionId,
      messages:      session.messages,
      careerContext: session.careerContext,
      createdAt:     session.createdAt,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /api/mentor/pdf/:sessionId
// ══════════════════════════════════════════════════════════════
router.get("/pdf/:sessionId", async (req, res) => {
  try {
    let session = await sessionCache.get(req.params.sessionId);
    if (!session) {
      session = await MentorChat.findOne({ sessionId: req.params.sessionId });
    }
    if (!session) return res.status(404).json({ success: false, error: "Session not found" });

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="mentor-${req.params.sessionId.slice(0, 8)}.pdf"`
    );
    doc.pipe(res);

    doc.fontSize(20).font("Helvetica-Bold").text("AI Career Mentor Session", { align: "center" });
    doc.moveDown(0.4);
    doc.fontSize(10).font("Helvetica").fillColor("#555")
      .text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), { align: "center" });
    if (session.userName) doc.text(`Candidate: ${session.userName}`, { align: "center" });
    doc.moveDown(1);

    if (session.careerContext?.skills?.length) {
      doc.fontSize(12).font("Helvetica-Bold").fillColor("#111").text("Profile Summary");
      doc.moveDown(0.3);
      doc.fontSize(9).font("Helvetica").fillColor("#333")
        .text(`Skills: ${session.careerContext.skills.join(", ")}`);
      if (session.careerContext.estimatedYOE)
        doc.text(`Experience: ~${session.careerContext.estimatedYOE} year(s)`);
      if (session.careerContext.jobTitle)
        doc.text(`Target Role: ${session.careerContext.jobTitle}`);
      doc.moveDown(0.8);
    }

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#ccc").lineWidth(1).stroke();
    doc.moveDown(0.6);
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#111").text("Conversation");
    doc.moveDown(0.5);

    (session.messages || []).forEach((msg, i) => {
      const isMentor = msg.role === "assistant";
      doc.fontSize(9).font("Helvetica-Bold")
        .fillColor(isMentor ? "#1d4ed8" : "#374151")
        .text(isMentor ? "Career Mentor" : "You");
      doc.fontSize(9).font("Helvetica").fillColor("#111")
        .text((msg.content || "").replace(/[^\x00-\x7F]/g, ""), { width: 495, lineGap: 2 });
      if (i < session.messages.length - 1) doc.moveDown(0.7);
    });

    doc.moveDown(2);
    doc.fontSize(8).fillColor("#aaa").text("Generated by ResumeAI · AI Career Mentor", { align: "center" });
    doc.end();

  } catch (err) {
    console.error("Mentor /pdf error:", err.message);
    if (!res.headersSent) res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// DELETE /api/mentor/:sessionId
// ══════════════════════════════════════════════════════════════
router.delete("/:sessionId", async (req, res) => {
  try {
    await Promise.all([
      MentorChat.findOneAndDelete({ sessionId: req.params.sessionId }),
      sessionCache.del(req.params.sessionId),   // also clear from Redis
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

