// import { useState, useRef, useCallback } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import * as pdfjsLib from "pdfjs-dist";

// pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
//   "pdfjs-dist/build/pdf.worker.min.mjs",
//   import.meta.url
// ).toString();

// // ══════════════════════════════════════════════════════════════
// // CONSTANTS
// // ══════════════════════════════════════════════════════════════
// const MAX_RESUMES = 5;
// const API_BASE = "https://ai-smart-resume-analyzer-so1y.vercel.app/api";

// const RANK_COLORS = [
//   { bg: "#FFD700", glow: "#FFD70088", label: "GOLD",   icon: "🥇", text: "#1a1200" },
//   { bg: "#C0C0C0", glow: "#C0C0C088", label: "SILVER", icon: "🥈", text: "#0f0f0f" },
//   { bg: "#CD7F32", glow: "#CD7F3288", label: "BRONZE", icon: "🥉", text: "#1a0a00" },
//   { bg: "#6366f1", glow: "#6366f188", label: "4TH",    icon: "4️⃣", text: "#fff" },
//   { bg: "#8b5cf6", glow: "#8b5cf688", label: "5TH",    icon: "5️⃣", text: "#fff" },
// ];

// const SKILL_KEYWORDS = [
//   "javascript","typescript","python","java","c++","c#","go","golang","rust","ruby","php",
//   "swift","kotlin","scala","dart","react","next.js","vue","angular","svelte","html","css",
//   "sass","tailwind","redux","node.js","nodejs","express","nestjs","fastapi","django","flask",
//   "spring","graphql","rest api","mongodb","mysql","postgresql","redis","firebase","docker",
//   "kubernetes","aws","azure","gcp","terraform","git","figma","tensorflow","pytorch",
//   "machine learning","deep learning","linux","bash","ci/cd",
// ];

// // ══════════════════════════════════════════════════════════════
// // UTILS
// // ══════════════════════════════════════════════════════════════
// async function extractTextFromFile(file) {
//   if (file.type === "application/pdf") {
//     const buf = await file.arrayBuffer();
//     const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
//     let text = "";
//     for (let i = 1; i <= pdf.numPages; i++) {
//       const page = await pdf.getPage(i);
//       const content = await page.getTextContent();
//       text += content.items.map((x) => x.str).join(" ") + "\n";
//     }
//     return text.trim();
//   } else {
//     return new Promise((res, rej) => {
//       const r = new FileReader();
//       r.onload = () => res(r.result);
//       r.onerror = rej;
//       r.readAsText(file);
//     });
//   }
// }

// function extractSkills(text) {
//   const lower = text.toLowerCase();
//   const found = new Set();
//   for (const skill of SKILL_KEYWORDS) {
//     const escaped = skill.replace(/[.+]/g, "\\$&");
//     if (new RegExp(`(?<![a-z])${escaped}(?![a-z])`, "i").test(lower)) found.add(skill);
//   }
//   return [...found];
// }

// function extractProjects(text) {
//   const projects = new Set();
//   const p1 = /(?:project[s]?\s*[:\-–—]\s*)([A-Z][A-Za-z0-9 \-_]+)/gm;
//   const p2 = /(?:built|developed|created|designed|implemented)\s+(?:a\s+|an\s+|the\s+)?([A-Z][A-Za-z0-9 \-_]{3,35}?)(?:\s+using|\s+with|\s+in|\s+for|[.,\n])/g;
//   const p3 = /github\.com\/[a-zA-Z0-9_\-]+\/([a-zA-Z0-9_\-]+)/g;
//   let m;
//   while ((m = p1.exec(text)) !== null) { if (m[1].trim().length > 3) projects.add(m[1].trim().slice(0, 40)); }
//   while ((m = p2.exec(text)) !== null) { if (m[1].trim().length > 3) projects.add(m[1].trim()); }
//   while ((m = p3.exec(text)) !== null) { projects.add(m[1].replace(/[-_]/g, " ")); }
//   return [...projects].slice(0, 10);
// }

// function extractGithub(text) {
//   const patterns = [
//     /github\.com\/([a-zA-Z0-9_\-]{2,39})(?:\/|$|\s|"|')/g,
//     /github:\s*@?([a-zA-Z0-9_\-]{2,39})/gi,
//   ];
//   const skip = ["features","topics","explore","marketplace","enterprise","sponsors","about","login","signup","orgs"];
//   for (const pattern of patterns) {
//     const m = pattern.exec(text);
//     if (m && !skip.includes(m[1].toLowerCase())) return m[1];
//   }
//   return "";
// }

// function extractYears(text) {
//   const m = text.match(/(\d+)\+?\s*years?\s+(?:of\s+)?(?:experience|exp)/i);
//   return m ? parseInt(m[1]) : 1;
// }

// function parseJSON(raw) {
//   let clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
//   const s = clean.indexOf("{"), e = clean.lastIndexOf("}");
//   if (s === -1 || e === -1) throw new Error("No JSON found");
//   clean = clean.slice(s, e + 1);
//   try { return JSON.parse(clean); } catch {}
//   return JSON.parse(clean.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]"));
// }

// function scoreColor(score) {
//   if (score >= 80) return "#22c55e";
//   if (score >= 60) return "#f59e0b";
//   if (score >= 40) return "#f97316";
//   return "#ef4444";
// }

// function fmt(bytes) {
//   return bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + " KB" : (bytes / (1024 * 1024)).toFixed(1) + " MB";
// }

// // ══════════════════════════════════════════════════════════════
// // ANALYZE A SINGLE RESUME (resume + github + linkedin)
// // ══════════════════════════════════════════════════════════════
// async function analyzeResume({ file, jdText, linkedinText, apiKey }) {
//   const resumeText = await extractTextFromFile(file);
//   const skills = extractSkills(resumeText);
//   const projects = extractProjects(resumeText);
//   const claimedYears = extractYears(resumeText);
//   const githubUsername = extractGithub(resumeText);

//   // ── 1. Groq AI (ATS + JD match) ───────────────────────────
//   const prompt = `You are an expert ATS resume analyzer. Analyze the resume against the job description.
// Return ONLY a valid JSON object. No markdown, no text outside JSON.

// {
//   "candidateName": "full name from resume or 'Candidate'",
//   "overallScore": 75,
//   "scores": {
//     "keywordMatch": { "score": 70, "details": "explanation", "keywords": ["React","Node.js"], "matched": ["React"], "missing": ["Docker"] },
//     "skillsMatch": { "score": 80, "details": "explanation", "matched": ["React"], "missing": ["Docker"] },
//     "experienceRelevance": { "score": 60, "details": "explanation" },
//     "educationMatch": { "score": 90, "details": "explanation", "degree": "B.Tech CSE" },
//     "projectRelevance": { "score": 70, "details": "explanation" },
//     "formattingScore": { "score": 75, "details": "explanation", "atsIssues": ["issue"] },
//     "actionVerbScore": { "score": 80, "details": "explanation", "goodVerbs": ["Built"], "weakPhrases": ["Worked on"] },
//     "achievementScore": { "score": 65, "details": "explanation", "examples": ["example"] },
//     "grammarReadability": { "score": 85, "details": "explanation" },
//     "atsCompatibility": { "score": 70, "details": "explanation" },
//     "sectionCompleteness": { "score": 75, "details": "explanation", "present": ["Skills"], "missing": ["Certifications"] }
//   },
//   "topStrengths": ["strength1", "strength2", "strength3"],
//   "criticalImprovements": ["improvement1", "improvement2", "improvement3"],
//   "jdSpecificImprovements": ["specific improvement tied to JD 1", "specific improvement tied to JD 2", "specific improvement tied to JD 3"],
//   "verdict": "Overall assessment in 2 sentences."
// }

// RESUME:
// ${resumeText.slice(0, 1500)}

// JOB DESCRIPTION:
// ${jdText.slice(0, 800)}`;

//   const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//     method: "POST",
//     headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
//     body: JSON.stringify({
//       model: "llama-3.1-8b-instant",
//       messages: [
//         { role: "system", content: "You are an ATS resume analyzer. Always respond with valid JSON only." },
//         { role: "user", content: prompt },
//       ],
//       temperature: 0.1,
//       max_tokens: 2000,
//     }),
//   });

//   if (!groqRes.ok) throw new Error("Groq API failed");
//   const groqData = await groqRes.json();
//   const result = parseJSON(groqData.choices[0].message.content);

//   // ── 2. GitHub metrics ──────────────────────────────────────
//   let githubMetrics = null;
//   if (githubUsername) {
//     try {
//       const ghRes = await fetch(`${API_BASE}/github-analyze`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ githubUsername, resumeText: resumeText.slice(0, 1500), resumeSkills: skills, resumeProjects: projects, claimedYears }),
//       });
//       const ghData = await ghRes.json();
//       if (ghData.success) githubMetrics = ghData.githubMetrics;
//     } catch {}
//   }

//   // ── 3. LinkedIn metrics ────────────────────────────────────
//   let linkedinMetrics = null;
//   if (linkedinText && linkedinText.trim().length > 50) {
//     try {
//       const liRes = await fetch(`${API_BASE}/linkedin-analyze`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ linkedinText, jobRole: jdText.slice(0, 100), resumeSkills: skills }),
//       });
//       const liData = await liRes.json();
//       if (liData.success) linkedinMetrics = liData.linkedinMetrics;
//     } catch {}
//   }

//   return {
//     fileName: file.name,
//     resumeText,
//     githubUsername,
//     atsResult: result,
//     githubMetrics,
//     linkedinMetrics,
//     skills,
//   };
// }

// // ══════════════════════════════════════════════════════════════
// // COMPUTE COMPOSITE SCORE (resume + github + linkedin)
// // ══════════════════════════════════════════════════════════════
// function computeCompositeScore(data) {
//   const atsScore = data.atsResult?.overallScore ?? 0;
//   const ghScore = data.githubMetrics?.trustScore ?? null;
//   const liScore = data.linkedinMetrics?.overallLinkedInScore ?? null;

//   let total = atsScore * 0.5;
//   let denominator = 0.5;

//   if (ghScore !== null) { total += ghScore * 0.3; denominator += 0.3; }
//   if (liScore !== null) { total += liScore * 0.2; denominator += 0.2; }

//   return Math.round(total / denominator);
// }

// // ══════════════════════════════════════════════════════════════
// // GENERATE IMPROVEMENT SUGGESTIONS VIA GROQ
// // ══════════════════════════════════════════════════════════════
// async function generateImprovements({ candidate, rank, jdText, apiKey }) {
//   const prompt = `You are a senior career coach. A candidate ranked #${rank} in a resume competition for this job.

// Candidate: ${candidate.atsResult?.candidateName || candidate.fileName}
// ATS Score: ${candidate.atsResult?.overallScore}/100
// GitHub Trust Score: ${candidate.githubMetrics?.trustScore ?? "N/A"}/100
// LinkedIn Score: ${candidate.linkedinMetrics?.overallLinkedInScore ?? "N/A"}/100
// Skills on resume: ${candidate.skills.slice(0, 15).join(", ")}
// Missing from JD: ${candidate.atsResult?.scores?.skillsMatch?.missing?.slice(0,5).join(", ") || "Unknown"}
// Weak areas: ${Object.entries(candidate.atsResult?.scores || {}).filter(([,v])=> v.score < 65).map(([k,v])=>`${k}(${v.score})`).join(", ")}

// Job Description: ${jdText.slice(0, 400)}

// Return ONLY a valid JSON array of exactly 6 actionable improvement tips. Each tip must be specific, not generic.
// Format: ["tip1", "tip2", "tip3", "tip4", "tip5", "tip6"]`;

//   try {
//     const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//       method: "POST",
//       headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
//       body: JSON.stringify({
//         model: "llama-3.1-8b-instant",
//         messages: [
//           { role: "system", content: "Return only a JSON array of strings. No markdown." },
//           { role: "user", content: prompt },
//         ],
//         temperature: 0.3,
//         max_tokens: 800,
//       }),
//     });
//     const data = await res.json();
//     const raw = data.choices[0].message.content;
//     const clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
//     const s = clean.indexOf("["), e = clean.lastIndexOf("]");
//     return JSON.parse(clean.slice(s, e + 1));
//   } catch {
//     return candidate.atsResult?.jdSpecificImprovements || candidate.atsResult?.criticalImprovements || [];
//   }
// }

// // ══════════════════════════════════════════════════════════════
// // RESUME SLOT CARD
// // ══════════════════════════════════════════════════════════════
// function ResumeSlot({ index, file, onAdd, onRemove, linkedinText, onLinkedinChange }) {
//   const inputRef = useRef(null);
//   const [dragging, setDragging] = useState(false);
//   const [showLinkedin, setShowLinkedin] = useState(false);

//   const slotColors = [
//     { accent: "#60a5fa", glow: "#3b82f6" },
//     { accent: "#a78bfa", glow: "#7c3aed" },
//     { accent: "#34d399", glow: "#059669" },
//     { accent: "#f59e0b", glow: "#d97706" },
//     { accent: "#f472b6", glow: "#db2777" },
//   ];
//   const { accent, glow } = slotColors[index];

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ delay: index * 0.08 }}
//       style={{
//         borderRadius: 16,
//         border: `1.5px solid ${file ? accent + "55" : "rgba(255,255,255,0.08)"}`,
//         background: file ? `${accent}08` : "rgba(255,255,255,0.015)",
//         padding: "16px",
//         transition: "all 0.3s",
//       }}
//     >
//       {/* Slot header */}
//       <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
//         <div style={{
//           width: 28, height: 28, borderRadius: 8,
//           background: `linear-gradient(135deg, ${glow}, ${accent})`,
//           display: "flex", alignItems: "center", justifyContent: "center",
//           fontSize: 12, fontWeight: 800, color: "#fff",
//           fontFamily: "'Outfit',sans-serif",
//           boxShadow: `0 0 12px ${glow}55`,
//         }}>
//           {index + 1}
//         </div>
//         <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, color: "#f1f0ff" }}>
//           Resume #{index + 1}
//         </span>
//         {!file && index > 0 && (
//           <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 100,
//             background: "rgba(255,255,255,0.05)", color: "rgba(200,195,230,0.4)",
//             border: "1px solid rgba(255,255,255,0.08)", fontFamily: "'DM Mono',monospace" }}>
//             OPTIONAL
//           </span>
//         )}
//         {index === 0 && (
//           <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 100,
//             background: `${glow}22`, color: accent,
//             border: `1px solid ${glow}44`, fontFamily: "'DM Mono',monospace" }}>
//             REQUIRED
//           </span>
//         )}
//       </div>

//       {/* Drop zone / file preview */}
//       <AnimatePresence mode="wait">
//         {!file ? (
//           <motion.div
//             key="drop"
//             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
//             onDragLeave={() => setDragging(false)}
//             onDrop={(e) => {
//               e.preventDefault(); setDragging(false);
//               const f = e.dataTransfer.files[0];
//               if (f) onAdd(f, index);
//             }}
//             onClick={() => inputRef.current.click()}
//             style={{
//               borderRadius: 12, border: `1.5px dashed ${dragging ? accent : accent + "33"}`,
//               background: dragging ? `${accent}10` : "transparent",
//               padding: "20px 16px", textAlign: "center",
//               cursor: "pointer", transition: "all 0.2s",
//             }}
//           >
//             <div style={{ fontSize: 24, marginBottom: 6 }}>{dragging ? "📂" : "📄"}</div>
//             <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.5)" }}>
//               Drop PDF/DOCX or click
//             </div>
//             <input ref={inputRef} type="file" accept=".pdf,.docx"
//               onChange={(e) => { const f = e.target.files[0]; if (f) { onAdd(f, index); e.target.value = ""; } }}
//               style={{ display: "none" }} />
//           </motion.div>
//         ) : (
//           <motion.div
//             key="file"
//             initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
//           >
//             {/* File info */}
//             <div style={{ display: "flex", alignItems: "center", gap: 10,
//               padding: "10px 12px", borderRadius: 10,
//               background: `${accent}10`, border: `1px solid ${accent}30` }}>
//               <span style={{ fontSize: 20 }}>📄</span>
//               <div style={{ flex: 1, minWidth: 0 }}>
//                 <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 12,
//                   color: "#f1f0ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//                   {file.name}
//                 </div>
//                 <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: `${accent}bb`, marginTop: 2 }}>
//                   {fmt(file.size)}
//                 </div>
//               </div>
//               <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
//                 onClick={() => onRemove(index)}
//                 style={{ width: 24, height: 24, borderRadius: 6,
//                   border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.1)",
//                   color: "#f87171", fontSize: 11, cursor: "pointer",
//                   display: "flex", alignItems: "center", justifyContent: "center" }}>✕</motion.button>
//             </div>

//             {/* LinkedIn toggle */}
//             <div style={{ marginTop: 10 }}>
//               <button
//                 onClick={() => setShowLinkedin(!showLinkedin)}
//                 style={{
//                   background: showLinkedin ? "rgba(10,102,194,0.15)" : "rgba(255,255,255,0.03)",
//                   border: `1px solid ${showLinkedin ? "rgba(10,102,194,0.4)" : "rgba(255,255,255,0.08)"}`,
//                   borderRadius: 8, padding: "6px 12px", cursor: "pointer",
//                   color: showLinkedin ? "#60a5fa" : "rgba(200,195,230,0.5)",
//                   fontSize: 11, fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
//                   display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
//                 }}
//               >
//                 <span>💼</span>
//                 {showLinkedin ? "Hide LinkedIn" : "+ Add LinkedIn Profile"}
//               </button>
//               <AnimatePresence>
//                 {showLinkedin && (
//                   <motion.div
//                     initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
//                     style={{ overflow: "hidden", marginTop: 8 }}
//                   >
//                     <textarea
//                       value={linkedinText}
//                       onChange={(e) => onLinkedinChange(index, e.target.value)}
//                       placeholder="Paste LinkedIn profile text here (copy from your LinkedIn About/Experience section)..."
//                       style={{
//                         width: "100%", minHeight: 80, borderRadius: 10,
//                         padding: "10px 12px", boxSizing: "border-box",
//                         background: "rgba(10,102,194,0.06)",
//                         border: "1px solid rgba(10,102,194,0.25)",
//                         color: "#f1f0ff", fontSize: 11, fontFamily: "'DM Sans',sans-serif",
//                         lineHeight: 1.6, resize: "vertical", outline: "none",
//                       }}
//                     />
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// }

