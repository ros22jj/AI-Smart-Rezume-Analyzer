// // import { useState, useRef } from "react";
// // import { motion, AnimatePresence } from "framer-motion";
// // import * as pdfjsLib from "pdfjs-dist";

// // pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
// //   "pdfjs-dist/build/pdf.worker.min.mjs",
// //   import.meta.url
// // ).toString();

// // // ── Extract text from PDF ──────────────────────────────────────
// // async function readPdfAsText(file) {
// //   const arrayBuffer = await file.arrayBuffer();
// //   const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
// //   let text = "";
// //   for (let i = 1; i <= pdf.numPages; i++) {
// //     const page = await pdf.getPage(i);
// //     const content = await page.getTextContent();
// //     text += content.items.map((item) => item.str).join(" ") + "\n";
// //   }
// //   return text.trim();
// // }

// // // ── Color helpers ──────────────────────────────────────────────
// // const scoreColor = (s) => s >= 75 ? "#34d399" : s >= 50 ? "#fbbf24" : "#f87171";
// // const scoreLabel = (s) => s >= 75 ? "Strong" : s >= 50 ? "Fair" : "Weak";

// // // ── Animated ring ──────────────────────────────────────────────
// // function Ring({ score, color, size = 90, stroke = 7, delay = 0.2 }) {
// //   const r = (size - stroke) / 2;
// //   const circ = 2 * Math.PI * r;
// //   const offset = circ - (Math.min(score, 100) / 100) * circ;
// //   return (
// //     <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
// //       <circle cx={size/2} cy={size/2} r={r} fill="none"
// //         stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
// //       <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
// //         stroke={color} strokeWidth={stroke} strokeLinecap="round"
// //         strokeDasharray={circ}
// //         initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
// //         transition={{ duration: 1.4, ease: "easeOut", delay }}
// //         style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
// //     </svg>
// //   );
// // }

// // // ── Horizontal progress bar ────────────────────────────────────
// // function Bar({ label, value, color, delay = 0, sub }) {
// //   const c = scoreColor(value);
// //   return (
// //     <div style={{ marginBottom: 14 }}>
// //       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
// //         <div>
// //           <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600,
// //             fontSize: 12, color: "#f1f0ff" }}>{label}</span>
// //           {sub && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10,
// //             color: "rgba(200,195,230,0.45)", marginLeft: 6 }}>{sub}</span>}
// //         </div>
// //         <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
// //           <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11,
// //             color: color || c, fontWeight: 700 }}>{value}</span>
// //           <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 100,
// //             background: `${color || c}20`, color: color || c,
// //             border: `1px solid ${color || c}40`,
// //             fontFamily: "'DM Mono',monospace" }}>{scoreLabel(value)}</span>
// //         </div>
// //       </div>
// //       <div style={{ height: 7, borderRadius: 4,
// //         background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
// //         <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }}
// //           transition={{ duration: 1, delay, ease: "easeOut" }}
// //           style={{ height: "100%", borderRadius: 4,
// //             background: color || c,
// //             boxShadow: `0 0 6px ${color || c}` }} />
// //       </div>
// //     </div>
// //   );
// // }

// // // ── Chip tag ───────────────────────────────────────────────────
// // function Chip({ label, color }) {
// //   return (
// //     <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 100,
// //       background: `${color}18`, color,
// //       border: `1px solid ${color}33`,
// //       fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" }}>
// //       {label}
// //     </span>
// //   );
// // }

// // // ── Section card ───────────────────────────────────────────────
// // function SectionCard({ title, icon, color, children, delay = 0 }) {
// //   return (
// //     <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
// //       transition={{ delay }}
// //       style={{ padding: 16, borderRadius: 14,
// //         background: `${color}08`,
// //         border: `1px solid ${color}28`,
// //         marginBottom: 14 }}>
// //       <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
// //         color, letterSpacing: "0.1em", marginBottom: 10 }}>
// //         {icon} {title}
// //       </div>
// //       {children}
// //     </motion.div>
// //   );
// // }

// // // ── Loading screen ─────────────────────────────────────────────
// // function LoadingScreen() {
// //   const steps = [
// //     "Parsing LinkedIn PDF...",
// //     "Checking profile completeness...",
// //     "Analyzing headline quality...",
// //     "Scoring skills relevance...",
// //     "Evaluating experience quality...",
// //     "Detecting project presence...",
// //     "Checking certifications...",
// //     "Computing branding score...",
// //     "Optimizing keyword analysis...",
// //     "Building your report...",
// //   ];
// //   const [cur, setCur] = useState(0);
// //   useState(() => {
// //     const t = setInterval(() => setCur(p => (p + 1) % steps.length), 900);
// //     return () => clearInterval(t);
// //   });
// //   return (
// //     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
// //       style={{ textAlign: "center", padding: "80px 24px" }}>
// //       <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 32px" }}>
// //         {[0, 1, 2].map(i => (
// //           <motion.div key={i} animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
// //             transition={{ duration: 1.8, delay: i * 0.5, repeat: Infinity }}
// //             style={{ position: "absolute", inset: 0, borderRadius: "50%",
// //               border: "2px solid rgba(14,165,233,0.5)" }} />
// //         ))}
// //         <div style={{ position: "absolute", inset: 0, display: "flex",
// //           alignItems: "center", justifyContent: "center", fontSize: 36 }}>💼</div>
// //       </div>
// //       <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700,
// //         fontSize: 22, color: "#f1f0ff", marginBottom: 10 }}>Analyzing LinkedIn Profile...</div>
// //       <AnimatePresence mode="wait">
// //         <motion.div key={cur} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
// //           exit={{ opacity: 0, y: -8 }}
// //           style={{ fontFamily: "'DM Mono',monospace", fontSize: 13,
// //             color: "#38bdf8", letterSpacing: "0.08em" }}>{steps[cur]}</motion.div>
// //       </AnimatePresence>
// //     </motion.div>
// //   );
// // }

// // // ══════════════════════════════════════════════════════════════
// // // RESULTS COMPONENT
// // // ══════════════════════════════════════════════════════════════
// // function LinkedInResults({ metrics, resumeScore, onReset }) {
// //   const [tab, setTab] = useState("overview");
// //   const m = metrics;
// //   const s = m.scores;
// //   const d = m.details;

// //   const METRIC_DEFS = [
// //     { key: "completenessScore", label: "Profile Completeness", icon: "✅", color: "#10b981" },
// //     { key: "headlineScore", label: "Headline Quality", icon: "🏷️", color: "#3b82f6" },
// //     { key: "skillsRelevanceScore", label: "Skills Relevance", icon: "💡", color: "#8b5cf6" },
// //     { key: "expQualityScore", label: "Experience Quality", icon: "💼", color: "#f59e0b" },
// //     { key: "projectScore", label: "Project Presence", icon: "🚀", color: "#06b6d4" },
// //     { key: "activityScore", label: "Activity & Engagement", icon: "📣", color: "#ec4899" },
// //     { key: "networkScore", label: "Network Strength", icon: "🌐", color: "#a78bfa" },
// //     { key: "certScore", label: "Certifications", icon: "🏅", color: "#34d399" },
// //     { key: "recommendationScore", label: "Recommendations", icon: "⭐", color: "#fbbf24" },
// //     { key: "consistencyScore", label: "Resume Consistency", icon: "🔗", color: "#60a5fa" },
// //     { key: "brandingScore", label: "Professional Branding", icon: "🎯", color: "#f87171" },
// //     { key: "keywordScore", label: "Keyword Optimization", icon: "🔍", color: "#c084fc" },
// //   ];

// //   const tabs = ["overview", "details", "compare"];

// //   return (
// //     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
// //       style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 60px" }}>

// //       {/* Top bar */}
// //       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
// //         marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
// //         <motion.button whileHover={{ scale: 1.04 }} onClick={onReset}
// //           style={{ padding: "9px 20px", borderRadius: 10,
// //             border: "1px solid rgba(14,165,233,0.4)",
// //             background: "rgba(14,165,233,0.08)", color: "#38bdf8",
// //             fontSize: 13, fontWeight: 600, cursor: "pointer",
// //             fontFamily: "'Outfit',sans-serif" }}>
// //           ← Analyze Again
// //         </motion.button>
// //         <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10,
// //           color: "rgba(200,195,230,0.4)", letterSpacing: "0.1em" }}>
// //           LINKEDIN ANALYSIS REPORT · {new Date().toLocaleDateString()}
// //         </div>
// //       </div>

// //       {/* Hero — two scores side by side */}
// //       <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
// //         style={{ display: "grid", gridTemplateColumns: resumeScore ? "1fr 1fr" : "1fr",
// //           gap: 20, marginBottom: 28 }}>

// //         {/* LinkedIn score */}
// //         <div style={{ padding: "32px 28px", borderRadius: 22,
// //           background: "rgba(14,165,233,0.07)",
// //           border: "1px solid rgba(14,165,233,0.3)",
// //           display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
// //           <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
// //             <Ring score={m.overallLinkedInScore} color="#38bdf8" size={120} stroke={10} delay={0.1} />
// //             <div style={{ position: "absolute", inset: 0, display: "flex",
// //               flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
// //               <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900,
// //                 fontSize: 30, color: "#38bdf8", lineHeight: 1 }}>{m.overallLinkedInScore}</span>
// //               <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9,
// //                 color: "rgba(200,195,230,0.4)", marginTop: 2 }}>/ 100</span>
// //             </div>
// //           </div>
// //           <div>
// //             <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
// //               color: "#38bdf8", letterSpacing: "0.12em", marginBottom: 6 }}>
// //               💼 LINKEDIN SCORE
// //             </div>
// //             <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800,
// //               fontSize: 20, color: "#f1f0ff", marginBottom: 4 }}>
// //               {scoreLabel(m.overallLinkedInScore)} Profile
// //             </div>
// //             <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12,
// //               color: "rgba(200,195,230,0.6)", lineHeight: 1.6 }}>
// //               Based on 12 LinkedIn metrics including<br />branding, keywords & experience quality
// //             </div>
// //           </div>
// //         </div>

// //         {/* Resume score (if available) */}
// //         {resumeScore !== null && resumeScore !== undefined && (
// //           <div style={{ padding: "32px 28px", borderRadius: 22,
// //             background: "rgba(124,58,237,0.07)",
// //             border: "1px solid rgba(124,58,237,0.3)",
// //             display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
// //             <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
// //               <Ring score={resumeScore} color="#a78bfa" size={120} stroke={10} delay={0.3} />
// //               <div style={{ position: "absolute", inset: 0, display: "flex",
// //                 flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
// //                 <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900,
// //                   fontSize: 30, color: "#a78bfa", lineHeight: 1 }}>{resumeScore}</span>
// //                 <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9,
// //                   color: "rgba(200,195,230,0.4)", marginTop: 2 }}>/ 100</span>
// //               </div>
// //             </div>
// //             <div>
// //               <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
// //                 color: "#a78bfa", letterSpacing: "0.12em", marginBottom: 6 }}>
// //                 📋 RESUME SCORE
// //               </div>
// //               <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800,
// //                 fontSize: 20, color: "#f1f0ff", marginBottom: 4 }}>
// //                 {scoreLabel(resumeScore)} Resume
// //               </div>
// //               <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12,
// //                 color: "rgba(200,195,230,0.6)", lineHeight: 1.6 }}>
// //                 From your last resume analysis.<br />Consistency check: {s.consistencyScore}%
// //               </div>
// //             </div>
// //           </div>
// //         )}
// //       </motion.div>

// //       {/* Tabs */}
// //       <div style={{ display: "flex", gap: 4, marginBottom: 20,
// //         borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 0 }}>
// //         {tabs.map(t => (
// //           <button key={t} onClick={() => setTab(t)}
// //             style={{ padding: "9px 20px", borderRadius: "10px 10px 0 0",
// //               border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
// //               fontFamily: "'Outfit',sans-serif", letterSpacing: "0.06em",
// //               background: tab === t ? "rgba(14,165,233,0.15)" : "transparent",
// //               color: tab === t ? "#38bdf8" : "rgba(200,195,230,0.45)",
// //               borderBottom: tab === t ? "2px solid #38bdf8" : "2px solid transparent",
// //               transition: "all 0.2s" }}>
// //             {t === "overview" ? "📊 OVERVIEW" : t === "details" ? "🔬 DETAILS" : "⚖️ COMPARE"}
// //           </button>
// //         ))}
// //       </div>

// //       <AnimatePresence mode="wait">

// //         {/* OVERVIEW TAB */}
// //         {tab === "overview" && (
// //           <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
// //             <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
// //               gap: 14 }}>
// //               {METRIC_DEFS.map((def, i) => (
// //                 <div key={def.key} style={{ padding: "16px", borderRadius: 14,
// //                   background: `${def.color}06`,
// //                   border: `1px solid ${def.color}25` }}>
// //                   <div style={{ display: "flex", justifyContent: "space-between",
// //                     alignItems: "center", marginBottom: 10 }}>
// //                     <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
// //                       <span style={{ fontSize: 15 }}>{def.icon}</span>
// //                       <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700,
// //                         fontSize: 12, color: "#f1f0ff" }}>{def.label}</span>
// //                     </div>
// //                     <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800,
// //                       fontSize: 18, color: def.color }}>{s[def.key]}</span>
// //                   </div>
// //                   <div style={{ height: 6, borderRadius: 3,
// //                     background: "rgba(255,255,255,0.05)" }}>
// //                     <motion.div initial={{ width: 0 }}
// //                       animate={{ width: `${s[def.key]}%` }}
// //                       transition={{ duration: 1, delay: i * 0.05, ease: "easeOut" }}
// //                       style={{ height: "100%", borderRadius: 3,
// //                         background: def.color,
// //                         boxShadow: `0 0 6px ${def.color}` }} />
// //                   </div>
// //                 </div>
// //               ))}
// //             </div>
// //           </motion.div>
// //         )}

// //         {/* DETAILS TAB */}
// //         {tab === "details" && (
// //           <motion.div key="dt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
// //             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
// //               <div>
// //                 {/* Completeness */}
// //                 <SectionCard title="PROFILE COMPLETENESS" icon="✅" color="#10b981" delay={0}>
// //                   <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
// //                     {["photo","headline","about","experience","skills","projects","education","contact"].map(sec => (
// //                       <span key={sec} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 100,
// //                         background: d.missingSections?.includes(sec) ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.15)",
// //                         color: d.missingSections?.includes(sec) ? "#f87171" : "#34d399",
// //                         border: `1px solid ${d.missingSections?.includes(sec) ? "rgba(248,113,113,0.3)" : "rgba(52,211,153,0.3)"}`,
// //                         fontFamily: "'DM Mono',monospace" }}>
// //                         {d.missingSections?.includes(sec) ? "❌" : "✓"} {sec}
// //                       </span>
// //                     ))}
// //                   </div>
// //                   {d.missingSections?.length > 0 && (
// //                     <div style={{ fontSize: 11, color: "#f87171",
// //                       fontFamily: "'DM Sans',sans-serif" }}>
// //                       🚩 Missing: {d.missingSections.join(", ")}
// //                     </div>
// //                   )}
// //                 </SectionCard>

// //                 {/* Skills */}
// //                 <SectionCard title="SKILLS FOUND" icon="💡" color="#8b5cf6" delay={0.05}>
// //                   <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
// //                     {(d.foundSkills || []).slice(0, 12).map((s, i) => (
// //                       <Chip key={i} label={s} color="#a78bfa" />
// //                     ))}
// //                   </div>
// //                   {d.foundSkills?.length === 0 && (
// //                     <div style={{ fontSize: 11, color: "#f87171",
// //                       fontFamily: "'DM Sans',sans-serif" }}>
// //                       No recognizable tech skills detected
// //                     </div>
// //                   )}
// //                 </SectionCard>

// //                 {/* Experience quality */}
// //                 <SectionCard title="EXPERIENCE QUALITY" icon="💼" color="#f59e0b" delay={0.1}>
// //                   <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
// //                     {(d.actionVerbs || []).map((v, i) => (
// //                       <Chip key={i} label={v} color="#fbbf24" />
// //                     ))}
// //                   </div>
// //                   <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
// //                     {[
// //                       { label: "Has Numbers/Metrics", ok: d.hasNumbers },
// //                       { label: "Internship", ok: d.hasInternship },
// //                       { label: "Full-Time Role", ok: d.hasFullTime },
// //                     ].map((item, i) => (
// //                       <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100,
// //                         background: item.ok ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
// //                         color: item.ok ? "#34d399" : "#f87171",
// //                         border: `1px solid ${item.ok ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`,
// //                         fontFamily: "'DM Mono',monospace" }}>
// //                         {item.ok ? "✓" : "✗"} {item.label}
// //                       </span>
// //                     ))}
// //                   </div>
// //                 </SectionCard>

// //                 {/* Certs */}
// //                 <SectionCard title="CERTIFICATIONS" icon="🏅" color="#34d399" delay={0.15}>
// //                   {(d.certsFound || []).length === 0 ? (
// //                     <div style={{ fontSize: 11, color: "#f87171",
// //                       fontFamily: "'DM Sans',sans-serif" }}>
// //                       No certifications detected — add courses, credentials, or badges
// //                     </div>
// //                   ) : (
// //                     <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
// //                       {d.certsFound.map((c, i) => <Chip key={i} label={c} color="#34d399" />)}
// //                     </div>
// //                   )}
// //                 </SectionCard>
// //               </div>

// //               <div>
// //                 {/* Network */}
// //                 <SectionCard title="NETWORK STRENGTH" icon="🌐" color="#a78bfa" delay={0.07}>
// //                   <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
// //                     <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900,
// //                       fontSize: 36, color: "#a78bfa" }}>
// //                       {d.connections > 0 ? d.connections : "?"}
// //                     </div>
// //                     <div>
// //                       <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11,
// //                         color: "#a78bfa" }}>{d.networkLabel}</div>
// //                       <div style={{ fontSize: 10, color: "rgba(200,195,230,0.5)",
// //                         fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>
// //                         {d.connections >= 500 ? "Excellent visibility" :
// //                           d.connections >= 100 ? "Good exposure" : "Grow your network"}
// //                       </div>
// //                     </div>
// //                   </div>
// //                 </SectionCard>

