// // const mongoose = require("mongoose");

// // const atsBuildSchema = new mongoose.Schema({
// //   // User info
// //   clerkUserId:      { type: String, required: true },
// //   userName:         { type: String, default: "" },
// //   userEmail:        { type: String, default: "" },

// //   // Input files metadata
// //   originalResumeFileName: { type: String, default: "" },
// //   jdText:                 { type: String, default: "" },
// //   jdFileName:             { type: String, default: "" }, // if uploaded as file

// //   // GitHub info used
// //   githubUsername:   { type: String, default: "" },
// //   githubUsed:       { type: Boolean, default: false },
// //   githubProjects:   { type: [String], default: [] },

// //   // The original resume text (extracted)
// //   originalResumeText: { type: String, default: "" },

// //   // The generated ATS resume
// //   generatedResumeText: { type: String, default: "" },

// //   // What was added/changed (analytics)
// //   analytics: {
// //     addedSkills:        { type: [String], default: [] },
// //     addedKeywords:      { type: [String], default: [] },
// //     addedProjects:      { type: [String], default: [] },
// //     addedAchievements:  { type: [String], default: [] },
// //     addedCertifications:{ type: [String], default: [] },
// //     enhancedSections:   { type: [String], default: [] },
// //     originalATSScore:   { type: Number,   default: 0  },
// //     newATSScore:        { type: Number,   default: 0  },
// //     improvementPercent: { type: Number,   default: 0  },
// //     totalChanges:       { type: Number,   default: 0  },
// //     sourceBreakdown: {
// //       fromGitHub:       { type: Number, default: 0 },
// //       fromOriginalResume:{ type: Number, default: 0 },
// //       aiGenerated:      { type: Number, default: 0 },
// //     },
// //   },

// //   // PDF stored as base64 (for download)
// //   generatedPdfBase64: { type: String, default: "" },

// //   createdAt: { type: Date, default: Date.now },
// // });

// // atsBuildSchema.index({ clerkUserId: 1, createdAt: -1 });

// // module.exports = mongoose.model("ATSBuild", atsBuildSchema);










































// import { useState, useRef, useCallback } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useUser } from "@clerk/clerk-react";
// import * as pdfjsLib from "pdfjs-dist";
// import API_BASE from "../config";

// pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
//   "pdfjs-dist/build/pdf.worker.min.mjs",
//   import.meta.url
// ).toString();

// // ── PDF / DOCX text extraction (client-side) ──────────────────
// async function extractText(file) {
//   if (!file) return "";
//   if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
//     const buf  = await file.arrayBuffer();
//     const pdf  = await pdfjsLib.getDocument({ data: buf }).promise;
//     let text   = "";
//     for (let i = 1; i <= pdf.numPages; i++) {
//       const pg  = await pdf.getPage(i);
//       const ct  = await pg.getTextContent();
//       text += ct.items.map(x => x.str).join(" ") + "\n";
//     }
//     return text.trim();
//   }
//   return new Promise((res, rej) => {
//     const r = new FileReader();
//     r.onload  = () => res(r.result);
//     r.onerror = rej;
//     r.readAsText(file);
//   });
// }

// // ── Extract GitHub username from resume text ──────────────────
// function extractGithub(text) {
//   const skip = new Set([
//     "features","topics","explore","marketplace","enterprise","sponsors",
//     "about","login","signup","orgs","settings","notifications","pulls",
//     "issues","actions","wiki","security","pulse","graphs","network",
//     "trending","collections","events","site","contact","pricing","apps",
//     "jobs","education","github","linkedin","twitter","facebook","instagram",
//     "youtube","medium","dev","hashnode","stackoverflow","leetcode",
//   ]);

//   const cleaned = text
//     .replace(/github\s*\.\s*com\s*\/\s*/gi, "github.com/")
//     .replace(/https?\s*:\/\/\s*/gi, "https://");

//   let m;

//   // Priority 1: full https URL
//   const p1 = /https:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9][a-zA-Z0-9_-]{1,38})(?:\/|\s|$|[,;)\n])/gi;
//   while ((m = p1.exec(cleaned)) !== null) {
//     const u = m[1].replace(/[^a-zA-Z0-9_-]/g, "");
//     if (u.length >= 2 && !skip.has(u.toLowerCase())) return u;
//   }

//   // Priority 2: bare github.com/username
//   const p2 = /(?:^|\s)github\.com\/([a-zA-Z0-9][a-zA-Z0-9_-]{1,38})(?:\/|\s|$|[,;)\n])/gi;
//   while ((m = p2.exec(cleaned)) !== null) {
//     const u = m[1].replace(/[^a-zA-Z0-9_-]/g, "");
//     if (u.length >= 2 && !skip.has(u.toLowerCase())) return u;
//   }

//   // Priority 3: label — "GitHub: username" at line start only
//   const p3 = /(?:^|\n)\s*github\s*[:|]\s*@?([a-zA-Z0-9][a-zA-Z0-9_-]{1,38})(?:\s|$)/gim;
//   while ((m = p3.exec(cleaned)) !== null) {
//     const u = m[1].replace(/[^a-zA-Z0-9_-]/g, "");
//     if (u.length >= 2 && !skip.has(u.toLowerCase())) return u;
//   }