// // ══════════════════════════════════════════════════════════════
// // METRIC BAR
// // ══════════════════════════════════════════════════════════════
// function MetricBar({ label, score, icon, delay = 0 }) {
//   const color = scoreColor(score);
//   return (
//     <div style={{ marginBottom: 10 }}>
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
//         <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(200,195,230,0.7)", display: "flex", alignItems: "center", gap: 5 }}>
//           {icon} {label}
//         </span>
//         <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color, fontWeight: 700 }}>{score}</span>
//       </div>
//       <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
//         <motion.div
//           initial={{ width: 0 }}
//           animate={{ width: `${score}%` }}
//           transition={{ duration: 0.8, delay, ease: "easeOut" }}
//           style={{ height: "100%", borderRadius: 3, background: color, boxShadow: `0 0 6px ${color}` }}
//         />
//       </div>
//     </div>
//   );
// }

// // ══════════════════════════════════════════════════════════════
// // RANKED CARD
// // ══════════════════════════════════════════════════════════════
// function RankedCard({ candidate, rank, improvements, jdText }) {
//   const [expanded, setExpanded] = useState(rank <= 2);
//   const rColor = RANK_COLORS[rank - 1] || RANK_COLORS[4];
//   const composite = computeCompositeScore(candidate);
//   const ats = candidate.atsResult;
//   const gh = candidate.githubMetrics;
//   const li = candidate.linkedinMetrics;
//   const isTop2 = rank <= 2;

//   return (
//     <motion.div
//       initial={{ opacity: 0, x: -30 }}
//       animate={{ opacity: 1, x: 0 }}
//       transition={{ delay: rank * 0.12 }}
//       style={{
//         borderRadius: 20,
//         border: `1.5px solid ${isTop2 ? rColor.bg + "66" : "rgba(255,255,255,0.08)"}`,
//         background: isTop2
//           ? `linear-gradient(135deg, ${rColor.bg}12, ${rColor.bg}05)`
//           : "rgba(255,255,255,0.02)",
//         overflow: "hidden",
//         boxShadow: isTop2 ? `0 0 40px ${rColor.glow}` : "none",
//         marginBottom: 16,
//       }}
//     >
//       {/* Card header — always visible */}
//       <div
//         onClick={() => setExpanded(!expanded)}
//         style={{
//           display: "flex", alignItems: "center", gap: 16, padding: "20px 24px",
//           cursor: "pointer", userSelect: "none",
//         }}
//       >
//         {/* Rank badge */}
//         <motion.div
//           whileHover={{ scale: 1.1 }}
//           style={{
//             width: 52, height: 52, borderRadius: 14, flexShrink: 0,
//             background: rColor.bg,
//             display: "flex", alignItems: "center", justifyContent: "center",
//             fontSize: 22, boxShadow: `0 0 20px ${rColor.glow}`,
//             fontWeight: 900,
//           }}
//         >
//           {rColor.icon}
//         </motion.div>

//         {/* Name & file */}
//         <div style={{ flex: 1, minWidth: 0 }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
//             <span style={{
//               fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 17, color: "#f1f0ff",
//             }}>
//               {ats?.candidateName || candidate.fileName}
//             </span>
//             <span style={{
//               fontSize: 9, padding: "2px 8px", borderRadius: 100,
//               background: `${rColor.bg}22`, color: rColor.bg,
//               border: `1px solid ${rColor.bg}44`, fontFamily: "'DM Mono',monospace",
//               letterSpacing: "0.1em",
//             }}>
//               #{rank} {rColor.label}
//             </span>
//           </div>
//           <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(200,195,230,0.4)", marginTop: 3 }}>
//             {candidate.fileName}
//             {candidate.githubUsername && ` · @${candidate.githubUsername}`}
//           </div>
//         </div>

//         {/* Score ring */}
//         <div style={{ textAlign: "center", flexShrink: 0 }}>
//           <div style={{
//             fontFamily: "'Outfit',sans-serif", fontWeight: 900,
//             fontSize: 28, color: scoreColor(composite),
//             textShadow: `0 0 20px ${scoreColor(composite)}`,
//           }}>
//             {composite}
//           </div>
//           <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(200,195,230,0.4)" }}>
//             COMPOSITE
//           </div>
//         </div>

//         {/* Expand arrow */}
//         <motion.div
//           animate={{ rotate: expanded ? 180 : 0 }}
//           style={{ fontSize: 16, color: "rgba(200,195,230,0.4)", flexShrink: 0 }}
//         >▼</motion.div>
//       </div>

//       {/* Score pills row */}
//       <div style={{ display: "flex", gap: 10, padding: "0 24px 16px", flexWrap: "wrap" }}>
//         <ScorePill label="ATS" score={ats?.overallScore ?? 0} icon="📋" />
//         {gh && <ScorePill label="GitHub" score={gh.trustScore ?? 0} icon="🐙" />}
//         {li && <ScorePill label="LinkedIn" score={li.overallLinkedInScore ?? 0} icon="💼" />}
//       </div>

//       {/* Expanded content */}
//       <AnimatePresence>
//         {expanded && (
//           <motion.div
//             initial={{ opacity: 0, height: 0 }}
//             animate={{ opacity: 1, height: "auto" }}
//             exit={{ opacity: 0, height: 0 }}
//             style={{ overflow: "hidden" }}
//           >
//             <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "20px 24px" }}>

//               {/* 3-column metrics grid */}
//               <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 24 }}>

//                 {/* ATS Metrics */}
//                 <div>
//                   <SectionLabel icon="📋" label="ATS Resume Metrics" color="#60a5fa" />
//                   {ats?.scores && Object.entries(ats.scores).slice(0, 6).map(([key, val], i) => (
//                     <MetricBar
//                       key={key}
//                       label={key.replace(/([A-Z])/g, " $1").trim()}
//                       score={val.score ?? 0}
//                       icon="·"
//                       delay={i * 0.05}
//                     />
//                   ))}
//                 </div>

//                 {/* GitHub Metrics */}
//                 {gh && (
//                   <div>
//                     <SectionLabel icon="🐙" label="GitHub Metrics" color="#34d399" />
//                     <MetricBar label="Skill Match" score={gh.skillMatchScore ?? 0} icon="·" delay={0.1} />
//                     <MetricBar label="Tech Usage" score={gh.techUsageScore ?? 0} icon="·" delay={0.15} />
//                     <MetricBar label="Project Match" score={gh.projectMatchScore ?? 0} icon="·" delay={0.2} />
//                     <MetricBar label="Consistency" score={gh.consistencyScore ?? 0} icon="·" delay={0.25} />
//                     <MetricBar label="Deployment" score={gh.deploymentScore ?? 0} icon="·" delay={0.3} />
//                     <MetricBar label="Trust Score" score={gh.trustScore ?? 0} icon="·" delay={0.35} />
//                   </div>
//                 )}

//                 {/* LinkedIn Metrics */}
//                 {li && (
//                   <div>
//                     <SectionLabel icon="💼" label="LinkedIn Metrics" color="#60a5fa" />
//                     <MetricBar label="Completeness" score={li.scores?.completenessScore ?? 0} icon="·" delay={0.1} />
//                     <MetricBar label="Headline Quality" score={li.scores?.headlineScore ?? 0} icon="·" delay={0.15} />
//                     <MetricBar label="Skills Relevance" score={li.scores?.skillsRelevanceScore ?? 0} icon="·" delay={0.2} />
//                     <MetricBar label="Experience Quality" score={li.scores?.expQualityScore ?? 0} icon="·" delay={0.25} />
//                     <MetricBar label="Branding" score={li.scores?.brandingScore ?? 0} icon="·" delay={0.3} />
//                     <MetricBar label="Keyword Opt." score={li.scores?.keywordScore ?? 0} icon="·" delay={0.35} />
//                   </div>
//                 )}
//               </div>

//               {/* Strengths */}
//               {ats?.topStrengths?.length > 0 && (
//                 <div style={{ marginBottom: 16 }}>
//                   <SectionLabel icon="⚡" label="Top Strengths" color="#22c55e" />
//                   <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
//                     {ats.topStrengths.map((s, i) => (
//                       <span key={i} style={{
//                         fontSize: 11, padding: "4px 10px", borderRadius: 8,
//                         background: "rgba(34,197,94,0.08)", color: "#22c55e",
//                         border: "1px solid rgba(34,197,94,0.2)", fontFamily: "'DM Sans',sans-serif",
//                       }}>✓ {s}</span>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Improvements — only for rank 3,4,5 */}
//               {!isTop2 && improvements && improvements.length > 0 && (
//                 <div style={{
//                   marginTop: 16, padding: "16px", borderRadius: 14,
//                   background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.2)",
//                 }}>
//                   <SectionLabel icon="🚀" label="Personalized Improvement Plan" color="#f59e0b" />
//                   <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 8 }}>
//                     {improvements.map((tip, i) => (
//                       <motion.div
//                         key={i}
//                         initial={{ opacity: 0, x: -10 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         transition={{ delay: i * 0.07 }}
//                         style={{
//                           display: "flex", gap: 10, alignItems: "flex-start",
//                           padding: "10px 12px", borderRadius: 10,
//                           background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.1)",
//                         }}
//                       >
//                         <span style={{
//                           width: 20, height: 20, borderRadius: 6, flexShrink: 0,
//                           background: "rgba(251,191,36,0.2)", color: "#f59e0b",
//                           display: "flex", alignItems: "center", justifyContent: "center",
//                           fontSize: 10, fontWeight: 800, fontFamily: "'DM Mono',monospace",
//                         }}>{i + 1}</span>
//                         <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.8)", lineHeight: 1.5 }}>
//                           {tip}
//                         </span>
//                       </motion.div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Top 2 verdict */}
//               {isTop2 && ats?.verdict && (
//                 <div style={{
//                   marginTop: 16, padding: "14px 16px", borderRadius: 12,
//                   background: `${rColor.bg}10`, border: `1px solid ${rColor.bg}30`,
//                 }}>
//                   <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.8)", lineHeight: 1.6 }}>
//                     💬 {ats.verdict}
//                   </span>
//                 </div>
//               )}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// }

// function ScorePill({ label, score, icon }) {
//   const color = scoreColor(score);
//   return (
//     <div style={{
//       display: "flex", alignItems: "center", gap: 6,
//       padding: "5px 12px", borderRadius: 100,
//       background: `${color}12`, border: `1px solid ${color}33`,
//     }}>
//       <span style={{ fontSize: 12 }}>{icon}</span>
//       <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(200,195,230,0.6)" }}>{label}</span>
//       <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 700, color }}>{score}</span>
//     </div>
//   );
// }

// function SectionLabel({ icon, label, color }) {
//   return (
//     <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
//       <span>{icon}</span>
//       <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 12, color }}>
//         {label}
//       </span>
//     </div>
//   );
// }

// // ══════════════════════════════════════════════════════════════
// // ANALYTICS OVERVIEW PANEL
// // ══════════════════════════════════════════════════════════════
// function AnalyticsPanel({ ranked }) {
//   const allSkills = ranked.flatMap((c) => c.skills);
//   const skillCounts = {};
//   allSkills.forEach((s) => { skillCounts[s] = (skillCounts[s] || 0) + 1; });
//   const topSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

//   const avgAts = Math.round(ranked.reduce((s, c) => s + (c.atsResult?.overallScore ?? 0), 0) / ranked.length);
//   const avgComposite = Math.round(ranked.reduce((s, c) => s + computeCompositeScore(c), 0) / ranked.length);
//   const hasGh = ranked.filter((c) => c.githubMetrics).length;
//   const hasLi = ranked.filter((c) => c.linkedinMetrics).length;

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ delay: 0.4 }}
//       style={{
//         borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)",
//         background: "rgba(255,255,255,0.02)", padding: "24px", marginBottom: 24,
//       }}
//     >
//       <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 16, color: "#f1f0ff", marginBottom: 20 }}>
//         📊 Cohort Analytics
//       </div>

//       {/* Stats row */}
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 24 }}>
//         {[
//           { label: "Candidates", value: ranked.length, icon: "👥" },
//           { label: "Avg ATS Score", value: avgAts, icon: "📋" },
//           { label: "Avg Composite", value: avgComposite, icon: "⚡" },
//           { label: "GitHub Linked", value: `${hasGh}/${ranked.length}`, icon: "🐙" },
//           { label: "LinkedIn Linked", value: `${hasLi}/${ranked.length}`, icon: "💼" },
//         ].map((stat, i) => (
//           <div key={i} style={{
//             textAlign: "center", padding: "14px 10px", borderRadius: 12,
//             background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
//           }}>
//             <div style={{ fontSize: 20, marginBottom: 4 }}>{stat.icon}</div>
//             <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 22, color: "#f1f0ff" }}>
//               {stat.value}
//             </div>
//             <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(200,195,230,0.4)", marginTop: 2 }}>
//               {stat.label}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Common skills */}
//       {topSkills.length > 0 && (
//         <div>
//           <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, color: "rgba(200,195,230,0.7)", marginBottom: 10 }}>
//             🔑 Skills Across All Resumes
//           </div>
//           <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
//             {topSkills.map(([skill, count], i) => (
//               <span key={i} style={{
//                 fontSize: 11, padding: "4px 10px", borderRadius: 8,
//                 background: count === ranked.length ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
//                 color: count === ranked.length ? "#818cf8" : "rgba(200,195,230,0.6)",
//                 border: `1px solid ${count === ranked.length ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.07)"}`,
//                 fontFamily: "'DM Mono',monospace",
//               }}>
//                 {skill} <span style={{ opacity: 0.6 }}>·{count}</span>
//               </span>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Score comparison bars */}
//       <div style={{ marginTop: 20 }}>
//         <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, color: "rgba(200,195,230,0.7)", marginBottom: 12 }}>
//           📈 Score Comparison
//         </div>
//         {ranked.map((c, i) => {
//           const composite = computeCompositeScore(c);
//           const color = RANK_COLORS[i]?.bg || "#6366f1";
//           return (
//             <div key={i} style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
//               <div style={{ width: 20, height: 20, borderRadius: 5, background: color,
//                 display: "flex", alignItems: "center", justifyContent: "center",
//                 fontSize: 9, fontWeight: 800, color: "#000", flexShrink: 0 }}>
//                 {i + 1}
//               </div>
//               <div style={{ flex: 1 }}>
//                 <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(200,195,230,0.6)", marginBottom: 3 }}>
//                   {c.atsResult?.candidateName || c.fileName}
//                 </div>
//                 <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
//                   <motion.div
//                     initial={{ width: 0 }}
//                     animate={{ width: `${composite}%` }}
//                     transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
//                     style={{ height: "100%", borderRadius: 4, background: color, boxShadow: `0 0 8px ${color}88` }}
//                   />
//                 </div>
//               </div>
//               <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 700,
//                 color: scoreColor(composite), width: 32, textAlign: "right" }}>
//                 {composite}
//               </span>
//             </div>
//           );
//         })}
//       </div>
//     </motion.div>
//   );
// }

// // ══════════════════════════════════════════════════════════════
// // LOADING SCREEN
// // ══════════════════════════════════════════════════════════════
// function LoadingScreen({ progress, currentStep }) {
//   return (
//     <motion.div
//       initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//       style={{ textAlign: "center", padding: "80px 24px" }}
//     >
//       <div style={{ position: "relative", width: 110, height: 110, margin: "0 auto 36px" }}>
//         {[0, 1, 2, 3].map((i) => (
//           <motion.div key={i}
//             animate={{ scale: [1, 1.6 + i * 0.2, 1], opacity: [0.6, 0, 0.6] }}
//             transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
//             style={{
//               position: "absolute", inset: 0, borderRadius: "50%",
//               border: `2px solid rgba(99,102,241,${0.5 - i * 0.1})`,
//             }} />
//         ))}
//         <div style={{
//           position: "absolute", inset: 0, display: "flex",
//           alignItems: "center", justifyContent: "center", fontSize: 40,
//         }}>🏆</div>
//       </div>

//       <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 24, color: "#f1f0ff", marginBottom: 8 }}>
//         Ranking Resumes...
//       </div>
//       <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: "#818cf8", marginBottom: 28, letterSpacing: "0.08em" }}>
//         {currentStep}
//       </div>

//       {/* Progress bar */}
//       <div style={{ maxWidth: 400, margin: "0 auto", marginBottom: 20 }}>
//         <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
//           <motion.div
//             animate={{ width: `${progress}%` }}
//             transition={{ duration: 0.5 }}
//             style={{ height: "100%", borderRadius: 3,
//               background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)",
//               boxShadow: "0 0 12px #6366f188" }}
//           />
//         </div>
//         <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(200,195,230,0.4)", marginTop: 8 }}>
//           {progress}% complete
//         </div>
//       </div>
//     </motion.div>
//   );
// }

// // ══════════════════════════════════════════════════════════════
// // MAIN COMPONENT
// // ══════════════════════════════════════════════════════════════
// export default function ResumeRanker({ onBack }) {
//   const [files, setFiles] = useState(Array(MAX_RESUMES).fill(null));
//   const [linkedinTexts, setLinkedinTexts] = useState(Array(MAX_RESUMES).fill(""));
//   const [jdText, setJdText] = useState("");
//   const [jdMode, setJdMode] = useState("text"); // "text" | "file"
//   const [jdFile, setJdFile] = useState(null);
//   const jdFileRef = useRef(null);

//   const [analyzing, setAnalyzing] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [currentStep, setCurrentStep] = useState("");
//   const [results, setResults] = useState(null); // { ranked, improvements }

//   const filledSlots = files.filter(Boolean);
//   const canRank = filledSlots.length >= 2 && (jdText.trim().length >= 20 || jdFile);

//   const handleAddFile = useCallback((file, index) => {
//     setFiles((prev) => { const next = [...prev]; next[index] = file; return next; });
//   }, []);

//   const handleRemoveFile = useCallback((index) => {
//     setFiles((prev) => { const next = [...prev]; next[index] = null; return next; });
//     setLinkedinTexts((prev) => { const next = [...prev]; next[index] = ""; return next; });
//   }, []);