// //                 {/* Recommendations */}
// //                 <SectionCard title="RECOMMENDATIONS" icon="⭐" color="#fbbf24" delay={0.12}>
// //                   <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
// //                     <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900,
// //                       fontSize: 36, color: "#fbbf24" }}>{d.recCount}</div>
// //                     <div style={{ fontSize: 11, color: "rgba(200,195,230,0.6)",
// //                       fontFamily: "'DM Sans',sans-serif", lineHeight: 1.6 }}>
// //                       {d.recCount === 0
// //                         ? "🚩 No recommendations — ask managers or peers to write one"
// //                         : d.recCount >= 3
// //                           ? "✅ Strong social proof"
// //                           : "⚠️ Getting there — aim for 3+"}
// //                     </div>
// //                   </div>
// //                 </SectionCard>

// //                 {/* Projects */}
// //                 <SectionCard title="PROJECT PRESENCE" icon="🚀" color="#06b6d4" delay={0.17}>
// //                   <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
// //                     {[
// //                       { label: `${d.projectCount} projects mentioned`, ok: d.projectCount > 0 },
// //                       { label: "GitHub link", ok: d.hasGithubLinks },
// //                       { label: "Live demo link", ok: d.hasLiveLinks },
// //                     ].map((item, i) => (
// //                       <span key={i} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 100,
// //                         background: item.ok ? "rgba(6,182,212,0.1)" : "rgba(248,113,113,0.1)",
// //                         color: item.ok ? "#06b6d4" : "#f87171",
// //                         border: `1px solid ${item.ok ? "rgba(6,182,212,0.25)" : "rgba(248,113,113,0.2)"}`,
// //                         fontFamily: "'DM Mono',monospace" }}>
// //                         {item.ok ? "✓" : "✗"} {item.label}
// //                       </span>
// //                     ))}
// //                   </div>
// //                 </SectionCard>

// //                 {/* Branding */}
// //                 <SectionCard title="PROFESSIONAL BRANDING" icon="🎯" color="#f87171" delay={0.2}>
// //                   <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
// //                     {[
// //                       { label: "Niche defined", ok: d.hasNiche },
// //                       { label: "Has story/about", ok: d.hasStory },
// //                     ].map((item, i) => (
// //                       <span key={i} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 100,
// //                         background: item.ok ? "rgba(248,113,113,0.1)" : "rgba(255,255,255,0.04)",
// //                         color: item.ok ? "#f87171" : "rgba(200,195,230,0.4)",
// //                         border: `1px solid ${item.ok ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.08)"}`,
// //                         fontFamily: "'DM Mono',monospace" }}>
// //                         {item.ok ? "✓" : "✗"} {item.label}
// //                       </span>
// //                     ))}
// //                   </div>
// //                   {d.techKeywordsInHeadline?.length > 0 && (
// //                     <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
// //                       {d.techKeywordsInHeadline.map((k, i) => (
// //                         <Chip key={i} label={k} color="#f87171" />
// //                       ))}
// //                     </div>
// //                   )}
// //                 </SectionCard>

// //                 {/* Keyword ATS */}
// //                 <SectionCard title="KEYWORD OPTIMIZATION" icon="🔍" color="#c084fc" delay={0.22}>
// //                   <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
// //                     {(d.foundATS || []).map((k, i) => <Chip key={i} label={k} color="#c084fc" />)}
// //                   </div>
// //                   <div style={{ fontSize: 10, color: "rgba(200,195,230,0.45)",
// //                     fontFamily: "'DM Sans',sans-serif" }}>
// //                     {d.foundATS?.length || 0}/15 ATS keywords found in profile
// //                   </div>
// //                 </SectionCard>
// //               </div>
// //             </div>
// //           </motion.div>
// //         )}

// //         {/* COMPARE TAB */}
// //         {tab === "compare" && (
// //           <motion.div key="cp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
// //             {resumeScore ? (
// //               <>
// //                 {/* Side by side all bars */}
// //                 <div style={{ padding: 20, borderRadius: 18,
// //                   background: "rgba(255,255,255,0.02)",
// //                   border: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
// //                   <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
// //                     <div>
// //                       <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
// //                         color: "#38bdf8", letterSpacing: "0.1em", marginBottom: 16 }}>
// //                         💼 LINKEDIN METRICS
// //                       </div>
// //                       {METRIC_DEFS.map((def, i) => (
// //                         <Bar key={def.key} label={def.label}
// //                           value={s[def.key]} color={def.color} delay={i * 0.04} />
// //                       ))}
// //                     </div>
// //                     <div>
// //                       <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
// //                         color: "#a78bfa", letterSpacing: "0.1em", marginBottom: 16 }}>
// //                         📋 RESUME OVERALL
// //                       </div>
// //                       <div style={{ display: "flex", alignItems: "center", gap: 16,
// //                         padding: 20, borderRadius: 14,
// //                         background: "rgba(124,58,237,0.08)",
// //                         border: "1px solid rgba(124,58,237,0.2)", marginBottom: 16 }}>
// //                         <div style={{ position: "relative", width: 80, height: 80 }}>
// //                           <Ring score={resumeScore} color="#a78bfa" size={80} stroke={7} delay={0.3} />
// //                           <div style={{ position: "absolute", inset: 0, display: "flex",
// //                             alignItems: "center", justifyContent: "center" }}>
// //                             <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900,
// //                               fontSize: 20, color: "#a78bfa" }}>{resumeScore}</span>
// //                           </div>
// //                         </div>
// //                         <div>
// //                           <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700,
// //                             fontSize: 16, color: "#f1f0ff" }}>{scoreLabel(resumeScore)} Resume</div>
// //                           <div style={{ fontSize: 11, color: "rgba(200,195,230,0.55)",
// //                             fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>
// //                             From your resume analysis
// //                           </div>
// //                         </div>
// //                       </div>

// //                       {/* Consistency */}
// //                       <div style={{ padding: 16, borderRadius: 14,
// //                         background: "rgba(96,165,250,0.07)",
// //                         border: "1px solid rgba(96,165,250,0.2)" }}>
// //                         <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
// //                           color: "#60a5fa", letterSpacing: "0.1em", marginBottom: 8 }}>
// //                           🔗 SKILL CONSISTENCY
// //                         </div>
// //                         <Bar label="Resume ↔ LinkedIn Skill Match"
// //                           value={s.consistencyScore} color="#60a5fa" delay={0.2} />
// //                         {d.matchingSkills?.length > 0 && (
// //                           <div style={{ marginTop: 8 }}>
// //                             <div style={{ fontSize: 10, color: "rgba(200,195,230,0.45)",
// //                               marginBottom: 5, fontFamily: "'DM Mono',monospace" }}>
// //                               MATCHED SKILLS
// //                             </div>
// //                             <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
// //                               {d.matchingSkills.map((sk, i) => (
// //                                 <Chip key={i} label={sk} color="#60a5fa" />
// //                               ))}
// //                             </div>
// //                           </div>
// //                         )}
// //                       </div>
// //                     </div>
// //                   </div>
// //                 </div>

// //                 {/* Combined trust signal */}
// //                 <div style={{ padding: 20, borderRadius: 18,
// //                   background: "rgba(251,191,36,0.06)",
// //                   border: "1px solid rgba(251,191,36,0.2)" }}>
// //                   <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
// //                     color: "#fbbf24", letterSpacing: "0.1em", marginBottom: 12 }}>
// //                     🔥 COMBINED TRUST SIGNAL
// //                   </div>
// //                   <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
// //                     <div style={{ position: "relative", width: 100, height: 100 }}>
// //                       <Ring score={Math.round((m.overallLinkedInScore + resumeScore) / 2)}
// //                         color="#fbbf24" size={100} stroke={8} delay={0.1} />
// //                       <div style={{ position: "absolute", inset: 0, display: "flex",
// //                         flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
// //                         <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900,
// //                           fontSize: 22, color: "#fbbf24", lineHeight: 1 }}>
// //                           {Math.round((m.overallLinkedInScore + resumeScore) / 2)}
// //                         </span>
// //                         <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8,
// //                           color: "rgba(200,195,230,0.4)" }}>COMBINED</span>
// //                       </div>
// //                     </div>
// //                     <div style={{ flex: 1 }}>
// //                       <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700,
// //                         fontSize: 15, color: "#f1f0ff", marginBottom: 6 }}>
// //                         Overall Candidate Trust Score
// //                       </div>
// //                       <div style={{ fontSize: 12, color: "rgba(200,195,230,0.6)",
// //                         fontFamily: "'DM Sans',sans-serif", lineHeight: 1.7 }}>
// //                         LinkedIn Score: <strong style={{ color: "#38bdf8" }}>{m.overallLinkedInScore}</strong> · Resume Score: <strong style={{ color: "#a78bfa" }}>{resumeScore}</strong><br />
// //                         Skill Consistency: <strong style={{ color: "#60a5fa" }}>{s.consistencyScore}%</strong>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 </div>
// //               </>
// //             ) : (
// //               <div style={{ textAlign: "center", padding: "60px 24px",
// //                 color: "rgba(200,195,230,0.4)",
// //                 fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>
// //                 <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
// //                 No resume analysis found.<br />
// //                 Go to <strong>Analyze Resume</strong> first, then come back to compare.
// //               </div>
// //             )}
// //           </motion.div>
// //         )}
// //       </AnimatePresence>
// //     </motion.div>
// //   );
// // }

// // // ══════════════════════════════════════════════════════════════
// // // MAIN PAGE COMPONENT
// // // ══════════════════════════════════════════════════════════════
// // export default function LinkedInAnalyzer({ onBack, resumeScore, resumeSkills = [] }) {
// //   const [pdfFile, setPdfFile] = useState(null);
// //   const [linkedinUrl, setLinkedinUrl] = useState("");
// //   const [manualText, setManualText] = useState("");
// //   const [jobRole, setJobRole] = useState("");
// //   const [analyzing, setAnalyzing] = useState(false);
// //   const [results, setResults] = useState(null);
// //   const [inputMode, setInputMode] = useState("pdf"); // "pdf" | "text"
// //   const inputRef = useRef(null);

// //   const handleAnalyze = async () => {
// //     let profileText = "";
// //     setAnalyzing(true);

// //     try {
// //       if (inputMode === "pdf" && pdfFile) {
// //         profileText = await readPdfAsText(pdfFile);
// //       } else if (inputMode === "text" && manualText.trim().length > 50) {
// //         profileText = manualText;
// //       } else {
// //         alert("❌ Please upload a LinkedIn PDF or paste your profile text.");
// //         setAnalyzing(false);
// //         return;
// //       }

// //       const response = await fetch("https://ai-smart-resume-analyzer-so1y.vercel.app/api/linkedin-analyze", {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({
// //           linkedinText: profileText,
// //           linkedinUrl: linkedinUrl.trim(),
// //           jobRole: jobRole.trim(),
// //           resumeSkills,
// //         }),
// //       });

// //       const data = await response.json();
// //       if (!data.success) throw new Error(data.error || "Analysis failed");
// //       setResults(data.linkedinMetrics);
// //     } catch (err) {
// //       alert(`❌ Error: ${err.message}`);
// //     } finally {
// //       setAnalyzing(false);
// //     }
// //   };

// //   const canAnalyze = (inputMode === "pdf" && pdfFile) ||
// //     (inputMode === "text" && manualText.trim().length > 50);

// //   if (results) {
// //     return (
// //       <div style={{ minHeight: "100vh",
// //         background: "linear-gradient(145deg, #06040f 0%, #0e0720 40%, #060c1c 100%)",
// //         paddingTop: 100, position: "relative" }}>
// //         <BgEffects />
// //         <div style={{ position: "relative", zIndex: 1 }}>
// //           <LinkedInResults metrics={results} resumeScore={resumeScore}
// //             onReset={() => setResults(null)} />
// //         </div>
// //         <Fonts />
// //       </div>
// //     );
// //   }

// //   return (
// //     <div style={{ minHeight: "100vh",
// //       background: "linear-gradient(145deg, #06040f 0%, #0e0720 40%, #060c1c 100%)",
// //       display: "flex", alignItems: "center", justifyContent: "center",
// //       padding: "100px 24px 40px", position: "relative", overflow: "hidden" }}>
// //       <BgEffects />

// //       <AnimatePresence mode="wait">
// //         {analyzing ? (
// //           <LoadingScreen key="loading" />
// //         ) : (
// //           <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
// //             exit={{ opacity: 0 }}
// //             style={{ width: "100%", maxWidth: 720, position: "relative", zIndex: 1 }}>

// //             {/* Header */}
// //             <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
// //               style={{ textAlign: "center", marginBottom: 36 }}>
// //               <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
// //                 transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
// //                 style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 16px",
// //                   background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
// //                   display: "flex", alignItems: "center", justifyContent: "center",
// //                   fontSize: 28, boxShadow: "0 0 40px rgba(14,165,233,0.5)" }}>💼</motion.div>
// //               <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800,
// //                 fontSize: "clamp(22px, 4vw, 34px)", color: "#f1f0ff", marginBottom: 8 }}>
// //                 LinkedIn Profile Analyzer
// //               </h2>
// //               <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14,
// //                 color: "rgba(200,195,230,0.65)", maxWidth: 480, margin: "0 auto" }}>
// //                 Analyze your LinkedIn profile across 12 professional metrics. Upload your PDF export or paste your profile text.
// //               </p>
// //             </motion.div>

// //             {/* Input mode toggle */}
// //             <div style={{ display: "flex", gap: 8, marginBottom: 20,
// //               padding: 5, borderRadius: 14,
// //               background: "rgba(255,255,255,0.03)",
// //               border: "1px solid rgba(255,255,255,0.07)" }}>
// //               {[
// //                 { key: "pdf", label: "📄 Upload LinkedIn PDF", sub: "Save as PDF from LinkedIn" },
// //                 { key: "text", label: "📝 Paste Profile Text", sub: "Copy-paste from your profile" },
// //               ].map(mode => (
// //                 <button key={mode.key} onClick={() => setInputMode(mode.key)}
// //                   style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: "none",
// //                     cursor: "pointer", transition: "all 0.2s", textAlign: "left",
// //                     background: inputMode === mode.key ? "rgba(14,165,233,0.15)" : "transparent",
// //                     borderBottom: inputMode === mode.key ? "2px solid #38bdf8" : "2px solid transparent" }}>
// //                   <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700,
// //                     fontSize: 13, color: inputMode === mode.key ? "#38bdf8" : "rgba(200,195,230,0.6)" }}>
// //                     {mode.label}
// //                   </div>
// //                   <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10,
// //                     color: "rgba(200,195,230,0.4)", marginTop: 2 }}>{mode.sub}</div>
// //                 </button>
// //               ))}
// //             </div>

// //             {/* PDF Upload */}
// //             {inputMode === "pdf" && (
// //               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
// //                 style={{ marginBottom: 20 }}>
// //                 {!pdfFile ? (
// //                   <div onClick={() => inputRef.current?.click()}
// //                     style={{ borderRadius: 16, border: "2px dashed rgba(14,165,233,0.4)",
// //                       background: "rgba(14,165,233,0.04)", padding: "36px 24px",
// //                       textAlign: "center", cursor: "pointer", transition: "all 0.25s" }}
// //                     onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(14,165,233,0.7)"}
// //                     onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(14,165,233,0.4)"}>
// //                     <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
// //                     <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700,
// //                       fontSize: 14, color: "#f1f0ff", marginBottom: 4 }}>
// //                       Upload LinkedIn PDF Export
// //                     </div>
// //                     <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11,
// //                       color: "rgba(200,195,230,0.5)", marginBottom: 14 }}>
// //                       LinkedIn → Me → Settings → Data Privacy → Get a copy of your data
// //                     </div>
// //                     <div style={{ display: "inline-block", padding: "8px 20px",
// //                       borderRadius: 9, background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
// //                       color: "#fff", fontSize: 12, fontWeight: 600,
// //                       fontFamily: "'Outfit',sans-serif",
// //                       boxShadow: "0 0 14px rgba(14,165,233,0.4)" }}>
// //                       Choose PDF
// //                     </div>
// //                     <input ref={inputRef} type="file" accept=".pdf"
// //                       onChange={e => { const f = e.target.files[0]; if (f) setPdfFile(f); e.target.value = ""; }}
// //                       style={{ display: "none" }} />
// //                   </div>
// //                 ) : (
// //                   <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
// //                     style={{ padding: 18, borderRadius: 16,
// //                       border: "1.5px solid rgba(14,165,233,0.4)",
// //                       background: "rgba(14,165,233,0.06)",
// //                       display: "flex", alignItems: "center", gap: 14 }}>
// //                     <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0,
// //                       background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
// //                       display: "flex", alignItems: "center", justifyContent: "center",
// //                       fontSize: 20, boxShadow: "0 0 16px rgba(14,165,233,0.4)" }}>📄</div>
// //                     <div style={{ flex: 1, minWidth: 0 }}>
// //                       <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700,
// //                         fontSize: 13, color: "#f1f0ff",
// //                         overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
// //                         {pdfFile.name}
// //                       </div>
// //                       <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10,
// //                         color: "#38bdf8", marginTop: 2 }}>
// //                         {(pdfFile.size / 1024).toFixed(1)} KB · PDF
// //                       </div>
// //                     </div>
// //                     <button onClick={() => setPdfFile(null)}
// //                       style={{ width: 28, height: 28, borderRadius: 7,
// //                         border: "1px solid rgba(248,113,113,0.3)",
// //                         background: "rgba(248,113,113,0.1)",
// //                         color: "#f87171", cursor: "pointer",
// //                         display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
// //                   </motion.div>
// //                 )}
// //               </motion.div>
// //             )}