//   return "";
// }

// // ── Score → color ─────────────────────────────────────────────
// function sc(v) {
//   if (v >= 80) return "#22c55e";
//   if (v >= 60) return "#f59e0b";
//   if (v >= 40) return "#f97316";
//   return "#ef4444";
// }

// // ── 15 metric definitions ─────────────────────────────────────
// const METRICS = [
//   { key: "overallATS",       label: "Overall ATS Score",       icon: "🎯", weight: "20%" },
//   { key: "keywordMatch",     label: "Keyword Match",           icon: "🔑", weight: "12%" },
//   { key: "techScore",        label: "Technical Skills",        icon: "⚙️", weight: "10%" },
//   { key: "actionVerbScore",  label: "Action Verbs",            icon: "💪", weight: "8%"  },
//   { key: "quantScore",       label: "Quantified Achievements", icon: "📊", weight: "8%"  },
//   { key: "sectionScore",     label: "Section Completeness",    icon: "📋", weight: "7%"  },
//   { key: "contactScore",     label: "Contact Info",            icon: "📱", weight: "5%"  },
//   { key: "formatScore",      label: "Formatting",              icon: "📐", weight: "5%"  },
//   { key: "summaryScore",     label: "Summary/Objective",       icon: "📝", weight: "5%"  },
//   { key: "linkScore",        label: "Links & Portfolio",       icon: "🔗", weight: "4%"  },
//   { key: "eduScore",         label: "Education Relevance",     icon: "🎓", weight: "4%"  },
//   { key: "certScore",        label: "Certifications",          icon: "🏅", weight: "4%"  },
//   { key: "projectScore",     label: "Projects",                icon: "🚀", weight: "4%"  },
//   { key: "industryScore",    label: "Industry Keywords",       icon: "🏢", weight: "3%"  },
//   { key: "readabilityScore", label: "Readability",             icon: "👁️", weight: "1%"  },
// ];

// // ═══════════════════════════════════════════════════════════════
// // MAIN COMPONENT
// // ═══════════════════════════════════════════════════════════════
// export default function ATSBuilder({ onBack }) {
//   const { user } = useUser();

//   const [resumeFile,     setResumeFile]     = useState(null);
//   const [jdText,         setJdText]         = useState("");
//   const [githubUsername, setGithubUsername] = useState("");
//   const [autoGitHub,     setAutoGitHub]     = useState("");

//   const [building,       setBuilding]       = useState(false);
//   const [step,           setStep]           = useState("");
//   const [progress,       setProgress]       = useState(0);
//   const [result,         setResult]         = useState(null);
//   const [error,          setError]          = useState("");
//   const [downloading,    setDownloading]    = useState(false);
//   const [activeTab,      setActiveTab]      = useState("preview"); // "preview" | "metrics" | "changes"

//   const resumeRef = useRef(null);

//   // Auto-detect GitHub on resume upload
//   const onResumeSelect = useCallback(async (file) => {
//     setResumeFile(file);
//     setAutoGitHub("");
//     try {
//       const txt = await extractText(file);
//       const gh  = extractGithub(txt);
//       if (gh) { setAutoGitHub(gh); setGithubUsername(gh); }
//     } catch {}
//   }, []);

//   const canBuild = !!resumeFile && jdText.trim().length >= 30;

//   // ── BUILD ──────────────────────────────────────────────────
//   const handleBuild = async () => {
//     if (!canBuild) return;
//     setBuilding(true); setError(""); setResult(null); setProgress(5);

//     try {
//       setStep("Reading resume..."); setProgress(10);
//       const resumeText = await extractText(resumeFile);
//       if (!resumeText || resumeText.trim().length < 50)
//         throw new Error("Could not extract text from resume. Try a different file.");

//       setStep(githubUsername.trim()
//         ? `Fetching GitHub @${githubUsername.trim()} and building ATS resume...`
//         : "Building ATS-optimised resume with AI...");
//       setProgress(30);

//       const res = await fetch(`${API_BASE}/api/ats-builder/build`, {
//         method:  "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           clerkUserId:    user?.id || "guest",
//           userName:       `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
//           userEmail:      user?.emailAddresses?.[0]?.emailAddress || "",
//           resumeText:     resumeText.slice(0, 6000),
//           resumeFileName: resumeFile.name,
//           jdText:         jdText.trim().slice(0, 3000),
//           githubUsername: githubUsername.trim(),
//           // Pass the Groq key from client env so server doesn't need its own copy
//           groqApiKey:     import.meta.env.VITE_GROQ_API_KEY || "",
//         }),
//       });

//       setProgress(85);
//       const ct = res.headers.get("content-type") || "";
//       if (!ct.includes("application/json")) {
//         const raw = await res.text();
//         throw new Error("Server error: " + raw.slice(0, 300));
//       }

//       const data = await res.json();
//       if (!data.success) throw new Error(data.error || "Build failed.");

//       setProgress(100); setStep("Done!");
//       setResult(data);
//       setActiveTab("metrics");
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setBuilding(false);
//     }
//   };