//   const handleLinkedinChange = useCallback((index, text) => {
//     setLinkedinTexts((prev) => { const next = [...prev]; next[index] = text; return next; });
//   }, []);

//   const handleRank = async () => {
//     if (!canRank) return;
//     setAnalyzing(true);
//     setProgress(0);
//     setResults(null);

//     const apiKey = import.meta.env.VITE_GROQ_API_KEY;
//     if (!apiKey) {
//       alert("❌ VITE_GROQ_API_KEY not found in client/.env");
//       setAnalyzing(false);
//       return;
//     }

//     try {
//       // ── Get JD text ──
//       let jd = jdText;
//       if (jdMode === "file" && jdFile) {
//         jd = await extractTextFromFile(jdFile);
//       }

//       const activeFiles = files.map((f, i) => ({ file: f, linkedin: linkedinTexts[i] })).filter((x) => x.file);

//       // ── Analyze each resume ──
//       const analyzed = [];
//       for (let i = 0; i < activeFiles.length; i++) {
//         setCurrentStep(`Analyzing resume ${i + 1} of ${activeFiles.length}: ${activeFiles[i].file.name}`);
//         setProgress(Math.round(((i) / activeFiles.length) * 60));

//         const data = await analyzeResume({
//           file: activeFiles[i].file,
//           jdText: jd,
//           linkedinText: activeFiles[i].linkedin,
//           apiKey,
//         });
//         analyzed.push(data);
//       }

//       setProgress(65);
//       setCurrentStep("Computing composite scores...");

//       // ── Rank by composite score ──
//       const ranked = [...analyzed].sort((a, b) => computeCompositeScore(b) - computeCompositeScore(a));

//       setProgress(75);
//       setCurrentStep("Generating personalized improvement plans...");

//       // ── Generate improvements for rank 3,4,5 ──
//       const improvements = {};
//       const needsImprovement = ranked.slice(2);
//       for (let i = 0; i < needsImprovement.length; i++) {
//         const candidate = needsImprovement[i];
//         const rank = i + 3;
//         setCurrentStep(`Creating improvement plan for #${rank}: ${candidate.atsResult?.candidateName || candidate.fileName}`);
//         setProgress(75 + Math.round((i / needsImprovement.length) * 20));
//         improvements[candidate.fileName] = await generateImprovements({ candidate, rank, jdText: jd, apiKey });
//       }

//       setProgress(100);
//       setCurrentStep("Done! Building leaderboard...");

//       await new Promise((r) => setTimeout(r, 600));
//       setResults({ ranked, improvements });
//       setAnalyzing(false);

//     } catch (err) {
//       console.error(err);
//       alert(`❌ Error: ${err.message}`);
//       setAnalyzing(false);
//     }
//   };

//   const reset = () => {
//     setFiles(Array(MAX_RESUMES).fill(null));
//     setLinkedinTexts(Array(MAX_RESUMES).fill(""));
//     setJdText("");
//     setJdFile(null);
//     setResults(null);
//     setProgress(0);
//   };

//   return (
//     <div style={{
//       minHeight: "100vh",
//       background: "linear-gradient(145deg, #06040f 0%, #0e0720 40%, #060c1c 100%)",
//       padding: "40px 24px",
//       position: "relative", overflow: "hidden",
//     }}>
//       {/* Background effects */}
//       <div style={{ position: "fixed", width: 700, height: 700, borderRadius: "50%", top: "-20%", left: "-10%",
//         background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
//         filter: "blur(80px)", pointerEvents: "none" }} />
//       <div style={{ position: "fixed", width: 500, height: 500, borderRadius: "50%", bottom: "-15%", right: "-5%",
//         background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)",
//         filter: "blur(70px)", pointerEvents: "none" }} />
//       <div style={{ position: "fixed", inset: 0,
//         backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`,
//         backgroundSize: "60px 60px", pointerEvents: "none" }} />

//       <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>

//         <AnimatePresence mode="wait">
//           {analyzing ? (
//             <LoadingScreen key="loading" progress={progress} currentStep={currentStep} />
//           ) : results ? (
//             /* ═══════════════════════════════════════════════ RESULTS */
//             <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

//               {/* Header */}
//               <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
//                 <div>
//                   <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
//                     <div style={{
//                       width: 44, height: 44, borderRadius: 12,
//                       background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
//                       display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
//                       boxShadow: "0 0 30px rgba(99,102,241,0.5)",
//                     }}>🏆</div>
//                     <h1 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 28, color: "#f1f0ff", margin: 0 }}>
//                       Resume Leaderboard
//                     </h1>
//                   </div>
//                   <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "rgba(200,195,230,0.4)", margin: 0, letterSpacing: "0.08em" }}>
//                     {results.ranked.length} CANDIDATES · RANKED BY COMPOSITE SCORE
//                   </p>
//                 </div>
//                 <div style={{ display: "flex", gap: 10 }}>
//                   <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
//                     onClick={reset}
//                     style={{
//                       padding: "10px 20px", borderRadius: 12, cursor: "pointer",
//                       background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
//                       color: "rgba(200,195,230,0.7)", fontFamily: "'Outfit',sans-serif",
//                       fontSize: 13, fontWeight: 600,
//                     }}>
//                     🔄 New Ranking
//                   </motion.button>
//                   {onBack && (
//                     <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
//                       onClick={onBack}
//                       style={{
//                         padding: "10px 20px", borderRadius: 12, cursor: "pointer",
//                         background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)",
//                         color: "#818cf8", fontFamily: "'Outfit',sans-serif",
//                         fontSize: 13, fontWeight: 600,
//                       }}>
//                       ← Dashboard
//                     </motion.button>
//                   )}
//                 </div>
//               </div>

//               {/* Analytics panel */}
//               <AnalyticsPanel ranked={results.ranked} />

//               {/* Ranked cards */}
//               <div>
//                 {results.ranked.map((candidate, i) => (
//                   <RankedCard
//                     key={candidate.fileName + i}
//                     candidate={candidate}
//                     rank={i + 1}
//                     improvements={results.improvements[candidate.fileName]}
//                     jdText={jdText}
//                   />
//                 ))}
//               </div>

//               {/* Footer note */}
//               <div style={{ textAlign: "center", marginTop: 32, padding: "20px",
//                 borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
//                 <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.4)", margin: 0, lineHeight: 1.7 }}>
//                   🏅 Scores are computed as: <strong style={{ color: "rgba(200,195,230,0.6)" }}>50% ATS</strong>
//                   {" + "}<strong style={{ color: "rgba(200,195,230,0.6)" }}>30% GitHub</strong>
//                   {" + "}<strong style={{ color: "rgba(200,195,230,0.6)" }}>20% LinkedIn</strong> (when available).<br />
//                   Improvement plans are generated only for candidates ranked 3rd and below.
//                 </p>
//               </div>
//             </motion.div>

//           ) : (
//             /* ═══════════════════════════════════════════════ UPLOAD FORM */
//             <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

//               {/* Header */}
//               <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: 40 }}>
//                 <motion.div
//                   initial={{ scale: 0 }} animate={{ scale: 1 }}
//                   transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
//                   style={{
//                     width: 70, height: 70, borderRadius: 20, margin: "0 auto 16px",
//                     background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)",
//                     display: "flex", alignItems: "center", justifyContent: "center",
//                     fontSize: 32, boxShadow: "0 0 50px rgba(99,102,241,0.6)",
//                   }}>🏆</motion.div>
//                 <h1 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900,
//                   fontSize: "clamp(24px, 4vw, 36px)", color: "#f1f0ff", marginBottom: 8 }}>
//                   Resume Ranker
//                 </h1>
//                 <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "rgba(200,195,230,0.55)", maxWidth: 500, margin: "0 auto" }}>
//                   Upload up to 5 resumes for a Job Description. We'll rank them by composite score across ATS, GitHub & LinkedIn metrics.
//                 </p>
//                 {onBack && (
//                   <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
//                     onClick={onBack}
//                     style={{
//                       marginTop: 16, padding: "8px 18px", borderRadius: 10, cursor: "pointer",
//                       background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
//                       color: "rgba(200,195,230,0.5)", fontFamily: "'Outfit',sans-serif", fontSize: 12,
//                     }}>
//                     ← Back to Dashboard
//                   </motion.button>
//                 )}
//               </motion.div>

//               {/* JD Section */}
//               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
//                 style={{ padding: "24px", borderRadius: 20,
//                   background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
//                 <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#34d399", letterSpacing: "0.12em", marginBottom: 14 }}>
//                   STEP 1 — JOB DESCRIPTION
//                 </div>

//                 {/* JD Mode toggle */}
//                 <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
//                   {[
//                     { key: "text", label: "📝 Paste Text" },
//                     { key: "file", label: "📄 Upload PDF/DOCX" },
//                   ].map((m) => (
//                     <button key={m.key} onClick={() => setJdMode(m.key)}
//                       style={{
//                         padding: "7px 16px", borderRadius: 10, cursor: "pointer",
//                         background: jdMode === m.key ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.03)",
//                         border: `1px solid ${jdMode === m.key ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.08)"}`,
//                         color: jdMode === m.key ? "#34d399" : "rgba(200,195,230,0.5)",
//                         fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600,
//                         transition: "all 0.2s",
//                       }}>
//                       {m.label}
//                     </button>
//                   ))}
//                 </div>

//                 {jdMode === "text" ? (
//                   <textarea value={jdText} onChange={(e) => setJdText(e.target.value.slice(0, 1200))}
//                     placeholder={`Paste the Job Description here...\n\nExample:\nRole: Senior Frontend Developer\nRequired Skills: React, TypeScript, Node.js\nNice to have: Docker, AWS, GraphQL\nExperience: 2-4 years`}
//                     style={{
//                       width: "100%", minHeight: 160, borderRadius: 14, padding: "14px 16px", boxSizing: "border-box",
//                       background: "rgba(255,255,255,0.03)",
//                       border: jdText ? "1.5px solid #34d39966" : "2px dashed #34d39944",
//                       color: "#f1f0ff", fontSize: 13, fontFamily: "'DM Sans',sans-serif",
//                       lineHeight: 1.7, resize: "vertical", outline: "none",
//                     }} />
//                 ) : (
//                   <div>
//                     <div
//                       onClick={() => jdFileRef.current.click()}
//                       style={{
//                         borderRadius: 14, border: `2px dashed ${jdFile ? "#34d39966" : "#34d39933"}`,
//                         background: jdFile ? "rgba(52,211,153,0.05)" : "transparent",
//                         padding: "28px", textAlign: "center", cursor: "pointer",
//                       }}
//                     >
//                       <div style={{ fontSize: 30, marginBottom: 8 }}>{jdFile ? "✅" : "📄"}</div>
//                       <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: jdFile ? "#34d399" : "rgba(200,195,230,0.5)" }}>
//                         {jdFile ? jdFile.name : "Click to upload JD as PDF or DOCX"}
//                       </div>
//                       <input ref={jdFileRef} type="file" accept=".pdf,.docx"
//                         onChange={(e) => { setJdFile(e.target.files[0]); e.target.value = ""; }}
//                         style={{ display: "none" }} />
//                     </div>
//                     {jdFile && (
//                       <button onClick={() => setJdFile(null)}
//                         style={{ marginTop: 8, fontSize: 11, background: "none", border: "none",
//                           color: "#f87171", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
//                         ✕ Remove
//                       </button>
//                     )}
//                   </div>
//                 )}
//               </motion.div>

//               {/* Resume Slots */}
//               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
//                 style={{ padding: "24px", borderRadius: 20,
//                   background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 24 }}>
//                 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
//                   <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#a78bfa", letterSpacing: "0.12em" }}>
//                     STEP 2 — UPLOAD RESUMES (2–5 resumes)
//                   </div>
//                   <div style={{
//                     fontFamily: "'DM Mono',monospace", fontSize: 10,
//                     color: filledSlots.length >= 2 ? "#22c55e" : "#f59e0b",
//                     padding: "4px 10px", borderRadius: 8,
//                     background: filledSlots.length >= 2 ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
//                     border: `1px solid ${filledSlots.length >= 2 ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}`,
//                   }}>
//                     {filledSlots.length}/{MAX_RESUMES} uploaded
//                   </div>
//                 </div>
//                 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
//                   {Array(MAX_RESUMES).fill(null).map((_, i) => (
//                     <ResumeSlot
//                       key={i}
//                       index={i}
//                       file={files[i]}
//                       onAdd={handleAddFile}
//                       onRemove={handleRemoveFile}
//                       linkedinText={linkedinTexts[i]}
//                       onLinkedinChange={handleLinkedinChange}
//                     />
//                   ))}
//                 </div>
//               </motion.div>

//               {/* Scoring info */}
//               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
//                 style={{ padding: "16px 20px", borderRadius: 14,
//                   background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", marginBottom: 24 }}>
//                 <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, color: "#818cf8", marginBottom: 10 }}>
//                   ⚡ How Composite Score Works
//                 </div>
//                 <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
//                   {[
//                     { label: "ATS Score", weight: "50%", icon: "📋", color: "#60a5fa" },
//                     { label: "GitHub Trust", weight: "30%", icon: "🐙", color: "#34d399" },
//                     { label: "LinkedIn Score", weight: "20%", icon: "💼", color: "#60a5fa" },
//                   ].map((item, i) => (
//                     <div key={i} style={{
//                       display: "flex", alignItems: "center", gap: 8,
//                       padding: "8px 14px", borderRadius: 10,
//                       background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
//                     }}>
//                       <span>{item.icon}</span>
//                       <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.7)" }}>{item.label}</span>
//                       <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 700, color: item.color }}>{item.weight}</span>
//                     </div>
//                   ))}
//                 </div>
//                 <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(200,195,230,0.4)", margin: "10px 0 0",lineHeight: 1.6 }}>
//                   GitHub & LinkedIn are optional. If not provided, score is weighted purely on ATS analysis. Candidates ranked 3rd+ receive a personalized AI improvement plan.
//                 </p>
//               </motion.div>

//               {/* Rank button */}
//               <AnimatePresence>
//                 {canRank && (
//                   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
//                     style={{ textAlign: "center" }}>
//                     <motion.button
//                       whileHover={{ scale: 1.05, boxShadow: "0 0 70px rgba(99,102,241,0.8)" }}
//                       whileTap={{ scale: 0.96 }}
//                       onClick={handleRank}
//                       style={{
//                         padding: "20px 70px", borderRadius: 20, border: "none",
//                         background: "linear-gradient(135deg, #4f46e5, #7c3aed, #6366f1)",
//                         color: "#fff", fontSize: 18, fontWeight: 900,
//                         fontFamily: "'Outfit',sans-serif", cursor: "pointer",
//                         boxShadow: "0 0 40px rgba(99,102,241,0.5)",
//                         letterSpacing: "0.05em", position: "relative", overflow: "hidden",
//                       }}
//                     >
//                       <motion.div
//                         animate={{ x: ["-100%", "200%"] }}
//                         transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
//                         style={{
//                           position: "absolute", inset: 0,
//                           background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
//                           pointerEvents: "none",
//                         }} />
//                       🏆 RANK {filledSlots.length} RESUMES
//                     </motion.button>
//                     <div style={{ marginTop: 10, fontFamily: "'DM Mono',monospace", fontSize: 10,
//                       color: "rgba(167,139,250,0.4)", letterSpacing: "0.1em" }}>
//                       POWERED BY GROQ AI + GITHUB API + LINKEDIN ANALYSIS
//                     </div>
//                   </motion.div>
//                 )}
//               </AnimatePresence>

//               {!canRank && (
//                 <div style={{ textAlign: "center", fontFamily: "'DM Sans',sans-serif", fontSize: 12,
//                   color: "rgba(200,195,230,0.35)", marginTop: 8 }}>
//                   {filledSlots.length < 2 ? "⬆️ Upload at least 2 resumes to start ranking" : "⬆️ Add a Job Description to proceed"}
//                 </div>
//               )}
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>

//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
//         textarea::placeholder { color: rgba(200,195,230,0.25); }
//         textarea::-webkit-scrollbar { width: 4px; }
//         textarea::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); border-radius: 2px; }
//         input::placeholder { color: rgba(200,195,230,0.3); }
//         * { box-sizing: border-box; }
//       `}</style>
//     </div>
//   );
// }













































// import { useState, useRef, useCallback } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useUser } from "@clerk/clerk-react";
// import * as pdfjsLib from "pdfjs-dist";

// pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
//   "pdfjs-dist/build/pdf.worker.min.mjs",
//   import.meta.url
// ).toString();

// // ══════════════════════════════════════════════════════════════
// // CONSTANTS
// // ══════════════════════════════════════════════════════════════
// const MAX_RESUMES = 5;
// const API_BASE    = "https://ai-smart-resume-analyzer-so1y.vercel.app/api";

// const RANK_COLORS = [
//   { bg: "#FFD700", glow: "#FFD70088", label: "GOLD",   icon: "🥇", text: "#1a1200" },
//   { bg: "#C0C0C0", glow: "#C0C0C088", label: "SILVER", icon: "🥈", text: "#0f0f0f" },
//   { bg: "#CD7F32", glow: "#CD7F3288", label: "BRONZE", icon: "🥉", text: "#1a0a00" },
//   { bg: "#6366f1", glow: "#6366f188", label: "4TH",    icon: "4️⃣", text: "#fff"    },
//   { bg: "#8b5cf6", glow: "#8b5cf688", label: "5TH",    icon: "5️⃣", text: "#fff"    },
// ];

// const SKILL_KEYWORDS = [
//   "javascript","typescript","python","java","c++","c#","go","golang","rust","ruby","php",
//   "swift","kotlin","scala","dart","react","next.js","vue","angular","svelte","html","css",
//   "sass","tailwind","redux","node.js","nodejs","express","nestjs","fastapi","django","flask",
//   "spring","graphql","rest api","mongodb","mysql","postgresql","redis","firebase","docker",
//   "kubernetes","aws","azure","gcp","terraform","git","figma","tensorflow","pytorch",
//   "machine learning","deep learning","linux","bash","ci/cd",
// ];