// //             {/* Text paste */}
// //             {inputMode === "text" && (
// //               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
// //                 style={{ marginBottom: 20 }}>
// //                 <textarea value={manualText} onChange={e => setManualText(e.target.value)}
// //                   placeholder="Paste your full LinkedIn profile text here — name, headline, about, experience, skills, projects, certifications, recommendations..."
// //                   style={{ width: "100%", minHeight: 200, borderRadius: 14,
// //                     padding: "14px 16px", boxSizing: "border-box",
// //                     background: "rgba(255,255,255,0.03)",
// //                     border: manualText ? "1.5px solid rgba(14,165,233,0.5)" : "2px dashed rgba(14,165,233,0.3)",
// //                     color: "#f1f0ff", fontSize: 13,
// //                     fontFamily: "'DM Sans',sans-serif",
// //                     lineHeight: 1.7, resize: "vertical", outline: "none" }} />
// //                 <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
// //                   color: "rgba(200,195,230,0.35)", marginTop: 6 }}>
// //                   {manualText.length} characters · Minimum 50 required
// //                 </div>
// //               </motion.div>
// //             )}

// //             {/* LinkedIn URL (optional) */}
// //             <div style={{ marginBottom: 20 }}>
// //               <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
// //                 color: "#38bdf8", letterSpacing: "0.1em", marginBottom: 8 }}>
// //                 🔗 LINKEDIN URL (OPTIONAL)
// //               </div>
// //               <input type="text" value={linkedinUrl}
// //                 onChange={e => setLinkedinUrl(e.target.value)}
// //                 placeholder="https://linkedin.com/in/yourprofile"
// //                 style={{ width: "100%", padding: "11px 14px", borderRadius: 11,
// //                   border: "1px solid rgba(14,165,233,0.25)",
// //                   background: "rgba(14,165,233,0.04)", color: "#f1f0ff",
// //                   fontSize: 13, fontFamily: "'DM Mono',monospace",
// //                   outline: "none", boxSizing: "border-box" }} />
// //             </div>

// //             {/* Job Role (optional) */}
// //             <div style={{ marginBottom: 28 }}>
// //               <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
// //                 color: "#a78bfa", letterSpacing: "0.1em", marginBottom: 8 }}>
// //                 🎯 TARGET JOB ROLE (OPTIONAL — improves skill relevance scoring)
// //               </div>
// //               <input type="text" value={jobRole}
// //                 onChange={e => setJobRole(e.target.value)}
// //                 placeholder="e.g., Frontend Developer, ML Engineer, Data Analyst"
// //                 style={{ width: "100%", padding: "11px 14px", borderRadius: 11,
// //                   border: "1px solid rgba(139,92,246,0.25)",
// //                   background: "rgba(124,58,237,0.05)", color: "#f1f0ff",
// //                   fontSize: 13, fontFamily: "'DM Mono',monospace",
// //                   outline: "none", boxSizing: "border-box" }} />
// //             </div>

// //             {/* How to export hint */}
// //             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
// //               style={{ marginBottom: 28, padding: "14px 16px", borderRadius: 12,
// //                 background: "rgba(251,191,36,0.07)",
// //                 border: "1px solid rgba(251,191,36,0.2)" }}>
// //               <div style={{ fontSize: 11, fontFamily: "'Outfit',sans-serif",
// //                 fontWeight: 700, color: "#fbbf24", marginBottom: 6 }}>
// //                 💡 How to get your LinkedIn PDF
// //               </div>
// //               <div style={{ fontSize: 11, fontFamily: "'DM Sans',sans-serif",
// //                 color: "rgba(251,191,36,0.75)", lineHeight: 1.8 }}>
// //                 LinkedIn → Your Profile → <strong>More</strong> button → <strong>Save to PDF</strong>
// //               </div>
// //             </motion.div>

// //             {/* Analyze button */}
// //             <AnimatePresence>
// //               {canAnalyze && (
// //                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
// //                   exit={{ opacity: 0 }} style={{ textAlign: "center" }}>
// //                   <motion.button whileHover={{ scale: 1.06, boxShadow: "0 0 60px rgba(14,165,233,0.6)" }}
// //                     whileTap={{ scale: 0.96 }} onClick={handleAnalyze}
// //                     style={{ padding: "18px 64px", borderRadius: 18, border: "none",
// //                       background: "linear-gradient(135deg, #0ea5e9, #2563eb, #7c3aed)",
// //                       color: "#fff", fontSize: 18, fontWeight: 800,
// //                       fontFamily: "'Outfit',sans-serif", cursor: "pointer",
// //                       boxShadow: "0 0 36px rgba(14,165,233,0.45)",
// //                       letterSpacing: "0.04em", position: "relative", overflow: "hidden" }}>
// //                     <motion.div animate={{ x: ["-100%", "200%"] }}
// //                       transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
// //                       style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
// //                         background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
// //                         pointerEvents: "none" }} />
// //                     💼 ANALYZE LINKEDIN
// //                   </motion.button>
// //                   <div style={{ marginTop: 10, fontFamily: "'DM Mono',monospace",
// //                     fontSize: 10, color: "rgba(167,139,250,0.5)", letterSpacing: "0.1em" }}>
// //                     12 PROFESSIONAL METRICS · AI POWERED
// //                   </div>
// //                 </motion.div>
// //               )}
// //             </AnimatePresence>
// //           </motion.div>
// //         )}
// //       </AnimatePresence>
// //       <Fonts />
// //     </div>
// //   );
// // }

// // // ── Shared bg & fonts ──────────────────────────────────────────
// // function BgEffects() {
// //   return (
// //     <>
// //       <div style={{ position: "fixed", width: 600, height: 600, borderRadius: "50%",
// //         top: "-15%", left: "-10%",
// //         background: "radial-gradient(circle, rgba(14,165,233,0.2) 0%, transparent 70%)",
// //         filter: "blur(60px)", pointerEvents: "none", zIndex: 0 }} />
// //       <div style={{ position: "fixed", width: 500, height: 500, borderRadius: "50%",
// //         bottom: "-15%", right: "-10%",
// //         background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)",
// //         filter: "blur(60px)", pointerEvents: "none", zIndex: 0 }} />
// //       <div style={{ position: "fixed", inset: 0,
// //         backgroundImage: `linear-gradient(rgba(14,165,233,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.04) 1px, transparent 1px)`,
// //         backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0 }} />
// //     </>
// //   );
// // }
// // function Fonts() {
// //   return (
// //     <style>{`
// //       @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=DM+Sans:wght@400;500&family=DM+Mono:wght@400;500&display=swap');
// //       textarea::placeholder, input::placeholder { color: rgba(200,195,230,0.25); }
// //     `}</style>
// //   );
// // }














































































// import { useState, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useUser } from "@clerk/clerk-react";
// import * as pdfjsLib from "pdfjs-dist";

// pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
//   "pdfjs-dist/build/pdf.worker.min.mjs",
//   import.meta.url
// ).toString();

// // ── Extract text from PDF ──────────────────────────────────────
// async function readPdfAsText(file) {
//   const arrayBuffer = await file.arrayBuffer();
//   const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
//   let text = "";
//   for (let i = 1; i <= pdf.numPages; i++) {
//     const page = await pdf.getPage(i);
//     const content = await page.getTextContent();
//     text += content.items.map((item) => item.str).join(" ") + "\n";
//   }
//   return text.trim();
// }

// // ── Color helpers ──────────────────────────────────────────────
// const scoreColor = (s) => s >= 75 ? "#34d399" : s >= 50 ? "#fbbf24" : "#f87171";
// const scoreLabel = (s) => s >= 75 ? "Strong" : s >= 50 ? "Fair" : "Weak";

// // ── Animated circle score ──────────────────────────────────────
// function Ring({ score, color, size = 80, stroke = 6, delay = 0.2 }) {
//   const r = (size - stroke) / 2;
//   const circ = 2 * Math.PI * r;
//   const offset = circ - (Math.min(score, 100) / 100) * circ;
//   return (
//     <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
//       <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
//       <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
//         strokeLinecap="round" strokeDasharray={circ}
//         initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
//         transition={{ duration: 1.4, ease: "easeOut", delay }}
//         style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
//     </svg>
//   );
// }

// // ── Score pill ─────────────────────────────────────────────────
// function ScorePill({ score }) {
//   const color = scoreColor(score);
//   const label = scoreLabel(score);
//   return (
//     <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100,
//       background: `${color}20`, color, border: `1px solid ${color}40`,
//       fontFamily: "'DM Mono',monospace" }}>
//       {label}
//     </span>
//   );
// }

// // ── Horizontal bar ─────────────────────────────────────────────
// function Bar({ label, value, color, delay = 0 }) {
//   const c = scoreColor(value);
//   return (
//     <div style={{ marginBottom: 14 }}>
//       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
//         <div>
//           <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 12, color: "#f1f0ff" }}>{label}</span>
//         </div>
//         <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
//           <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: color || c, fontWeight: 700 }}>{value}</span>
//           <ScorePill score={value} />
//         </div>
//       </div>
//       <div style={{ height: 7, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
//         <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }}
//           transition={{ duration: 1, delay, ease: "easeOut" }}
//           style={{ height: "100%", borderRadius: 4, background: color || c, boxShadow: `0 0 6px ${color || c}` }} />
//       </div>
//     </div>
//   );
// }

// // ── Chip tag ───────────────────────────────────────────────────
// function Chip({ label, color }) {
//   return (
//     <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 100,
//       background: `${color}18`, color, border: `1px solid ${color}33`,
//       fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" }}>
//       {label}
//     </span>
//   );
// }

// // ── Section card ───────────────────────────────────────────────
// function SectionCard({ title, icon, color, children, delay = 0 }) {
//   return (
//     <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
//       style={{ padding: 16, borderRadius: 14, background: `${color}08`, border: `1px solid ${color}28`, marginBottom: 14 }}>
//       <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color, letterSpacing: "0.1em", marginBottom: 10 }}>
//         {icon} {title}
//       </div>
//       {children}
//     </motion.div>
//   );
// }

// // ── Trust score ring ───────────────────────────────────────────
// function TrustRing({ score }) {
//   const color = scoreColor(score);
//   const label = score >= 75 ? "HIGHLY AUTHENTIC" : score >= 50 ? "PARTIALLY VERIFIED" : "LOW AUTHENTICITY";
//   return (
//     <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
//       <div style={{ position: "relative", width: 110, height: 110 }}>
//         <Ring score={score} color={color} size={110} stroke={9} delay={0.1} />
//         <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
//           alignItems: "center", justifyContent: "center" }}>
//           <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 26, color, lineHeight: 1 }}>{score}</span>
//           <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "rgba(200,195,230,0.5)", marginTop: 2 }}>/ 100</span>
//         </div>
//       </div>
//       <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color, letterSpacing: "0.12em", textAlign: "center" }}>{label}</div>
//     </div>
//   );
// }

// // ── Loading screen ─────────────────────────────────────────────
// function LoadingScreen() {
//   const steps = [
//     "Parsing LinkedIn PDF...", "Checking profile completeness...",
//     "Analyzing headline quality...", "Scoring skills relevance...",
//     "Evaluating experience quality...", "Detecting project presence...",
//     "Checking certifications...", "Computing branding score...",
//     "Optimizing keyword analysis...", "Building your report...",
//   ];
//   const [cur, setCur] = useState(0);
//   useState(() => {
//     const t = setInterval(() => setCur((p) => (p + 1) % steps.length), 900);
//     return () => clearInterval(t);
//   });
//   return (
//     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//       style={{ textAlign: "center", padding: "80px 24px" }}>
//       <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 32px" }}>
//         {[0, 1, 2].map((i) => (
//           <motion.div key={i} animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
//             transition={{ duration: 1.8, delay: i * 0.5, repeat: Infinity }}
//             style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(14,165,233,0.5)" }} />
//         ))}
//         <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>💼</div>
//       </div>
//       <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 22, color: "#f1f0ff", marginBottom: 10 }}>
//         Analyzing LinkedIn Profile...
//       </div>
//       <AnimatePresence mode="wait">
//         <motion.div key={cur} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
//           style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: "#38bdf8", letterSpacing: "0.08em" }}>
//           {steps[cur]}
//         </motion.div>
//       </AnimatePresence>
//     </motion.div>
//   );
// }

// // ══════════════════════════════════════════════════════════════
// // RESULTS COMPONENT
// // ══════════════════════════════════════════════════════════════
// function LinkedInResults({ metrics, resumeScore, onReset }) {
//   const [tab, setTab] = useState("overview");
//   const m = metrics;
//   const s = m.scores;
//   const d = m.details;

//   const METRIC_DEFS = [
//     { key: "completenessScore",    label: "Profile Completeness",  icon: "✅", color: "#10b981" },
//     { key: "headlineScore",        label: "Headline Quality",       icon: "🏷️", color: "#3b82f6" },
//     { key: "skillsRelevanceScore", label: "Skills Relevance",       icon: "💡", color: "#8b5cf6" },
//     { key: "expQualityScore",      label: "Experience Quality",     icon: "💼", color: "#f59e0b" },
//     { key: "projectScore",         label: "Project Presence",       icon: "🚀", color: "#06b6d4" },
//     { key: "activityScore",        label: "Activity & Engagement",  icon: "📣", color: "#ec4899" },
//     { key: "networkScore",         label: "Network Strength",       icon: "🌐", color: "#a78bfa" },
//     { key: "certScore",            label: "Certifications",         icon: "🏅", color: "#34d399" },
//     { key: "recommendationScore",  label: "Recommendations",        icon: "⭐", color: "#fbbf24" },
//     { key: "consistencyScore",     label: "Resume Consistency",     icon: "🔗", color: "#60a5fa" },
//     { key: "brandingScore",        label: "Professional Branding",  icon: "🎯", color: "#f87171" },
//     { key: "keywordScore",         label: "Keyword Optimization",   icon: "🔍", color: "#c084fc" },
//   ];

//   const tabs = ["overview", "details", "compare"];

//   return (
//     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//       style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 60px" }}>

//       {/* Top bar */}
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
//         <motion.button whileHover={{ scale: 1.04 }} onClick={onReset}
//           style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(14,165,233,0.4)",
//             background: "rgba(14,165,233,0.08)", color: "#38bdf8", fontSize: 13, fontWeight: 600,
//             cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
//           ← Analyze Again
//         </motion.button>
//         <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(200,195,230,0.4)", letterSpacing: "0.1em" }}>
//           LINKEDIN ANALYSIS REPORT · {new Date().toLocaleDateString()}
//         </div>
//       </div>

//       {/* Hero — two scores side by side */}
//       <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
//         style={{ display: "grid", gridTemplateColumns: resumeScore ? "1fr 1fr" : "1fr", gap: 20, marginBottom: 28 }}>

//         {/* LinkedIn score */}
//         <div style={{ padding: "32px 28px", borderRadius: 22, background: "rgba(14,165,233,0.07)",
//           border: "1px solid rgba(14,165,233,0.3)", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
//           <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
//             <Ring score={m.overallLinkedInScore} color="#38bdf8" size={120} stroke={10} delay={0.1} />
//             <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
//               <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 30, color: "#38bdf8", lineHeight: 1 }}>{m.overallLinkedInScore}</span>
//               <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(200,195,230,0.4)", marginTop: 2 }}>/ 100</span>
//             </div>
//           </div>
//           <div>
//             <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "#38bdf8", letterSpacing: "0.12em", marginBottom: 6 }}>💼 LINKEDIN SCORE</div>
//             <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 20, color: "#f1f0ff", marginBottom: 4 }}>
//               {scoreLabel(m.overallLinkedInScore)} Profile
//             </div>
//             <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.6)", lineHeight: 1.6 }}>
//               Based on 12 LinkedIn metrics including<br />branding, keywords & experience quality
//             </div>
//           </div>
//         </div>

//         {/* Resume score (if available) */}
//         {resumeScore !== null && resumeScore !== undefined && (
//           <div style={{ padding: "32px 28px", borderRadius: 22, background: "rgba(124,58,237,0.07)",
//             border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
//             <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
//               <Ring score={resumeScore} color="#a78bfa" size={120} stroke={10} delay={0.3} />
//               <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
//                 <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 30, color: "#a78bfa", lineHeight: 1 }}>{resumeScore}</span>
//                 <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(200,195,230,0.4)", marginTop: 2 }}>/ 100</span>
//               </div>
//             </div>
//             <div>
//               <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "#a78bfa", letterSpacing: "0.12em", marginBottom: 6 }}>📋 RESUME SCORE</div>
//               <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 20, color: "#f1f0ff", marginBottom: 4 }}>
//                 {scoreLabel(resumeScore)} Resume
//               </div>
//               <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.6)", lineHeight: 1.6 }}>
//                 From your last resume analysis.<br />Consistency check: {s.consistencyScore}%
//               </div>
//             </div>
//           </div>
//         )}
//       </motion.div>

//       {/* Tabs */}
//       <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 0 }}>
//         {tabs.map((t) => (
//           <button key={t} onClick={() => setTab(t)}
//             style={{ padding: "9px 20px", borderRadius: "10px 10px 0 0", border: "none", cursor: "pointer",
//               fontSize: 11, fontWeight: 600, fontFamily: "'Outfit',sans-serif", letterSpacing: "0.06em",
//               background: tab === t ? "rgba(14,165,233,0.15)" : "transparent",
//               color: tab === t ? "#38bdf8" : "rgba(200,195,230,0.45)",
//               borderBottom: tab === t ? "2px solid #38bdf8" : "2px solid transparent", transition: "all 0.2s" }}>
//             {t === "overview" ? "📊 OVERVIEW" : t === "details" ? "🔬 DETAILS" : "⚖️ COMPARE"}
//           </button>
//         ))}
//       </div>

//       <AnimatePresence mode="wait">