//   // ── DOWNLOAD PDF ───────────────────────────────────────────
//   const handleDownload = async () => {
//     if (!result?.id) return;
//     setDownloading(true);
//     try {
//       const res = await fetch(`${API_BASE}/api/ats-builder/pdf/${result.id}`);
//       if (!res.ok) throw new Error("Download failed");
//       const blob = await res.blob();
//       const url  = URL.createObjectURL(blob);
//       const a    = document.createElement("a");
//       a.href     = url;
//       a.download = `${result.resumeJSON?.name || "Resume"}_ATS_Optimised.pdf`;
//       a.click();
//       URL.revokeObjectURL(url);
//     } catch (e) { alert("Download failed: " + e.message); }
//     finally { setDownloading(false); }
//   };

//   const reset = () => {
//     setResumeFile(null); setJdText(""); setGithubUsername(""); setAutoGitHub("");
//     setResult(null); setError(""); setProgress(0);
//   };

//   // ── STYLES ─────────────────────────────────────────────────
//   const BG   = "linear-gradient(145deg,#06040f 0%,#0e0720 40%,#060c1c 100%)";
//   const CARD = { padding:24, borderRadius:20, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", marginBottom:20 };

//   // ── RENDER ─────────────────────────────────────────────────
//   return (
//     <div style={{ minHeight:"100vh", background:BG, padding:"40px 24px", position:"relative", overflowX:"hidden" }}>

//       {/* BG blobs */}
//       {[["top:-20%","left:-10%","rgba(124,58,237,0.22)"],["bottom:-15%","right:-5%","rgba(5,150,105,0.18)"]].map(([t,l,c],i) => (
//         <div key={i} style={{ position:"fixed", width:550, height:550, borderRadius:"50%", [t.split(":")[0]]:t.split(":")[1], [l.split(":")[0]]:l.split(":")[1], background:`radial-gradient(circle,${c} 0%,transparent 70%)`, filter:"blur(80px)", pointerEvents:"none" }} />
//       ))}

//       <div style={{ maxWidth:900, margin:"0 auto", position:"relative", zIndex:1 }}>

//         {/* ── HEADER ────────────────────────────────────── */}
//         <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} style={{textAlign:"center",marginBottom:32}}>
//           <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",bounce:0.5}}
//             style={{width:68,height:68,borderRadius:20,margin:"0 auto 14px",background:"linear-gradient(135deg,#7c3aed,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,boxShadow:"0 0 50px rgba(124,58,237,0.5)"}}>🎯</motion.div>
//           <h1 style={{fontFamily:"'Outfit',sans-serif",fontWeight:900,fontSize:"clamp(22px,4vw,34px)",color:"#f1f0ff",marginBottom:6}}>ATS Resume Builder</h1>
//           <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(200,195,230,0.55)",maxWidth:520,margin:"0 auto"}}>
//             Upload resume + paste job description. AI rebuilds your resume to match the JD, pulls real GitHub projects, and shows 15-metric before/after analytics.
//           </p>
//           {onBack && <motion.button whileHover={{scale:1.05}} onClick={onBack}
//             style={{marginTop:12,padding:"6px 16px",borderRadius:10,cursor:"pointer",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(200,195,230,0.5)",fontFamily:"'Outfit',sans-serif",fontSize:12}}>← Back</motion.button>}
//         </motion.div>

//         <AnimatePresence mode="wait">

//           {/* ── BUILDING ──────────────────────────────────── */}
//           {building && (
//             <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
//               style={{textAlign:"center",padding:"80px 24px"}}>
//               <div style={{position:"relative",width:100,height:100,margin:"0 auto 28px"}}>
//                 {[0,1,2].map(i=>(
//                   <motion.div key={i} animate={{scale:[1,1.5+i*0.2,1],opacity:[0.5,0,0.5]}}
//                     transition={{duration:2,delay:i*0.4,repeat:Infinity}}
//                     style={{position:"absolute",inset:0,borderRadius:"50%",border:`2px solid rgba(124,58,237,${0.5-i*0.12})`}}/>
//                 ))}
//                 <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:38}}>🎯</div>
//               </div>
//               <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:20,color:"#f1f0ff",marginBottom:8}}>Building Your ATS Resume...</div>
//               <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#a78bfa",marginBottom:24}}>{step}</div>
//               <div style={{maxWidth:400,margin:"0 auto"}}>
//                 <div style={{height:6,borderRadius:3,background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
//                   <motion.div animate={{width:`${progress}%`}} transition={{duration:0.5}}
//                     style={{height:"100%",borderRadius:3,background:"linear-gradient(90deg,#7c3aed,#059669)"}}/>
//                 </div>
//                 <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(200,195,230,0.3)",marginTop:6,textAlign:"center"}}>{progress}%</div>
//               </div>
//             </motion.div>
//           )}

//           {/* ── RESULT ────────────────────────────────────── */}
//           {!building && result && (
//             <motion.div key="result" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>

