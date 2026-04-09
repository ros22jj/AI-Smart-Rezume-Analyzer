import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import * as pdfjsLib from "pdfjs-dist";
import API_BASE from "../config";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// ── Extract text from PDF/DOCX ────────────────────────────────
async function extractText(file) {
  if (!file) return "";
  if (file.type === "application/pdf" || file.name?.endsWith(".pdf")) {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let text  = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const pg = await pdf.getPage(i);
      const ct = await pg.getTextContent();
      text += ct.items.map(x => x.str).join(" ") + "\n";
    }
    return text.trim();
  }
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result);
    r.onerror = rej;
    r.readAsText(file);
  });
}

// ── Simple markdown renderer ──────────────────────────────────
function renderMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`(.+?)`/g,       '<code style="background:rgba(0,0,0,0.2);padding:1px 5px;border-radius:3px;font-size:11px">$1</code>')
    .replace(/^### (.+)$/gm,   '<div style="font-weight:800;font-size:13px;color:#c4b5fd;margin:10px 0 4px">$1</div>')
    .replace(/^## (.+)$/gm,    '<div style="font-weight:800;font-size:14px;color:#a78bfa;margin:12px 0 5px">$1</div>')
    .replace(/^# (.+)$/gm,     '<div style="font-weight:900;font-size:16px;color:#818cf8;margin:14px 0 6px">$1</div>')
    .replace(/^\d+\.\s+(.+)$/gm,'<div style="padding-left:16px;margin:3px 0">● $1</div>')
    .replace(/^[-•]\s+(.+)$/gm, '<div style="padding-left:16px;margin:3px 0">▸ $1</div>')
    .replace(/\n\n/g,           '<br/><br/>')
    .replace(/\n/g,             '<br/>');
}

function scoreColor(v) {
  if (v >= 75) return "#22c55e";
  if (v >= 55) return "#f59e0b";
  if (v >= 35) return "#f97316";
  return "#ef4444";
}

// ── Quick action suggestions ──────────────────────────────────
const QUICK_ACTIONS = [
  "How do I learn the missing skills fast?",
  "What career path suits me best?",
  "How long to be job-ready for this role?",
  "Give me a 3-month learning roadmap",
  "What projects should I build for this JD?",
  "How do I prepare for interviews for this role?",
  "What salary can I expect?",
  "How do I improve my resume for this JD?",
];

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function CareerMentor({ onBack }) {
  const { user } = useUser();

  // ── Setup phase state ──────────────────────────────────────
  const [phase,          setPhase]         = useState("setup"); // "setup"|"chat"
  const [resumeFile,     setResumeFile]    = useState(null);
  const [jdText,         setJdText]        = useState("");
  const [starting,       setStarting]      = useState(false);
  const [setupError,     setSetupError]    = useState("");

  // ── Chat phase state ───────────────────────────────────────
  const [sessionId,      setSessionId]     = useState(null);
  const [insights,       setInsights]      = useState(null);
  const [messages,       setMessages]      = useState([]);
  const [inputText,      setInputText]     = useState("");
  const [sending,        setSending]       = useState(false);
  const [chatError,      setChatError]     = useState("");
  const [downloading,    setDownloading]   = useState(false);
  const [showInsights,   setShowInsights]  = useState(true);

  const resumeRef  = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef   = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // ── Start session ──────────────────────────────────────────
  const handleStart = async () => {
    if (!resumeFile || jdText.trim().length < 20) return;
    setStarting(true);
    setSetupError("");

    try {
      const resumeText = await extractText(resumeFile);
      if (!resumeText || resumeText.trim().length < 50)
        throw new Error("Could not extract text from resume. Try a different file.");

      const res = await fetch(`${API_BASE}/api/mentor/start`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkUserId:    user?.id || "guest",
          userName:       `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
          userEmail:      user?.emailAddresses?.[0]?.emailAddress || "",
          resumeText:     resumeText.slice(0, 5000),
          resumeFileName: resumeFile.name,
          jdText:         jdText.trim().slice(0, 2000),
          groqApiKey:     import.meta.env.VITE_GROQ_API_KEY || "",
        }),
      });

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const raw = await res.text();
        throw new Error("Server error: " + raw.slice(0, 200));
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to start session");

      setSessionId(data.sessionId);
      setInsights(data.insights);
      setMessages([{ role: "assistant", content: data.welcomeMessage, id: Date.now() }]);
      setPhase("chat");

    } catch (e) {
      setSetupError(e.message);
    } finally {
      setStarting(false);
    }
  };

  // ── Send message ───────────────────────────────────────────
  const handleSend = useCallback(async (msgText) => {
    const text = (msgText || inputText).trim();
    if (!text || sending) return;

    const userMsg = { role: "user", content: text, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setSending(true);
    setChatError("");

    try {
      const res = await fetch(`${API_BASE}/api/mentor/chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message:    text,
          groqApiKey: import.meta.env.VITE_GROQ_API_KEY || "",
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to get response");

      setMessages(prev => [...prev, { role: "assistant", content: data.reply, id: Date.now() + 1 }]);
    } catch (e) {
      setChatError(e.message);
      // Remove the user message if it failed
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [inputText, sending, sessionId]);

  // ── Download PDF ───────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!sessionId) return;
    setDownloading(true);
    try {
      const res = await fetch(`${API_BASE}/api/mentor/pdf/${sessionId}`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `Career_Mentorship_${new Date().toISOString().slice(0,10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("PDF download failed: " + e.message);
    } finally {
      setDownloading(false);
    }
  };

  const reset = () => {
    setPhase("setup"); setResumeFile(null); setJdText(""); setSessionId(null);
    setInsights(null); setMessages([]); setSetupError(""); setChatError("");
  };

  // ── Colours & style helpers ────────────────────────────────
  const BG = "linear-gradient(145deg,#06040f 0%,#0e0720 40%,#060c1c 100%)";

  // ══════════════════════════════════════════════════════════
  // SETUP PHASE
  // ══════════════════════════════════════════════════════════
  if (phase === "setup") {
    return (
      <div style={{ minHeight:"100vh", background:BG, padding:"40px 24px", position:"relative", overflowX:"hidden" }}>
        <div style={{ position:"fixed", width:600, height:600, borderRadius:"50%", top:"-20%", left:"-10%", background:"radial-gradient(circle,rgba(139,92,246,0.2) 0%,transparent 70%)", filter:"blur(80px)", pointerEvents:"none" }} />
        <div style={{ position:"fixed", width:500, height:500, borderRadius:"50%", bottom:"-15%", right:"-5%", background:"radial-gradient(circle,rgba(16,185,129,0.15) 0%,transparent 70%)", filter:"blur(70px)", pointerEvents:"none" }} />

        <div style={{ maxWidth:680, margin:"0 auto", position:"relative", zIndex:1 }}>

          {/* Header */}
          <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} style={{textAlign:"center",marginBottom:32}}>
            <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",bounce:0.5}}
              style={{width:70,height:70,borderRadius:20,margin:"0 auto 14px",background:"linear-gradient(135deg,#7c3aed,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,boxShadow:"0 0 50px rgba(124,58,237,0.5)"}}>🧠</motion.div>
            <h1 style={{fontFamily:"'Outfit',sans-serif",fontWeight:900,fontSize:"clamp(22px,4vw,32px)",color:"#f1f0ff",marginBottom:6}}>AI Career Mentor</h1>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(200,195,230,0.55)",maxWidth:480,margin:"0 auto"}}>
              Upload your resume + paste the job description. Your personal AI mentor will analyze the gap, teach missing skills, and guide your career path — with unlimited chat.
            </p>
            {onBack && (
              <motion.button whileHover={{scale:1.05}} onClick={onBack}
                style={{marginTop:12,padding:"6px 16px",borderRadius:10,cursor:"pointer",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(200,195,230,0.5)",fontFamily:"'Outfit',sans-serif",fontSize:12}}>← Back</motion.button>
            )}
          </motion.div>

          {/* What you'll get */}
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
            style={{padding:"16px 20px",borderRadius:16,background:"rgba(124,58,237,0.06)",border:"1px solid rgba(124,58,237,0.15)",marginBottom:24}}>
            <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:13,color:"#a78bfa",marginBottom:10}}>🎯 What your AI Mentor does</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:8}}>
              {[
                {icon:"🔍", text:"Identifies exact skills you're missing for this JD"},
                {icon:"📚", text:"Teaches each skill with resources + project ideas"},
                {icon:"🗺️", text:"Maps realistic career paths with timelines"},
                {icon:"💬", text:"Unlimited chat — ask anything about your career"},
                {icon:"🎯", text:"Interview prep specific to this role"},
                {icon:"📥", text:"Download full chat as PDF report"},
              ].map((item,i) => (
                <div key={i} style={{display:"flex",gap:8,padding:"8px 10px",borderRadius:10,background:"rgba(255,255,255,0.02)"}}>
                  <span style={{fontSize:16}}>{item.icon}</span>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(200,195,230,0.7)",lineHeight:1.5}}>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Error */}
          {setupError && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}}
              style={{padding:"12px 16px",borderRadius:12,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",color:"#fca5a5",fontFamily:"'DM Sans',sans-serif",fontSize:13,marginBottom:16}}>
              ❌ {setupError}
            </motion.div>
          )}

          {/* Step 1 — Resume */}
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.15}}
            style={{padding:"20px",borderRadius:20,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",marginBottom:16}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#60a5fa",letterSpacing:"0.12em",marginBottom:12}}>STEP 1 — UPLOAD YOUR RESUME (PDF or DOCX)</div>
            {!resumeFile ? (
              <motion.div whileHover={{borderColor:"rgba(99,102,241,0.5)"}} onClick={()=>resumeRef.current.click()}
                style={{borderRadius:12,border:"2px dashed rgba(99,102,241,0.2)",padding:"28px",textAlign:"center",cursor:"pointer",background:"rgba(99,102,241,0.02)",transition:"all 0.2s"}}>
                <div style={{fontSize:32,marginBottom:8}}>📄</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(200,195,230,0.6)"}}>Click to upload PDF or DOCX</div>
                <input ref={resumeRef} type="file" accept=".pdf,.docx,.doc"
                  onChange={e=>{if(e.target.files[0])setResumeFile(e.target.files[0]);e.target.value="";}}
                  style={{display:"none"}}/>
              </motion.div>
            ) : (
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:12,background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.25)"}}>
                <span style={{fontSize:24}}>📄</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:600,fontSize:13,color:"#f1f0ff"}}>{resumeFile.name}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#818cf8",marginTop:2}}>{(resumeFile.size/1024).toFixed(1)} KB</div>
                </div>
                <button onClick={()=>setResumeFile(null)}
                  style={{width:26,height:26,borderRadius:6,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.1)",color:"#f87171",fontSize:12,cursor:"pointer"}}>✕</button>
              </div>
            )}
          </motion.div>

          {/* Step 2 — JD */}
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
            style={{padding:"20px",borderRadius:20,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",marginBottom:24}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#34d399",letterSpacing:"0.12em",marginBottom:12}}>STEP 2 — PASTE JOB DESCRIPTION</div>
            <textarea value={jdText} onChange={e=>setJdText(e.target.value.slice(0,3000))}
              placeholder="Paste the full job description here — required skills, responsibilities, company info..."
              style={{width:"100%",minHeight:160,borderRadius:12,padding:"14px 16px",boxSizing:"border-box",
                background:"rgba(255,255,255,0.03)",color:"#f1f0ff",fontSize:13,fontFamily:"'DM Sans',sans-serif",
                lineHeight:1.7,resize:"vertical",outline:"none",
                border:jdText?"1.5px solid rgba(52,211,153,0.35)":"2px dashed rgba(52,211,153,0.2)"}}/>
            <div style={{marginTop:5,fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(200,195,230,0.3)"}}>{jdText.length}/3000</div>
          </motion.div>

          {/* Start button */}
          <AnimatePresence>
            {resumeFile && jdText.trim().length >= 20 && (
              <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{textAlign:"center"}}>
                <motion.button whileHover={{scale:1.05,boxShadow:"0 0 70px rgba(124,58,237,0.7)"}} whileTap={{scale:0.97}}
                  onClick={handleStart} disabled={starting}
                  style={{padding:"20px 72px",borderRadius:20,border:"none",background:"linear-gradient(135deg,#7c3aed,#4f46e5,#059669)",
                    color:"#fff",fontSize:17,fontWeight:900,fontFamily:"'Outfit',sans-serif",cursor:starting?"wait":"pointer",
                    boxShadow:"0 0 40px rgba(124,58,237,0.45)",letterSpacing:"0.05em",position:"relative",overflow:"hidden",opacity:starting?0.8:1}}>
                  {starting ? (
                    <span style={{display:"flex",alignItems:"center",gap:10,justifyContent:"center"}}>
                      <motion.span animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:"linear"}}
                        style={{display:"inline-block",fontSize:18}}>⚙️</motion.span>
                      Analyzing Resume...
                    </span>
                  ) : "🧠 START MENTORSHIP SESSION"}
                </motion.button>
                <div style={{marginTop:10,fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(167,139,250,0.35)",letterSpacing:"0.1em"}}>
                  GROQ AI · UNLIMITED CHAT · SAVED TO MONGODB
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {(!resumeFile || jdText.trim().length < 20) && (
            <div style={{textAlign:"center",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(200,195,230,0.3)"}}>
              Upload a resume and paste a job description to begin
            </div>
          )}
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
          textarea::placeholder{color:rgba(200,195,230,0.22);}
          *{box-sizing:border-box;}
        `}</style>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // CHAT PHASE
  // ══════════════════════════════════════════════════════════
  return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",position:"relative"}}>
      <div style={{position:"fixed",width:500,height:500,borderRadius:"50%",top:"-15%",left:"-8%",background:"radial-gradient(circle,rgba(124,58,237,0.15) 0%,transparent 70%)",filter:"blur(80px)",pointerEvents:"none"}}/>
      <div style={{position:"fixed",width:400,height:400,borderRadius:"50%",bottom:"-10%",right:"-5%",background:"radial-gradient(circle,rgba(5,150,105,0.12) 0%,transparent 70%)",filter:"blur(70px)",pointerEvents:"none"}}/>

      {/* ── TOP BAR ── */}
      <div style={{position:"sticky",top:0,zIndex:50,background:"rgba(6,4,15,0.85)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>

        {/* Left: title + back */}
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {onBack && (
            <button onClick={reset}
              style={{padding:"6px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"rgba(200,195,230,0.6)",fontFamily:"'Outfit',sans-serif",fontSize:11,cursor:"pointer"}}>← Back</button>
          )}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20}}>🧠</span>
            <div>
              <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:14,color:"#f1f0ff"}}>AI Career Mentor</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#34d399"}}>
                {insights?.targetRole} · {messages.length} messages
              </div>
            </div>
          </div>
        </div>

        {/* Right: fit score + buttons */}
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {insights && (
            <div style={{padding:"6px 14px",borderRadius:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",textAlign:"center"}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"rgba(200,195,230,0.4)"}}>JD FIT</div>
              <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:900,fontSize:18,color:scoreColor(insights.overallFitScore||0)}}>{insights.overallFitScore||0}<span style={{fontSize:10}}>/100</span></div>
            </div>
          )}
          <button onClick={()=>setShowInsights(s=>!s)}
            style={{padding:"7px 12px",borderRadius:10,border:"1px solid rgba(124,58,237,0.3)",background:showInsights?"rgba(124,58,237,0.15)":"rgba(255,255,255,0.04)",color:showInsights?"#a78bfa":"rgba(200,195,230,0.5)",fontFamily:"'DM Mono',monospace",fontSize:10,cursor:"pointer"}}>
            {showInsights?"Hide":"Show"} Insights
          </button>
          <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.97}}
            onClick={handleDownloadPDF} disabled={downloading}
            style={{padding:"7px 14px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#059669,#047857)",color:"#fff",fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:11,cursor:"pointer",opacity:downloading?0.7:1}}>
            {downloading?"⏳...":"📥 PDF"}
          </motion.button>
          <button onClick={reset}
            style={{padding:"7px 12px",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"rgba(200,195,230,0.5)",fontFamily:"'DM Mono',monospace",fontSize:10,cursor:"pointer"}}>
            New Session
          </button>
        </div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden",maxHeight:"calc(100vh - 70px)"}}>

        {/* ── INSIGHTS SIDEBAR ── */}
        <AnimatePresence>
          {showInsights && insights && (
            <motion.div initial={{width:0,opacity:0}} animate={{width:280,opacity:1}} exit={{width:0,opacity:0}}
              transition={{duration:0.3}} style={{overflow:"hidden",borderRight:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.01)",flexShrink:0}}>
              <div style={{width:280,height:"100%",overflowY:"auto",padding:"16px"}}>

                {/* Fit score */}
                <div style={{padding:"14px",borderRadius:14,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",marginBottom:14,textAlign:"center"}}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(200,195,230,0.4)",marginBottom:4}}>CURRENT JD FIT</div>
                  <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:900,fontSize:42,color:scoreColor(insights.overallFitScore||0),lineHeight:1}}>{insights.overallFitScore||0}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(200,195,230,0.3)"}}>/100</div>
                  <div style={{marginTop:8,height:6,borderRadius:3,background:"rgba(255,255,255,0.05)",overflow:"hidden"}}>
                    <motion.div initial={{width:0}} animate={{width:`${insights.overallFitScore||0}%`}} transition={{duration:1,ease:"easeOut"}}
                      style={{height:"100%",borderRadius:3,background:scoreColor(insights.overallFitScore||0)}}/>
                  </div>
                  {insights.experienceLevel && (
                    <div style={{marginTop:8,fontFamily:"'DM Mono',monospace",fontSize:9,padding:"3px 10px",borderRadius:100,background:"rgba(124,58,237,0.15)",color:"#a78bfa",display:"inline-block"}}>{insights.experienceLevel}</div>
                  )}
                </div>

                {/* Missing skills */}
                {insights.missingSkills?.length > 0 && (
                  <div style={{marginBottom:14}}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#ef4444",letterSpacing:"0.1em",marginBottom:8}}>SKILLS TO LEARN</div>
                    {insights.missingSkills.slice(0,8).map((s,i) => (
                      <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:8,background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.15)",marginBottom:5}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:"#ef4444",flexShrink:0}}/>
                        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(200,195,230,0.8)"}}>{s}</span>
                        <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                          onClick={()=>handleSend(`How do I learn ${s}? Give me resources and a project idea.`)}
                          style={{marginLeft:"auto",fontSize:9,padding:"2px 7px",borderRadius:6,border:"none",background:"rgba(239,68,68,0.2)",color:"#fca5a5",cursor:"pointer",flexShrink:0}}>Ask</motion.button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Present skills */}
                {insights.presentSkills?.length > 0 && (
                  <div style={{marginBottom:14}}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#34d399",letterSpacing:"0.1em",marginBottom:8}}>SKILLS YOU HAVE</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {insights.presentSkills.slice(0,10).map((s,i) => (
                        <span key={i} style={{fontSize:10,padding:"3px 9px",borderRadius:100,background:"rgba(52,211,153,0.1)",color:"#34d399",border:"1px solid rgba(52,211,153,0.2)",fontFamily:"'DM Mono',monospace"}}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Career paths */}
                {insights.careerPaths?.length > 0 && (
                  <div style={{marginBottom:14}}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#a78bfa",letterSpacing:"0.1em",marginBottom:8}}>CAREER PATHS</div>
                    {insights.careerPaths.map((p,i) => (
                      <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:8,background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.15)",marginBottom:5}}>
                        <span style={{fontSize:14}}>🗺️</span>
                        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(200,195,230,0.8)"}}>{p}</span>
                        <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                          onClick={()=>handleSend(`Tell me more about the ${p} career path and how I can get there.`)}
                          style={{marginLeft:"auto",fontSize:9,padding:"2px 7px",borderRadius:6,border:"none",background:"rgba(124,58,237,0.2)",color:"#c4b5fd",cursor:"pointer",flexShrink:0}}>Ask</motion.button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Time to ready */}
                {insights.estimatedTimeToReady && (
                  <div style={{padding:"10px 12px",borderRadius:10,background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)"}}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#f59e0b",marginBottom:4}}>EST. TIME TO JOB-READY</div>
                    <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:13,color:"#fde68a"}}>{insights.estimatedTimeToReady}</div>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CHAT AREA ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"20px",display:"flex",flexDirection:"column",gap:14}}>

            {messages.map((msg, i) => (
              <motion.div key={msg.id || i} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
                style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",maxWidth:"100%"}}>
                <div style={{
                  maxWidth:msg.role==="user"?"70%":"85%",
                  padding:"12px 16px",
                  borderRadius: msg.role==="user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role==="user"
                    ? "linear-gradient(135deg,#4f46e5,#7c3aed)"
                    : "rgba(255,255,255,0.04)",
                  border: msg.role==="user" ? "none" : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: msg.role==="user" ? "0 4px 20px rgba(99,102,241,0.3)" : "none",
                }}>
                  {msg.role === "assistant" && (
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                      <div style={{width:22,height:22,borderRadius:6,background:"linear-gradient(135deg,#7c3aed,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>🧠</div>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#a78bfa",letterSpacing:"0.1em"}}>AI MENTOR</span>
                    </div>
                  )}
                  <div
                    style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#f1f0ff",lineHeight:1.65}}
                    dangerouslySetInnerHTML={{__html: renderMarkdown(msg.content)}}
                  />
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {sending && (
              <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                style={{display:"flex",justifyContent:"flex-start"}}>
                <div style={{padding:"12px 18px",borderRadius:"18px 18px 18px 4px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:22,height:22,borderRadius:6,background:"linear-gradient(135deg,#7c3aed,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>🧠</div>
                  <div style={{display:"flex",gap:4,alignItems:"center"}}>
                    {[0,1,2].map(i => (
                      <motion.div key={i} animate={{y:[-3,3,-3]}} transition={{duration:0.6,repeat:Infinity,delay:i*0.15}}
                        style={{width:6,height:6,borderRadius:"50%",background:"#a78bfa"}}/>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {chatError && (
              <div style={{textAlign:"center",padding:"8px 14px",borderRadius:10,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",color:"#fca5a5",fontFamily:"'DM Sans',sans-serif",fontSize:12}}>
                ❌ {chatError}
              </div>
            )}

            <div ref={chatEndRef}/>
          </div>

          {/* Quick actions */}
          {messages.length <= 2 && (
            <div style={{padding:"0 20px 10px",display:"flex",gap:6,flexWrap:"wrap"}}>
              {QUICK_ACTIONS.map((q,i) => (
                <motion.button key={i} whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                  onClick={()=>handleSend(q)} disabled={sending}
                  style={{padding:"6px 12px",borderRadius:20,border:"1px solid rgba(124,58,237,0.3)",background:"rgba(124,58,237,0.08)",color:"#a78bfa",fontFamily:"'DM Sans',sans-serif",fontSize:11,cursor:"pointer",transition:"all 0.2s"}}>
                  {q}
                </motion.button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div style={{padding:"14px 20px",borderTop:"1px solid rgba(255,255,255,0.07)",background:"rgba(6,4,15,0.6)",backdropFilter:"blur(20px)"}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-end",maxWidth:900,margin:"0 auto"}}>
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={e=>setInputText(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();}}}
                placeholder="Ask your mentor anything... (Enter to send, Shift+Enter for new line)"
                rows={1}
                style={{flex:1,padding:"12px 16px",borderRadius:14,background:"rgba(255,255,255,0.05)",
                  border:"1px solid rgba(255,255,255,0.1)",color:"#f1f0ff",fontSize:13,fontFamily:"'DM Sans',sans-serif",
                  resize:"none",outline:"none",lineHeight:1.5,maxHeight:120,overflowY:"auto",
                  transition:"border-color 0.2s"}}
                onFocus={e=>e.target.style.borderColor="rgba(124,58,237,0.5)"}
                onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.1)"}
              />
              <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.97}}
                onClick={()=>handleSend()} disabled={sending||!inputText.trim()}
                style={{width:46,height:46,borderRadius:14,border:"none",
                  background: inputText.trim() ? "linear-gradient(135deg,#7c3aed,#059669)" : "rgba(255,255,255,0.05)",
                  color:"#fff",fontSize:18,cursor:inputText.trim()?"pointer":"default",
                  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                  boxShadow:inputText.trim()?"0 4px 20px rgba(124,58,237,0.4)":"none",
                  transition:"all 0.2s"}}>
                {sending ? (
                  <motion.span animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:"linear"}} style={{display:"inline-block",fontSize:16}}>⚙️</motion.span>
                ) : "↑"}
              </motion.button>
            </div>
            <div style={{textAlign:"center",marginTop:6,fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(200,195,230,0.25)"}}>
              Enter to send · Shift+Enter for new line · Unlimited messages
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.4);border-radius:2px;}
        ::-webkit-scrollbar-track{background:transparent;}
        textarea::placeholder{color:rgba(200,195,230,0.22);}
        *{box-sizing:border-box;}
      `}</style>
    </div>
  );
}