//         {/* OVERVIEW TAB */}
//         {tab === "overview" && (
//           <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//             <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
//               {METRIC_DEFS.map((def, i) => (
//                 <div key={def.key} style={{ padding: "16px", borderRadius: 14, background: `${def.color}06`, border: `1px solid ${def.color}25` }}>
//                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
//                     <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
//                       <span style={{ fontSize: 15 }}>{def.icon}</span>
//                       <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 12, color: "#f1f0ff" }}>{def.label}</span>
//                     </div>
//                     <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 18, color: def.color }}>{s[def.key]}</span>
//                   </div>
//                   <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)" }}>
//                     <motion.div initial={{ width: 0 }} animate={{ width: `${s[def.key]}%` }}
//                       transition={{ duration: 1, delay: i * 0.05, ease: "easeOut" }}
//                       style={{ height: "100%", borderRadius: 3, background: def.color, boxShadow: `0 0 6px ${def.color}` }} />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </motion.div>
//         )}

//         {/* DETAILS TAB */}
//         {tab === "details" && (
//           <motion.div key="dt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
//               <div>
//                 <SectionCard title="PROFILE COMPLETENESS" icon="✅" color="#10b981" delay={0}>
//                   <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
//                     {["photo","headline","about","experience","skills","projects","education","contact"].map((sec) => (
//                       <span key={sec} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 100,
//                         background: d.missingSections?.includes(sec) ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.15)",
//                         color: d.missingSections?.includes(sec) ? "#f87171" : "#34d399",
//                         border: `1px solid ${d.missingSections?.includes(sec) ? "rgba(248,113,113,0.3)" : "rgba(52,211,153,0.3)"}`,
//                         fontFamily: "'DM Mono',monospace" }}>
//                         {d.missingSections?.includes(sec) ? "❌" : "✓"} {sec}
//                       </span>
//                     ))}
//                   </div>
//                 </SectionCard>

//                 <SectionCard title="SKILLS FOUND" icon="💡" color="#8b5cf6" delay={0.05}>
//                   <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
//                     {(d.foundSkills || []).slice(0, 12).map((skill, i) => <Chip key={i} label={skill} color="#a78bfa" />)}
//                     {(!d.foundSkills || d.foundSkills.length === 0) && (
//                       <span style={{ fontSize: 11, color: "rgba(200,195,230,0.4)", fontFamily: "'DM Sans',sans-serif" }}>No recognizable tech skills detected</span>
//                     )}
//                   </div>
//                 </SectionCard>

//                 <SectionCard title="EXPERIENCE QUALITY" icon="💼" color="#f59e0b" delay={0.1}>
//                   <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
//                     {(d.actionVerbs || []).map((v, i) => <Chip key={i} label={v} color="#fbbf24" />)}
//                   </div>
//                   <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
//                     {[
//                       { label: "Has Numbers/Metrics", ok: d.hasNumbers },
//                       { label: "Internship",           ok: d.hasInternship },
//                       { label: "Full-Time Role",       ok: d.hasFullTime },
//                     ].map((item, i) => (
//                       <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100,
//                         background: item.ok ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
//                         color: item.ok ? "#34d399" : "#f87171",
//                         border: `1px solid ${item.ok ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`,
//                         fontFamily: "'DM Mono',monospace" }}>
//                         {item.ok ? "✓" : "✗"} {item.label}
//                       </span>
//                     ))}
//                   </div>
//                 </SectionCard>

//                 <SectionCard title="CERTIFICATIONS" icon="🏅" color="#34d399" delay={0.15}>
//                   {(d.certsFound || []).length === 0 ? (
//                     <div style={{ fontSize: 11, color: "#f87171", fontFamily: "'DM Sans',sans-serif" }}>
//                       No certifications detected — add courses, credentials, or badges
//                     </div>
//                   ) : (
//                     <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
//                       {d.certsFound.map((c, i) => <Chip key={i} label={c} color="#34d399" />)}
//                     </div>
//                   )}
//                 </SectionCard>
//               </div>

//               <div>
//                 <SectionCard title="NETWORK STRENGTH" icon="🌐" color="#a78bfa" delay={0.07}>
//                   <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
//                     <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 36, color: "#a78bfa" }}>
//                       {d.connections > 0 ? d.connections : "?"}
//                     </div>
//                     <div>
//                       <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#a78bfa" }}>{d.networkLabel}</div>
//                       <div style={{ fontSize: 10, color: "rgba(200,195,230,0.5)", fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>
//                         {d.connections >= 500 ? "Excellent visibility" : d.connections >= 100 ? "Good exposure" : "Grow your network"}
//                       </div>
//                     </div>
//                   </div>
//                 </SectionCard>

//                 <SectionCard title="RECOMMENDATIONS" icon="⭐" color="#fbbf24" delay={0.12}>
//                   <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
//                     <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 36, color: "#fbbf24" }}>{d.recCount}</div>
//                     <div style={{ fontSize: 11, color: "rgba(200,195,230,0.6)", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.6 }}>
//                       {d.recCount === 0 ? "🚩 No recommendations — ask managers or peers to write one"
//                         : d.recCount >= 3 ? "✅ Strong social proof"
//                         : "⚠️ Getting there — aim for 3+"}
//                     </div>
//                   </div>
//                 </SectionCard>

//                 <SectionCard title="PROJECT PRESENCE" icon="🚀" color="#06b6d4" delay={0.17}>
//                   <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
//                     {[
//                       { label: `${d.projectCount} projects mentioned`, ok: d.projectCount > 0 },
//                       { label: "GitHub link",  ok: d.hasGithubLinks },
//                       { label: "Live demo link", ok: d.hasLiveLinks },
//                     ].map((item, i) => (
//                       <span key={i} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 100,
//                         background: item.ok ? "rgba(6,182,212,0.1)" : "rgba(248,113,113,0.1)",
//                         color: item.ok ? "#06b6d4" : "#f87171",
//                         border: `1px solid ${item.ok ? "rgba(6,182,212,0.25)" : "rgba(248,113,113,0.2)"}`,
//                         fontFamily: "'DM Mono',monospace" }}>
//                         {item.ok ? "✓" : "✗"} {item.label}
//                       </span>
//                     ))}
//                   </div>
//                 </SectionCard>

//                 <SectionCard title="KEYWORD OPTIMIZATION" icon="🔍" color="#c084fc" delay={0.22}>
//                   <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
//                     {(d.foundATS || []).map((k, i) => <Chip key={i} label={k} color="#c084fc" />)}
//                   </div>
//                   <div style={{ fontSize: 10, color: "rgba(200,195,230,0.45)", fontFamily: "'DM Sans',sans-serif" }}>
//                     {d.foundATS?.length || 0}/15 ATS keywords found in profile
//                   </div>
//                 </SectionCard>
//               </div>
//             </div>
//           </motion.div>
//         )}

//         {/* COMPARE TAB */}
//         {tab === "compare" && (
//           <motion.div key="cp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//             {resumeScore ? (
//               <div style={{ padding: 20, borderRadius: 18, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
//                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
//                   <div>
//                     <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "#38bdf8", letterSpacing: "0.1em", marginBottom: 16 }}>💼 LINKEDIN METRICS</div>
//                     {METRIC_DEFS.map((def, i) => (
//                       <Bar key={def.key} label={def.label} value={s[def.key]} color={def.color} delay={i * 0.04} />
//                     ))}
//                   </div>
//                   <div>
//                     <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "#a78bfa", letterSpacing: "0.1em", marginBottom: 16 }}>📋 RESUME OVERALL</div>
//                     <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 20, borderRadius: 14, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", marginBottom: 16 }}>
//                       <div style={{ position: "relative", width: 80, height: 80 }}>
//                         <Ring score={resumeScore} color="#a78bfa" size={80} stroke={7} delay={0.3} />
//                         <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
//                           <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 20, color: "#a78bfa" }}>{resumeScore}</span>
//                         </div>
//                       </div>
//                       <div>
//                         <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 16, color: "#f1f0ff" }}>{scoreLabel(resumeScore)} Resume</div>
//                         <div style={{ fontSize: 11, color: "rgba(200,195,230,0.55)", fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>From your resume analysis</div>
//                       </div>
//                     </div>
//                     {/* Combined trust signal */}
//                     <div style={{ padding: 16, borderRadius: 14, background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>
//                       <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "#fbbf24", letterSpacing: "0.1em", marginBottom: 8 }}>🔥 COMBINED TRUST SIGNAL</div>
//                       <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
//                         <div style={{ position: "relative", width: 80, height: 80 }}>
//                           <Ring score={Math.round((m.overallLinkedInScore + resumeScore) / 2)} color="#fbbf24" size={80} stroke={7} delay={0.1} />
//                           <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
//                             <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 18, color: "#fbbf24", lineHeight: 1 }}>
//                               {Math.round((m.overallLinkedInScore + resumeScore) / 2)}
//                             </span>
//                           </div>
//                         </div>
//                         <div style={{ fontSize: 12, color: "rgba(200,195,230,0.6)", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.7 }}>
//                           LinkedIn: <strong style={{ color: "#38bdf8" }}>{m.overallLinkedInScore}</strong> · Resume: <strong style={{ color: "#a78bfa" }}>{resumeScore}</strong><br />
//                           Consistency: <strong style={{ color: "#60a5fa" }}>{s.consistencyScore}%</strong>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ) : (
//               <div style={{ textAlign: "center", padding: "60px 24px", color: "rgba(200,195,230,0.4)", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>
//                 <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
//                 No resume analysis found.<br />
//                 Go to <strong>Analyze Resume</strong> first, then come back to compare.
//               </div>
//             )}
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// }

// // ══════════════════════════════════════════════════════════════
// // MAIN PAGE COMPONENT
// // ══════════════════════════════════════════════════════════════
// export default function LinkedInAnalyzer({ onBack, resumeScore, resumeSkills = [] }) {
//   const { user } = useUser();
//   const [pdfFile, setPdfFile] = useState(null);
//   const [linkedinUrl, setLinkedinUrl] = useState("");
//   const [manualText, setManualText] = useState("");
//   const [jobRole, setJobRole] = useState("");
//   const [analyzing, setAnalyzing] = useState(false);
//   const [results, setResults] = useState(null);
//   const [inputMode, setInputMode] = useState("pdf");
//   const inputRef = useRef(null);

//   const handleAnalyze = async () => {
//     let profileText = "";
//     setAnalyzing(true);

//     try {
//       if (inputMode === "pdf" && pdfFile) {
//         profileText = await readPdfAsText(pdfFile);
//       } else if (inputMode === "text" && manualText.trim().length > 50) {
//         profileText = manualText;
//       } else {
//         alert("❌ Please upload a LinkedIn PDF or paste your profile text.");
//         setAnalyzing(false);
//         return;
//       }

//       // ── Step 1: Analyze LinkedIn ───────────────────────────
//       const response = await fetch("https://ai-smart-resume-analyzer-so1y.vercel.app/api/linkedin-analyze", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           linkedinText: profileText,
//           linkedinUrl:  linkedinUrl.trim(),
//           jobRole:      jobRole.trim(),
//           resumeSkills,
//         }),
//       });

//       const data = await response.json();
//       if (!data.success) throw new Error(data.error || "Analysis failed");

//       setResults(data.linkedinMetrics);

//       // ── Step 2: Save to MongoDB ────────────────────────────
//       try {
//         await fetch("https://ai-smart-resume-analyzer-so1y.vercel.app/api/linkedin/save", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             clerkUserId:     user?.id             || "guest",
//             userName:        `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
//             userEmail:       user?.emailAddresses?.[0]?.emailAddress || "",
//             linkedinUrl:     linkedinUrl.trim(),
//             jobRole:         jobRole.trim(),
//             linkedinMetrics: data.linkedinMetrics,
//             resumeScore:     resumeScore || null,
//           }),
//         });
//         console.log("✅ LinkedIn analysis saved to MongoDB");
//       } catch (saveErr) {
//         console.warn("⚠️ Could not save LinkedIn analysis:", saveErr.message);
//       }

//     } catch (err) {
//       alert(`❌ Error: ${err.message}`);
//     } finally {
//       setAnalyzing(false);
//     }
//   };

//   const canAnalyze = (inputMode === "pdf" && pdfFile) || (inputMode === "text" && manualText.trim().length > 50);

//   if (results) {
//     return (
//       <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #06040f 0%, #0e0720 40%, #060c1c 100%)", paddingTop: 100, position: "relative" }}>
//         <BgEffects />
//         <div style={{ position: "relative", zIndex: 1 }}>
//           <LinkedInResults metrics={results} resumeScore={resumeScore} onReset={() => setResults(null)} />
//         </div>
//         <Fonts />
//       </div>
//     );
//   }

//   return (
//     <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #06040f 0%, #0e0720 40%, #060c1c 100%)",
//       display: "flex", alignItems: "center", justifyContent: "center",
//       padding: "100px 24px 40px", position: "relative", overflow: "hidden" }}>
//       <BgEffects />

//       <AnimatePresence mode="wait">
//         {analyzing ? (
//           <LoadingScreen key="loading" />
//         ) : (
//           <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             style={{ width: "100%", maxWidth: 720, position: "relative", zIndex: 1 }}>

//             {/* Header */}
//             <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: 36 }}>
//               <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
//                 transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
//                 style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 16px",
//                   background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
//                   display: "flex", alignItems: "center", justifyContent: "center",
//                   fontSize: 28, boxShadow: "0 0 40px rgba(14,165,233,0.5)" }}>💼</motion.div>
//               <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: "clamp(22px, 4vw, 34px)", color: "#f1f0ff", marginBottom: 8 }}>
//                 LinkedIn Profile Analyzer
//               </h2>
//               <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "rgba(200,195,230,0.65)", maxWidth: 480, margin: "0 auto" }}>
//                 Analyze your LinkedIn profile across 12 professional metrics. Results are saved to your history.
//               </p>
//             </motion.div>

//             {/* Input mode toggle */}
//             <div style={{ display: "flex", gap: 8, marginBottom: 20, padding: 5, borderRadius: 14,
//               background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
//               {[
//                 { key: "pdf",  label: "📄 Upload LinkedIn PDF",  sub: "Save as PDF from LinkedIn" },
//                 { key: "text", label: "📝 Paste Profile Text",   sub: "Copy-paste from your profile" },
//               ].map((mode) => (
//                 <button key={mode.key} onClick={() => setInputMode(mode.key)}
//                   style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: "none", cursor: "pointer",
//                     transition: "all 0.2s", textAlign: "left",
//                     background: inputMode === mode.key ? "rgba(14,165,233,0.15)" : "transparent",
//                     borderBottom: inputMode === mode.key ? "2px solid #38bdf8" : "2px solid transparent" }}>
//                   <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13,
//                     color: inputMode === mode.key ? "#38bdf8" : "rgba(200,195,230,0.6)" }}>{mode.label}</div>
//                   <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "rgba(200,195,230,0.4)", marginTop: 2 }}>{mode.sub}</div>
//                 </button>
//               ))}
//             </div>

//             {/* PDF Upload */}
//             {inputMode === "pdf" && (
//               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 20 }}>
//                 {!pdfFile ? (
//                   <div onClick={() => inputRef.current?.click()}
//                     style={{ borderRadius: 16, border: "2px dashed rgba(14,165,233,0.4)",
//                       background: "rgba(14,165,233,0.04)", padding: "36px 24px",
//                       textAlign: "center", cursor: "pointer", transition: "all 0.25s" }}
//                     onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(14,165,233,0.7)"}
//                     onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(14,165,233,0.4)"}>
//                     <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
//                     <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14, color: "#f1f0ff", marginBottom: 4 }}>
//                       Upload LinkedIn PDF Export
//                     </div>
//                     <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(200,195,230,0.5)", marginBottom: 14 }}>
//                       LinkedIn → Me → Settings → Data Privacy → Get a copy of your data
//                     </div>
//                     <div style={{ display: "inline-block", padding: "8px 20px", borderRadius: 9,
//                       background: "linear-gradient(135deg, #0ea5e9, #2563eb)", color: "#fff",
//                       fontSize: 12, fontWeight: 600, fontFamily: "'Outfit',sans-serif",
//                       boxShadow: "0 0 14px rgba(14,165,233,0.4)" }}>Choose PDF</div>
//                     <input ref={inputRef} type="file" accept=".pdf"
//                       onChange={(e) => { const f = e.target.files[0]; if (f) setPdfFile(f); e.target.value = ""; }}
//                       style={{ display: "none" }} />
//                   </div>
//                 ) : (
//                   <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
//                     style={{ padding: 18, borderRadius: 16, border: "1.5px solid rgba(14,165,233,0.4)",
//                       background: "rgba(14,165,233,0.06)", display: "flex", alignItems: "center", gap: 14 }}>
//                     <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0,
//                       background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
//                       display: "flex", alignItems: "center", justifyContent: "center",
//                       fontSize: 20, boxShadow: "0 0 16px rgba(14,165,233,0.4)" }}>📄</div>
//                     <div style={{ flex: 1, minWidth: 0 }}>
//                       <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, color: "#f1f0ff",
//                         overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pdfFile.name}</div>
//                       <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#38bdf8", marginTop: 2 }}>
//                         {(pdfFile.size / 1024).toFixed(1)} KB · PDF
//                       </div>
//                     </div>
//                     <button onClick={() => setPdfFile(null)}
//                       style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid rgba(248,113,113,0.3)",
//                         background: "rgba(248,113,113,0.1)", color: "#f87171", cursor: "pointer",
//                         display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
//                   </motion.div>
//                 )}
//               </motion.div>
//             )}

//             {/* Text paste */}
//             {inputMode === "text" && (
//               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 20 }}>
//                 <textarea value={manualText} onChange={(e) => setManualText(e.target.value)}
//                   placeholder="Paste your full LinkedIn profile text here — name, headline, about, experience, skills, projects, certifications, recommendations..."
//                   style={{ width: "100%", minHeight: 200, borderRadius: 14, padding: "14px 16px", boxSizing: "border-box",
//                     background: "rgba(255,255,255,0.03)",
//                     border: manualText ? "1.5px solid rgba(14,165,233,0.5)" : "2px dashed rgba(14,165,233,0.3)",
//                     color: "#f1f0ff", fontSize: 13, fontFamily: "'DM Sans',sans-serif",
//                     lineHeight: 1.7, resize: "vertical", outline: "none" }} />
//                 <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(200,195,230,0.35)", marginTop: 6 }}>
//                   {manualText.length} characters · Minimum 50 required
//                 </div>
//               </motion.div>
//             )}