//               {/* Score banner */}
//               <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
//                 style={{padding:"20px 28px",borderRadius:20,marginBottom:20,background:"linear-gradient(135deg,rgba(124,58,237,0.12),rgba(5,150,105,0.1))",border:"1px solid rgba(124,58,237,0.25)"}}>
//                 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
//                   <div>
//                     <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:900,fontSize:20,color:"#f1f0ff",marginBottom:4}}>
//                       ATS Resume Built Successfully
//                     </div>
//                     <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(200,195,230,0.6)"}}>
//                       {result.githubUsed
//                         ? `GitHub @${result.resumeJSON?.github?.replace("github.com/","") || ""} — ${result.githubProjects?.length || 0} real repos analysed`
//                         : "AI-generated professional content (no GitHub detected)"}
//                     </div>
//                   </div>
//                   <div style={{display:"flex",gap:14,alignItems:"center"}}>
//                     {[
//                       {label:"BEFORE",val:result.analytics.originalATSScore,col:sc(result.analytics.originalATSScore)},
//                       {label:"",val:"→",col:"#60a5fa",big:false},
//                       {label:"AFTER", val:result.analytics.newATSScore,     col:sc(result.analytics.newATSScore)},
//                     ].map((s,i)=>(
//                       <div key={i} style={{textAlign:"center"}}>
//                         {s.label && <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(200,195,230,0.4)",marginBottom:2}}>{s.label}</div>}
//                         <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:900,fontSize:s.big===false&&s.label===""?22:28,color:s.col}}>{s.val}</div>
//                       </div>
//                     ))}
//                     <div style={{padding:"8px 14px",borderRadius:12,background:"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.3)",textAlign:"center"}}>
//                       <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(200,195,230,0.4)"}}>GAIN</div>
//                       <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:900,fontSize:22,color:"#34d399"}}>+{result.analytics.improvementPercent}pts</div>
//                     </div>
//                   </div>
//                 </div>
//               </motion.div>

//               {/* Tabs */}
//               <div style={{display:"flex",gap:8,marginBottom:20}}>
//                 {[{k:"metrics",l:"📊 15 Metrics"},  {k:"changes",l:"✏️ What Changed"}, {k:"preview",l:"📄 Resume Preview"}].map(t=>(
//                   <button key={t.k} onClick={()=>setActiveTab(t.k)}
//                     style={{padding:"8px 18px",borderRadius:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:12,transition:"all 0.2s",
//                       background:activeTab===t.k?"rgba(124,58,237,0.2)":"rgba(255,255,255,0.03)",
//                       border:`1px solid ${activeTab===t.k?"rgba(124,58,237,0.5)":"rgba(255,255,255,0.08)"}`,
//                       color:activeTab===t.k?"#c4b5fd":"rgba(200,195,230,0.5)"}}>
//                     {t.l}
//                   </button>
//                 ))}
//               </div>

//               {/* ── METRICS TAB ─── */}
//               {activeTab==="metrics" && (
//                 <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} style={CARD}>
//                   <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:16,color:"#f1f0ff",marginBottom:4}}>15 ATS Metrics: Before vs After</div>
//                   <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(200,195,230,0.5)",marginBottom:20}}>Each metric scored 0–100. Industry standard pass = 70+.</div>

//                   {/* Header */}
//                   <div style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 80px",gap:6,marginBottom:10,padding:"0 8px"}}>
//                     {["Metric","Before","After","Change"].map(h=>(
//                       <div key={h} style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(200,195,230,0.4)",letterSpacing:"0.1em"}}>{h}</div>
//                     ))}
//                   </div>

//                   {METRICS.map((m,i)=>{
//                     const before = result.analytics.metricsBefore?.[m.key] ?? 0;
//                     const after  = result.analytics.metricsAfter?.[m.key]  ?? 0;
//                     const diff   = after - before;
//                     return (
//                       <motion.div key={m.key} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.03}}
//                         style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 80px",gap:6,alignItems:"center",
//                           padding:"10px 8px",borderRadius:10,marginBottom:4,
//                           background:i%2===0?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.01)",
//                           border:"1px solid rgba(255,255,255,0.04)"}}>

//                         {/* Label */}
//                         <div>
//                           <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
//                             <span style={{fontSize:12}}>{m.icon}</span>
//                             <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(200,195,230,0.85)",fontWeight:600}}>{m.label}</span>
//                             <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(200,195,230,0.3)"}}>{m.weight}</span>
//                           </div>
//                           {/* progress bars before/after */}
//                           <div style={{display:"flex",gap:3,height:4}}>
//                             <div style={{width:`${before}%`,maxWidth:"45%",height:4,borderRadius:2,background:"#ef4444aa",transition:"width 0.8s"}}/>
//                             <div style={{width:`${after}%`,maxWidth:"45%",height:4,borderRadius:2,background:sc(after)+"cc",transition:"width 0.8s"}}/>
//                           </div>
//                         </div>

//                         {/* Before */}
//                         <div style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,color:sc(before)}}>{before}</div>

//                         {/* After */}
//                         <div style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,color:sc(after)}}>{after}</div>

//                         {/* Change */}
//                         <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:800,
//                           color:diff>0?"#34d399":diff<0?"#ef4444":"#6b7280"}}>
//                           {diff>0?"+":""}{diff}
//                         </div>
//                       </motion.div>
//                     );
//                   })}
//                 </motion.div>
//               )}