// // ══════════════════════════════════════════════════════════════
// // UTILS
// // ══════════════════════════════════════════════════════════════
// async function extractTextFromFile(file) {
//   if (file.type === "application/pdf") {
//     const buf = await file.arrayBuffer();
//     const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
//     let text = "";
//     for (let i = 1; i <= pdf.numPages; i++) {
//       const page    = await pdf.getPage(i);
//       const content = await page.getTextContent();
//       text += content.items.map((x) => x.str).join(" ") + "\n";
//     }
//     return text.trim();
//   } else {
//     return new Promise((res, rej) => {
//       const r = new FileReader();
//       r.onload  = () => res(r.result);
//       r.onerror = rej;
//       r.readAsText(file);
//     });
//   }
// }

// function extractSkills(text) {
//   const lower = text.toLowerCase();
//   const found = new Set();
//   for (const skill of SKILL_KEYWORDS) {
//     const escaped = skill.replace(/[.+]/g, "\\$&");
//     if (new RegExp(`(?<![a-z])${escaped}(?![a-z])`, "i").test(lower)) found.add(skill);
//   }
//   return [...found];
// }

// function extractProjects(text) {
//   const projects = new Set();
//   const p1 = /(?:project[s]?\s*[:\-–—]\s*)([A-Z][A-Za-z0-9 \-_]+)/gm;
//   const p2 = /(?:built|developed|created|designed|implemented)\s+(?:a\s+|an\s+|the\s+)?([A-Z][A-Za-z0-9 \-_]{3,35}?)(?:\s+using|\s+with|\s+in|\s+for|[.,\n])/g;
//   const p3 = /github\.com\/[a-zA-Z0-9_\-]+\/([a-zA-Z0-9_\-]+)/g;
//   let m;
//   while ((m = p1.exec(text)) !== null) { if (m[1].trim().length > 3) projects.add(m[1].trim().slice(0, 40)); }
//   while ((m = p2.exec(text)) !== null) { if (m[1].trim().length > 3) projects.add(m[1].trim()); }
//   while ((m = p3.exec(text)) !== null) { projects.add(m[1].replace(/[-_]/g, " ")); }
//   return [...projects].slice(0, 10);
// }

// function extractGithub(text) {
//   const patterns = [
//     /github\.com\/([a-zA-Z0-9_\-]{2,39})(?:\/|$|\s|"|')/g,
//     /github:\s*@?([a-zA-Z0-9_\-]{2,39})/gi,
//   ];
//   const skip = ["features","topics","explore","marketplace","enterprise","sponsors","about","login","signup","orgs"];
//   for (const pattern of patterns) {
//     const m = pattern.exec(text);
//     if (m && !skip.includes(m[1].toLowerCase())) return m[1];
//   }
//   return "";
// }

// function extractYears(text) {
//   const m = text.match(/(\d+)\+?\s*years?\s+(?:of\s+)?(?:experience|exp)/i);
//   return m ? parseInt(m[1]) : 1;
// }

// function parseJSON(raw) {
//   let clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
//   const s = clean.indexOf("{"), e = clean.lastIndexOf("}");
//   if (s === -1 || e === -1) throw new Error("No JSON found");
//   clean = clean.slice(s, e + 1);
//   try { return JSON.parse(clean); } catch {}
//   return JSON.parse(clean.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]"));
// }

// function scoreColor(score) {
//   if (score >= 80) return "#22c55e";
//   if (score >= 60) return "#f59e0b";
//   if (score >= 40) return "#f97316";
//   return "#ef4444";
// }

// function fmt(bytes) {
//   return bytes < 1024 * 1024
//     ? (bytes / 1024).toFixed(1) + " KB"
//     : (bytes / (1024 * 1024)).toFixed(1) + " MB";
// }

// // ══════════════════════════════════════════════════════════════
// // ANALYZE A SINGLE RESUME
// // ══════════════════════════════════════════════════════════════


// async function analyzeResume({ file, jdText, linkedinText, apiKey }) {
//   const resumeText   = await extractTextFromFile(file);
//   const skills       = extractSkills(resumeText);
//   const projects     = extractProjects(resumeText);
//   const claimedYears = extractYears(resumeText);
//   const githubUsername = extractGithub(resumeText);

//   // ── Groq AI (ATS + JD match) ──────────────────────────────
//   const prompt = `You are an expert ATS resume analyzer. Analyze the resume against the job description.
// Return ONLY a valid JSON object. No markdown, no text outside JSON.

// {
//   "candidateName": "full name from resume or 'Candidate'",
//   "overallScore": 75,
//   "scores": {
//     "keywordMatch":         { "score": 70, "details": "explanation", "keywords": ["React","Node.js"], "matched": ["React"], "missing": ["Docker"] },
//     "skillsMatch":          { "score": 80, "details": "explanation", "matched": ["React"], "missing": ["Docker"] },
//     "experienceRelevance":  { "score": 60, "details": "explanation" },
//     "educationMatch":       { "score": 90, "details": "explanation", "degree": "B.Tech CSE" },
//     "projectRelevance":     { "score": 70, "details": "explanation" },
//     "formattingScore":      { "score": 75, "details": "explanation", "atsIssues": ["issue"] },
//     "actionVerbScore":      { "score": 80, "details": "explanation", "goodVerbs": ["Built"], "weakPhrases": ["Worked on"] },
//     "achievementScore":     { "score": 65, "details": "explanation", "examples": ["example"] },
//     "grammarReadability":   { "score": 85, "details": "explanation" },
//     "atsCompatibility":     { "score": 70, "details": "explanation" },
//     "sectionCompleteness":  { "score": 75, "details": "explanation", "present": ["Skills"], "missing": ["Certifications"] }
//   },
//   "topStrengths": ["strength1", "strength2", "strength3"],
//   "criticalImprovements": ["improvement1", "improvement2", "improvement3"],
//   "jdSpecificImprovements": ["specific improvement 1", "specific improvement 2", "specific improvement 3"],
//   "verdict": "Overall assessment in 2 sentences."
// }

// RESUME:
// ${resumeText.slice(0, 1500)}

// JOB DESCRIPTION:
// ${jdText.slice(0, 800)}`;

//   const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//     method: "POST",
//     headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
//     body: JSON.stringify({
//       model: "llama-3.1-8b-instant",
//       messages: [
//         { role: "system", content: "You are an ATS resume analyzer. Always respond with valid JSON only." },
//         { role: "user",   content: prompt },
//       ],
//       temperature: 0.1,
//       max_tokens: 2000,
//     }),
//   });

//   if (!groqRes.ok) throw new Error("Groq API failed");
//   const groqData = await groqRes.json();
//   const result   = parseJSON(groqData.choices[0].message.content);

//   // ── GitHub metrics ────────────────────────────────────────
//   let githubMetrics = null;
//   if (githubUsername) {
//     try {
//       const ghRes = await fetch(`${API_BASE}/github-analyze`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           githubUsername,
//           resumeText: resumeText.slice(0, 1500),
//           resumeSkills: skills,
//           resumeProjects: projects,
//           claimedYears,
//         }),
//       });
//       const ghData = await ghRes.json();
//       if (ghData.success) githubMetrics = ghData.githubMetrics;
//     } catch {}
//   }

//   // ── LinkedIn metrics ──────────────────────────────────────
//   let linkedinMetrics = null;
//   if (linkedinText && linkedinText.trim().length > 50) {
//     try {
//       const liRes = await fetch(`${API_BASE}/linkedin-analyze`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           linkedinText,
//           jobRole: jdText.slice(0, 100),
//           resumeSkills: skills,
//         }),
//       });
//       const liData = await liRes.json();
//       if (liData.success) linkedinMetrics = liData.linkedinMetrics;
//     } catch {}
//   }

//   return {
//     fileName: file.name,
//     resumeText,
//     githubUsername,
//     atsResult: result,
//     githubMetrics,
//     linkedinMetrics,
//     skills,
//   };
// }



// // async function analyzeResume({ file, jdText, linkedinText, apiKey }) {
// //   const resumeText   = await extractTextFromFile(file);
// //   const skills       = extractSkills(resumeText);
// //   const projects     = extractProjects(resumeText);
// //   const claimedYears = extractYears(resumeText);
// //   const githubUsername = extractGithub(resumeText);

// //   // 🔍 DEBUG
// //   console.log("API KEY:", apiKey);

// //   const prompt = `You are an expert ATS resume analyzer. Analyze the resume against the job description.
// // Return ONLY a valid JSON object.

// // RESUME:
// // ${resumeText.slice(0, 1500)}

// // JOB DESCRIPTION:
// // ${jdText.slice(0, 800)}`;

// //   const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
// //     method: "POST",
// //     headers: {
// //       "Content-Type": "application/json",
// //       "Authorization": `Bearer ${apiKey}`
// //     },
// //     body: JSON.stringify({
// //       model: "llama-3.1-8b-instant",
// //       messages: [
// //         { role: "system", content: "Return valid JSON only" },
// //         { role: "user", content: prompt }
// //       ],
// //       temperature: 0.1,
// //       max_tokens: 2000
// //     })
// //   });

// //   // 🔍 DEBUG STATUS
// //   console.log("Groq Status:", groqRes.status);

// //   // ❌ ERROR HANDLING
// //   if (!groqRes.ok) {
// //     const errorText = await groqRes.text();
// //     console.error("❌ Groq API Error:", errorText);
// //     throw new Error(errorText);
// //   }

// //   // ✅ SUCCESS
// //   const groqData = await groqRes.json();
// //   console.log("✅ Groq Response:", groqData);

// //   const result = parseJSON(groqData.choices[0].message.content);

// //   return {
// //     fileName: file.name,
// //     resumeText,
// //     githubUsername,
// //     atsResult: result,
// //     skills
// //   };
// // }







// // ══════════════════════════════════════════════════════════════
// // COMPUTE COMPOSITE SCORE
// // ══════════════════════════════════════════════════════════════
// function computeCompositeScore(data) {
//   const atsScore = data.atsResult?.overallScore           ?? 0;
//   const ghScore  = data.githubMetrics?.trustScore         ?? null;
//   const liScore  = data.linkedinMetrics?.overallLinkedInScore ?? null;

//   let total = atsScore * 0.5, denominator = 0.5;
//   if (ghScore !== null) { total += ghScore * 0.3; denominator += 0.3; }
//   if (liScore !== null) { total += liScore * 0.2; denominator += 0.2; }
//   return Math.round(total / denominator);
// }

// // ══════════════════════════════════════════════════════════════
// // GENERATE IMPROVEMENTS VIA GROQ
// // ══════════════════════════════════════════════════════════════





// async function generateImprovements({ candidate, rank, jdText, apiKey }) {
//   const prompt = `You are a senior career coach. A candidate ranked #${rank} in a resume competition for this job.

// Candidate: ${candidate.atsResult?.candidateName || candidate.fileName}
// ATS Score: ${candidate.atsResult?.overallScore}/100
// GitHub Trust Score: ${candidate.githubMetrics?.trustScore ?? "N/A"}/100
// LinkedIn Score: ${candidate.linkedinMetrics?.overallLinkedInScore ?? "N/A"}/100
// Skills on resume: ${candidate.skills.slice(0, 15).join(", ")}
// Missing from JD: ${candidate.atsResult?.scores?.skillsMatch?.missing?.slice(0, 5).join(", ") || "Unknown"}
// Weak areas: ${Object.entries(candidate.atsResult?.scores || {}).filter(([, v]) => v.score < 65).map(([k, v]) => `${k}(${v.score})`).join(", ")}

// Job Description: ${jdText.slice(0, 400)}

// Return ONLY a valid JSON array of exactly 6 actionable improvement tips. Each tip must be specific, not generic.
// Format: ["tip1", "tip2", "tip3", "tip4", "tip5", "tip6"]`;

//   try {
//     const res  = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//       method: "POST",
//       headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
//       body: JSON.stringify({
//         model: "llama-3.1-8b-instant",
//         messages: [
//           { role: "system", content: "Return only a JSON array of strings. No markdown." },
//           { role: "user",   content: prompt },
//         ],
//         temperature: 0.3,
//         max_tokens: 800,
//       }),
//     });
//     const data  = await res.json();
//     const raw   = data.choices[0].message.content;
//     const clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
//     const s = clean.indexOf("["), e = clean.lastIndexOf("]");
//     return JSON.parse(clean.slice(s, e + 1));
//   } catch {
//     return candidate.atsResult?.jdSpecificImprovements || candidate.atsResult?.criticalImprovements || [];
//   }
// } 








// // async function generateImprovements({ candidate, rank, jdText, apiKey }) {
// //   console.log("API KEY (improvement):", apiKey);

// //   const prompt = `Give 6 improvement tips for resume`;

// //   const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
// //     method: "POST",
// //     headers: {
// //       "Content-Type": "application/json",
// //       "Authorization": `Bearer ${apiKey}`
// //     },
// //     body: JSON.stringify({
// //       model: "llama-3.1-8b-instant",
// //       messages: [
// //         { role: "system", content: "Return only JSON array" },
// //         { role: "user", content: prompt }
// //       ],
// //       temperature: 0.3,
// //       max_tokens: 800
// //     })
// //   });

// //   console.log("Groq Status (improvement):", res.status);

// //   if (!res.ok) {
// //     const errorText = await res.text();
// //     console.error("❌ Groq Error:", errorText);
// //     throw new Error(errorText);
// //   }

// //   const data = await res.json();
// //   console.log("✅ Groq Improvement Response:", data);

// //   return JSON.parse(data.choices[0].message.content);
// // }





// // ══════════════════════════════════════════════════════════════
// // RESUME SLOT CARD
// // ══════════════════════════════════════════════════════════════
// function ResumeSlot({ index, file, onAdd, onRemove, linkedinText, onLinkedinChange }) {
//   const inputRef = useRef(null);
//   const [dragging, setDragging]       = useState(false);
//   const [showLinkedin, setShowLinkedin] = useState(false);

//   const slotColors = [
//     { accent: "#60a5fa", glow: "#3b82f6" },
//     { accent: "#a78bfa", glow: "#7c3aed" },
//     { accent: "#34d399", glow: "#059669" },
//     { accent: "#f59e0b", glow: "#d97706" },
//     { accent: "#f472b6", glow: "#db2777" },
//   ];
//   const { accent, glow } = slotColors[index];

//   return (
//     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}
//       style={{ borderRadius: 16, border: `1.5px solid ${file ? accent + "55" : "rgba(255,255,255,0.08)"}`,
//         background: file ? `${accent}08` : "rgba(255,255,255,0.015)", padding: "16px", transition: "all 0.3s" }}>

//       {/* Slot header */}
//       <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
//         <div style={{ width: 28, height: 28, borderRadius: 8,
//           background: `linear-gradient(135deg, ${glow}, ${accent})`,
//           display: "flex", alignItems: "center", justifyContent: "center",
//           fontSize: 12, fontWeight: 800, color: "#fff", fontFamily: "'Outfit',sans-serif",
//           boxShadow: `0 0 12px ${glow}55` }}>{index + 1}</div>
//         <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, color: "#f1f0ff" }}>
//           Resume #{index + 1}
//         </span>
//         {!file && index > 0 && (
//           <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 100,
//             background: "rgba(255,255,255,0.05)", color: "rgba(200,195,230,0.4)",
//             border: "1px solid rgba(255,255,255,0.08)", fontFamily: "'DM Mono',monospace" }}>OPTIONAL</span>
//         )}
//         {index === 0 && (
//           <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 100,
//             background: `${glow}22`, color: accent, border: `1px solid ${glow}44`,
//             fontFamily: "'DM Mono',monospace" }}>REQUIRED</span>
//         )}
//       </div>

//       <AnimatePresence mode="wait">
//         {!file ? (
//           <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
//             onDragLeave={() => setDragging(false)}
//             onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onAdd(f, index); }}
//             onClick={() => inputRef.current.click()}
//             style={{ borderRadius: 12, border: `1.5px dashed ${dragging ? accent : accent + "33"}`,
//               background: dragging ? `${accent}10` : "transparent", padding: "20px 16px",
//               textAlign: "center", cursor: "pointer", transition: "all 0.2s" }}>
//             <div style={{ fontSize: 24, marginBottom: 6 }}>{dragging ? "📂" : "📄"}</div>
//             <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.5)" }}>
//               Drop PDF/DOCX or click
//             </div>
//             <input ref={inputRef} type="file" accept=".pdf,.docx"
//               onChange={(e) => { const f = e.target.files[0]; if (f) { onAdd(f, index); e.target.value = ""; } }}
//               style={{ display: "none" }} />
//           </motion.div>
//         ) : (
//           <motion.div key="file" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
//             <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
//               borderRadius: 10, background: `${accent}10`, border: `1px solid ${accent}30` }}>
//               <span style={{ fontSize: 20 }}>📄</span>
//               <div style={{ flex: 1, minWidth: 0 }}>
//                 <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 12, color: "#f1f0ff",
//                   overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
//                 <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: `${accent}bb`, marginTop: 2 }}>{fmt(file.size)}</div>
//               </div>
//               <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onRemove(index)}
//                 style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid rgba(248,113,113,0.3)",
//                   background: "rgba(248,113,113,0.1)", color: "#f87171", fontSize: 11, cursor: "pointer",
//                   display: "flex", alignItems: "center", justifyContent: "center" }}>✕</motion.button>
//             </div>

//             {/* LinkedIn toggle */}
//             <div style={{ marginTop: 10 }}>
//               <button onClick={() => setShowLinkedin(!showLinkedin)}
//                 style={{ background: showLinkedin ? "rgba(10,102,194,0.15)" : "rgba(255,255,255,0.03)",
//                   border: `1px solid ${showLinkedin ? "rgba(10,102,194,0.4)" : "rgba(255,255,255,0.08)"}`,
//                   borderRadius: 8, padding: "6px 12px", cursor: "pointer",
//                   color: showLinkedin ? "#60a5fa" : "rgba(200,195,230,0.5)",
//                   fontSize: 11, fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
//                   display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
//                 <span>💼</span>
//                 {showLinkedin ? "Hide LinkedIn" : "+ Add LinkedIn Profile"}
//               </button>
//               <AnimatePresence>
//                 {showLinkedin && (
//                   <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
//                     exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginTop: 8 }}>
//                     <textarea value={linkedinText} onChange={(e) => onLinkedinChange(index, e.target.value)}
//                       placeholder="Paste LinkedIn profile text here..."
//                       style={{ width: "100%", minHeight: 80, borderRadius: 10, padding: "10px 12px",
//                         boxSizing: "border-box", background: "rgba(10,102,194,0.06)",
//                         border: "1px solid rgba(10,102,194,0.25)", color: "#f1f0ff",
//                         fontSize: 11, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.6,
//                         resize: "vertical", outline: "none" }} />
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// }