//             {/* LinkedIn URL */}
//             <div style={{ marginBottom: 20 }}>
//               <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "#38bdf8", letterSpacing: "0.1em", marginBottom: 8 }}>
//                 🔗 LINKEDIN URL (OPTIONAL)
//               </div>
//               <input type="text" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)}
//                 placeholder="https://linkedin.com/in/yourprofile"
//                 style={{ width: "100%", padding: "11px 14px", borderRadius: 11,
//                   border: "1px solid rgba(14,165,233,0.25)", background: "rgba(14,165,233,0.04)",
//                   color: "#f1f0ff", fontSize: 13, fontFamily: "'DM Mono',monospace",
//                   outline: "none", boxSizing: "border-box" }} />
//             </div>

//             {/* Job Role */}
//             <div style={{ marginBottom: 28 }}>
//               <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "#a78bfa", letterSpacing: "0.1em", marginBottom: 8 }}>
//                 🎯 TARGET JOB ROLE (OPTIONAL — improves skill relevance scoring)
//               </div>
//               <input type="text" value={jobRole} onChange={(e) => setJobRole(e.target.value)}
//                 placeholder="e.g., Frontend Developer, ML Engineer, Data Analyst"
//                 style={{ width: "100%", padding: "11px 14px", borderRadius: 11,
//                   border: "1px solid rgba(139,92,246,0.25)", background: "rgba(124,58,237,0.05)",
//                   color: "#f1f0ff", fontSize: 13, fontFamily: "'DM Mono',monospace",
//                   outline: "none", boxSizing: "border-box" }} />
//             </div>

//             {/* How to export hint */}
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//               style={{ marginBottom: 28, padding: "14px 16px", borderRadius: 12,
//                 background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)" }}>
//               <div style={{ fontSize: 11, fontFamily: "'Outfit',sans-serif", fontWeight: 700, color: "#fbbf24", marginBottom: 6 }}>
//                 💡 How to get your LinkedIn PDF
//               </div>
//               <div style={{ fontSize: 11, fontFamily: "'DM Sans',sans-serif", color: "rgba(251,191,36,0.75)", lineHeight: 1.8 }}>
//                 LinkedIn → Your Profile → <strong>More</strong> button → <strong>Save to PDF</strong>
//               </div>
//             </motion.div>

//             {/* Analyze button */}
//             <AnimatePresence>
//               {canAnalyze && (
//                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
//                   style={{ textAlign: "center" }}>
//                   <motion.button
//                     whileHover={{ scale: 1.06, boxShadow: "0 0 60px rgba(14,165,233,0.6)" }}
//                     whileTap={{ scale: 0.96 }} onClick={handleAnalyze}
//                     style={{ padding: "18px 64px", borderRadius: 18, border: "none",
//                       background: "linear-gradient(135deg, #0ea5e9, #2563eb, #7c3aed)",
//                       color: "#fff", fontSize: 18, fontWeight: 800,
//                       fontFamily: "'Outfit',sans-serif", cursor: "pointer",
//                       boxShadow: "0 0 36px rgba(14,165,233,0.45)",
//                       letterSpacing: "0.04em", position: "relative", overflow: "hidden" }}>
//                     <motion.div animate={{ x: ["-100%", "200%"] }}
//                       transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
//                       style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
//                         background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
//                         pointerEvents: "none" }} />
//                     💼 ANALYZE LINKEDIN
//                   </motion.button>
//                   <div style={{ marginTop: 10, fontFamily: "'DM Mono',monospace", fontSize: 10,
//                     color: "rgba(167,139,250,0.5)", letterSpacing: "0.1em" }}>
//                     12 PROFESSIONAL METRICS · SAVED TO HISTORY
//                   </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </motion.div>
//         )}
//       </AnimatePresence>
//       <Fonts />
//     </div>
//   );
// }

// // ── Shared bg & fonts ──────────────────────────────────────────
// function BgEffects() {
//   return (
//     <>
//       <div style={{ position: "fixed", width: 600, height: 600, borderRadius: "50%", top: "-15%", left: "-10%",
//         background: "radial-gradient(circle, rgba(14,165,233,0.2) 0%, transparent 70%)",
//         filter: "blur(60px)", pointerEvents: "none", zIndex: 0 }} />
//       <div style={{ position: "fixed", width: 500, height: 500, borderRadius: "50%", bottom: "-15%", right: "-10%",
//         background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)",
//         filter: "blur(60px)", pointerEvents: "none", zIndex: 0 }} />
//       <div style={{ position: "fixed", inset: 0,
//         backgroundImage: `linear-gradient(rgba(14,165,233,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.04) 1px, transparent 1px)`,
//         backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0 }} />
//     </>
//   );
// }

// function Fonts() {
//   return (
//     <style>{`
//       @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=DM+Sans:wght@400;500&family=DM+Mono:wght@400;500&display=swap');
//       textarea::placeholder, input::placeholder { color: rgba(200,195,230,0.25); }
//     `}</style>
//   );
// }










// import { useState, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import * as pdfjsLib from "pdfjs-dist";

// pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
//   "pdfjs-dist/build/pdf.worker.min.mjs",
//   import.meta.url
// ).toString();

// // ── Extract text from PDF ──────────────────────────────────────
// async function readPdfAsText(file) {
//   const arrayBuffer = await file.arrayBuffer();
//   const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
//   let text = "";
//   for (let i = 1; i <= pdf.numPages; i++) {
//     const page = await pdf.getPage(i);
//     const content = await page.getTextContent();
//     text += content.items.map((item) => item.str).join(" ") + "\n";
//   }
//   return text.trim();
// }

// // ── Color helpers ──────────────────────────────────────────────
// const scoreColor = (s) => s >= 75 ? "#34d399" : s >= 50 ? "#fbbf24" : "#f87171";
// const scoreLabel = (s) => s >= 75 ? "Strong" : s >= 50 ? "Fair" : "Weak";

// // ── Animated ring ──────────────────────────────────────────────
// function Ring({ score, color, size = 90, stroke = 7, delay = 0.2 }) {
//   const r = (size - stroke) / 2;
//   const circ = 2 * Math.PI * r;
//   const offset = circ - (Math.min(score, 100) / 100) * circ;
//   return (
//     <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
//       <circle cx={size/2} cy={size/2} r={r} fill="none"
//         stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
//       <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
//         stroke={color} strokeWidth={stroke} strokeLinecap="round"
//         strokeDasharray={circ}
//         initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
//         transition={{ duration: 1.4, ease: "easeOut", delay }}
//         style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
//     </svg>
//   );
// }

// // ── Horizontal progress bar ────────────────────────────────────
// function Bar({ label, value, color, delay = 0, sub }) {
//   const c = scoreColor(value);
//   return (
//     <div style={{ marginBottom: 14 }}>
//       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
//         <div>
//           <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600,
//             fontSize: 12, color: "#f1f0ff" }}>{label}</span>
//           {sub && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10,
//             color: "rgba(200,195,230,0.45)", marginLeft: 6 }}>{sub}</span>}
//         </div>
//         <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
//           <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11,
//             color: color || c, fontWeight: 700 }}>{value}</span>
//           <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 100,
//             background: `${color || c}20`, color: color || c,
//             border: `1px solid ${color || c}40`,
//             fontFamily: "'DM Mono',monospace" }}>{scoreLabel(value)}</span>
//         </div>
//       </div>
//       <div style={{ height: 7, borderRadius: 4,
//         background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
//         <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }}
//           transition={{ duration: 1, delay, ease: "easeOut" }}
//           style={{ height: "100%", borderRadius: 4,
//             background: color || c,
//             boxShadow: `0 0 6px ${color || c}` }} />
//       </div>
//     </div>
//   );
// }

// // ── Chip tag ───────────────────────────────────────────────────
// function Chip({ label, color }) {
//   return (
//     <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 100,
//       background: `${color}18`, color,
//       border: `1px solid ${color}33`,
//       fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" }}>
//       {label}
//     </span>
//   );
// }

// // ── Section card ───────────────────────────────────────────────
// function SectionCard({ title, icon, color, children, delay = 0 }) {
//   return (
//     <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
//       transition={{ delay }}
//       style={{ padding: 16, borderRadius: 14,
//         background: `${color}08`,
//         border: `1px solid ${color}28`,
//         marginBottom: 14 }}>
//       <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
//         color, letterSpacing: "0.1em", marginBottom: 10 }}>
//         {icon} {title}
//       </div>
//       {children}
//     </motion.div>
//   );
// }

// // ── Loading screen ─────────────────────────────────────────────
// function LoadingScreen() {
//   const steps = [
//     "Parsing LinkedIn PDF...",
//     "Checking profile completeness...",
//     "Analyzing headline quality...",
//     "Scoring skills relevance...",
//     "Evaluating experience quality...",
//     "Detecting project presence...",
//     "Checking certifications...",
//     "Computing branding score...",
//     "Optimizing keyword analysis...",
//     "Building your report...",
//   ];
//   const [cur, setCur] = useState(0);
//   useState(() => {
//     const t = setInterval(() => setCur(p => (p + 1) % steps.length), 900);
//     return () => clearInterval(t);
//   });
//   return (
//     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//       style={{ textAlign: "center", padding: "80px 24px" }}>
//       <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 32px" }}>
//         {[0, 1, 2].map(i => (
//           <motion.div key={i} animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
//             transition={{ duration: 1.8, delay: i * 0.5, repeat: Infinity }}
//             style={{ position: "absolute", inset: 0, borderRadius: "50%",
//               border: "2px solid rgba(14,165,233,0.5)" }} />
//         ))}
//         <div style={{ position: "absolute", inset: 0, display: "flex",
//           alignItems: "center", justifyContent: "center", fontSize: 36 }}>💼</div>
//       </div>
//       <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700,
//         fontSize: 22, color: "#f1f0ff", marginBottom: 10 }}>Analyzing LinkedIn Profile...</div>
//       <AnimatePresence mode="wait">
//         <motion.div key={cur} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
//           exit={{ opacity: 0, y: -8 }}
//           style={{ fontFamily: "'DM Mono',monospace", fontSize: 13,
//             color: "#38bdf8", letterSpacing: "0.08em" }}>{steps[cur]}</motion.div>
//       </AnimatePresence>
//     </motion.div>
//   );
// }

// // ══════════════════════════════════════════════════════════════
// // RESULTS COMPONENT
// // ══════════════════════════════════════════════════════════════
// function LinkedInResults({ metrics, resumeScore, onReset }) {
//   const [tab, setTab] = useState("overview");
//   const m = metrics;
//   const s = m.scores;
//   const d = m.details;

//   const METRIC_DEFS = [
//     { key: "completenessScore", label: "Profile Completeness", icon: "✅", color: "#10b981" },
//     { key: "headlineScore", label: "Headline Quality", icon: "🏷️", color: "#3b82f6" },
//     { key: "skillsRelevanceScore", label: "Skills Relevance", icon: "💡", color: "#8b5cf6" },
//     { key: "expQualityScore", label: "Experience Quality", icon: "💼", color: "#f59e0b" },
//     { key: "projectScore", label: "Project Presence", icon: "🚀", color: "#06b6d4" },
//     { key: "activityScore", label: "Activity & Engagement", icon: "📣", color: "#ec4899" },
//     { key: "networkScore", label: "Network Strength", icon: "🌐", color: "#a78bfa" },
//     { key: "certScore", label: "Certifications", icon: "🏅", color: "#34d399" },
//     { key: "recommendationScore", label: "Recommendations", icon: "⭐", color: "#fbbf24" },
//     { key: "consistencyScore", label: "Resume Consistency", icon: "🔗", color: "#60a5fa" },
//     { key: "brandingScore", label: "Professional Branding", icon: "🎯", color: "#f87171" },
//     { key: "keywordScore", label: "Keyword Optimization", icon: "🔍", color: "#c084fc" },
//   ];

//   const tabs = ["overview", "details", "compare"];

//   return (
//     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//       style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 60px" }}>

//       {/* Top bar */}
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
//         marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
//         <motion.button whileHover={{ scale: 1.04 }} onClick={onReset}
//           style={{ padding: "9px 20px", borderRadius: 10,
//             border: "1px solid rgba(14,165,233,0.4)",
//             background: "rgba(14,165,233,0.08)", color: "#38bdf8",
//             fontSize: 13, fontWeight: 600, cursor: "pointer",
//             fontFamily: "'Outfit',sans-serif" }}>
//           ← Analyze Again
//         </motion.button>
//         <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10,
//           color: "rgba(200,195,230,0.4)", letterSpacing: "0.1em" }}>
//           LINKEDIN ANALYSIS REPORT · {new Date().toLocaleDateString()}
//         </div>
//       </div>

//       {/* Hero — two scores side by side */}
//       <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
//         style={{ display: "grid", gridTemplateColumns: resumeScore ? "1fr 1fr" : "1fr",
//           gap: 20, marginBottom: 28 }}>

//         {/* LinkedIn score */}
//         <div style={{ padding: "32px 28px", borderRadius: 22,
//           background: "rgba(14,165,233,0.07)",
//           border: "1px solid rgba(14,165,233,0.3)",
//           display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
//           <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
//             <Ring score={m.overallLinkedInScore} color="#38bdf8" size={120} stroke={10} delay={0.1} />
//             <div style={{ position: "absolute", inset: 0, display: "flex",
//               flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
//               <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900,
//                 fontSize: 30, color: "#38bdf8", lineHeight: 1 }}>{m.overallLinkedInScore}</span>
//               <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9,
//                 color: "rgba(200,195,230,0.4)", marginTop: 2 }}>/ 100</span>
//             </div>
//           </div>
//           <div>
//             <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
//               color: "#38bdf8", letterSpacing: "0.12em", marginBottom: 6 }}>
//               💼 LINKEDIN SCORE
//             </div>
//             <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800,
//               fontSize: 20, color: "#f1f0ff", marginBottom: 4 }}>
//               {scoreLabel(m.overallLinkedInScore)} Profile
//             </div>
//             <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12,
//               color: "rgba(200,195,230,0.6)", lineHeight: 1.6 }}>
//               Based on 12 LinkedIn metrics including<br />branding, keywords & experience quality
//             </div>
//           </div>
//         </div>

//         {/* Resume score (if available) */}
//         {resumeScore !== null && resumeScore !== undefined && (
//           <div style={{ padding: "32px 28px", borderRadius: 22,
//             background: "rgba(124,58,237,0.07)",
//             border: "1px solid rgba(124,58,237,0.3)",
//             display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
//             <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
//               <Ring score={resumeScore} color="#a78bfa" size={120} stroke={10} delay={0.3} />
//               <div style={{ position: "absolute", inset: 0, display: "flex",
//                 flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
//                 <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900,
//                   fontSize: 30, color: "#a78bfa", lineHeight: 1 }}>{resumeScore}</span>
//                 <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9,
//                   color: "rgba(200,195,230,0.4)", marginTop: 2 }}>/ 100</span>
//               </div>
//             </div>
//             <div>
//               <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
//                 color: "#a78bfa", letterSpacing: "0.12em", marginBottom: 6 }}>
//                 📋 RESUME SCORE
//               </div>
//               <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800,
//                 fontSize: 20, color: "#f1f0ff", marginBottom: 4 }}>
//                 {scoreLabel(resumeScore)} Resume
//               </div>
//               <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12,
//                 color: "rgba(200,195,230,0.6)", lineHeight: 1.6 }}>
//                 From your last resume analysis.<br />Consistency check: {s.consistencyScore}%
//               </div>
//             </div>
//           </div>
//         )}
//       </motion.div>

//       {/* Tabs */}
//       <div style={{ display: "flex", gap: 4, marginBottom: 20,
//         borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 0 }}>
//         {tabs.map(t => (
//           <button key={t} onClick={() => setTab(t)}
//             style={{ padding: "9px 20px", borderRadius: "10px 10px 0 0",
//               border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
//               fontFamily: "'Outfit',sans-serif", letterSpacing: "0.06em",
//               background: tab === t ? "rgba(14,165,233,0.15)" : "transparent",
//               color: tab === t ? "#38bdf8" : "rgba(200,195,230,0.45)",
//               borderBottom: tab === t ? "2px solid #38bdf8" : "2px solid transparent",
//               transition: "all 0.2s" }}>
//             {t === "overview" ? "📊 OVERVIEW" : t === "details" ? "🔬 DETAILS" : "⚖️ COMPARE"}
//           </button>
//         ))}
//       </div>

//       <AnimatePresence mode="wait">

//         {/* OVERVIEW TAB */}
//         {tab === "overview" && (
//           <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//             <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
//               gap: 14 }}>
//               {METRIC_DEFS.map((def, i) => (
//                 <div key={def.key} style={{ padding: "16px", borderRadius: 14,
//                   background: `${def.color}06`,
//                   border: `1px solid ${def.color}25` }}>
//                   <div style={{ display: "flex", justifyContent: "space-between",
//                     alignItems: "center", marginBottom: 10 }}>
//                     <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
//                       <span style={{ fontSize: 15 }}>{def.icon}</span>
//                       <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700,
//                         fontSize: 12, color: "#f1f0ff" }}>{def.label}</span>
//                     </div>
//                     <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800,
//                       fontSize: 18, color: def.color }}>{s[def.key]}</span>
//                   </div>
//                   <div style={{ height: 6, borderRadius: 3,
//                     background: "rgba(255,255,255,0.05)" }}>
//                     <motion.div initial={{ width: 0 }}
//                       animate={{ width: `${s[def.key]}%` }}
//                       transition={{ duration: 1, delay: i * 0.05, ease: "easeOut" }}
//                       style={{ height: "100%", borderRadius: 3,
//                         background: def.color,
//                         boxShadow: `0 0 6px ${def.color}` }} />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </motion.div>
//         )}