//               {/* ── CHANGES TAB ─── */}
//               {activeTab==="changes" && (
//                 <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} style={CARD}>
//                   <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:16,color:"#f1f0ff",marginBottom:20}}>What Was Added & Enhanced</div>
//                   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
//                     {[
//                       {title:"Added Skills",    items:result.analytics.addedSkills,        color:"#34d399",icon:"✅"},
//                       {title:"Added Keywords",  items:result.analytics.addedKeywords,      color:"#a78bfa",icon:"🔑"},
//                       {title:"Added Projects",  items:result.analytics.addedProjects,      color:"#60a5fa",icon:"🚀"},
//                       {title:"Achievements",    items:result.analytics.addedAchievements,  color:"#f59e0b",icon:"🏆"},
//                       {title:"Certifications",  items:result.analytics.addedCertifications,color:"#3b82f6",icon:"📜"},
//                       {title:"Enhanced Sections",items:result.analytics.enhancedSections, color:"#6b7280",icon:"✏️"},
//                     ].filter(s=>s.items?.length>0).map((s,i)=>(
//                       <div key={i} style={{padding:"14px",borderRadius:12,background:"rgba(255,255,255,0.02)",border:`1px solid ${s.color}22`}}>
//                         <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:s.color,letterSpacing:"0.1em",marginBottom:10}}>
//                           {s.icon} {s.title.toUpperCase()}
//                         </div>
//                         <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
//                           {s.items.map((item,j)=>(
//                             <span key={j} style={{fontSize:10,padding:"3px 9px",borderRadius:100,
//                               background:`${s.color}14`,color:s.color,border:`1px solid ${s.color}33`,
//                               fontFamily:"'DM Mono',monospace",
//                               textDecoration:"underline",textDecorationStyle:"wavy",textDecorationColor:`${s.color}66`}}>
//                               {item}
//                             </span>
//                           ))}
//                         </div>
//                       </div>
//                     ))}
//                   </div>

//                   {/* Source breakdown */}
//                   <div style={{marginTop:20,padding:"14px",borderRadius:12,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
//                     <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(200,195,230,0.4)",marginBottom:12,letterSpacing:"0.1em"}}>CONTENT SOURCES</div>
//                     {[
//                       {label:"From GitHub repos",         val:result.analytics.sourceBreakdown?.fromGitHub||0,         color:"#34d399"},
//                       {label:"From original resume",       val:result.analytics.sourceBreakdown?.fromOriginalResume||0, color:"#60a5fa"},
//                       {label:"AI generated",              val:result.analytics.sourceBreakdown?.aiGenerated||0,         color:"#a78bfa"},
//                     ].map((row,i)=>(
//                       <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
//                         <div style={{width:12,height:12,borderRadius:3,background:row.color,flexShrink:0}}/>
//                         <div style={{flex:1,height:6,borderRadius:3,background:"rgba(255,255,255,0.05)",overflow:"hidden"}}>
//                           <motion.div initial={{width:0}} animate={{width:`${Math.min(row.val*12,100)}%`}}
//                             transition={{duration:0.8,delay:i*0.2}}
//                             style={{height:"100%",background:row.color,borderRadius:3}}/>
//                         </div>
//                         <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:row.color,minWidth:120}}>{row.label}: {row.val}</span>
//                       </div>
//                     ))}
//                   </div>

//                   {/* Matched keywords */}
//                   {result.analytics.matchedKeywords?.length>0 && (
//                     <div style={{marginTop:16,padding:"14px",borderRadius:12,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
//                       <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#34d399",marginBottom:8,letterSpacing:"0.1em"}}>JD KEYWORDS NOW IN RESUME</div>
//                       <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
//                         {result.analytics.matchedKeywords.map((k,i)=>(
//                           <span key={i} style={{fontSize:10,padding:"2px 8px",borderRadius:100,background:"rgba(52,211,153,0.1)",color:"#34d399",border:"1px solid rgba(52,211,153,0.25)",fontFamily:"'DM Mono',monospace"}}>{k}</span>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </motion.div>
//               )}

//               {/* ── PREVIEW TAB ─── */}
//               {activeTab==="preview" && result.resumeJSON && (
//                 <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} style={CARD}>
//                   <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:16,color:"#f1f0ff",marginBottom:16}}>Resume Preview</div>
//                   <div style={{background:"#fff",borderRadius:12,padding:"36px 40px",color:"#111827",fontFamily:"Georgia,serif",fontSize:11,lineHeight:1.6,boxShadow:"0 4px 24px rgba(0,0,0,0.3)"}}>

//                     {/* Header */}
//                     <div style={{borderBottom:"3px solid #1e3a5f",paddingBottom:14,marginBottom:16}}>
//                       <div style={{fontWeight:700,fontSize:20,color:"#0f172a"}}>{result.resumeJSON.name}</div>
//                       <div style={{color:"#2563eb",fontWeight:600,fontSize:12,margin:"4px 0"}}>{result.resumeJSON.headline}</div>
//                       <div style={{fontSize:10,color:"#6b7280"}}>
//                         {[result.resumeJSON.email,result.resumeJSON.phone,result.resumeJSON.location,result.resumeJSON.github,result.resumeJSON.linkedin].filter(Boolean).join("  |  ")}
//                       </div>
//                     </div>