// // ══════════════════════════════════════════════════════════════
// // METRIC BAR
// // ══════════════════════════════════════════════════════════════
// function MetricBar({ label, score, delay = 0 }) {
//   const color = scoreColor(score);
//   return (
//     <div style={{ marginBottom: 10 }}>
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
//         <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(200,195,230,0.7)" }}>{label}</span>
//         <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color, fontWeight: 700 }}>{score}</span>
//       </div>
//       <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
//         <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }}
//           transition={{ duration: 0.8, delay, ease: "easeOut" }}
//           style={{ height: "100%", borderRadius: 3, background: color, boxShadow: `0 0 6px ${color}` }} />
//       </div>
//     </div>
//   );
// }

// // ══════════════════════════════════════════════════════════════
// // SCORE PILL
// // ══════════════════════════════════════════════════════════════
// function ScorePill({ label, score, icon }) {
//   const color = scoreColor(score);
//   return (
//     <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 100,
//       background: `${color}12`, border: `1px solid ${color}33` }}>
//       <span style={{ fontSize: 12 }}>{icon}</span>
//       <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(200,195,230,0.6)" }}>{label}</span>
//       <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 700, color }}>{score}</span>
//     </div>
//   );
// }

// function SectionLabel({ icon, label, color }) {
//   return (
//     <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
//       <span>{icon}</span>
//       <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 12, color }}>{label}</span>
//     </div>
//   );
// }

// // ══════════════════════════════════════════════════════════════
// // RANKED CARD
// // ══════════════════════════════════════════════════════════════
// function RankedCard({ candidate, rank, improvements }) {
//   const [expanded, setExpanded] = useState(rank <= 2);
//   const rColor    = RANK_COLORS[rank - 1] || RANK_COLORS[4];
//   const composite = computeCompositeScore(candidate);
//   const ats       = candidate.atsResult;
//   const gh        = candidate.githubMetrics;
//   const li        = candidate.linkedinMetrics;
//   const isTop2    = rank <= 2;

//   return (
//     <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: rank * 0.12 }}
//       style={{ borderRadius: 20, border: `1.5px solid ${isTop2 ? rColor.bg + "66" : "rgba(255,255,255,0.08)"}`,
//         background: isTop2 ? `linear-gradient(135deg, ${rColor.bg}12, ${rColor.bg}05)` : "rgba(255,255,255,0.02)",
//         overflow: "hidden", boxShadow: isTop2 ? `0 0 40px ${rColor.glow}` : "none", marginBottom: 16 }}>

//       {/* Card header */}
//       <div onClick={() => setExpanded(!expanded)}
//         style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", cursor: "pointer", userSelect: "none" }}>
//         <motion.div whileHover={{ scale: 1.1 }}
//           style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: rColor.bg,
//             display: "flex", alignItems: "center", justifyContent: "center",
//             fontSize: 22, boxShadow: `0 0 20px ${rColor.glow}`, fontWeight: 900 }}>
//           {rColor.icon}
//         </motion.div>

//         <div style={{ flex: 1, minWidth: 0 }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
//             <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 17, color: "#f1f0ff" }}>
//               {ats?.candidateName || candidate.fileName}
//             </span>
//             <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 100,
//               background: `${rColor.bg}22`, color: rColor.bg,
//               border: `1px solid ${rColor.bg}44`, fontFamily: "'DM Mono',monospace", letterSpacing: "0.1em" }}>
//               #{rank} {rColor.label}
//             </span>
//           </div>
//           <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(200,195,230,0.4)", marginTop: 3 }}>
//             {candidate.fileName}{candidate.githubUsername && ` · @${candidate.githubUsername}`}
//           </div>
//         </div>

//         <div style={{ textAlign: "center", flexShrink: 0 }}>
//           <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 28,
//             color: scoreColor(composite), textShadow: `0 0 20px ${scoreColor(composite)}` }}>{composite}</div>
//           <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(200,195,230,0.4)" }}>COMPOSITE</div>
//         </div>

//         <motion.div animate={{ rotate: expanded ? 180 : 0 }}
//           style={{ fontSize: 16, color: "rgba(200,195,230,0.4)", flexShrink: 0 }}>▼</motion.div>
//       </div>

//       {/* Score pills */}
//       <div style={{ display: "flex", gap: 10, padding: "0 24px 16px", flexWrap: "wrap" }}>
//         <ScorePill label="ATS"      score={ats?.overallScore ?? 0}              icon="📋" />
//         {gh && <ScorePill label="GitHub"   score={gh.trustScore ?? 0}               icon="🐙" />}
//         {li && <ScorePill label="LinkedIn" score={li.overallLinkedInScore ?? 0}     icon="💼" />}
//       </div>

//       {/* Expanded content */}
//       <AnimatePresence>
//         {expanded && (
//           <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
//             exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
//             <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "20px 24px" }}>

//               <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 24 }}>
//                 {/* ATS */}
//                 <div>
//                   <SectionLabel icon="📋" label="ATS Resume Metrics" color="#60a5fa" />
//                   {ats?.scores && Object.entries(ats.scores).slice(0, 6).map(([key, val], i) => (
//                     <MetricBar key={key} label={key.replace(/([A-Z])/g, " $1").trim()} score={val.score ?? 0} delay={i * 0.05} />
//                   ))}
//                 </div>

//                 {/* GitHub */}
//                 {gh && (
//                   <div>
//                     <SectionLabel icon="🐙" label="GitHub Metrics" color="#34d399" />
//                     <MetricBar label="Skill Match"     score={gh.skillMatchScore ?? 0}    delay={0.1} />
//                     <MetricBar label="Tech Usage"      score={gh.techUsageScore ?? 0}     delay={0.15} />
//                     <MetricBar label="Project Match"   score={gh.projectMatchScore ?? 0}  delay={0.2} />
//                     <MetricBar label="Consistency"     score={gh.consistencyScore ?? 0}   delay={0.25} />
//                     <MetricBar label="Deployment"      score={gh.deploymentScore ?? 0}    delay={0.3} />
//                     <MetricBar label="Trust Score"     score={gh.trustScore ?? 0}         delay={0.35} />
//                   </div>
//                 )}

//                 {/* LinkedIn */}
//                 {li && (
//                   <div>
//                     <SectionLabel icon="💼" label="LinkedIn Metrics" color="#60a5fa" />
//                     <MetricBar label="Completeness"    score={li.scores?.completenessScore ?? 0}    delay={0.1} />
//                     <MetricBar label="Headline Quality" score={li.scores?.headlineScore ?? 0}       delay={0.15} />
//                     <MetricBar label="Skills Relevance" score={li.scores?.skillsRelevanceScore ?? 0} delay={0.2} />
//                     <MetricBar label="Experience Quality" score={li.scores?.expQualityScore ?? 0}   delay={0.25} />
//                     <MetricBar label="Branding"        score={li.scores?.brandingScore ?? 0}        delay={0.3} />
//                     <MetricBar label="Keyword Opt."    score={li.scores?.keywordScore ?? 0}         delay={0.35} />
//                   </div>
//                 )}
//               </div>

//               {/* Strengths */}
//               {ats?.topStrengths?.length > 0 && (
//                 <div style={{ marginBottom: 16 }}>
//                   <SectionLabel icon="⚡" label="Top Strengths" color="#22c55e" />
//                   <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
//                     {ats.topStrengths.map((s, i) => (
//                       <span key={i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8,
//                         background: "rgba(34,197,94,0.08)", color: "#22c55e",
//                         border: "1px solid rgba(34,197,94,0.2)", fontFamily: "'DM Sans',sans-serif" }}>✓ {s}</span>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Improvements for rank 3,4,5 */}
//               {!isTop2 && improvements && improvements.length > 0 && (
//                 <div style={{ marginTop: 16, padding: "16px", borderRadius: 14,
//                   background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.2)" }}>
//                   <SectionLabel icon="🚀" label="Personalized Improvement Plan" color="#f59e0b" />
//                   <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 8 }}>
//                     {improvements.map((tip, i) => (
//                       <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
//                         transition={{ delay: i * 0.07 }}
//                         style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px",
//                           borderRadius: 10, background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.1)" }}>
//                         <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0,
//                           background: "rgba(251,191,36,0.2)", color: "#f59e0b",
//                           display: "flex", alignItems: "center", justifyContent: "center",
//                           fontSize: 10, fontWeight: 800, fontFamily: "'DM Mono',monospace" }}>{i + 1}</span>
//                         <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12,
//                           color: "rgba(200,195,230,0.8)", lineHeight: 1.5 }}>{tip}</span>
//                       </motion.div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Top 2 verdict */}
//               {isTop2 && ats?.verdict && (
//                 <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12,
//                   background: `${rColor.bg}10`, border: `1px solid ${rColor.bg}30` }}>
//                   <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12,
//                     color: "rgba(200,195,230,0.8)", lineHeight: 1.6 }}>💬 {ats.verdict}</span>
//                 </div>
//               )}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// }

// // ══════════════════════════════════════════════════════════════
// // ANALYTICS PANEL
// // ══════════════════════════════════════════════════════════════
// function AnalyticsPanel({ ranked }) {
//   const allSkills   = ranked.flatMap((c) => c.skills);
//   const skillCounts = {};
//   allSkills.forEach((s) => { skillCounts[s] = (skillCounts[s] || 0) + 1; });
//   const topSkills     = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
//   const avgAts        = Math.round(ranked.reduce((s, c) => s + (c.atsResult?.overallScore ?? 0), 0) / ranked.length);
//   const avgComposite  = Math.round(ranked.reduce((s, c) => s + computeCompositeScore(c), 0) / ranked.length);

//   return (
//     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
//       style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)",
//         background: "rgba(255,255,255,0.02)", padding: "24px", marginBottom: 24 }}>
//       <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 16, color: "#f1f0ff", marginBottom: 20 }}>
//         📊 Cohort Analytics
//       </div>

//       <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 24 }}>
//         {[
//           { label: "Candidates",   value: ranked.length,                                              icon: "👥" },
//           { label: "Avg ATS",      value: avgAts,                                                     icon: "📋" },
//           { label: "Avg Composite",value: avgComposite,                                               icon: "⚡" },
//           { label: "GitHub Linked",value: `${ranked.filter((c) => c.githubMetrics).length}/${ranked.length}`, icon: "🐙" },
//           { label: "LinkedIn",     value: `${ranked.filter((c) => c.linkedinMetrics).length}/${ranked.length}`, icon: "💼" },
//         ].map((stat, i) => (
//           <div key={i} style={{ textAlign: "center", padding: "14px 10px", borderRadius: 12,
//             background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
//             <div style={{ fontSize: 20, marginBottom: 4 }}>{stat.icon}</div>
//             <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 22, color: "#f1f0ff" }}>{stat.value}</div>
//             <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(200,195,230,0.4)", marginTop: 2 }}>{stat.label}</div>
//           </div>
//         ))}
//       </div>

//       {/* Score comparison bars */}
//       <div style={{ marginBottom: 20 }}>
//         <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, color: "rgba(200,195,230,0.7)", marginBottom: 12 }}>
//           📈 Score Comparison
//         </div>
//         {ranked.map((c, i) => {
//           const composite = computeCompositeScore(c);
//           const color     = RANK_COLORS[i]?.bg || "#6366f1";
//           return (
//             <div key={i} style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
//               <div style={{ width: 20, height: 20, borderRadius: 5, background: color, flexShrink: 0,
//                 display: "flex", alignItems: "center", justifyContent: "center",
//                 fontSize: 9, fontWeight: 800, color: "#000" }}>{i + 1}</div>
//               <div style={{ flex: 1 }}>
//                 <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(200,195,230,0.6)", marginBottom: 3 }}>
//                   {c.atsResult?.candidateName || c.fileName}
//                 </div>
//                 <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
//                   <motion.div initial={{ width: 0 }} animate={{ width: `${composite}%` }}
//                     transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
//                     style={{ height: "100%", borderRadius: 4, background: color, boxShadow: `0 0 8px ${color}88` }} />
//                 </div>
//               </div>
//               <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 700,
//                 color: scoreColor(composite), width: 32, textAlign: "right" }}>{composite}</span>
//             </div>
//           );
//         })}
//       </div>

//       {/* Common skills */}
//       {topSkills.length > 0 && (
//         <div>
//           <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, color: "rgba(200,195,230,0.7)", marginBottom: 10 }}>
//             🔑 Skills Across All Resumes
//           </div>
//           <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
//             {topSkills.map(([skill, count], i) => (
//               <span key={i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8,
//                 background: count === ranked.length ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
//                 color: count === ranked.length ? "#818cf8" : "rgba(200,195,230,0.6)",
//                 border: `1px solid ${count === ranked.length ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.07)"}`,
//                 fontFamily: "'DM Mono',monospace" }}>
//                 {skill} <span style={{ opacity: 0.6 }}>·{count}</span>
//               </span>
//             ))}
//           </div>
//         </div>
//       )}
//     </motion.div>
//   );
// }

// // ══════════════════════════════════════════════════════════════
// // LOADING SCREEN
// // ══════════════════════════════════════════════════════════════
// function LoadingScreen({ progress, currentStep }) {
//   return (
//     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//       style={{ textAlign: "center", padding: "80px 24px" }}>
//       <div style={{ position: "relative", width: 110, height: 110, margin: "0 auto 36px" }}>
//         {[0, 1, 2, 3].map((i) => (
//           <motion.div key={i} animate={{ scale: [1, 1.6 + i * 0.2, 1], opacity: [0.6, 0, 0.6] }}
//             transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
//             style={{ position: "absolute", inset: 0, borderRadius: "50%",
//               border: `2px solid rgba(99,102,241,${0.5 - i * 0.1})` }} />
//         ))}
//         <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🏆</div>
//       </div>
//       <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 24, color: "#f1f0ff", marginBottom: 8 }}>
//         Ranking Resumes...
//       </div>
//       <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: "#818cf8", marginBottom: 28, letterSpacing: "0.08em" }}>
//         {currentStep}
//       </div>
//       <div style={{ maxWidth: 400, margin: "0 auto", marginBottom: 20 }}>
//         <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
//           <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }}
//             style={{ height: "100%", borderRadius: 3,
//               background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)",
//               boxShadow: "0 0 12px #6366f188" }} />
//         </div>
//         <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(200,195,230,0.4)", marginTop: 8 }}>
//           {progress}% complete
//         </div>
//       </div>
//     </motion.div>
//   );
// }

// // ══════════════════════════════════════════════════════════════
// // MAIN COMPONENT
// // ══════════════════════════════════════════════════════════════
// export default function ResumeRanker({ onBack }) {
//   const { user } = useUser();

//   const [files, setFiles]               = useState(Array(MAX_RESUMES).fill(null));
//   const [linkedinTexts, setLinkedinTexts] = useState(Array(MAX_RESUMES).fill(""));
//   const [jdText, setJdText]             = useState("");
//   const [jdMode, setJdMode]             = useState("text");
//   const [jdFile, setJdFile]             = useState(null);
//   const jdFileRef                       = useRef(null);

//   const [analyzing, setAnalyzing]       = useState(false);
//   const [progress, setProgress]         = useState(0);
//   const [currentStep, setCurrentStep]   = useState("");
//   const [results, setResults]           = useState(null);
//   const [savedToDb, setSavedToDb]       = useState(false);

//   const filledSlots = files.filter(Boolean);
//   const canRank     = filledSlots.length >= 2 && (jdText.trim().length >= 20 || jdFile);

//   const handleAddFile     = useCallback((file, index) => { setFiles((prev) => { const next = [...prev]; next[index] = file; return next; }); }, []);
//   const handleRemoveFile  = useCallback((index) => { setFiles((prev) => { const next = [...prev]; next[index] = null; return next; }); setLinkedinTexts((prev) => { const next = [...prev]; next[index] = ""; return next; }); }, []);
//   const handleLinkedinChange = useCallback((index, text) => { setLinkedinTexts((prev) => { const next = [...prev]; next[index] = text; return next; }); }, []);

//   // ── Save ranking to MongoDB ──────────────────────────────
//   const saveRankingToDb = async (ranked, improvements, jd) => {
//     try {
//       const response = await fetch(`${API_BASE}/rankings/save`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           clerkUserId:    user?.id              || "guest",
//           userName:       `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
//           userEmail:      user?.emailAddresses?.[0]?.emailAddress || "",
//           jobDescription: jd.slice(0, 500),
//           ranked,
//           improvements,
//         }),
//       });
//       const data = await response.json();
//       if (data.success) {
//         console.log("✅ Ranking saved to MongoDB — winner:", data.ranking.winner.candidateName);
//         setSavedToDb(true);
//       }
//     } catch (err) {
//       console.warn("⚠️ Could not save ranking:", err.message);
//     }
//   };

//   const handleRank = async () => {
//     if (!canRank) return;
//     setAnalyzing(true);
//     setProgress(0);
//     setResults(null);
//     setSavedToDb(false);

//     const apiKey = import.meta.env.VITE_GROQ_API_KEY;
//     if (!apiKey) {
//       alert("❌ VITE_GROQ_API_KEY not found in client/.env");
//       setAnalyzing(false);
//       return;
//     }

//     try {
//       let jd = jdText;
//       if (jdMode === "file" && jdFile) jd = await extractTextFromFile(jdFile);

//       const activeFiles = files.map((f, i) => ({ file: f, linkedin: linkedinTexts[i] })).filter((x) => x.file);

//       // ── Analyze each resume ────────────────────────────────
//       const analyzed = [];
//       for (let i = 0; i < activeFiles.length; i++) {
//         setCurrentStep(`Analyzing resume ${i + 1} of ${activeFiles.length}: ${activeFiles[i].file.name}`);
//         setProgress(Math.round((i / activeFiles.length) * 60));
//         const data = await analyzeResume({ file: activeFiles[i].file, jdText: jd, linkedinText: activeFiles[i].linkedin, apiKey });
//         analyzed.push(data);
//       }

//       setProgress(65);
//       setCurrentStep("Computing composite scores...");