//         {/* DETAILS TAB */}
//         {tab === "details" && (
//           <motion.div key="dt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
//               <div>
//                 {/* Completeness */}
//                 <SectionCard title="PROFILE COMPLETENESS" icon="✅" color="#10b981" delay={0}>
//                   <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
//                     {["photo","headline","about","experience","skills","projects","education","contact"].map(sec => (
//                       <span key={sec} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 100,
//                         background: d.missingSections?.includes(sec) ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.15)",
//                         color: d.missingSections?.includes(sec) ? "#f87171" : "#34d399",
//                         border: `1px solid ${d.missingSections?.includes(sec) ? "rgba(248,113,113,0.3)" : "rgba(52,211,153,0.3)"}`,
//                         fontFamily: "'DM Mono',monospace" }}>
//                         {d.missingSections?.includes(sec) ? "❌" : "✓"} {sec}
//                       </span>
//                     ))}
//                   </div>
//                   {d.missingSections?.length > 0 && (
//                     <div style={{ fontSize: 11, color: "#f87171",
//                       fontFamily: "'DM Sans',sans-serif" }}>
//                       🚩 Missing: {d.missingSections.join(", ")}
//                     </div>
//                   )}
//                 </SectionCard>

//                 {/* Skills */}
//                 <SectionCard title="SKILLS FOUND" icon="💡" color="#8b5cf6" delay={0.05}>
//                   <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
//                     {(d.foundSkills || []).slice(0, 12).map((s, i) => (
//                       <Chip key={i} label={s} color="#a78bfa" />
//                     ))}
//                   </div>
//                   {d.foundSkills?.length === 0 && (
//                     <div style={{ fontSize: 11, color: "#f87171",
//                       fontFamily: "'DM Sans',sans-serif" }}>
//                       No recognizable tech skills detected
//                     </div>
//                   )}
//                 </SectionCard>

//                 {/* Experience quality */}
//                 <SectionCard title="EXPERIENCE QUALITY" icon="💼" color="#f59e0b" delay={0.1}>
//                   <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
//                     {(d.actionVerbs || []).map((v, i) => (
//                       <Chip key={i} label={v} color="#fbbf24" />
//                     ))}
//                   </div>
//                   <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
//                     {[
//                       { label: "Has Numbers/Metrics", ok: d.hasNumbers },
//                       { label: "Internship", ok: d.hasInternship },
//                       { label: "Full-Time Role", ok: d.hasFullTime },
//                     ].map((item, i) => (
//                       <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100,
//                         background: item.ok ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
//                         color: item.ok ? "#34d399" : "#f87171",
//                         border: `1px solid ${item.ok ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`,
//                         fontFamily: "'DM Mono',monospace" }}>
//                         {item.ok ? "✓" : "✗"} {item.label}
//                       </span>
//                     ))}
//                   </div>
//                 </SectionCard>

//                 {/* Certs */}
//                 <SectionCard title="CERTIFICATIONS" icon="🏅" color="#34d399" delay={0.15}>
//                   {(d.certsFound || []).length === 0 ? (
//                     <div style={{ fontSize: 11, color: "#f87171",
//                       fontFamily: "'DM Sans',sans-serif" }}>
//                       No certifications detected — add courses, credentials, or badges
//                     </div>
//                   ) : (
//                     <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
//                       {d.certsFound.map((c, i) => <Chip key={i} label={c} color="#34d399" />)}
//                     </div>
//                   )}
//                 </SectionCard>
//               </div>

//               <div>
//                 {/* Network */}
//                 <SectionCard title="NETWORK STRENGTH" icon="🌐" color="#a78bfa" delay={0.07}>
//                   <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
//                     <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900,
//                       fontSize: 36, color: "#a78bfa" }}>
//                       {d.connections > 0 ? d.connections : "?"}
//                     </div>
//                     <div>
//                       <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11,
//                         color: "#a78bfa" }}>{d.networkLabel}</div>
//                       <div style={{ fontSize: 10, color: "rgba(200,195,230,0.5)",
//                         fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>
//                         {d.connections >= 500 ? "Excellent visibility" :
//                           d.connections >= 100 ? "Good exposure" : "Grow your network"}
//                       </div>
//                     </div>
//                   </div>
//                 </SectionCard>

//                 {/* Recommendations */}
//                 <SectionCard title="RECOMMENDATIONS" icon="⭐" color="#fbbf24" delay={0.12}>
//                   <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
//                     <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900,
//                       fontSize: 36, color: "#fbbf24" }}>{d.recCount}</div>
//                     <div style={{ fontSize: 11, color: "rgba(200,195,230,0.6)",
//                       fontFamily: "'DM Sans',sans-serif", lineHeight: 1.6 }}>
//                       {d.recCount === 0
//                         ? "🚩 No recommendations — ask managers or peers to write one"
//                         : d.recCount >= 3
//                           ? "✅ Strong social proof"
//                           : "⚠️ Getting there — aim for 3+"}
//                     </div>
//                   </div>
//                 </SectionCard>

//                 {/* Projects */}
//                 <SectionCard title="PROJECT PRESENCE" icon="🚀" color="#06b6d4" delay={0.17}>
//                   <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
//                     {[
//                       { label: `${d.projectCount} projects mentioned`, ok: d.projectCount > 0 },
//                       { label: "GitHub link", ok: d.hasGithubLinks },
//                       { label: "Live demo link", ok: d.hasLiveLinks },
//                     ].map((item, i) => (
//                       <span key={i} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 100,
//                         background: item.ok ? "rgba(6,182,212,0.1)" : "rgba(248,113,113,0.1)",
//                         color: item.ok ? "#06b6d4" : "#f87171",
//                         border: `1px solid ${item.ok ? "rgba(6,182,212,0.25)" : "rgba(248,113,113,0.2)"}`,
//                         fontFamily: "'DM Mono',monospace" }}>
//                         {item.ok ? "✓" : "✗"} {item.label}
//                       </span>
//                     ))}
//                   </div>
//                 </SectionCard>

//                 {/* Branding */}
//                 <SectionCard title="PROFESSIONAL BRANDING" icon="🎯" color="#f87171" delay={0.2}>
//                   <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//                     {[
//                       { label: "Niche defined", ok: d.hasNiche },
//                       { label: "Has story/about", ok: d.hasStory },
//                     ].map((item, i) => (
//                       <span key={i} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 100,
//                         background: item.ok ? "rgba(248,113,113,0.1)" : "rgba(255,255,255,0.04)",
//                         color: item.ok ? "#f87171" : "rgba(200,195,230,0.4)",
//                         border: `1px solid ${item.ok ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.08)"}`,
//                         fontFamily: "'DM Mono',monospace" }}>
//                         {item.ok ? "✓" : "✗"} {item.label}
//                       </span>
//                     ))}
//                   </div>
//                   {d.techKeywordsInHeadline?.length > 0 && (
//                     <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
//                       {d.techKeywordsInHeadline.map((k, i) => (
//                         <Chip key={i} label={k} color="#f87171" />
//                       ))}
//                     </div>
//                   )}
//                 </SectionCard>

//                 {/* Keyword ATS */}
//                 <SectionCard title="KEYWORD OPTIMIZATION" icon="🔍" color="#c084fc" delay={0.22}>
//                   <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
//                     {(d.foundATS || []).map((k, i) => <Chip key={i} label={k} color="#c084fc" />)}
//                   </div>
//                   <div style={{ fontSize: 10, color: "rgba(200,195,230,0.45)",
//                     fontFamily: "'DM Sans',sans-serif" }}>
//                     {d.foundATS?.length || 0}/15 ATS keywords found in profile
//                   </div>
//                 </SectionCard>
//               </div>
//             </div>
//           </motion.div>
//         )}

//         {/* COMPARE TAB */}
//         {tab === "compare" && (
//           <motion.div key="cp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//             {resumeScore ? (
//               <>
//                 {/* Side by side all bars */}
//                 <div style={{ padding: 20, borderRadius: 18,
//                   background: "rgba(255,255,255,0.02)",
//                   border: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
//                   <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
//                     <div>
//                       <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
//                         color: "#38bdf8", letterSpacing: "0.1em", marginBottom: 16 }}>
//                         💼 LINKEDIN METRICS
//                       </div>
//                       {METRIC_DEFS.map((def, i) => (
//                         <Bar key={def.key} label={def.label}
//                           value={s[def.key]} color={def.color} delay={i * 0.04} />
//                       ))}
//                     </div>
//                     <div>
//                       <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
//                         color: "#a78bfa", letterSpacing: "0.1em", marginBottom: 16 }}>
//                         📋 RESUME OVERALL
//                       </div>
//                       <div style={{ display: "flex", alignItems: "center", gap: 16,
//                         padding: 20, borderRadius: 14,
//                         background: "rgba(124,58,237,0.08)",
//                         border: "1px solid rgba(124,58,237,0.2)", marginBottom: 16 }}>
//                         <div style={{ position: "relative", width: 80, height: 80 }}>
//                           <Ring score={resumeScore} color="#a78bfa" size={80} stroke={7} delay={0.3} />
//                           <div style={{ position: "absolute", inset: 0, display: "flex",
//                             alignItems: "center", justifyContent: "center" }}>
//                             <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900,
//                               fontSize: 20, color: "#a78bfa" }}>{resumeScore}</span>
//                           </div>
//                         </div>
//                         <div>
//                           <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700,
//                             fontSize: 16, color: "#f1f0ff" }}>{scoreLabel(resumeScore)} Resume</div>
//                           <div style={{ fontSize: 11, color: "rgba(200,195,230,0.55)",
//                             fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>
//                             From your resume analysis
//                           </div>
//                         </div>
//                       </div>

//                       {/* Consistency */}
//                       <div style={{ padding: 16, borderRadius: 14,
//                         background: "rgba(96,165,250,0.07)",
//                         border: "1px solid rgba(96,165,250,0.2)" }}>
//                         <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
//                           color: "#60a5fa", letterSpacing: "0.1em", marginBottom: 8 }}>
//                           🔗 SKILL CONSISTENCY
//                         </div>
//                         <Bar label="Resume ↔ LinkedIn Skill Match"
//                           value={s.consistencyScore} color="#60a5fa" delay={0.2} />
//                         {d.matchingSkills?.length > 0 && (
//                           <div style={{ marginTop: 8 }}>
//                             <div style={{ fontSize: 10, color: "rgba(200,195,230,0.45)",
//                               marginBottom: 5, fontFamily: "'DM Mono',monospace" }}>
//                               MATCHED SKILLS
//                             </div>
//                             <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
//                               {d.matchingSkills.map((sk, i) => (
//                                 <Chip key={i} label={sk} color="#60a5fa" />
//                               ))}
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Combined trust signal */}
//                 <div style={{ padding: 20, borderRadius: 18,
//                   background: "rgba(251,191,36,0.06)",
//                   border: "1px solid rgba(251,191,36,0.2)" }}>
//                   <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
//                     color: "#fbbf24", letterSpacing: "0.1em", marginBottom: 12 }}>
//                     🔥 COMBINED TRUST SIGNAL
//                   </div>
//                   <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
//                     <div style={{ position: "relative", width: 100, height: 100 }}>
//                       <Ring score={Math.round((m.overallLinkedInScore + resumeScore) / 2)}
//                         color="#fbbf24" size={100} stroke={8} delay={0.1} />
//                       <div style={{ position: "absolute", inset: 0, display: "flex",
//                         flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
//                         <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900,
//                           fontSize: 22, color: "#fbbf24", lineHeight: 1 }}>
//                           {Math.round((m.overallLinkedInScore + resumeScore) / 2)}
//                         </span>
//                         <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8,
//                           color: "rgba(200,195,230,0.4)" }}>COMBINED</span>
//                       </div>
//                     </div>
//                     <div style={{ flex: 1 }}>
//                       <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700,
//                         fontSize: 15, color: "#f1f0ff", marginBottom: 6 }}>
//                         Overall Candidate Trust Score
//                       </div>
//                       <div style={{ fontSize: 12, color: "rgba(200,195,230,0.6)",
//                         fontFamily: "'DM Sans',sans-serif", lineHeight: 1.7 }}>
//                         LinkedIn Score: <strong style={{ color: "#38bdf8" }}>{m.overallLinkedInScore}</strong> · Resume Score: <strong style={{ color: "#a78bfa" }}>{resumeScore}</strong><br />
//                         Skill Consistency: <strong style={{ color: "#60a5fa" }}>{s.consistencyScore}%</strong>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </>
//             ) : (
//               <div style={{ textAlign: "center", padding: "60px 24px",
//                 color: "rgba(200,195,230,0.4)",
//                 fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>
//                 <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
//                 No resume analysis found.<br />
//                 Go to <strong>Analyze Resume</strong> first, then come back to compare.
//               </div>
//             )}
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// }

// // ══════════════════════════════════════════════════════════════
// // MAIN PAGE COMPONENT
// // ══════════════════════════════════════════════════════════════
// export default function LinkedInAnalyzer({ onBack, resumeScore, resumeSkills = [] }) {
//   const [pdfFile, setPdfFile] = useState(null);
//   const [linkedinUrl, setLinkedinUrl] = useState("");
//   const [manualText, setManualText] = useState("");
//   const [jobRole, setJobRole] = useState("");
//   const [analyzing, setAnalyzing] = useState(false);
//   const [results, setResults] = useState(null);
//   const [inputMode, setInputMode] = useState("pdf"); // "pdf" | "text"
//   const inputRef = useRef(null);

//   const handleAnalyze = async () => {
//     let profileText = "";
//     setAnalyzing(true);

//     try {
//       if (inputMode === "pdf" && pdfFile) {
//         profileText = await readPdfAsText(pdfFile);
//       } else if (inputMode === "text" && manualText.trim().length > 50) {
//         profileText = manualText;
//       } else {
//         alert("❌ Please upload a LinkedIn PDF or paste your profile text.");
//         setAnalyzing(false);
//         return;
//       }

//       const response = await fetch("https://ai-smart-resume-analyzer-so1y.vercel.app/api/linkedin-analyze", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           linkedinText: profileText,
//           linkedinUrl: linkedinUrl.trim(),
//           jobRole: jobRole.trim(),
//           resumeSkills,
//         }),
//       });

//       const data = await response.json();
//       if (!data.success) throw new Error(data.error || "Analysis failed");
//       setResults(data.linkedinMetrics);
//     } catch (err) {
//       alert(`❌ Error: ${err.message}`);
//     } finally {
//       setAnalyzing(false);
//     }
//   };

//   const canAnalyze = (inputMode === "pdf" && pdfFile) ||
//     (inputMode === "text" && manualText.trim().length > 50);

//   if (results) {
//     return (
//       <div style={{ minHeight: "100vh",
//         background: "linear-gradient(145deg, #06040f 0%, #0e0720 40%, #060c1c 100%)",
//         paddingTop: 100, position: "relative" }}>
//         <BgEffects />
//         <div style={{ position: "relative", zIndex: 1 }}>
//           <LinkedInResults metrics={results} resumeScore={resumeScore}
//             onReset={() => setResults(null)} />
//         </div>
//         <Fonts />
//       </div>
//     );
//   }

//   return (
//     <div style={{ minHeight: "100vh",
//       background: "linear-gradient(145deg, #06040f 0%, #0e0720 40%, #060c1c 100%)",
//       display: "flex", alignItems: "center", justifyContent: "center",
//       padding: "100px 24px 40px", position: "relative", overflow: "hidden" }}>
//       <BgEffects />

//       <AnimatePresence mode="wait">
//         {analyzing ? (
//           <LoadingScreen key="loading" />
//         ) : (
//           <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             style={{ width: "100%", maxWidth: 720, position: "relative", zIndex: 1 }}>

//             {/* Header */}
//             <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
//               style={{ textAlign: "center", marginBottom: 36 }}>
//               <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
//                 transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
//                 style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 16px",
//                   background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
//                   display: "flex", alignItems: "center", justifyContent: "center",
//                   fontSize: 28, boxShadow: "0 0 40px rgba(14,165,233,0.5)" }}>💼</motion.div>
//               <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800,
//                 fontSize: "clamp(22px, 4vw, 34px)", color: "#f1f0ff", marginBottom: 8 }}>
//                 LinkedIn Profile Analyzer
//               </h2>
//               <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14,
//                 color: "rgba(200,195,230,0.65)", maxWidth: 480, margin: "0 auto" }}>
//                 Analyze your LinkedIn profile across 12 professional metrics. Upload your PDF export or paste your profile text.
//               </p>
//             </motion.div>

//             {/* Input mode toggle */}
//             <div style={{ display: "flex", gap: 8, marginBottom: 20,
//               padding: 5, borderRadius: 14,
//               background: "rgba(255,255,255,0.03)",
//               border: "1px solid rgba(255,255,255,0.07)" }}>
//               {[
//                 { key: "pdf", label: "📄 Upload LinkedIn PDF", sub: "Save as PDF from LinkedIn" },
//                 { key: "text", label: "📝 Paste Profile Text", sub: "Copy-paste from your profile" },
//               ].map(mode => (
//                 <button key={mode.key} onClick={() => setInputMode(mode.key)}
//                   style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: "none",
//                     cursor: "pointer", transition: "all 0.2s", textAlign: "left",
//                     background: inputMode === mode.key ? "rgba(14,165,233,0.15)" : "transparent",
//                     borderBottom: inputMode === mode.key ? "2px solid #38bdf8" : "2px solid transparent" }}>
//                   <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700,
//                     fontSize: 13, color: inputMode === mode.key ? "#38bdf8" : "rgba(200,195,230,0.6)" }}>
//                     {mode.label}
//                   </div>
//                   <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10,
//                     color: "rgba(200,195,230,0.4)", marginTop: 2 }}>{mode.sub}</div>
//                 </button>
//               ))}
//             </div>