//                     {/* Summary */}
//                     {result.resumeJSON.summary && <>
//                       <div style={{fontWeight:700,fontSize:10,color:"#1e3a5f",letterSpacing:"0.12em",marginBottom:6}}>PROFESSIONAL SUMMARY</div>
//                       <div style={{marginBottom:14,color:"#374151",textAlign:"justify"}}>{result.resumeJSON.summary}</div>
//                     </>}

//                     {/* Skills */}
//                     {result.resumeJSON.skills && <>
//                       <div style={{fontWeight:700,fontSize:10,color:"#1e3a5f",letterSpacing:"0.12em",marginBottom:6}}>TECHNICAL SKILLS</div>
//                       {Object.entries(result.resumeJSON.skills).map(([cat,items])=>items?.length>0&&(
//                         <div key={cat} style={{marginBottom:3}}>
//                           <span style={{fontWeight:700,color:"#374151",textTransform:"capitalize"}}>{cat}: </span>
//                           <span style={{color:"#6b7280"}}>{(items||[]).join(", ")}</span>
//                         </div>
//                       ))}
//                       <div style={{marginBottom:14}}/>
//                     </>}

//                     {/* Experience */}
//                     {result.resumeJSON.experience?.length>0 && <>
//                       <div style={{fontWeight:700,fontSize:10,color:"#1e3a5f",letterSpacing:"0.12em",marginBottom:8}}>PROFESSIONAL EXPERIENCE</div>
//                       {result.resumeJSON.experience.map((exp,i)=>(
//                         <div key={i} style={{marginBottom:12}}>
//                           <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap"}}>
//                             <span style={{fontWeight:700,fontSize:12}}>{exp.title}</span>
//                             <span style={{color:"#6b7280",fontSize:10}}>{exp.duration}</span>
//                           </div>
//                           <div style={{color:"#2563eb",fontSize:11,marginBottom:4}}>{exp.company}</div>
//                           {(exp.bullets||[]).map((b,j)=>(
//                             <div key={j} style={{paddingLeft:14,marginBottom:3,borderLeft:j>=(exp.originalBulletCount||2)?"2px solid #fde68a":"2px solid transparent",
//                               background:j>=(exp.originalBulletCount||2)?"#fffbeb":"transparent",paddingRight:4,color:"#374151"}}>
//                               ▸ {b}
//                             </div>
//                           ))}
//                         </div>
//                       ))}
//                     </>}

//                     {/* Projects */}
//                     {result.resumeJSON.projects?.length>0 && <>
//                       <div style={{fontWeight:700,fontSize:10,color:"#059669",letterSpacing:"0.12em",marginBottom:8}}>PROJECTS</div>
//                       {result.resumeJSON.projects.map((p,i)=>{
//                         const isNew = p.source==="generated"||p.source==="github";
//                         const link  = p.liveUrl||p.githubUrl||p.url||"";
//                         return (
//                           <div key={i} style={{marginBottom:12,padding:"8px 10px",borderRadius:8,
//                             background:isNew?"#f0fdf4":"transparent",border:isNew?"1px solid #bbf7d0":"1px solid transparent"}}>
//                             <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
//                               <span style={{fontWeight:700,fontSize:12,color:isNew?"#059669":"#0f172a"}}>{p.name}</span>
//                               {isNew && <span style={{fontSize:9,padding:"1px 7px",borderRadius:100,background:"#dcfce7",color:"#166534",fontWeight:700}}>
//                                 {p.source==="github"?"FROM GITHUB":"AI GENERATED"}
//                               </span>}
//                               {link && <a href={link} target="_blank" rel="noopener noreferrer"
//                                 style={{fontSize:10,color:"#2563eb",textDecoration:"underline"}}>Link →</a>}
//                             </div>
//                             {p.tech?.length>0 && <div style={{fontSize:10,color:"#6b7280",marginBottom:4}}>Tech: {p.tech.join(", ")}</div>}
//                             {(p.bullets||[]).map((b,j)=>(
//                               <div key={j} style={{paddingLeft:12,marginBottom:2,color:"#374151",fontSize:11}}>▸ {b}</div>
//                             ))}
//                           </div>
//                         );
//                       })}
//                     </>}

//                     {/* Education */}
//                     {result.resumeJSON.education?.length>0 && <>
//                       <div style={{fontWeight:700,fontSize:10,color:"#1e3a5f",letterSpacing:"0.12em",marginBottom:6}}>EDUCATION</div>
//                       {result.resumeJSON.education.map((e,i)=>(
//                         <div key={i} style={{marginBottom:4}}>
//                           <span style={{fontWeight:700}}>{e.degree}</span> — {e.institution} ({e.year})
//                           {e.gpa&&<span style={{color:"#6b7280"}}> | GPA: {e.gpa}</span>}
//                         </div>
//                       ))}
//                       <div style={{marginBottom:14}}/>
//                     </>}

//                     {/* Certifications */}
//                     {result.resumeJSON.certifications?.length>0 && <>
//                       <div style={{fontWeight:700,fontSize:10,color:"#1e3a5f",letterSpacing:"0.12em",marginBottom:6}}>CERTIFICATIONS</div>
//                       <div style={{marginBottom:14}}>{result.resumeJSON.certifications.join("  •  ")}</div>
//                     </>}