//       // ── Rank by composite score ────────────────────────────
//       const ranked = [...analyzed].sort((a, b) => computeCompositeScore(b) - computeCompositeScore(a));

//       setProgress(75);
//       setCurrentStep("Generating personalized improvement plans...");

//       // ── Generate improvements for rank 3,4,5 ──────────────
//       const improvements = {};
//       const needsImprovement = ranked.slice(2);
//       for (let i = 0; i < needsImprovement.length; i++) {
//         const candidate = needsImprovement[i];
//         const rank = i + 3;
//         setCurrentStep(`Creating improvement plan for #${rank}: ${candidate.atsResult?.candidateName || candidate.fileName}`);
//         setProgress(75 + Math.round((i / needsImprovement.length) * 15));
//         improvements[candidate.fileName] = await generateImprovements({ candidate, rank, jdText: jd, apiKey });
//       }

//       setProgress(92);
//       setCurrentStep("Saving ranking to database...");

//       // ── Save to MongoDB ────────────────────────────────────
//       await saveRankingToDb(ranked, improvements, jd);

//       setProgress(100);
//       setCurrentStep("Done! Building leaderboard...");
//       await new Promise((r) => setTimeout(r, 600));

//       setResults({ ranked, improvements });
//       setAnalyzing(false);

//     } catch (err) {
//       console.error(err);
//       alert(`❌ Error: ${err.message}`);
//       setAnalyzing(false);
//     }
//   };

//   const reset = () => {
//     setFiles(Array(MAX_RESUMES).fill(null));
//     setLinkedinTexts(Array(MAX_RESUMES).fill(""));
//     setJdText("");
//     setJdFile(null);
//     setResults(null);
//     setProgress(0);
//     setSavedToDb(false);
//   };

//   return (
//     <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #06040f 0%, #0e0720 40%, #060c1c 100%)",
//       padding: "40px 24px", position: "relative", overflow: "hidden" }}>
//       {/* Background */}
//       <div style={{ position: "fixed", width: 700, height: 700, borderRadius: "50%", top: "-20%", left: "-10%",
//         background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
//         filter: "blur(80px)", pointerEvents: "none" }} />
//       <div style={{ position: "fixed", width: 500, height: 500, borderRadius: "50%", bottom: "-15%", right: "-5%",
//         background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)",
//         filter: "blur(70px)", pointerEvents: "none" }} />
//       <div style={{ position: "fixed", inset: 0,
//         backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`,
//         backgroundSize: "60px 60px", pointerEvents: "none" }} />

//       <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>
//         <AnimatePresence mode="wait">

//           {/* LOADING */}
//           {analyzing && <LoadingScreen key="loading" progress={progress} currentStep={currentStep} />}

//           {/* RESULTS */}
//           {!analyzing && results && (
//             <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

//               {/* Header */}
//               <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
//                 <div>
//                   <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
//                     <div style={{ width: 44, height: 44, borderRadius: 12,
//                       background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
//                       display: "flex", alignItems: "center", justifyContent: "center",
//                       fontSize: 22, boxShadow: "0 0 30px rgba(99,102,241,0.5)" }}>🏆</div>
//                     <h1 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 28, color: "#f1f0ff", margin: 0 }}>
//                       Resume Leaderboard
//                     </h1>
//                   </div>
//                   <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                     <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "rgba(200,195,230,0.4)", margin: 0, letterSpacing: "0.08em" }}>
//                       {results.ranked.length} CANDIDATES · RANKED BY COMPOSITE SCORE
//                     </p>
//                     {savedToDb && (
//                       <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100,
//                         background: "rgba(52,211,153,0.15)", color: "#34d399",
//                         border: "1px solid rgba(52,211,153,0.3)", fontFamily: "'DM Mono',monospace" }}>
//                         ✅ SAVED TO DB
//                       </span>
//                     )}
//                   </div>
//                 </div>
//                 <div style={{ display: "flex", gap: 10 }}>
//                   <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={reset}
//                     style={{ padding: "10px 20px", borderRadius: 12, cursor: "pointer",
//                       background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
//                       color: "rgba(200,195,230,0.7)", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600 }}>
//                     🔄 New Ranking
//                   </motion.button>
//                   {onBack && (
//                     <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBack}
//                       style={{ padding: "10px 20px", borderRadius: 12, cursor: "pointer",
//                         background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)",
//                         color: "#818cf8", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600 }}>
//                       ← Dashboard
//                     </motion.button>
//                   )}
//                 </div>
//               </div>

//               <AnalyticsPanel ranked={results.ranked} />

//               {results.ranked.map((candidate, i) => (
//                 <RankedCard key={candidate.fileName + i} candidate={candidate} rank={i + 1}
//                   improvements={results.improvements[candidate.fileName]} />
//               ))}

//               <div style={{ textAlign: "center", marginTop: 32, padding: "20px", borderRadius: 16,
//                 background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
//                 <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.4)", margin: 0, lineHeight: 1.7 }}>
//                   🏅 Scores: <strong style={{ color: "rgba(200,195,230,0.6)" }}>50% ATS</strong>
//                   {" + "}<strong style={{ color: "rgba(200,195,230,0.6)" }}>30% GitHub</strong>
//                   {" + "}<strong style={{ color: "rgba(200,195,230,0.6)" }}>20% LinkedIn</strong> (when available)
//                 </p>
//               </div>
//             </motion.div>
//           )}

//           {/* UPLOAD FORM */}
//           {!analyzing && !results && (
//             <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

//               {/* Header */}
//               <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: 40 }}>
//                 <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
//                   transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
//                   style={{ width: 70, height: 70, borderRadius: 20, margin: "0 auto 16px",
//                     background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)",
//                     display: "flex", alignItems: "center", justifyContent: "center",
//                     fontSize: 32, boxShadow: "0 0 50px rgba(99,102,241,0.6)" }}>🏆</motion.div>
//                 <h1 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900,
//                   fontSize: "clamp(24px, 4vw, 36px)", color: "#f1f0ff", marginBottom: 8 }}>
//                   Resume Ranker
//                 </h1>
//                 <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "rgba(200,195,230,0.55)", maxWidth: 500, margin: "0 auto" }}>
//                   Upload up to 5 resumes. We'll rank them and save results to your history.
//                 </p>
//                 {onBack && (
//                   <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBack}
//                     style={{ marginTop: 16, padding: "8px 18px", borderRadius: 10, cursor: "pointer",
//                       background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
//                       color: "rgba(200,195,230,0.5)", fontFamily: "'Outfit',sans-serif", fontSize: 12 }}>
//                     ← Back to Dashboard
//                   </motion.button>
//                 )}
//               </motion.div>

//               {/* JD Section */}
//               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
//                 style={{ padding: "24px", borderRadius: 20, background: "rgba(255,255,255,0.02)",
//                   border: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
//                 <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#34d399", letterSpacing: "0.12em", marginBottom: 14 }}>
//                   STEP 1 — JOB DESCRIPTION
//                 </div>
//                 <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
//                   {[{ key: "text", label: "📝 Paste Text" }, { key: "file", label: "📄 Upload PDF/DOCX" }].map((m) => (
//                     <button key={m.key} onClick={() => setJdMode(m.key)}
//                       style={{ padding: "7px 16px", borderRadius: 10, cursor: "pointer",
//                         background: jdMode === m.key ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.03)",
//                         border: `1px solid ${jdMode === m.key ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.08)"}`,
//                         color: jdMode === m.key ? "#34d399" : "rgba(200,195,230,0.5)",
//                         fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, transition: "all 0.2s" }}>
//                       {m.label}
//                     </button>
//                   ))}
//                 </div>
//                 {jdMode === "text" ? (
//                   <textarea value={jdText} onChange={(e) => setJdText(e.target.value.slice(0, 1200))}
//                     placeholder="Paste the Job Description here..."
//                     style={{ width: "100%", minHeight: 160, borderRadius: 14, padding: "14px 16px", boxSizing: "border-box",
//                       background: "rgba(255,255,255,0.03)",
//                       border: jdText ? "1.5px solid #34d39966" : "2px dashed #34d39944",
//                       color: "#f1f0ff", fontSize: 13, fontFamily: "'DM Sans',sans-serif",
//                       lineHeight: 1.7, resize: "vertical", outline: "none" }} />
//                 ) : (
//                   <div>
//                     <div onClick={() => jdFileRef.current.click()}
//                       style={{ borderRadius: 14, border: `2px dashed ${jdFile ? "#34d39966" : "#34d39933"}`,
//                         background: jdFile ? "rgba(52,211,153,0.05)" : "transparent",
//                         padding: "28px", textAlign: "center", cursor: "pointer" }}>
//                       <div style={{ fontSize: 30, marginBottom: 8 }}>{jdFile ? "✅" : "📄"}</div>
//                       <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13,
//                         color: jdFile ? "#34d399" : "rgba(200,195,230,0.5)" }}>
//                         {jdFile ? jdFile.name : "Click to upload JD as PDF or DOCX"}
//                       </div>
//                       <input ref={jdFileRef} type="file" accept=".pdf,.docx"
//                         onChange={(e) => { setJdFile(e.target.files[0]); e.target.value = ""; }}
//                         style={{ display: "none" }} />
//                     </div>
//                     {jdFile && (
//                       <button onClick={() => setJdFile(null)}
//                         style={{ marginTop: 8, fontSize: 11, background: "none", border: "none",
//                           color: "#f87171", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
//                         ✕ Remove
//                       </button>
//                     )}
//                   </div>
//                 )}
//               </motion.div>

//               {/* Resume Slots */}
//               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
//                 style={{ padding: "24px", borderRadius: 20, background: "rgba(255,255,255,0.02)",
//                   border: "1px solid rgba(255,255,255,0.07)", marginBottom: 24 }}>
//                 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
//                   <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#a78bfa", letterSpacing: "0.12em" }}>
//                     STEP 2 — UPLOAD RESUMES (2–5 resumes)
//                   </div>
//                   <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10,
//                     color: filledSlots.length >= 2 ? "#22c55e" : "#f59e0b",
//                     padding: "4px 10px", borderRadius: 8,
//                     background: filledSlots.length >= 2 ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
//                     border: `1px solid ${filledSlots.length >= 2 ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}` }}>
//                     {filledSlots.length}/{MAX_RESUMES} uploaded
//                   </div>
//                 </div>
//                 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
//                   {Array(MAX_RESUMES).fill(null).map((_, i) => (
//                     <ResumeSlot key={i} index={i} file={files[i]} onAdd={handleAddFile} onRemove={handleRemoveFile}
//                       linkedinText={linkedinTexts[i]} onLinkedinChange={handleLinkedinChange} />
//                   ))}
//                 </div>
//               </motion.div>

//               {/* Scoring info */}
//               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
//                 style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(99,102,241,0.05)",
//                   border: "1px solid rgba(99,102,241,0.15)", marginBottom: 24 }}>
//                 <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, color: "#818cf8", marginBottom: 10 }}>
//                   ⚡ How Composite Score Works
//                 </div>
//                 <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
//                   {[
//                     { label: "ATS Score",     weight: "50%", icon: "📋", color: "#60a5fa" },
//                     { label: "GitHub Trust",  weight: "30%", icon: "🐙", color: "#34d399" },
//                     { label: "LinkedIn Score",weight: "20%", icon: "💼", color: "#60a5fa" },
//                   ].map((item, i) => (
//                     <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
//                       borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
//                       <span>{item.icon}</span>
//                       <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.7)" }}>{item.label}</span>
//                       <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 700, color: item.color }}>{item.weight}</span>
//                     </div>
//                   ))}
//                 </div>
//               </motion.div>

//               {/* Rank button */}
//               <AnimatePresence>
//                 {canRank && (
//                   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
//                     style={{ textAlign: "center" }}>
//                     <motion.button whileHover={{ scale: 1.05, boxShadow: "0 0 70px rgba(99,102,241,0.8)" }}
//                       whileTap={{ scale: 0.96 }} onClick={handleRank}
//                       style={{ padding: "20px 70px", borderRadius: 20, border: "none",
//                         background: "linear-gradient(135deg, #4f46e5, #7c3aed, #6366f1)",
//                         color: "#fff", fontSize: 18, fontWeight: 900,
//                         fontFamily: "'Outfit',sans-serif", cursor: "pointer",
//                         boxShadow: "0 0 40px rgba(99,102,241,0.5)",
//                         letterSpacing: "0.05em", position: "relative", overflow: "hidden" }}>
//                       <motion.div animate={{ x: ["-100%", "200%"] }}
//                         transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
//                         style={{ position: "absolute", inset: 0,
//                           background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
//                           pointerEvents: "none" }} />
//                       🏆 RANK {filledSlots.length} RESUMES
//                     </motion.button>
//                     <div style={{ marginTop: 10, fontFamily: "'DM Mono',monospace", fontSize: 10,
//                       color: "rgba(167,139,250,0.4)", letterSpacing: "0.1em" }}>
//                       POWERED BY GROQ AI + GITHUB API + SAVED TO YOUR HISTORY
//                     </div>
//                   </motion.div>
//                 )}
//               </AnimatePresence>

//               {!canRank && (
//                 <div style={{ textAlign: "center", fontFamily: "'DM Sans',sans-serif", fontSize: 12,
//                   color: "rgba(200,195,230,0.35)", marginTop: 8 }}>
//                   {filledSlots.length < 2 ? "⬆️ Upload at least 2 resumes to start ranking" : "⬆️ Add a Job Description to proceed"}
//                 </div>
//               )}
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>

//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
//         textarea::placeholder { color: rgba(200,195,230,0.25); }
//         textarea::-webkit-scrollbar { width: 4px; }
//         textarea::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); border-radius: 2px; }
//         input::placeholder { color: rgba(200,195,230,0.3); }
//         * { box-sizing: border-box; }
//       `}</style>
//     </div>
//   );
// }
























































































































































































































































































































































































































import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const MAX_RESUMES = 5;
const API_BASE    = (import.meta.env.VITE_API_BASE || "http://localhost:5000") + "/api";

const RANK_COLORS = [
  { bg: "#FFD700", glow: "#FFD70088", label: "GOLD",   icon: "🥇", text: "#1a1200" },
  { bg: "#C0C0C0", glow: "#C0C0C088", label: "SILVER", icon: "🥈", text: "#0f0f0f" },
  { bg: "#CD7F32", glow: "#CD7F3288", label: "BRONZE", icon: "🥉", text: "#1a0a00" },
  { bg: "#6366f1", glow: "#6366f188", label: "4TH",    icon: "4️⃣", text: "#fff"    },
  { bg: "#8b5cf6", glow: "#8b5cf688", label: "5TH",    icon: "5️⃣", text: "#fff"    },
];

const SKILL_KEYWORDS = [
  "javascript","typescript","python","java","c++","c#","go","golang","rust","ruby","php",
  "swift","kotlin","scala","dart","react","next.js","vue","angular","svelte","html","css",
  "sass","tailwind","redux","node.js","nodejs","express","nestjs","fastapi","django","flask",
  "spring","graphql","rest api","mongodb","mysql","postgresql","redis","firebase","docker",
  "kubernetes","aws","azure","gcp","terraform","git","figma","tensorflow","pytorch",
  "machine learning","deep learning","linux","bash","ci/cd",
];

// ══════════════════════════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════════════════════════
async function extractTextFromFile(file) {
  if (file.type === "application/pdf") {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page    = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((x) => x.str).join(" ") + "\n";
    }
    return text.trim();
  } else {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(r.result);
      r.onerror = rej;
      r.readAsText(file);
    });
  }
}

function extractSkills(text) {
  const lower = text.toLowerCase();
  const found = new Set();
  for (const skill of SKILL_KEYWORDS) {
    const escaped = skill.replace(/[.+]/g, "\\$&");
    if (new RegExp(`(?<![a-z])${escaped}(?![a-z])`, "i").test(lower)) found.add(skill);
  }
  return [...found];
}

function extractProjects(text) {
  const projects = new Set();
  const p1 = /(?:project[s]?\s*[:\-–—]\s*)([A-Z][A-Za-z0-9 \-_]+)/gm;
  const p2 = /(?:built|developed|created|designed|implemented)\s+(?:a\s+|an\s+|the\s+)?([A-Z][A-Za-z0-9 \-_]{3,35}?)(?:\s+using|\s+with|\s+in|\s+for|[.,\n])/g;
  const p3 = /github\.com\/[a-zA-Z0-9_\-]+\/([a-zA-Z0-9_\-]+)/g;
  let m;
  while ((m = p1.exec(text)) !== null) { if (m[1].trim().length > 3) projects.add(m[1].trim().slice(0, 40)); }
  while ((m = p2.exec(text)) !== null) { if (m[1].trim().length > 3) projects.add(m[1].trim()); }
  while ((m = p3.exec(text)) !== null) { projects.add(m[1].replace(/[-_]/g, " ")); }
  return [...projects].slice(0, 10);
}

function extractGithub(text) {
  const patterns = [
    /github\.com\/([a-zA-Z0-9_\-]{2,39})(?:\/|$|\s|"|')/g,
    /github:\s*@?([a-zA-Z0-9_\-]{2,39})/gi,
  ];
  const skip = ["features","topics","explore","marketplace","enterprise","sponsors","about","login","signup","orgs"];
  for (const pattern of patterns) {
    const m = pattern.exec(text);
    if (m && !skip.includes(m[1].toLowerCase())) return m[1];
  }
  return "";
}

function extractYears(text) {
  const m = text.match(/(\d+)\+?\s*years?\s+(?:of\s+)?(?:experience|exp)/i);
  return m ? parseInt(m[1]) : 1;
}

// ── FIXED parseJSON — robust with fallback ────────────────────
function parseJSON(raw) {
  try {
    let clean = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .trim();

    const start = clean.indexOf("{");
    const end   = clean.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON object found");
    clean = clean.slice(start, end + 1);

    try { return JSON.parse(clean); } catch {}

    clean = clean
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]");
    return JSON.parse(clean);

  } catch (err) {
    console.error("❌ JSON parse failed:", err.message, "| Raw:", raw?.slice(0, 300));
    return {
      candidateName: "Candidate",
      overallScore:  50,
      scores: {
        keywordMatch:        { score: 50, details: "Parse error", keywords: [], matched: [], missing: [] },
        skillsMatch:         { score: 50, details: "Parse error", matched: [], missing: [] },
        experienceRelevance: { score: 50, details: "Parse error" },
        educationMatch:      { score: 50, details: "Parse error", degree: "" },
        projectRelevance:    { score: 50, details: "Parse error" },
        formattingScore:     { score: 50, details: "Parse error", atsIssues: [] },
        actionVerbScore:     { score: 50, details: "Parse error", goodVerbs: [], weakPhrases: [] },
        achievementScore:    { score: 50, details: "Parse error", examples: [] },
        grammarReadability:  { score: 50, details: "Parse error" },
        atsCompatibility:    { score: 50, details: "Parse error" },
        sectionCompleteness: { score: 50, details: "Parse error", present: [], missing: [] },
      },
      topStrengths:           ["Resume uploaded successfully"],
      criticalImprovements:   ["Re-run analysis for full results"],
      jdSpecificImprovements: ["Please retry"],
      verdict: "Analysis parsing failed. Please try again.",
    };
  }
}