//             {/* PDF Upload */}
//             {inputMode === "pdf" && (
//               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//                 style={{ marginBottom: 20 }}>
//                 {!pdfFile ? (
//                   <div onClick={() => inputRef.current?.click()}
//                     style={{ borderRadius: 16, border: "2px dashed rgba(14,165,233,0.4)",
//                       background: "rgba(14,165,233,0.04)", padding: "36px 24px",
//                       textAlign: "center", cursor: "pointer", transition: "all 0.25s" }}
//                     onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(14,165,233,0.7)"}
//                     onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(14,165,233,0.4)"}>
//                     <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
//                     <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700,
//                       fontSize: 14, color: "#f1f0ff", marginBottom: 4 }}>
//                       Upload LinkedIn PDF Export
//                     </div>
//                     <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11,
//                       color: "rgba(200,195,230,0.5)", marginBottom: 14 }}>
//                       LinkedIn → Me → Settings → Data Privacy → Get a copy of your data
//                     </div>
//                     <div style={{ display: "inline-block", padding: "8px 20px",
//                       borderRadius: 9, background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
//                       color: "#fff", fontSize: 12, fontWeight: 600,
//                       fontFamily: "'Outfit',sans-serif",
//                       boxShadow: "0 0 14px rgba(14,165,233,0.4)" }}>
//                       Choose PDF
//                     </div>
//                     <input ref={inputRef} type="file" accept=".pdf"
//                       onChange={e => { const f = e.target.files[0]; if (f) setPdfFile(f); e.target.value = ""; }}
//                       style={{ display: "none" }} />
//                   </div>
//                 ) : (
//                   <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
//                     style={{ padding: 18, borderRadius: 16,
//                       border: "1.5px solid rgba(14,165,233,0.4)",
//                       background: "rgba(14,165,233,0.06)",
//                       display: "flex", alignItems: "center", gap: 14 }}>
//                     <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0,
//                       background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
//                       display: "flex", alignItems: "center", justifyContent: "center",
//                       fontSize: 20, boxShadow: "0 0 16px rgba(14,165,233,0.4)" }}>📄</div>
//                     <div style={{ flex: 1, minWidth: 0 }}>
//                       <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700,
//                         fontSize: 13, color: "#f1f0ff",
//                         overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//                         {pdfFile.name}
//                       </div>
//                       <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10,
//                         color: "#38bdf8", marginTop: 2 }}>
//                         {(pdfFile.size / 1024).toFixed(1)} KB · PDF
//                       </div>
//                     </div>
//                     <button onClick={() => setPdfFile(null)}
//                       style={{ width: 28, height: 28, borderRadius: 7,
//                         border: "1px solid rgba(248,113,113,0.3)",
//                         background: "rgba(248,113,113,0.1)",
//                         color: "#f87171", cursor: "pointer",
//                         display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
//                   </motion.div>
//                 )}
//               </motion.div>
//             )}

//             {/* Text paste */}
//             {inputMode === "text" && (
//               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//                 style={{ marginBottom: 20 }}>
//                 <textarea value={manualText} onChange={e => setManualText(e.target.value)}
//                   placeholder="Paste your full LinkedIn profile text here — name, headline, about, experience, skills, projects, certifications, recommendations..."
//                   style={{ width: "100%", minHeight: 200, borderRadius: 14,
//                     padding: "14px 16px", boxSizing: "border-box",
//                     background: "rgba(255,255,255,0.03)",
//                     border: manualText ? "1.5px solid rgba(14,165,233,0.5)" : "2px dashed rgba(14,165,233,0.3)",
//                     color: "#f1f0ff", fontSize: 13,
//                     fontFamily: "'DM Sans',sans-serif",
//                     lineHeight: 1.7, resize: "vertical", outline: "none" }} />
//                 <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
//                   color: "rgba(200,195,230,0.35)", marginTop: 6 }}>
//                   {manualText.length} characters · Minimum 50 required
//                 </div>
//               </motion.div>
//             )}

//             {/* LinkedIn URL (optional) */}
//             <div style={{ marginBottom: 20 }}>
//               <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
//                 color: "#38bdf8", letterSpacing: "0.1em", marginBottom: 8 }}>
//                 🔗 LINKEDIN URL (OPTIONAL)
//               </div>
//               <input type="text" value={linkedinUrl}
//                 onChange={e => setLinkedinUrl(e.target.value)}
//                 placeholder="https://linkedin.com/in/yourprofile"
//                 style={{ width: "100%", padding: "11px 14px", borderRadius: 11,
//                   border: "1px solid rgba(14,165,233,0.25)",
//                   background: "rgba(14,165,233,0.04)", color: "#f1f0ff",
//                   fontSize: 13, fontFamily: "'DM Mono',monospace",
//                   outline: "none", boxSizing: "border-box" }} />
//             </div>

//             {/* Job Role (optional) */}
//             <div style={{ marginBottom: 28 }}>
//               <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
//                 color: "#a78bfa", letterSpacing: "0.1em", marginBottom: 8 }}>
//                 🎯 TARGET JOB ROLE (OPTIONAL — improves skill relevance scoring)
//               </div>
//               <input type="text" value={jobRole}
//                 onChange={e => setJobRole(e.target.value)}
//                 placeholder="e.g., Frontend Developer, ML Engineer, Data Analyst"
//                 style={{ width: "100%", padding: "11px 14px", borderRadius: 11,
//                   border: "1px solid rgba(139,92,246,0.25)",
//                   background: "rgba(124,58,237,0.05)", color: "#f1f0ff",
//                   fontSize: 13, fontFamily: "'DM Mono',monospace",
//                   outline: "none", boxSizing: "border-box" }} />
//             </div>

//             {/* How to export hint */}
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//               style={{ marginBottom: 28, padding: "14px 16px", borderRadius: 12,
//                 background: "rgba(251,191,36,0.07)",
//                 border: "1px solid rgba(251,191,36,0.2)" }}>
//               <div style={{ fontSize: 11, fontFamily: "'Outfit',sans-serif",
//                 fontWeight: 700, color: "#fbbf24", marginBottom: 6 }}>
//                 💡 How to get your LinkedIn PDF
//               </div>
//               <div style={{ fontSize: 11, fontFamily: "'DM Sans',sans-serif",
//                 color: "rgba(251,191,36,0.75)", lineHeight: 1.8 }}>
//                 LinkedIn → Your Profile → <strong>More</strong> button → <strong>Save to PDF</strong>
//               </div>
//             </motion.div>

//             {/* Analyze button */}
//             <AnimatePresence>
//               {canAnalyze && (
//                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0 }} style={{ textAlign: "center" }}>
//                   <motion.button whileHover={{ scale: 1.06, boxShadow: "0 0 60px rgba(14,165,233,0.6)" }}
//                     whileTap={{ scale: 0.96 }} onClick={handleAnalyze}
//                     style={{ padding: "18px 64px", borderRadius: 18, border: "none",
//                       background: "linear-gradient(135deg, #0ea5e9, #2563eb, #7c3aed)",
//                       color: "#fff", fontSize: 18, fontWeight: 800,
//                       fontFamily: "'Outfit',sans-serif", cursor: "pointer",
//                       boxShadow: "0 0 36px rgba(14,165,233,0.45)",
//                       letterSpacing: "0.04em", position: "relative", overflow: "hidden" }}>
//                     <motion.div animate={{ x: ["-100%", "200%"] }}
//                       transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
//                       style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
//                         background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
//                         pointerEvents: "none" }} />
//                     💼 ANALYZE LINKEDIN
//                   </motion.button>
//                   <div style={{ marginTop: 10, fontFamily: "'DM Mono',monospace",
//                     fontSize: 10, color: "rgba(167,139,250,0.5)", letterSpacing: "0.1em" }}>
//                     12 PROFESSIONAL METRICS · AI POWERED
//                   </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </motion.div>
//         )}
//       </AnimatePresence>
//       <Fonts />
//     </div>
//   );
// }

// // ── Shared bg & fonts ──────────────────────────────────────────
// function BgEffects() {
//   return (
//     <>
//       <div style={{ position: "fixed", width: 600, height: 600, borderRadius: "50%",
//         top: "-15%", left: "-10%",
//         background: "radial-gradient(circle, rgba(14,165,233,0.2) 0%, transparent 70%)",
//         filter: "blur(60px)", pointerEvents: "none", zIndex: 0 }} />
//       <div style={{ position: "fixed", width: 500, height: 500, borderRadius: "50%",
//         bottom: "-15%", right: "-10%",
//         background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)",
//         filter: "blur(60px)", pointerEvents: "none", zIndex: 0 }} />
//       <div style={{ position: "fixed", inset: 0,
//         backgroundImage: `linear-gradient(rgba(14,165,233,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.04) 1px, transparent 1px)`,
//         backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0 }} />
//     </>
//   );
// }
// function Fonts() {
//   return (
//     <style>{`
//       @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=DM+Sans:wght@400;500&family=DM+Mono:wght@400;500&display=swap');
//       textarea::placeholder, input::placeholder { color: rgba(200,195,230,0.25); }
//     `}</style>
//   );
// }














































































import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import * as pdfjsLib from "pdfjs-dist";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// ── Extract text from PDF ──────────────────────────────────────
async function readPdfAsText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + "\n";
  }
  return text.trim();
}

// ── Color helpers ──────────────────────────────────────────────
const scoreColor = (s) => s >= 75 ? "#34d399" : s >= 50 ? "#fbbf24" : "#f87171";
const scoreLabel = (s) => s >= 75 ? "Strong" : s >= 50 ? "Fair" : "Weak";

// ── Animated circle score ──────────────────────────────────────
function Ring({ score, color, size = 80, stroke = 6, delay = 0.2 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(score, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.4, ease: "easeOut", delay }}
        style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
    </svg>
  );
}

// ── Score pill ─────────────────────────────────────────────────
function ScorePill({ score }) {
  const color = scoreColor(score);
  const label = scoreLabel(score);
  return (
    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100,
      background: `${color}20`, color, border: `1px solid ${color}40`,
      fontFamily: "'DM Mono',monospace" }}>
      {label}
    </span>
  );
}

// ── Horizontal bar ─────────────────────────────────────────────
function Bar({ label, value, color, delay = 0 }) {
  const c = scoreColor(value);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <div>
          <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 12, color: "#f1f0ff" }}>{label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: color || c, fontWeight: 700 }}>{value}</span>
          <ScorePill score={value} />
        </div>
      </div>
      <div style={{ height: 7, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay, ease: "easeOut" }}
          style={{ height: "100%", borderRadius: 4, background: color || c, boxShadow: `0 0 6px ${color || c}` }} />
      </div>
    </div>
  );
}

// ── Chip tag ───────────────────────────────────────────────────
function Chip({ label, color }) {
  return (
    <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 100,
      background: `${color}18`, color, border: `1px solid ${color}33`,
      fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

// ── Section card ───────────────────────────────────────────────
function SectionCard({ title, icon, color, children, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      style={{ padding: 16, borderRadius: 14, background: `${color}08`, border: `1px solid ${color}28`, marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color, letterSpacing: "0.1em", marginBottom: 10 }}>
        {icon} {title}
      </div>
      {children}
    </motion.div>
  );
}

// ── Trust score ring ───────────────────────────────────────────
function TrustRing({ score }) {
  const color = scoreColor(score);
  const label = score >= 75 ? "HIGHLY AUTHENTIC" : score >= 50 ? "PARTIALLY VERIFIED" : "LOW AUTHENTICITY";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: 110, height: 110 }}>
        <Ring score={score} color={color} size={110} stroke={9} delay={0.1} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 26, color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "rgba(200,195,230,0.5)", marginTop: 2 }}>/ 100</span>
        </div>
      </div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color, letterSpacing: "0.12em", textAlign: "center" }}>{label}</div>
    </div>
  );
}

// ── Loading screen ─────────────────────────────────────────────
function LoadingScreen() {
  const steps = [
    "Parsing LinkedIn PDF...", "Checking profile completeness...",
    "Analyzing headline quality...", "Scoring skills relevance...",
    "Evaluating experience quality...", "Detecting project presence...",
    "Checking certifications...", "Computing branding score...",
    "Optimizing keyword analysis...", "Building your report...",
  ];
  const [cur, setCur] = useState(0);
  useState(() => {
    const t = setInterval(() => setCur((p) => (p + 1) % steps.length), 900);
    return () => clearInterval(t);
  });
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ textAlign: "center", padding: "80px 24px" }}>
      <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 32px" }}>
        {[0, 1, 2].map((i) => (
          <motion.div key={i} animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 1.8, delay: i * 0.5, repeat: Infinity }}
            style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(14,165,233,0.5)" }} />
        ))}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>💼</div>
      </div>
      <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 22, color: "#f1f0ff", marginBottom: 10 }}>
        Analyzing LinkedIn Profile...
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={cur} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: "#38bdf8", letterSpacing: "0.08em" }}>
          {steps[cur]}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// RESULTS COMPONENT