//                     {/* Achievements */}
//                     {result.resumeJSON.achievements?.length>0 && <>
//                       <div style={{fontWeight:700,fontSize:10,color:"#1e3a5f",letterSpacing:"0.12em",marginBottom:6}}>ACHIEVEMENTS</div>
//                       {result.resumeJSON.achievements.map((a,i)=>(
//                         <div key={i} style={{paddingLeft:12,marginBottom:3,color:"#374151"}}>▸ {a}</div>
//                       ))}
//                     </>}

//                     {/* Legend */}
//                     <div style={{marginTop:20,padding:"10px 12px",borderRadius:8,background:"#fffbeb",border:"1px solid #fde68a",fontSize:10,color:"#92400e"}}>
//                       Legend: <span style={{background:"#fef3c7",padding:"0 4px",borderRadius:3,borderLeft:"2px solid #fde68a"}}>Yellow highlighted bullets</span> = newly added by AI optimiser.
//                       Green project cards = from GitHub or AI-generated.
//                     </div>
//                   </div>
//                 </motion.div>
//               )}

//               {/* Download + Reset buttons */}
//               <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.15}}
//                 style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginTop:8,marginBottom:24}}>
//                 <motion.button whileHover={{scale:1.05,boxShadow:"0 0 40px rgba(5,150,105,0.5)"}} whileTap={{scale:0.97}}
//                   onClick={handleDownload} disabled={downloading}
//                   style={{padding:"15px 40px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#059669,#047857)",
//                     color:"#fff",fontSize:15,fontWeight:800,fontFamily:"'Outfit',sans-serif",cursor:"pointer",
//                     boxShadow:"0 0 24px rgba(5,150,105,0.4)",opacity:downloading?0.7:1}}>
//                   {downloading?"Downloading...":"Download ATS PDF"}
//                 </motion.button>
//                 <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.97}} onClick={reset}
//                   style={{padding:"15px 30px",borderRadius:16,border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.04)",
//                     color:"rgba(200,195,230,0.7)",fontSize:14,fontWeight:700,fontFamily:"'Outfit',sans-serif",cursor:"pointer"}}>
//                   Build Another
//                 </motion.button>
//               </motion.div>
//             </motion.div>
//           )}

//           {/* ── INPUT FORM ──────────────────────────────────── */}
//           {!building && !result && (
//             <motion.div key="form" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>

//               {error && (
//                 <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
//                   style={{padding:"14px 18px",borderRadius:12,marginBottom:16,
//                     background: error.includes("GROQ_API_KEY") || error.includes("GROQ") ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
//                     border: `1px solid ${error.includes("GROQ_API_KEY") || error.includes("GROQ") ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)"}`,
//                     color: error.includes("GROQ_API_KEY") || error.includes("GROQ") ? "#fde68a" : "#fca5a5",
//                     fontFamily:"'DM Sans',sans-serif",fontSize:13}}>
//                   {error.includes("GROQ_API_KEY") || error.includes("GROQ") ? (
//                     <div>
//                       <div style={{fontWeight:700,marginBottom:6}}>⚠️ Server configuration needed</div>
//                       <div>Add <code style={{background:"rgba(0,0,0,0.3)",padding:"2px 6px",borderRadius:4}}>GROQ_API_KEY=your_key</code> to your server <code style={{background:"rgba(0,0,0,0.3)",padding:"2px 6px",borderRadius:4}}>resume-analyzer/server/.env</code> file, then restart the server.</div>
//                       <div style={{marginTop:6,fontSize:11,opacity:0.7}}>Get your key free at groq.com → API Keys</div>
//                     </div>
//                   ) : error}
//                 </motion.div>
//               )}

//               {/* Step 1 — Resume */}
//               <div style={CARD}>
//                 <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#60a5fa",letterSpacing:"0.12em",marginBottom:14}}>STEP 1 — UPLOAD YOUR RESUME (PDF or DOCX)</div>
//                 {!resumeFile ? (
//                   <motion.div whileHover={{borderColor:"rgba(99,102,241,0.5)"}} onClick={()=>resumeRef.current.click()}
//                     style={{borderRadius:14,border:"2px dashed rgba(99,102,241,0.25)",padding:"32px 24px",textAlign:"center",cursor:"pointer",background:"rgba(99,102,241,0.02)",transition:"all 0.2s"}}>
//                     <div style={{fontSize:36,marginBottom:10}}>📄</div>
//                     <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(200,195,230,0.6)"}}>Click to upload PDF or DOCX</div>
//                     <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(200,195,230,0.3)",marginTop:5}}>MAX 10MB</div>
//                     <input ref={resumeRef} type="file" accept=".pdf,.docx,.doc"
//                       onChange={e=>{if(e.target.files[0])onResumeSelect(e.target.files[0]);e.target.value="";}}
//                       style={{display:"none"}}/>
//                   </motion.div>
//                 ) : (
//                   <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:12,background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.25)"}}>
//                     <span style={{fontSize:24}}>📄</span>
//                     <div style={{flex:1}}>
//                       <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:600,fontSize:13,color:"#f1f0ff"}}>{resumeFile.name}</div>
//                       <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#818cf8",marginTop:2}}>{(resumeFile.size/1024).toFixed(1)} KB</div>
//                     </div>
//                     <button onClick={()=>{setResumeFile(null);setAutoGitHub("");setGithubUsername("");}}
//                       style={{width:26,height:26,borderRadius:6,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.1)",color:"#f87171",fontSize:12,cursor:"pointer"}}>✕</button>
//                   </div>
//                 )}
//                 {autoGitHub && (
//                   <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
//                     style={{marginTop:10,padding:"8px 12px",borderRadius:10,background:"rgba(52,211,153,0.07)",border:"1px solid rgba(52,211,153,0.2)",fontSize:12,color:"#34d399",fontFamily:"'DM Sans',sans-serif"}}>
//                     GitHub auto-detected: <strong>@{autoGitHub}</strong> — will be used to enrich your resume
//                   </motion.div>
//                 )}
//               </div>