function scoreColor(score) {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function fmt(bytes) {
  return bytes < 1024 * 1024
    ? (bytes / 1024).toFixed(1) + " KB"
    : (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ══════════════════════════════════════════════════════════════
// FIXED: analyzeResume — proper Groq response extraction
// ══════════════════════════════════════════════════════════════
async function analyzeResume({ file, jdText, linkedinText, apiKey }) {
  const resumeText     = await extractTextFromFile(file);
  const skills         = extractSkills(resumeText);
  const projects       = extractProjects(resumeText);
  const claimedYears   = extractYears(resumeText);
  const githubUsername = extractGithub(resumeText);

  const prompt = `You are an expert ATS resume analyzer. Analyze the resume against the job description.
Return ONLY a valid JSON object. No markdown, no text outside JSON.

{
  "candidateName": "full name from resume or 'Candidate'",
  "overallScore": 75,
  "scores": {
    "keywordMatch":         { "score": 70, "details": "explanation", "keywords": ["React","Node.js"], "matched": ["React"], "missing": ["Docker"] },
    "skillsMatch":          { "score": 80, "details": "explanation", "matched": ["React"], "missing": ["Docker"] },
    "experienceRelevance":  { "score": 60, "details": "explanation" },
    "educationMatch":       { "score": 90, "details": "explanation", "degree": "B.Tech CSE" },
    "projectRelevance":     { "score": 70, "details": "explanation" },
    "formattingScore":      { "score": 75, "details": "explanation", "atsIssues": ["issue"] },
    "actionVerbScore":      { "score": 80, "details": "explanation", "goodVerbs": ["Built"], "weakPhrases": ["Worked on"] },
    "achievementScore":     { "score": 65, "details": "explanation", "examples": ["example"] },
    "grammarReadability":   { "score": 85, "details": "explanation" },
    "atsCompatibility":     { "score": 70, "details": "explanation" },
    "sectionCompleteness":  { "score": 75, "details": "explanation", "present": ["Skills"], "missing": ["Certifications"] }
  },
  "topStrengths": ["strength1", "strength2", "strength3"],
  "criticalImprovements": ["improvement1", "improvement2", "improvement3"],
  "jdSpecificImprovements": ["specific improvement 1", "specific improvement 2", "specific improvement 3"],
  "verdict": "Overall assessment in 2 sentences."
}

RESUME:
${resumeText.slice(0, 1500)}

JOB DESCRIPTION:
${jdText.slice(0, 800)}`;

  // ── FIXED: Groq call with full error info ─────────────────
  let groqResponse;
  try {
    groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are an ATS resume analyzer. Always respond with valid JSON only. No markdown, no backticks." },
          { role: "user",   content: prompt },
        ],
        temperature: 0.1,
        max_tokens:  2000,
      }),
    });
  } catch (netErr) {
    throw new Error(`Network error: ${netErr.message}`);
  }

  // ── FIXED: Detailed error message from Groq ───────────────
  if (!groqResponse.ok) {
    let errMsg = `Groq API error (${groqResponse.status})`;
    try {
      const errBody = await groqResponse.json();
      errMsg = errBody?.error?.message || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  // ── FIXED: Proper response extraction ────────────────────
  const groqData = await groqResponse.json();

  if (!groqData?.choices?.[0]?.message?.content) {
    throw new Error("Empty or invalid response from Groq API");
  }

  const result = parseJSON(groqData.choices[0].message.content);

  // ── GitHub metrics ────────────────────────────────────────
  let githubMetrics = null;
  if (githubUsername) {
    try {
      const ghRes  = await fetch(`${API_BASE}/github-analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUsername, resumeText: resumeText.slice(0, 1500), resumeSkills: skills, resumeProjects: projects, claimedYears }),
      });
      const ghData = await ghRes.json();
      if (ghData.success) githubMetrics = ghData.githubMetrics;
    } catch (ghErr) {
      console.warn("⚠️ GitHub metrics failed:", ghErr.message);
    }
  }

  // ── LinkedIn metrics ──────────────────────────────────────
  let linkedinMetrics = null;
  if (linkedinText && linkedinText.trim().length > 50) {
    try {
      const liRes  = await fetch(`${API_BASE}/linkedin-analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinText, jobRole: jdText.slice(0, 100), resumeSkills: skills }),
      });
      const liData = await liRes.json();
      if (liData.success) linkedinMetrics = liData.linkedinMetrics;
    } catch (liErr) {
      console.warn("⚠️ LinkedIn metrics failed:", liErr.message);
    }
  }

  return { fileName: file.name, resumeText, githubUsername, atsResult: result, githubMetrics, linkedinMetrics, skills };
}

// ══════════════════════════════════════════════════════════════
// COMPUTE COMPOSITE SCORE
// ══════════════════════════════════════════════════════════════
function computeCompositeScore(data) {
  const atsScore = data.atsResult?.overallScore               ?? 0;
  const ghScore  = data.githubMetrics?.trustScore             ?? null;
  const liScore  = data.linkedinMetrics?.overallLinkedInScore ?? null;
  let total = atsScore * 0.5, denominator = 0.5;
  if (ghScore !== null) { total += ghScore * 0.3; denominator += 0.3; }
  if (liScore !== null) { total += liScore * 0.2; denominator += 0.2; }
  return Math.round(total / denominator);
}

// ══════════════════════════════════════════════════════════════
// FIXED: generateImprovements — proper extraction
// ══════════════════════════════════════════════════════════════
async function generateImprovements({ candidate, rank, jdText, apiKey }) {
  const prompt = `You are a senior career coach. A candidate ranked #${rank} in a resume competition for this job.

Candidate: ${candidate.atsResult?.candidateName || candidate.fileName}
ATS Score: ${candidate.atsResult?.overallScore}/100
GitHub Trust Score: ${candidate.githubMetrics?.trustScore ?? "N/A"}/100
LinkedIn Score: ${candidate.linkedinMetrics?.overallLinkedInScore ?? "N/A"}/100
Skills on resume: ${candidate.skills.slice(0, 15).join(", ")}
Missing from JD: ${candidate.atsResult?.scores?.skillsMatch?.missing?.slice(0, 5).join(", ") || "Unknown"}
Weak areas: ${Object.entries(candidate.atsResult?.scores || {}).filter(([, v]) => v.score < 65).map(([k, v]) => `${k}(${v.score})`).join(", ")}

Job Description: ${jdText.slice(0, 400)}

Return ONLY a valid JSON array of exactly 6 actionable improvement tips. Each tip must be specific, not generic.
Format: ["tip1", "tip2", "tip3", "tip4", "tip5", "tip6"]`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "Return only a JSON array of strings. No markdown. No backticks." },
          { role: "user",   content: prompt },
        ],
        temperature: 0.3,
        max_tokens:  800,
      }),
    });

    if (!res.ok) throw new Error(`Groq error ${res.status}`);

    const data = await res.json();
    if (!data?.choices?.[0]?.message?.content) throw new Error("Empty improvements response");

    const raw   = data.choices[0].message.content;
    const clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const s = clean.indexOf("["), e = clean.lastIndexOf("]");
    if (s === -1 || e === -1) throw new Error("No array in response");
    return JSON.parse(clean.slice(s, e + 1));

  } catch (err) {
    console.warn("⚠️ Improvements failed:", err.message);
    return candidate.atsResult?.jdSpecificImprovements || candidate.atsResult?.criticalImprovements || ["Review and improve resume"];
  }
}

// ══════════════════════════════════════════════════════════════
// RESUME SLOT
// ══════════════════════════════════════════════════════════════
function ResumeSlot({ index, file, onAdd, onRemove, linkedinText, onLinkedinChange }) {
  const inputRef                        = useRef(null);
  const [dragging, setDragging]         = useState(false);
  const [showLinkedin, setShowLinkedin] = useState(false);
  const slotColors = [
    { accent: "#60a5fa", glow: "#3b82f6" },
    { accent: "#a78bfa", glow: "#7c3aed" },
    { accent: "#34d399", glow: "#059669" },
    { accent: "#f59e0b", glow: "#d97706" },
    { accent: "#f472b6", glow: "#db2777" },
  ];
  const { accent, glow } = slotColors[index];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}
      style={{ borderRadius: 16, border: `1.5px solid ${file ? accent + "55" : "rgba(255,255,255,0.08)"}`,
        background: file ? `${accent}08` : "rgba(255,255,255,0.015)", padding: "16px", transition: "all 0.3s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${glow}, ${accent})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 800, color: "#fff", fontFamily: "'Outfit',sans-serif",
          boxShadow: `0 0 12px ${glow}55` }}>{index + 1}</div>
        <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, color: "#f1f0ff" }}>Resume #{index + 1}</span>
        {!file && index > 0 && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 100,
          background: "rgba(255,255,255,0.05)", color: "rgba(200,195,230,0.4)",
          border: "1px solid rgba(255,255,255,0.08)", fontFamily: "'DM Mono',monospace" }}>OPTIONAL</span>}
        {index === 0 && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 100,
          background: `${glow}22`, color: accent, border: `1px solid ${glow}44`,
          fontFamily: "'DM Mono',monospace" }}>REQUIRED</span>}
      </div>
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onAdd(f, index); }}
            onClick={() => inputRef.current.click()}
            style={{ borderRadius: 12, border: `1.5px dashed ${dragging ? accent : accent + "33"}`,
              background: dragging ? `${accent}10` : "transparent", padding: "20px 16px",
              textAlign: "center", cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{dragging ? "📂" : "📄"}</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.5)" }}>Drop PDF/DOCX or click</div>
            <input ref={inputRef} type="file" accept=".pdf,.docx"
              onChange={(e) => { const f = e.target.files[0]; if (f) { onAdd(f, index); e.target.value = ""; } }}
              style={{ display: "none" }} />
          </motion.div>
        ) : (
          <motion.div key="file" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 10, background: `${accent}10`, border: `1px solid ${accent}30` }}>
              <span style={{ fontSize: 20 }}>📄</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 12, color: "#f1f0ff",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: `${accent}bb`, marginTop: 2 }}>{fmt(file.size)}</div>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onRemove(index)}
                style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid rgba(248,113,113,0.3)",
                  background: "rgba(248,113,113,0.1)", color: "#f87171", fontSize: 11, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>✕</motion.button>
            </div>
            <div style={{ marginTop: 10 }}>
              <button onClick={() => setShowLinkedin(!showLinkedin)}
                style={{ background: showLinkedin ? "rgba(10,102,194,0.15)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${showLinkedin ? "rgba(10,102,194,0.4)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 8, padding: "6px 12px", cursor: "pointer",
                  color: showLinkedin ? "#60a5fa" : "rgba(200,195,230,0.5)",
                  fontSize: 11, fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
                <span>💼</span>{showLinkedin ? "Hide LinkedIn" : "+ Add LinkedIn Profile"}
              </button>
              <AnimatePresence>
                {showLinkedin && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginTop: 8 }}>
                    <textarea value={linkedinText} onChange={(e) => onLinkedinChange(index, e.target.value)}
                      placeholder="Paste LinkedIn profile text here..."
                      style={{ width: "100%", minHeight: 80, borderRadius: 10, padding: "10px 12px",
                        boxSizing: "border-box", background: "rgba(10,102,194,0.06)",
                        border: "1px solid rgba(10,102,194,0.25)", color: "#f1f0ff",
                        fontSize: 11, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.6,
                        resize: "vertical", outline: "none" }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MetricBar({ label, score, delay = 0 }) {
  const color = scoreColor(score);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(200,195,230,0.7)" }}>{label}</span>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color, fontWeight: 700 }}>{score}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay, ease: "easeOut" }}
          style={{ height: "100%", borderRadius: 3, background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
    </div>
  );
}

function ScorePill({ label, score, icon }) {
  const color = scoreColor(score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 100,
      background: `${color}12`, border: `1px solid ${color}33` }}>
      <span style={{ fontSize: 12 }}>{icon}</span>
      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(200,195,230,0.6)" }}>{label}</span>
      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 700, color }}>{score}</span>
    </div>
  );
}

function SectionLabel({ icon, label, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
      <span>{icon}</span>
      <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 12, color }}>{label}</span>
    </div>
  );
}