// ══════════════════════════════════════════════════════════════
function LinkedInResults({ metrics, resumeScore, onReset }) {
  const [tab, setTab] = useState("overview");
  const m = metrics;
  const s = m.scores;
  const d = m.details;

  const METRIC_DEFS = [
    { key: "completenessScore",    label: "Profile Completeness",  icon: "✅", color: "#10b981" },
    { key: "headlineScore",        label: "Headline Quality",       icon: "🏷️", color: "#3b82f6" },
    { key: "skillsRelevanceScore", label: "Skills Relevance",       icon: "💡", color: "#8b5cf6" },
    { key: "expQualityScore",      label: "Experience Quality",     icon: "💼", color: "#f59e0b" },
    { key: "projectScore",         label: "Project Presence",       icon: "🚀", color: "#06b6d4" },
    { key: "activityScore",        label: "Activity & Engagement",  icon: "📣", color: "#ec4899" },
    { key: "networkScore",         label: "Network Strength",       icon: "🌐", color: "#a78bfa" },
    { key: "certScore",            label: "Certifications",         icon: "🏅", color: "#34d399" },
    { key: "recommendationScore",  label: "Recommendations",        icon: "⭐", color: "#fbbf24" },
    { key: "consistencyScore",     label: "Resume Consistency",     icon: "🔗", color: "#60a5fa" },
    { key: "brandingScore",        label: "Professional Branding",  icon: "🎯", color: "#f87171" },
    { key: "keywordScore",         label: "Keyword Optimization",   icon: "🔍", color: "#c084fc" },
  ];

  const tabs = ["overview", "details", "compare"];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 60px" }}>

      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
        <motion.button whileHover={{ scale: 1.04 }} onClick={onReset}
          style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(14,165,233,0.4)",
            background: "rgba(14,165,233,0.08)", color: "#38bdf8", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
          ← Analyze Again
        </motion.button>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(200,195,230,0.4)", letterSpacing: "0.1em" }}>
          LINKEDIN ANALYSIS REPORT · {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Hero — two scores side by side */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "grid", gridTemplateColumns: resumeScore ? "1fr 1fr" : "1fr", gap: 20, marginBottom: 28 }}>

        {/* LinkedIn score */}
        <div style={{ padding: "32px 28px", borderRadius: 22, background: "rgba(14,165,233,0.07)",
          border: "1px solid rgba(14,165,233,0.3)", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
            <Ring score={m.overallLinkedInScore} color="#38bdf8" size={120} stroke={10} delay={0.1} />
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 30, color: "#38bdf8", lineHeight: 1 }}>{m.overallLinkedInScore}</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(200,195,230,0.4)", marginTop: 2 }}>/ 100</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "#38bdf8", letterSpacing: "0.12em", marginBottom: 6 }}>💼 LINKEDIN SCORE</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 20, color: "#f1f0ff", marginBottom: 4 }}>
              {scoreLabel(m.overallLinkedInScore)} Profile
            </div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.6)", lineHeight: 1.6 }}>
              Based on 12 LinkedIn metrics including<br />branding, keywords & experience quality
            </div>
          </div>
        </div>

        {/* Resume score (if available) */}
        {resumeScore !== null && resumeScore !== undefined && (
          <div style={{ padding: "32px 28px", borderRadius: 22, background: "rgba(124,58,237,0.07)",
            border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
              <Ring score={resumeScore} color="#a78bfa" size={120} stroke={10} delay={0.3} />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 30, color: "#a78bfa", lineHeight: 1 }}>{resumeScore}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(200,195,230,0.4)", marginTop: 2 }}>/ 100</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "#a78bfa", letterSpacing: "0.12em", marginBottom: 6 }}>📋 RESUME SCORE</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 20, color: "#f1f0ff", marginBottom: 4 }}>
                {scoreLabel(resumeScore)} Resume
              </div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.6)", lineHeight: 1.6 }}>
                From your last resume analysis.<br />Consistency check: {s.consistencyScore}%
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 0 }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "9px 20px", borderRadius: "10px 10px 0 0", border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 600, fontFamily: "'Outfit',sans-serif", letterSpacing: "0.06em",
              background: tab === t ? "rgba(14,165,233,0.15)" : "transparent",
              color: tab === t ? "#38bdf8" : "rgba(200,195,230,0.45)",
              borderBottom: tab === t ? "2px solid #38bdf8" : "2px solid transparent", transition: "all 0.2s" }}>
            {t === "overview" ? "📊 OVERVIEW" : t === "details" ? "🔬 DETAILS" : "⚖️ COMPARE"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
              {METRIC_DEFS.map((def, i) => (
                <div key={def.key} style={{ padding: "16px", borderRadius: 14, background: `${def.color}06`, border: `1px solid ${def.color}25` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 15 }}>{def.icon}</span>
                      <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 12, color: "#f1f0ff" }}>{def.label}</span>
                    </div>
                    <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 18, color: def.color }}>{s[def.key]}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${s[def.key]}%` }}
                      transition={{ duration: 1, delay: i * 0.05, ease: "easeOut" }}
                      style={{ height: "100%", borderRadius: 3, background: def.color, boxShadow: `0 0 6px ${def.color}` }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* DETAILS TAB */}
        {tab === "details" && (
          <motion.div key="dt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <SectionCard title="PROFILE COMPLETENESS" icon="✅" color="#10b981" delay={0}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    {["photo","headline","about","experience","skills","projects","education","contact"].map((sec) => (
                      <span key={sec} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 100,
                        background: d.missingSections?.includes(sec) ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.15)",
                        color: d.missingSections?.includes(sec) ? "#f87171" : "#34d399",
                        border: `1px solid ${d.missingSections?.includes(sec) ? "rgba(248,113,113,0.3)" : "rgba(52,211,153,0.3)"}`,
                        fontFamily: "'DM Mono',monospace" }}>
                        {d.missingSections?.includes(sec) ? "❌" : "✓"} {sec}
                      </span>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="SKILLS FOUND" icon="💡" color="#8b5cf6" delay={0.05}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {(d.foundSkills || []).slice(0, 12).map((skill, i) => <Chip key={i} label={skill} color="#a78bfa" />)}
                    {(!d.foundSkills || d.foundSkills.length === 0) && (
                      <span style={{ fontSize: 11, color: "rgba(200,195,230,0.4)", fontFamily: "'DM Sans',sans-serif" }}>No recognizable tech skills detected</span>
                    )}
                  </div>
                </SectionCard>

                <SectionCard title="EXPERIENCE QUALITY" icon="💼" color="#f59e0b" delay={0.1}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                    {(d.actionVerbs || []).map((v, i) => <Chip key={i} label={v} color="#fbbf24" />)}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                    {[
                      { label: "Has Numbers/Metrics", ok: d.hasNumbers },
                      { label: "Internship",           ok: d.hasInternship },
                      { label: "Full-Time Role",       ok: d.hasFullTime },
                    ].map((item, i) => (
                      <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100,
                        background: item.ok ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
                        color: item.ok ? "#34d399" : "#f87171",
                        border: `1px solid ${item.ok ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`,
                        fontFamily: "'DM Mono',monospace" }}>
                        {item.ok ? "✓" : "✗"} {item.label}
                      </span>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="CERTIFICATIONS" icon="🏅" color="#34d399" delay={0.15}>
                  {(d.certsFound || []).length === 0 ? (
                    <div style={{ fontSize: 11, color: "#f87171", fontFamily: "'DM Sans',sans-serif" }}>
                      No certifications detected — add courses, credentials, or badges
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {d.certsFound.map((c, i) => <Chip key={i} label={c} color="#34d399" />)}
                    </div>
                  )}
                </SectionCard>
              </div>

              <div>
                <SectionCard title="NETWORK STRENGTH" icon="🌐" color="#a78bfa" delay={0.07}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 36, color: "#a78bfa" }}>
                      {d.connections > 0 ? d.connections : "?"}
                    </div>
                    <div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#a78bfa" }}>{d.networkLabel}</div>
                      <div style={{ fontSize: 10, color: "rgba(200,195,230,0.5)", fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>
                        {d.connections >= 500 ? "Excellent visibility" : d.connections >= 100 ? "Good exposure" : "Grow your network"}
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="RECOMMENDATIONS" icon="⭐" color="#fbbf24" delay={0.12}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 36, color: "#fbbf24" }}>{d.recCount}</div>
                    <div style={{ fontSize: 11, color: "rgba(200,195,230,0.6)", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.6 }}>
                      {d.recCount === 0 ? "🚩 No recommendations — ask managers or peers to write one"
                        : d.recCount >= 3 ? "✅ Strong social proof"
                        : "⚠️ Getting there — aim for 3+"}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="PROJECT PRESENCE" icon="🚀" color="#06b6d4" delay={0.17}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {[
                      { label: `${d.projectCount} projects mentioned`, ok: d.projectCount > 0 },
                      { label: "GitHub link",  ok: d.hasGithubLinks },
                      { label: "Live demo link", ok: d.hasLiveLinks },
                    ].map((item, i) => (
                      <span key={i} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 100,
                        background: item.ok ? "rgba(6,182,212,0.1)" : "rgba(248,113,113,0.1)",
                        color: item.ok ? "#06b6d4" : "#f87171",
                        border: `1px solid ${item.ok ? "rgba(6,182,212,0.25)" : "rgba(248,113,113,0.2)"}`,
                        fontFamily: "'DM Mono',monospace" }}>
                        {item.ok ? "✓" : "✗"} {item.label}
                      </span>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="KEYWORD OPTIMIZATION" icon="🔍" color="#c084fc" delay={0.22}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
                    {(d.foundATS || []).map((k, i) => <Chip key={i} label={k} color="#c084fc" />)}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(200,195,230,0.45)", fontFamily: "'DM Sans',sans-serif" }}>
                    {d.foundATS?.length || 0}/15 ATS keywords found in profile
                  </div>
                </SectionCard>
              </div>
            </div>
          </motion.div>
        )}

        {/* COMPARE TAB */}
        {tab === "compare" && (
          <motion.div key="cp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {resumeScore ? (
              <div style={{ padding: 20, borderRadius: 18, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                  <div>
                    <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "#38bdf8", letterSpacing: "0.1em", marginBottom: 16 }}>💼 LINKEDIN METRICS</div>
                    {METRIC_DEFS.map((def, i) => (
                      <Bar key={def.key} label={def.label} value={s[def.key]} color={def.color} delay={i * 0.04} />
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "#a78bfa", letterSpacing: "0.1em", marginBottom: 16 }}>📋 RESUME OVERALL</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 20, borderRadius: 14, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", marginBottom: 16 }}>
                      <div style={{ position: "relative", width: 80, height: 80 }}>
                        <Ring score={resumeScore} color="#a78bfa" size={80} stroke={7} delay={0.3} />
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 20, color: "#a78bfa" }}>{resumeScore}</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 16, color: "#f1f0ff" }}>{scoreLabel(resumeScore)} Resume</div>
                        <div style={{ fontSize: 11, color: "rgba(200,195,230,0.55)", fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>From your resume analysis</div>
                      </div>
                    </div>
                    {/* Combined trust signal */}
                    <div style={{ padding: 16, borderRadius: 14, background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>
                      <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "#fbbf24", letterSpacing: "0.1em", marginBottom: 8 }}>🔥 COMBINED TRUST SIGNAL</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ position: "relative", width: 80, height: 80 }}>
                          <Ring score={Math.round((m.overallLinkedInScore + resumeScore) / 2)} color="#fbbf24" size={80} stroke={7} delay={0.1} />
                          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 18, color: "#fbbf24", lineHeight: 1 }}>
                              {Math.round((m.overallLinkedInScore + resumeScore) / 2)}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: "rgba(200,195,230,0.6)", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.7 }}>
                          LinkedIn: <strong style={{ color: "#38bdf8" }}>{m.overallLinkedInScore}</strong> · Resume: <strong style={{ color: "#a78bfa" }}>{resumeScore}</strong><br />
                          Consistency: <strong style={{ color: "#60a5fa" }}>{s.consistencyScore}%</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 24px", color: "rgba(200,195,230,0.4)", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                No resume analysis found.<br />
                Go to <strong>Analyze Resume</strong> first, then come back to compare.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ══════════════════════════════════════════════════════════════
export default function LinkedInAnalyzer({ onBack, resumeScore, resumeSkills = [] }) {
  const { user } = useUser();
  const [pdfFile, setPdfFile] = useState(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [manualText, setManualText] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [inputMode, setInputMode] = useState("pdf");
  const inputRef = useRef(null);

  const handleAnalyze = async () => {
    let profileText = "";
    setAnalyzing(true);

    try {
      if (inputMode === "pdf" && pdfFile) {
        profileText = await readPdfAsText(pdfFile);
      } else if (inputMode === "text" && manualText.trim().length > 50) {
        profileText = manualText;
      } else {
        alert("❌ Please upload a LinkedIn PDF or paste your profile text.");
        setAnalyzing(false);
        return;
      }

      // ── Step 1: Analyze LinkedIn ───────────────────────────
      const response = await fetch(`${API_BASE}/api/linkedin-analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedinText: profileText,
          linkedinUrl:  linkedinUrl.trim(),
          jobRole:      jobRole.trim(),
          resumeSkills,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Analysis failed");

      setResults(data.linkedinMetrics);

      // ── Step 2: Save to MongoDB ────────────────────────────
      try {
        await fetch(`${API_BASE}/api/linkedin/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkUserId:     user?.id             || "guest",
            userName:        `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
            userEmail:       user?.emailAddresses?.[0]?.emailAddress || "",
            linkedinUrl:     linkedinUrl.trim(),
            jobRole:         jobRole.trim(),
            linkedinMetrics: data.linkedinMetrics,
            resumeScore:     resumeScore || null,
          }),
        });
        console.log("✅ LinkedIn analysis saved to MongoDB");
      } catch (saveErr) {
        console.warn("⚠️ Could not save LinkedIn analysis:", saveErr.message);
      }

    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const canAnalyze = (inputMode === "pdf" && pdfFile) || (inputMode === "text" && manualText.trim().length > 50);

  if (results) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #06040f 0%, #0e0720 40%, #060c1c 100%)", paddingTop: 100, position: "relative" }}>
        <BgEffects />
        <div style={{ position: "relative", zIndex: 1 }}>
          <LinkedInResults metrics={results} resumeScore={resumeScore} onReset={() => setResults(null)} />
        </div>
        <Fonts />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #06040f 0%, #0e0720 40%, #060c1c 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "100px 24px 40px", position: "relative", overflow: "hidden" }}>
      <BgEffects />

      <AnimatePresence mode="wait">
        {analyzing ? (
          <LoadingScreen key="loading" />
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ width: "100%", maxWidth: 720, position: "relative", zIndex: 1 }}>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: 36 }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 16px",
                  background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, boxShadow: "0 0 40px rgba(14,165,233,0.5)" }}>💼</motion.div>
              <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: "clamp(22px, 4vw, 34px)", color: "#f1f0ff", marginBottom: 8 }}>
                LinkedIn Profile Analyzer
              </h2>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "rgba(200,195,230,0.65)", maxWidth: 480, margin: "0 auto" }}>
                Analyze your LinkedIn profile across 12 professional metrics. Results are saved to your history.
              </p>
            </motion.div>

            {/* Input mode toggle */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, padding: 5, borderRadius: 14,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {[
                { key: "pdf",  label: "📄 Upload LinkedIn PDF",  sub: "Save as PDF from LinkedIn" },
                { key: "text", label: "📝 Paste Profile Text",   sub: "Copy-paste from your profile" },
              ].map((mode) => (
                <button key={mode.key} onClick={() => setInputMode(mode.key)}
                  style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: "none", cursor: "pointer",
                    transition: "all 0.2s", textAlign: "left",
                    background: inputMode === mode.key ? "rgba(14,165,233,0.15)" : "transparent",
                    borderBottom: inputMode === mode.key ? "2px solid #38bdf8" : "2px solid transparent" }}>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13,
                    color: inputMode === mode.key ? "#38bdf8" : "rgba(200,195,230,0.6)" }}>{mode.label}</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "rgba(200,195,230,0.4)", marginTop: 2 }}>{mode.sub}</div>
                </button>
              ))}
            </div>

            {/* PDF Upload */}
            {inputMode === "pdf" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 20 }}>
                {!pdfFile ? (
                  <div onClick={() => inputRef.current?.click()}
                    style={{ borderRadius: 16, border: "2px dashed rgba(14,165,233,0.4)",
                      background: "rgba(14,165,233,0.04)", padding: "36px 24px",
                      textAlign: "center", cursor: "pointer", transition: "all 0.25s" }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(14,165,233,0.7)"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(14,165,233,0.4)"}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14, color: "#f1f0ff", marginBottom: 4 }}>
                      Upload LinkedIn PDF Export
                    </div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(200,195,230,0.5)", marginBottom: 14 }}>
                      LinkedIn → Me → Settings → Data Privacy → Get a copy of your data
                    </div>
                    <div style={{ display: "inline-block", padding: "8px 20px", borderRadius: 9,
                      background: "linear-gradient(135deg, #0ea5e9, #2563eb)", color: "#fff",
                      fontSize: 12, fontWeight: 600, fontFamily: "'Outfit',sans-serif",
                      boxShadow: "0 0 14px rgba(14,165,233,0.4)" }}>Choose PDF</div>
                    <input ref={inputRef} type="file" accept=".pdf"
                      onChange={(e) => { const f = e.target.files[0]; if (f) setPdfFile(f); e.target.value = ""; }}
                      style={{ display: "none" }} />
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ padding: 18, borderRadius: 16, border: "1.5px solid rgba(14,165,233,0.4)",
                      background: "rgba(14,165,233,0.06)", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20, boxShadow: "0 0 16px rgba(14,165,233,0.4)" }}>📄</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, color: "#f1f0ff",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pdfFile.name}</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#38bdf8", marginTop: 2 }}>
                        {(pdfFile.size / 1024).toFixed(1)} KB · PDF
                      </div>
                    </div>
                    <button onClick={() => setPdfFile(null)}
                      style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid rgba(248,113,113,0.3)",
                        background: "rgba(248,113,113,0.1)", color: "#f87171", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Text paste */}
            {inputMode === "text" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 20 }}>
                <textarea value={manualText} onChange={(e) => setManualText(e.target.value)}
                  placeholder="Paste your full LinkedIn profile text here — name, headline, about, experience, skills, projects, certifications, recommendations..."
                  style={{ width: "100%", minHeight: 200, borderRadius: 14, padding: "14px 16px", boxSizing: "border-box",
                    background: "rgba(255,255,255,0.03)",
                    border: manualText ? "1.5px solid rgba(14,165,233,0.5)" : "2px dashed rgba(14,165,233,0.3)",
                    color: "#f1f0ff", fontSize: 13, fontFamily: "'DM Sans',sans-serif",
                    lineHeight: 1.7, resize: "vertical", outline: "none" }} />
                <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(200,195,230,0.35)", marginTop: 6 }}>
                  {manualText.length} characters · Minimum 50 required
                </div>
              </motion.div>
            )}

            {/* LinkedIn URL */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "#38bdf8", letterSpacing: "0.1em", marginBottom: 8 }}>
                🔗 LINKEDIN URL (OPTIONAL)
              </div>
              <input type="text" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
                style={{ width: "100%", padding: "11px 14px", borderRadius: 11,
                  border: "1px solid rgba(14,165,233,0.25)", background: "rgba(14,165,233,0.04)",
                  color: "#f1f0ff", fontSize: 13, fontFamily: "'DM Mono',monospace",
                  outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Job Role */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "#a78bfa", letterSpacing: "0.1em", marginBottom: 8 }}>
                🎯 TARGET JOB ROLE (OPTIONAL — improves skill relevance scoring)
              </div>
              <input type="text" value={jobRole} onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g., Frontend Developer, ML Engineer, Data Analyst"
                style={{ width: "100%", padding: "11px 14px", borderRadius: 11,
                  border: "1px solid rgba(139,92,246,0.25)", background: "rgba(124,58,237,0.05)",
                  color: "#f1f0ff", fontSize: 13, fontFamily: "'DM Mono',monospace",
                  outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* How to export hint */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ marginBottom: 28, padding: "14px 16px", borderRadius: 12,
                background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)" }}>
              <div style={{ fontSize: 11, fontFamily: "'Outfit',sans-serif", fontWeight: 700, color: "#fbbf24", marginBottom: 6 }}>
                💡 How to get your LinkedIn PDF
              </div>
              <div style={{ fontSize: 11, fontFamily: "'DM Sans',sans-serif", color: "rgba(251,191,36,0.75)", lineHeight: 1.8 }}>
                LinkedIn → Your Profile → <strong>More</strong> button → <strong>Save to PDF</strong>
              </div>
            </motion.div>

            {/* Analyze button */}
            <AnimatePresence>
              {canAnalyze && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ textAlign: "center" }}>
                  <motion.button
                    whileHover={{ scale: 1.06, boxShadow: "0 0 60px rgba(14,165,233,0.6)" }}
                    whileTap={{ scale: 0.96 }} onClick={handleAnalyze}
                    style={{ padding: "18px 64px", borderRadius: 18, border: "none",
                      background: "linear-gradient(135deg, #0ea5e9, #2563eb, #7c3aed)",
                      color: "#fff", fontSize: 18, fontWeight: 800,
                      fontFamily: "'Outfit',sans-serif", cursor: "pointer",
                      boxShadow: "0 0 36px rgba(14,165,233,0.45)",
                      letterSpacing: "0.04em", position: "relative", overflow: "hidden" }}>
                    <motion.div animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                        pointerEvents: "none" }} />
                    💼 ANALYZE LINKEDIN
                  </motion.button>
                  <div style={{ marginTop: 10, fontFamily: "'DM Mono',monospace", fontSize: 10,
                    color: "rgba(167,139,250,0.5)", letterSpacing: "0.1em" }}>
                    12 PROFESSIONAL METRICS · SAVED TO HISTORY
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      <Fonts />
    </div>
  );
}

// ── Shared bg & fonts ──────────────────────────────────────────
function BgEffects() {
  return (
    <>
      <div style={{ position: "fixed", width: 600, height: 600, borderRadius: "50%", top: "-15%", left: "-10%",
        background: "radial-gradient(circle, rgba(14,165,233,0.2) 0%, transparent 70%)",
        filter: "blur(60px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", width: 500, height: 500, borderRadius: "50%", bottom: "-15%", right: "-10%",
        background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)",
        filter: "blur(60px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0,
        backgroundImage: `linear-gradient(rgba(14,165,233,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.04) 1px, transparent 1px)`,
        backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0 }} />
    </>
  );
}

function Fonts() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=DM+Sans:wght@400;500&family=DM+Mono:wght@400;500&display=swap');
      textarea::placeholder, input::placeholder { color: rgba(200,195,230,0.25); }
    `}</style>
  );
}