//               {/* Step 2 — JD text */}
//               <div style={CARD}>
//                 <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#34d399",letterSpacing:"0.12em",marginBottom:14}}>STEP 2 — PASTE JOB DESCRIPTION</div>
//                 <textarea value={jdText} onChange={e=>setJdText(e.target.value.slice(0,4000))}
//                   placeholder="Paste the full job description here — the more detail, the better the resume match..."
//                   style={{width:"100%",minHeight:180,borderRadius:12,padding:"14px 16px",boxSizing:"border-box",
//                     background:"rgba(255,255,255,0.03)",color:"#f1f0ff",fontSize:13,fontFamily:"'DM Sans',sans-serif",
//                     lineHeight:1.7,resize:"vertical",outline:"none",
//                     border:jdText?"1.5px solid rgba(52,211,153,0.35)":"2px dashed rgba(52,211,153,0.2)"}}/>
//                 <div style={{marginTop:6,fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(200,195,230,0.3)"}}>
//                   {jdText.length}/4000 chars
//                 </div>
//               </div>

//               {/* Step 3 — GitHub (optional) */}
//               <div style={CARD}>
//                 <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#f59e0b",letterSpacing:"0.12em",marginBottom:14}}>
//                   STEP 3 — GITHUB USERNAME (OPTIONAL — adds real project data)
//                 </div>
//                 <input type="text" value={githubUsername} onChange={e=>setGithubUsername(e.target.value.trim())}
//                   placeholder="e.g. torvalds"
//                   style={{width:"100%",padding:"12px 16px",borderRadius:12,boxSizing:"border-box",
//                     background:"rgba(245,158,11,0.05)",color:"#f1f0ff",fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none",
//                     border:githubUsername?"1.5px solid rgba(245,158,11,0.4)":"1px solid rgba(245,158,11,0.2)"}}/>
//                 <div style={{marginTop:8,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(245,158,11,0.65)",lineHeight:1.5}}>
//                   {githubUsername
//                     ? `Will scan @${githubUsername}'s real repos and embed actual projects with links`
//                     : "Without GitHub: AI generates impressive realistic projects matching the JD's tech stack. With GitHub: uses your real repos with actual links."}
//                 </div>
//               </div>

//               {/* Build button */}
//               <AnimatePresence>
//                 {canBuild && (
//                   <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{textAlign:"center",marginBottom:24}}>
//                     <motion.button whileHover={{scale:1.05,boxShadow:"0 0 70px rgba(124,58,237,0.7)"}} whileTap={{scale:0.97}}
//                       onClick={handleBuild}
//                       style={{padding:"20px 72px",borderRadius:20,border:"none",background:"linear-gradient(135deg,#7c3aed,#4f46e5,#059669)",
//                         color:"#fff",fontSize:17,fontWeight:900,fontFamily:"'Outfit',sans-serif",cursor:"pointer",
//                         boxShadow:"0 0 40px rgba(124,58,237,0.45)",letterSpacing:"0.05em",position:"relative",overflow:"hidden"}}>
//                       <motion.div animate={{x:["-100%","200%"]}} transition={{duration:2.5,repeat:Infinity}}
//                         style={{position:"absolute",inset:0,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)",pointerEvents:"none"}}/>
//                       BUILD MY ATS RESUME
//                     </motion.button>
//                     <div style={{marginTop:10,fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(167,139,250,0.35)",letterSpacing:"0.1em"}}>
//                       GROQ AI + GITHUB API + SAVED TO MONGODB
//                     </div>
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//               {!canBuild && (
//                 <div style={{textAlign:"center",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(200,195,230,0.3)"}}>
//                   Upload a resume and paste a job description to continue
//                 </div>
//               )}
//             </motion.div>
//           )}

//         </AnimatePresence>
//       </div>

//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
//         textarea::placeholder{color:rgba(200,195,230,0.22);}
//         textarea::-webkit-scrollbar{width:4px;}
//         textarea::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.4);border-radius:2px;}
//         input::placeholder{color:rgba(200,195,230,0.25);}
//         *{box-sizing:border-box;}
//       `}</style>
//     </div>
//   );
// }































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