function RankedCard({ candidate, rank, improvements }) {
  const [expanded, setExpanded] = useState(rank <= 2);
  const rColor    = RANK_COLORS[rank - 1] || RANK_COLORS[4];
  const composite = computeCompositeScore(candidate);
  const ats       = candidate.atsResult;
  const gh        = candidate.githubMetrics;
  const li        = candidate.linkedinMetrics;
  const isTop2    = rank <= 2;

  return (
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: rank * 0.12 }}
      style={{ borderRadius: 20, border: `1.5px solid ${isTop2 ? rColor.bg + "66" : "rgba(255,255,255,0.08)"}`,
        background: isTop2 ? `linear-gradient(135deg, ${rColor.bg}12, ${rColor.bg}05)` : "rgba(255,255,255,0.02)",
        overflow: "hidden", boxShadow: isTop2 ? `0 0 40px ${rColor.glow}` : "none", marginBottom: 16 }}>
      <div onClick={() => setExpanded(!expanded)}
        style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", cursor: "pointer", userSelect: "none" }}>
        <motion.div whileHover={{ scale: 1.1 }}
          style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: rColor.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, boxShadow: `0 0 20px ${rColor.glow}`, fontWeight: 900 }}>{rColor.icon}</motion.div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 17, color: "#f1f0ff" }}>
              {ats?.candidateName || candidate.fileName}
            </span>
            <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 100,
              background: `${rColor.bg}22`, color: rColor.bg,
              border: `1px solid ${rColor.bg}44`, fontFamily: "'DM Mono',monospace", letterSpacing: "0.1em" }}>
              #{rank} {rColor.label}
            </span>
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(200,195,230,0.4)", marginTop: 3 }}>
            {candidate.fileName}{candidate.githubUsername && ` · @${candidate.githubUsername}`}
          </div>
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 28,
            color: scoreColor(composite), textShadow: `0 0 20px ${scoreColor(composite)}` }}>{composite}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(200,195,230,0.4)" }}>COMPOSITE</div>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }}
          style={{ fontSize: 16, color: "rgba(200,195,230,0.4)", flexShrink: 0 }}>▼</motion.div>
      </div>

      <div style={{ display: "flex", gap: 10, padding: "0 24px 16px", flexWrap: "wrap" }}>
        <ScorePill label="ATS"      score={ats?.overallScore ?? 0}              icon="📋" />
        {gh && <ScorePill label="GitHub"   score={gh.trustScore ?? 0}           icon="🐙" />}
        {li && <ScorePill label="LinkedIn" score={li.overallLinkedInScore ?? 0} icon="💼" />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "20px 24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 24 }}>
                <div>
                  <SectionLabel icon="📋" label="ATS Resume Metrics" color="#60a5fa" />
                  {ats?.scores && Object.entries(ats.scores).slice(0, 6).map(([key, val], i) => (
                    <MetricBar key={key} label={key.replace(/([A-Z])/g, " $1").trim()} score={val.score ?? 0} delay={i * 0.05} />
                  ))}
                </div>
                {gh && (
                  <div>
                    <SectionLabel icon="🐙" label="GitHub Metrics" color="#34d399" />
                    <MetricBar label="Skill Match"   score={gh.skillMatchScore ?? 0}   delay={0.1} />
                    <MetricBar label="Tech Usage"    score={gh.techUsageScore ?? 0}    delay={0.15} />
                    <MetricBar label="Project Match" score={gh.projectMatchScore ?? 0} delay={0.2} />
                    <MetricBar label="Consistency"   score={gh.consistencyScore ?? 0}  delay={0.25} />
                    <MetricBar label="Deployment"    score={gh.deploymentScore ?? 0}   delay={0.3} />
                    <MetricBar label="Trust Score"   score={gh.trustScore ?? 0}        delay={0.35} />
                  </div>
                )}
                {li && (
                  <div>
                    <SectionLabel icon="💼" label="LinkedIn Metrics" color="#60a5fa" />
                    <MetricBar label="Completeness"       score={li.scores?.completenessScore ?? 0}    delay={0.1} />
                    <MetricBar label="Headline Quality"   score={li.scores?.headlineScore ?? 0}        delay={0.15} />
                    <MetricBar label="Skills Relevance"   score={li.scores?.skillsRelevanceScore ?? 0} delay={0.2} />
                    <MetricBar label="Experience Quality" score={li.scores?.expQualityScore ?? 0}      delay={0.25} />
                    <MetricBar label="Branding"           score={li.scores?.brandingScore ?? 0}        delay={0.3} />
                    <MetricBar label="Keyword Opt."       score={li.scores?.keywordScore ?? 0}         delay={0.35} />
                  </div>
                )}
              </div>
              {ats?.topStrengths?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <SectionLabel icon="⚡" label="Top Strengths" color="#22c55e" />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {ats.topStrengths.map((s, i) => (
                      <span key={i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8,
                        background: "rgba(34,197,94,0.08)", color: "#22c55e",
                        border: "1px solid rgba(34,197,94,0.2)", fontFamily: "'DM Sans',sans-serif" }}>✓ {s}</span>
                    ))}
                  </div>
                </div>
              )}
              {!isTop2 && improvements && improvements.length > 0 && (
                <div style={{ marginTop: 16, padding: "16px", borderRadius: 14,
                  background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.2)" }}>
                  <SectionLabel icon="🚀" label="Personalized Improvement Plan" color="#f59e0b" />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 8 }}>
                    {improvements.map((tip, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px",
                          borderRadius: 10, background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.1)" }}>
                        <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                          background: "rgba(251,191,36,0.2)", color: "#f59e0b",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 800, fontFamily: "'DM Mono',monospace" }}>{i + 1}</span>
                        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12,
                          color: "rgba(200,195,230,0.8)", lineHeight: 1.5 }}>{tip}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              {isTop2 && ats?.verdict && (
                <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12,
                  background: `${rColor.bg}10`, border: `1px solid ${rColor.bg}30` }}>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12,
                    color: "rgba(200,195,230,0.8)", lineHeight: 1.6 }}>💬 {ats.verdict}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AnalyticsPanel({ ranked }) {
  const allSkills   = ranked.flatMap((c) => c.skills);
  const skillCounts = {};
  allSkills.forEach((s) => { skillCounts[s] = (skillCounts[s] || 0) + 1; });
  const topSkills    = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const avgAts       = Math.round(ranked.reduce((s, c) => s + (c.atsResult?.overallScore ?? 0), 0) / ranked.length);
  const avgComposite = Math.round(ranked.reduce((s, c) => s + computeCompositeScore(c), 0) / ranked.length);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
      style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.02)", padding: "24px", marginBottom: 24 }}>
      <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 16, color: "#f1f0ff", marginBottom: 20 }}>📊 Cohort Analytics</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Candidates",    value: ranked.length,                                                        icon: "👥" },
          { label: "Avg ATS",       value: avgAts,                                                               icon: "📋" },
          { label: "Avg Composite", value: avgComposite,                                                         icon: "⚡" },
          { label: "GitHub Linked", value: `${ranked.filter((c) => c.githubMetrics).length}/${ranked.length}`,   icon: "🐙" },
          { label: "LinkedIn",      value: `${ranked.filter((c) => c.linkedinMetrics).length}/${ranked.length}`, icon: "💼" },
        ].map((stat, i) => (
          <div key={i} style={{ textAlign: "center", padding: "14px 10px", borderRadius: 12,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 22, color: "#f1f0ff" }}>{stat.value}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(200,195,230,0.4)", marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, color: "rgba(200,195,230,0.7)", marginBottom: 12 }}>📈 Score Comparison</div>
        {ranked.map((c, i) => {
          const composite = computeCompositeScore(c);
          const color     = RANK_COLORS[i]?.bg || "#6366f1";
          return (
            <div key={i} style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, background: color, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#000" }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(200,195,230,0.6)", marginBottom: 3 }}>
                  {c.atsResult?.candidateName || c.fileName}
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${composite}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                    style={{ height: "100%", borderRadius: 4, background: color, boxShadow: `0 0 8px ${color}88` }} />
                </div>
              </div>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 700,
                color: scoreColor(composite), width: 32, textAlign: "right" }}>{composite}</span>
            </div>
          );
        })}
      </div>
      {topSkills.length > 0 && (
        <div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, color: "rgba(200,195,230,0.7)", marginBottom: 10 }}>🔑 Skills Across All Resumes</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {topSkills.map(([skill, count], i) => (
              <span key={i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8,
                background: count === ranked.length ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                color: count === ranked.length ? "#818cf8" : "rgba(200,195,230,0.6)",
                border: `1px solid ${count === ranked.length ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.07)"}`,
                fontFamily: "'DM Mono',monospace" }}>
                {skill} <span style={{ opacity: 0.6 }}>·{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function LoadingScreen({ progress, currentStep }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ textAlign: "center", padding: "80px 24px" }}>
      <div style={{ position: "relative", width: 110, height: 110, margin: "0 auto 36px" }}>
        {[0, 1, 2, 3].map((i) => (
          <motion.div key={i} animate={{ scale: [1, 1.6 + i * 0.2, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
            style={{ position: "absolute", inset: 0, borderRadius: "50%",
              border: `2px solid rgba(99,102,241,${0.5 - i * 0.1})` }} />
        ))}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🏆</div>
      </div>
      <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 24, color: "#f1f0ff", marginBottom: 8 }}>Ranking Resumes...</div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: "#818cf8", marginBottom: 28, letterSpacing: "0.08em" }}>{currentStep}</div>
      <div style={{ maxWidth: 400, margin: "0 auto", marginBottom: 20 }}>
        <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
          <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }}
            style={{ height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)", boxShadow: "0 0 12px #6366f188" }} />
        </div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(200,195,230,0.4)", marginTop: 8 }}>{progress}% complete</div>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function ResumeRanker({ onBack }) {
  const { user } = useUser();

  const [files, setFiles]                   = useState(Array(MAX_RESUMES).fill(null));
  const [linkedinTexts, setLinkedinTexts]   = useState(Array(MAX_RESUMES).fill(""));
  const [jdText, setJdText]                 = useState("");
  const [jdMode, setJdMode]                 = useState("text");
  const [jdFile, setJdFile]                 = useState(null);
  const jdFileRef                           = useRef(null);
  const [analyzing, setAnalyzing]           = useState(false);
  const [progress, setProgress]             = useState(0);
  const [currentStep, setCurrentStep]       = useState("");
  const [results, setResults]               = useState(null);
  const [savedToDb, setSavedToDb]           = useState(false);

  const filledSlots = files.filter(Boolean);
  const canRank     = filledSlots.length >= 2 && (jdText.trim().length >= 20 || jdFile);

  const handleAddFile        = useCallback((file, index) => { setFiles((prev) => { const next = [...prev]; next[index] = file; return next; }); }, []);
  const handleRemoveFile     = useCallback((index) => { setFiles((prev) => { const next = [...prev]; next[index] = null; return next; }); setLinkedinTexts((prev) => { const next = [...prev]; next[index] = ""; return next; }); }, []);
  const handleLinkedinChange = useCallback((index, text) => { setLinkedinTexts((prev) => { const next = [...prev]; next[index] = text; return next; }); }, []);

  const saveRankingToDb = async (ranked, improvements, jd) => {
    try {
      const response = await fetch(`${API_BASE}/rankings/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkUserId:    user?.id              || "guest",
          userName:       `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
          userEmail:      user?.emailAddresses?.[0]?.emailAddress || "",
          jobDescription: jd.slice(0, 500),
          ranked,
          improvements,
        }),
      });
      const data = await response.json();
      if (data.success) {
        console.log("✅ Ranking saved — winner:", data.ranking.winner.candidateName);
        setSavedToDb(true);
      }
    } catch (err) {
      console.warn("⚠️ Could not save ranking:", err.message);
    }
  };

  const handleRank = async () => {
    if (!canRank) return;
    setAnalyzing(true);
    setProgress(0);
    setResults(null);
    setSavedToDb(false);

    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      alert("❌ VITE_GROQ_API_KEY not found in client/.env");
      setAnalyzing(false);
      return;
    }

    try {
      let jd = jdText;
      if (jdMode === "file" && jdFile) jd = await extractTextFromFile(jdFile);

      const activeFiles = files.map((f, i) => ({ file: f, linkedin: linkedinTexts[i] })).filter((x) => x.file);

      const analyzed = [];
      for (let i = 0; i < activeFiles.length; i++) {
        setCurrentStep(`Analyzing resume ${i + 1} of ${activeFiles.length}: ${activeFiles[i].file.name}`);
        setProgress(Math.round((i / activeFiles.length) * 60));
        const data = await analyzeResume({ file: activeFiles[i].file, jdText: jd, linkedinText: activeFiles[i].linkedin, apiKey });
        analyzed.push(data);
        // ── Rate-limit guard: pause between Groq calls ──────
        if (i < activeFiles.length - 1) {
          setCurrentStep(`Analyzed resume ${i + 1}/${activeFiles.length} — waiting before next...`);
          await new Promise(r => setTimeout(r, 900));
        }
      }

      setProgress(65);
      setCurrentStep("Computing composite scores...");
      const ranked = [...analyzed].sort((a, b) => computeCompositeScore(b) - computeCompositeScore(a));

      setProgress(75);
      setCurrentStep("Generating personalized improvement plans...");
      const improvements     = {};
      const needsImprovement = ranked.slice(2);
      for (let i = 0; i < needsImprovement.length; i++) {
        const candidate = needsImprovement[i];
        const rank      = i + 3;
        setCurrentStep(`Creating improvement plan for #${rank}: ${candidate.atsResult?.candidateName || candidate.fileName}`);
        setProgress(75 + Math.round((i / needsImprovement.length) * 15));
        improvements[candidate.fileName] = await generateImprovements({ candidate, rank, jdText: jd, apiKey });
        // ── Rate-limit guard: pause between improvement calls ──
        if (i < needsImprovement.length - 1) {
          await new Promise(r => setTimeout(r, 700));
        }
      }

      setProgress(92);
      setCurrentStep("Saving ranking to database...");
      await saveRankingToDb(ranked, improvements, jd);

      setProgress(100);
      setCurrentStep("Done! Building leaderboard...");
      await new Promise((r) => setTimeout(r, 600));

      // ── FIXED: proper state update ────────────────────────
      setResults({ ranked, improvements });
      setAnalyzing(false);

    } catch (err) {
      console.error("❌ handleRank error:", err.message);
      alert(`❌ Error: ${err.message}`);
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setFiles(Array(MAX_RESUMES).fill(null));
    setLinkedinTexts(Array(MAX_RESUMES).fill(""));
    setJdText(""); setJdFile(null); setResults(null); setProgress(0); setSavedToDb(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #06040f 0%, #0e0720 40%, #060c1c 100%)",
      padding: "40px 24px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", width: 700, height: 700, borderRadius: "50%", top: "-20%", left: "-10%",
        background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", width: 500, height: 500, borderRadius: "50%", bottom: "-15%", right: "-5%",
        background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)", filter: "blur(70px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", inset: 0,
        backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`,
        backgroundSize: "60px 60px", pointerEvents: "none" }} />

      <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <AnimatePresence mode="wait">

          {analyzing && <LoadingScreen key="loading" progress={progress} currentStep={currentStep} />}

          {!analyzing && results && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12,
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22, boxShadow: "0 0 30px rgba(99,102,241,0.5)" }}>🏆</div>
                    <h1 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 28, color: "#f1f0ff", margin: 0 }}>Resume Leaderboard</h1>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "rgba(200,195,230,0.4)", margin: 0, letterSpacing: "0.08em" }}>
                      {results.ranked.length} CANDIDATES · RANKED BY COMPOSITE SCORE
                    </p>
                    {savedToDb && (
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100,
                        background: "rgba(52,211,153,0.15)", color: "#34d399",
                        border: "1px solid rgba(52,211,153,0.3)", fontFamily: "'DM Mono',monospace" }}>✅ SAVED TO DB</span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={reset}
                    style={{ padding: "10px 20px", borderRadius: 12, cursor: "pointer",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(200,195,230,0.7)", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600 }}>🔄 New Ranking</motion.button>
                  {onBack && (
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBack}
                      style={{ padding: "10px 20px", borderRadius: 12, cursor: "pointer",
                        background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)",
                        color: "#818cf8", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600 }}>← Dashboard</motion.button>
                  )}
                </div>
              </div>

              <AnalyticsPanel ranked={results.ranked} />
              {results.ranked.map((candidate, i) => (
                <RankedCard key={candidate.fileName + i} candidate={candidate} rank={i + 1}
                  improvements={results.improvements[candidate.fileName]} />
              ))}
              <div style={{ textAlign: "center", marginTop: 32, padding: "20px", borderRadius: 16,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.4)", margin: 0, lineHeight: 1.7 }}>
                  🏅 Scores: <strong style={{ color: "rgba(200,195,230,0.6)" }}>50% ATS</strong>
                  {" + "}<strong style={{ color: "rgba(200,195,230,0.6)" }}>30% GitHub</strong>
                  {" + "}<strong style={{ color: "rgba(200,195,230,0.6)" }}>20% LinkedIn</strong> (when available)
                </p>
              </div>
            </motion.div>
          )}

          {!analyzing && !results && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: 40 }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                  style={{ width: 70, height: 70, borderRadius: 20, margin: "0 auto 16px",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 32, boxShadow: "0 0 50px rgba(99,102,241,0.6)" }}>🏆</motion.div>
                <h1 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: "clamp(24px, 4vw, 36px)", color: "#f1f0ff", marginBottom: 8 }}>Resume Ranker</h1>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "rgba(200,195,230,0.55)", maxWidth: 500, margin: "0 auto" }}>
                  Upload up to 5 resumes. We'll rank them and save results to your history.
                </p>
                {onBack && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBack}
                    style={{ marginTop: 16, padding: "8px 18px", borderRadius: 10, cursor: "pointer",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(200,195,230,0.5)", fontFamily: "'Outfit',sans-serif", fontSize: 12 }}>← Back to Dashboard</motion.button>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: "24px", borderRadius: 20, background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#34d399", letterSpacing: "0.12em", marginBottom: 14 }}>STEP 1 — JOB DESCRIPTION</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  {[{ key: "text", label: "📝 Paste Text" }, { key: "file", label: "📄 Upload PDF/DOCX" }].map((m) => (
                    <button key={m.key} onClick={() => setJdMode(m.key)}
                      style={{ padding: "7px 16px", borderRadius: 10, cursor: "pointer",
                        background: jdMode === m.key ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${jdMode === m.key ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.08)"}`,
                        color: jdMode === m.key ? "#34d399" : "rgba(200,195,230,0.5)",
                        fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, transition: "all 0.2s" }}>{m.label}</button>
                  ))}
                </div>
                {jdMode === "text" ? (
                  <textarea value={jdText} onChange={(e) => setJdText(e.target.value.slice(0, 1200))}
                    placeholder="Paste the Job Description here..."
                    style={{ width: "100%", minHeight: 160, borderRadius: 14, padding: "14px 16px", boxSizing: "border-box",
                      background: "rgba(255,255,255,0.03)",
                      border: jdText ? "1.5px solid #34d39966" : "2px dashed #34d39944",
                      color: "#f1f0ff", fontSize: 13, fontFamily: "'DM Sans',sans-serif",
                      lineHeight: 1.7, resize: "vertical", outline: "none" }} />
                ) : (
                  <div>
                    <div onClick={() => jdFileRef.current.click()}
                      style={{ borderRadius: 14, border: `2px dashed ${jdFile ? "#34d39966" : "#34d39933"}`,
                        background: jdFile ? "rgba(52,211,153,0.05)" : "transparent", padding: "28px", textAlign: "center", cursor: "pointer" }}>
                      <div style={{ fontSize: 30, marginBottom: 8 }}>{jdFile ? "✅" : "📄"}</div>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: jdFile ? "#34d399" : "rgba(200,195,230,0.5)" }}>
                        {jdFile ? jdFile.name : "Click to upload JD as PDF or DOCX"}
                      </div>
                      <input ref={jdFileRef} type="file" accept=".pdf,.docx"
                        onChange={(e) => { setJdFile(e.target.files[0]); e.target.value = ""; }} style={{ display: "none" }} />
                    </div>
                    {jdFile && <button onClick={() => setJdFile(null)}
                      style={{ marginTop: 8, fontSize: 11, background: "none", border: "none", color: "#f87171", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>✕ Remove</button>}
                  </div>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: "24px", borderRadius: 20, background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#a78bfa", letterSpacing: "0.12em" }}>STEP 2 — UPLOAD RESUMES (2–5 resumes)</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10,
                    color: filledSlots.length >= 2 ? "#22c55e" : "#f59e0b", padding: "4px 10px", borderRadius: 8,
                    background: filledSlots.length >= 2 ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
                    border: `1px solid ${filledSlots.length >= 2 ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}` }}>
                    {filledSlots.length}/{MAX_RESUMES} uploaded
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                  {Array(MAX_RESUMES).fill(null).map((_, i) => (
                    <ResumeSlot key={i} index={i} file={files[i]} onAdd={handleAddFile} onRemove={handleRemoveFile}
                      linkedinText={linkedinTexts[i]} onLinkedinChange={handleLinkedinChange} />
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(99,102,241,0.05)",
                  border: "1px solid rgba(99,102,241,0.15)", marginBottom: 24 }}>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, color: "#818cf8", marginBottom: 10 }}>⚡ How Composite Score Works</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {[
                    { label: "ATS Score",      weight: "50%", icon: "📋", color: "#60a5fa" },
                    { label: "GitHub Trust",   weight: "30%", icon: "🐙", color: "#34d399" },
                    { label: "LinkedIn Score", weight: "20%", icon: "💼", color: "#60a5fa" },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
                      borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <span>{item.icon}</span>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.7)" }}>{item.label}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 700, color: item.color }}>{item.weight}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <AnimatePresence>
                {canRank && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ textAlign: "center" }}>
                    <motion.button whileHover={{ scale: 1.05, boxShadow: "0 0 70px rgba(99,102,241,0.8)" }}
                      whileTap={{ scale: 0.96 }} onClick={handleRank}
                      style={{ padding: "20px 70px", borderRadius: 20, border: "none",
                        background: "linear-gradient(135deg, #4f46e5, #7c3aed, #6366f1)",
                        color: "#fff", fontSize: 18, fontWeight: 900, fontFamily: "'Outfit',sans-serif", cursor: "pointer",
                        boxShadow: "0 0 40px rgba(99,102,241,0.5)", letterSpacing: "0.05em", position: "relative", overflow: "hidden" }}>
                      <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        style={{ position: "absolute", inset: 0,
                          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", pointerEvents: "none" }} />
                      🏆 RANK {filledSlots.length} RESUMES
                    </motion.button>
                    <div style={{ marginTop: 10, fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(167,139,250,0.4)", letterSpacing: "0.1em" }}>
                      POWERED BY GROQ AI + GITHUB API + SAVED TO YOUR HISTORY
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!canRank && (
                <div style={{ textAlign: "center", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.35)", marginTop: 8 }}>
                  {filledSlots.length < 2 ? "⬆️ Upload at least 2 resumes to start ranking" : "⬆️ Add a Job Description to proceed"}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        textarea::placeholder { color: rgba(200,195,230,0.25); }
        textarea::-webkit-scrollbar { width: 4px; }
        textarea::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); border-radius: 2px; }
        input::placeholder { color: rgba(200,195,230,0.3); }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}