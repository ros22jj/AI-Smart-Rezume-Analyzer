import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import * as pdfjsLib from "pdfjs-dist";
import API_BASE from "../config";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// ── PDF / DOCX text extraction ────────────────────────────────
async function extractText(file) {
  if (!file) return "";
  if (file.type === "application/pdf" || file.name?.endsWith(".pdf")) {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const pg = await pdf.getPage(i);
      const ct = await pg.getTextContent();
      text += ct.items.map(x => x.str).join(" ") + "\n";
    }
    return text.trim();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// ── Markdown renderer ─────────────────────────────────────────
function Markdown({ text }) {
  const html = (text || "")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,     "<em>$1</em>")
    .replace(/`(.+?)`/g,       '<code style="background:rgba(0,0,0,0.25);padding:1px 5px;border-radius:3px;font-size:11px;font-family:monospace">$1</code>')
    .replace(/^### (.+)$/gm,   '<div style="font-weight:800;font-size:13px;color:#c4b5fd;margin:10px 0 4px">$1</div>')
    .replace(/^## (.+)$/gm,    '<div style="font-weight:800;font-size:14px;color:#a78bfa;margin:12px 0 5px">$1</div>')
    .replace(/^# (.+)$/gm,     '<div style="font-weight:900;font-size:15px;color:#818cf8;margin:14px 0 6px">$1</div>')
    .replace(/^\d+\. (.+)$/gm, '<div style="padding-left:14px;margin:3px 0">$1</div>')
    .replace(/^[-•▸] (.+)$/gm, '<div style="padding-left:14px;margin:3px 0">▸ $1</div>')
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g,   "<br/>");
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

// ── Score colour ──────────────────────────────────────────────
function sc(v) {
  if (v >= 75) return "#22c55e";
  if (v >= 55) return "#f59e0b";
  if (v >= 35) return "#f97316";
  return "#ef4444";
}

const QUICK = [
  "How do I learn the missing skills fast?",
  "Give me a 3-month learning roadmap",
  "What career path suits me best?",
  "How long to be job-ready for this role?",
  "What projects should I build for this JD?",
  "How should I prepare for interviews?",
  "What salary can I expect for this role?",
  "How do I improve my resume for this JD?",
];

// ═════════════════════════════════════════════════════════════
export default function CareerMentor({ onBack }) {
  const { user } = useUser();

  // Setup
  const [resumeFile,   setResumeFile]   = useState(null);
  const [jdText,       setJdText]       = useState("");
  const [starting,     setStarting]     = useState(false);
  const [setupError,   setSetupError]   = useState("");

  // Chat
  const [phase,        setPhase]        = useState("setup");
  const [sessionId,    setSessionId]    = useState(null);
  const [insights,     setInsights]     = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [inputText,    setInputText]    = useState("");
  const [sending,      setSending]      = useState(false);
  const [chatError,    setChatError]    = useState("");
  const [downloading,  setDownloading]  = useState(false);
  const [showPanel,    setShowPanel]    = useState(true);

  const resumeRef  = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // ── START SESSION ─────────────────────────────────────────
  const handleStart = async () => {
    if (!resumeFile || jdText.trim().length < 20) return;
    setStarting(true);
    setSetupError("");

    let resumeText = "";
    try {
      resumeText = await extractText(resumeFile);
    } catch (e) {
      setSetupError("Could not read resume file: " + e.message);
      setStarting(false);
      return;
    }

    if (resumeText.trim().length < 50) {
      setSetupError("Resume appears empty. Please try a different file.");
      setStarting(false);
      return;
    }

    try {
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
      setMessages([{ role: "assistant", content: data.welcomeMessage, id: 1 }]);
      setPhase("chat");

    } catch (e) {
      setSetupError(e.message);
    } finally {
      setStarting(false);
    }
  };

  // ── SEND MESSAGE ──────────────────────────────────────────
  const handleSend = async (overrideText) => {
    const text = (overrideText || inputText).trim();
    if (!text || sending || !sessionId) return;

    const msgId  = Date.now();
    const newMsg = { role: "user", content: text, id: msgId };

    setMessages(prev => [...prev, newMsg]);
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

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const raw = await res.text();
        throw new Error("Server error: " + raw.slice(0, 200));
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "No response from mentor");

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.reply, id: Date.now() },
      ]);
    } catch (e) {
      setChatError(e.message);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  };

  // ── DOWNLOAD PDF ──────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!sessionId || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(`${API_BASE}/api/mentor/pdf/${sessionId}`);
      if (!res.ok) throw new Error("Server returned " + res.status);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `Career_Mentor_Chat_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("PDF download failed: " + e.message);
    } finally {
      setDownloading(false);
    }
  };

  const reset = () => {
    setPhase("setup");
    setResumeFile(null);
    setJdText("");
    setSessionId(null);
    setInsights(null);
    setMessages([]);
    setSetupError("");
    setChatError("");
    setInputText("");
  };

  const BG = "linear-gradient(145deg,#06040f 0%,#0e0720 40%,#060c1c 100%)";
  const CARD = {
    padding: "20px",
    borderRadius: 20,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.07)",
    marginBottom: 16,
  };

  // ═════════════════════════════════════════════════════════
  // SETUP SCREEN
  // ═════════════════════════════════════════════════════════
  if (phase === "setup") {
    return (
      <div style={{ minHeight:"100vh", background:BG, padding:"40px 24px", position:"relative", overflowX:"hidden" }}>
        <div style={{ position:"fixed", width:600, height:600, borderRadius:"50%", top:"-20%", left:"-10%", background:"radial-gradient(circle,rgba(139,92,246,0.18) 0%,transparent 70%)", filter:"blur(80px)", pointerEvents:"none" }} />
        <div style={{ position:"fixed", width:500, height:500, borderRadius:"50%", bottom:"-15%", right:"-5%", background:"radial-gradient(circle,rgba(16,185,129,0.13) 0%,transparent 70%)", filter:"blur(70px)", pointerEvents:"none" }} />

        <div style={{ maxWidth:660, margin:"0 auto", position:"relative", zIndex:1 }}>

          {/* Header */}
          <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} style={{textAlign:"center",marginBottom:28}}>
            <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",bounce:0.5}}
              style={{width:68,height:68,borderRadius:20,margin:"0 auto 14px",background:"linear-gradient(135deg,#7c3aed,#059669)",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,boxShadow:"0 0 50px rgba(124,58,237,0.5)"}}>🧠</motion.div>
            <h1 style={{fontFamily:"'Outfit',sans-serif",fontWeight:900,fontSize:"clamp(22px,4vw,32px)",color:"#f1f0ff",marginBottom:6}}>AI Career Mentor</h1>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(200,195,230,0.55)",maxWidth:460,margin:"0 auto"}}>
              Upload your resume + paste the job description. Your AI mentor will identify skill gaps, teach you what's missing, map career paths — with unlimited chat.
            </p>
            {onBack && (
              <motion.button whileHover={{scale:1.04}} onClick={onBack}
                style={{marginTop:12,padding:"6px 16px",borderRadius:10,cursor:"pointer",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(200,195,230,0.5)",fontFamily:"'Outfit',sans-serif",fontSize:12}}>← Back</motion.button>
            )}
          </motion.div>

          {/* What it does */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
            style={{padding:"14px 18px",borderRadius:16,background:"rgba(124,58,237,0.06)",border:"1px solid rgba(124,58,237,0.14)",marginBottom:20}}>
            <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:12,color:"#a78bfa",marginBottom:10}}>What your AI Mentor does</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:8}}>
              {[
                {i:"🔍",t:"Finds exact skills you're missing for this JD"},
                {i:"📚",t:"Teaches each skill with resources + project ideas"},
                {i:"🗺️",t:"Maps realistic career paths with timelines"},
                {i:"💬",t:"Unlimited chat — ask anything about your career"},
                {i:"🎯",t:"Interview prep specific to this role"},
                {i:"📥",t:"Download full chat as PDF report"},
              ].map((x,i) => (
                <div key={i} style={{display:"flex",gap:8,padding:"8px 10px",borderRadius:10,background:"rgba(255,255,255,0.02)"}}>
                  <span style={{fontSize:15,flexShrink:0}}>{x.i}</span>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(200,195,230,0.7)",lineHeight:1.5}}>{x.t}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {setupError && (
              <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                style={{padding:"12px 16px",borderRadius:12,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",color:"#fca5a5",fontFamily:"'DM Sans',sans-serif",fontSize:13,marginBottom:14}}>
                ❌ {setupError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 1 — Resume */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.15}} style={CARD}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#60a5fa",letterSpacing:"0.12em",marginBottom:12}}>STEP 1 — UPLOAD YOUR RESUME (PDF or DOCX)</div>
            {!resumeFile ? (
              <div onClick={() => resumeRef.current?.click()}
                style={{borderRadius:12,border:"2px dashed rgba(99,102,241,0.22)",padding:"28px",textAlign:"center",cursor:"pointer",background:"rgba(99,102,241,0.02)",transition:"border-color 0.2s"}}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.45)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.22)"}>
                <div style={{fontSize:30,marginBottom:8}}>📄</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(200,195,230,0.6)"}}>Click to upload PDF or DOCX</div>
                <input ref={resumeRef} type="file" accept=".pdf,.docx,.doc"
                  onChange={e => { if (e.target.files[0]) setResumeFile(e.target.files[0]); e.target.value = ""; }}
                  style={{display:"none"}} />
              </div>
            ) : (
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:12,background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.25)"}}>
                <span style={{fontSize:22}}>📄</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:600,fontSize:13,color:"#f1f0ff"}}>{resumeFile.name}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#818cf8",marginTop:2}}>{(resumeFile.size/1024).toFixed(1)} KB</div>
                </div>
                <button onClick={() => setResumeFile(null)}
                  style={{width:26,height:26,borderRadius:6,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.1)",color:"#f87171",fontSize:12,cursor:"pointer"}}>✕</button>
              </div>
            )}
          </motion.div>

          {/* Step 2 — JD */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.2}} style={CARD}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#34d399",letterSpacing:"0.12em",marginBottom:12}}>STEP 2 — PASTE JOB DESCRIPTION</div>
            <textarea value={jdText} onChange={e => setJdText(e.target.value.slice(0,3000))}
              placeholder="Paste the full job description here..."
              style={{width:"100%",minHeight:160,borderRadius:12,padding:"14px 16px",boxSizing:"border-box",
                background:"rgba(255,255,255,0.03)",color:"#f1f0ff",fontSize:13,fontFamily:"'DM Sans',sans-serif",
                lineHeight:1.7,resize:"vertical",outline:"none",
                border:jdText?"1.5px solid rgba(52,211,153,0.35)":"2px dashed rgba(52,211,153,0.2)"}} />
            <div style={{marginTop:4,fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(200,195,230,0.28)"}}>{jdText.length}/3000</div>
          </motion.div>

          {/* Start button */}
          <div style={{textAlign:"center",marginTop:8}}>
            {resumeFile && jdText.trim().length >= 20 ? (
              <motion.button
                whileHover={{scale:1.04,boxShadow:"0 0 60px rgba(124,58,237,0.65)"}}
                whileTap={{scale:0.97}}
                onClick={handleStart}
                disabled={starting}
                style={{padding:"18px 64px",borderRadius:18,border:"none",
                  background:"linear-gradient(135deg,#7c3aed,#4f46e5,#059669)",
                  color:"#fff",fontSize:16,fontWeight:900,fontFamily:"'Outfit',sans-serif",
                  cursor:starting?"wait":"pointer",boxShadow:"0 0 36px rgba(124,58,237,0.4)",
                  letterSpacing:"0.05em",opacity:starting?0.85:1,position:"relative",overflow:"hidden"}}>
                {starting ? (
                  <span style={{display:"flex",alignItems:"center",gap:10,justifyContent:"center"}}>
                    <motion.span animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:"linear"}} style={{display:"inline-block"}}>⚙️</motion.span>
                    Analyzing your resume...
                  </span>
                ) : "🧠 START MENTORSHIP SESSION"}
              </motion.button>
            ) : (
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(200,195,230,0.3)"}}>
                Upload a resume and paste a job description to begin
              </div>
            )}
          </div>
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
          textarea::placeholder{color:rgba(200,195,230,0.22);}
          *{box-sizing:border-box;}
        `}</style>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════
  // CHAT SCREEN
  // ═════════════════════════════════════════════════════════
  return (
    <div style={{height:"100vh",background:BG,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{position:"fixed",width:500,height:500,borderRadius:"50%",top:"-15%",left:"-8%",background:"radial-gradient(circle,rgba(124,58,237,0.14) 0%,transparent 70%)",filter:"blur(80px)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",width:400,height:400,borderRadius:"50%",bottom:"-10%",right:"-5%",background:"radial-gradient(circle,rgba(5,150,105,0.11) 0%,transparent 70%)",filter:"blur(70px)",pointerEvents:"none",zIndex:0}}/>

      {/* ── TOPBAR ── */}
      <div style={{flexShrink:0,position:"relative",zIndex:10,background:"rgba(6,4,15,0.9)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"10px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={reset}
            style={{padding:"5px 11px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"rgba(200,195,230,0.55)",fontFamily:"'Outfit',sans-serif",fontSize:11,cursor:"pointer"}}>← Back</button>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <span style={{fontSize:18}}>🧠</span>
            <div>
              <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:13,color:"#f1f0ff"}}>AI Career Mentor</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#34d399"}}>{insights?.targetRole || "Career Session"} · {messages.length} messages</div>
            </div>
          </div>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {insights && (
            <div style={{padding:"5px 12px",borderRadius:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",textAlign:"center"}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"rgba(200,195,230,0.4)"}}>JD FIT</div>
              <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:900,fontSize:16,color:sc(insights.overallFitScore||0),lineHeight:1.1}}>{insights.overallFitScore||0}<span style={{fontSize:9}}>/100</span></div>
            </div>
          )}
          <button onClick={() => setShowPanel(p => !p)}
            style={{padding:"6px 11px",borderRadius:9,border:`1px solid rgba(124,58,237,${showPanel?0.4:0.2})`,background:showPanel?"rgba(124,58,237,0.14)":"rgba(255,255,255,0.04)",color:showPanel?"#a78bfa":"rgba(200,195,230,0.5)",fontFamily:"'DM Mono',monospace",fontSize:10,cursor:"pointer"}}>
            {showPanel?"Hide":"Insights"}
          </button>
          <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.97}}
            onClick={handleDownloadPDF} disabled={downloading}
            style={{padding:"6px 13px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#059669,#047857)",color:"#fff",fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:11,cursor:downloading?"wait":"pointer",opacity:downloading?0.7:1}}>
            {downloading ? "⏳..." : "📥 PDF"}
          </motion.button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{flex:1,display:"flex",overflow:"hidden",position:"relative",zIndex:1}}>

        {/* Insights Panel */}
        <AnimatePresence>
          {showPanel && insights && (
            <motion.div initial={{width:0,opacity:0}} animate={{width:272,opacity:1}} exit={{width:0,opacity:0}} transition={{duration:0.25}}
              style={{flexShrink:0,borderRight:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.01)",overflow:"hidden"}}>
              <div style={{width:272,height:"100%",overflowY:"auto",padding:"14px"}}>

                {/* Fit score gauge */}
                <div style={{padding:"12px",borderRadius:14,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",marginBottom:12,textAlign:"center"}}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"rgba(200,195,230,0.35)",marginBottom:4}}>JD FIT SCORE</div>
                  <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:900,fontSize:40,color:sc(insights.overallFitScore||0),lineHeight:1}}>{insights.overallFitScore||0}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"rgba(200,195,230,0.3)"}}>/100</div>
                  <div style={{margin:"8px 0 4px",height:5,borderRadius:3,background:"rgba(255,255,255,0.05)",overflow:"hidden"}}>
                    <motion.div initial={{width:0}} animate={{width:`${insights.overallFitScore||0}%`}} transition={{duration:1,ease:"easeOut"}}
                      style={{height:"100%",background:sc(insights.overallFitScore||0),borderRadius:3}}/>
                  </div>
                  {insights.experienceLevel && (
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,padding:"2px 8px",borderRadius:100,background:"rgba(124,58,237,0.15)",color:"#a78bfa"}}>{insights.experienceLevel}</span>
                  )}
                  {insights.estimatedTimeToReady && (
                    <div style={{marginTop:8,padding:"6px 8px",borderRadius:8,background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.18)"}}>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#f59e0b",marginBottom:2}}>TIME TO JOB-READY</div>
                      <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:12,color:"#fde68a"}}>{insights.estimatedTimeToReady}</div>
                    </div>
                  )}
                </div>

                {/* Missing skills */}
                {insights.missingSkills?.length > 0 && (
                  <div style={{marginBottom:12}}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#ef4444",letterSpacing:"0.1em",marginBottom:7}}>SKILLS TO LEARN</div>
                    {insights.missingSkills.slice(0,8).map((s,i) => (
                      <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",borderRadius:7,background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.13)",marginBottom:4}}>
                        <div style={{width:5,height:5,borderRadius:"50%",background:"#ef4444",flexShrink:0}}/>
                        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(200,195,230,0.8)",flex:1}}>{s}</span>
                        <button onClick={() => handleSend(`How do I learn ${s}? Give me the best free resources and a practice project idea.`)}
                          style={{fontSize:9,padding:"2px 6px",borderRadius:5,border:"none",background:"rgba(239,68,68,0.18)",color:"#fca5a5",cursor:"pointer",flexShrink:0}}>Ask</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Present skills */}
                {insights.presentSkills?.length > 0 && (
                  <div style={{marginBottom:12}}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#34d399",letterSpacing:"0.1em",marginBottom:7}}>SKILLS YOU HAVE</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                      {insights.presentSkills.slice(0,10).map((s,i) => (
                        <span key={i} style={{fontSize:10,padding:"2px 8px",borderRadius:100,background:"rgba(52,211,153,0.09)",color:"#34d399",border:"1px solid rgba(52,211,153,0.18)",fontFamily:"'DM Mono',monospace"}}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Career paths */}
                {insights.careerPaths?.length > 0 && (
                  <div style={{marginBottom:12}}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#a78bfa",letterSpacing:"0.1em",marginBottom:7}}>CAREER PATHS</div>
                    {insights.careerPaths.map((p,i) => (
                      <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",borderRadius:7,background:"rgba(124,58,237,0.07)",border:"1px solid rgba(124,58,237,0.13)",marginBottom:4}}>
                        <span style={{fontSize:12}}>🗺️</span>
                        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(200,195,230,0.8)",flex:1}}>{p}</span>
                        <button onClick={() => handleSend(`Tell me about the ${p} career path — how do I get there from my current skills?`)}
                          style={{fontSize:9,padding:"2px 6px",borderRadius:5,border:"none",background:"rgba(124,58,237,0.18)",color:"#c4b5fd",cursor:"pointer",flexShrink:0}}>Ask</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"18px",display:"flex",flexDirection:"column",gap:12}}>
            {messages.map((msg, i) => (
              <motion.div key={msg.id || i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
                style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start"}}>
                <div style={{
                  maxWidth: msg.role==="user" ? "68%" : "82%",
                  padding: "11px 15px",
                  borderRadius: msg.role==="user" ? "16px 16px 3px 16px" : "16px 16px 16px 3px",
                  background: msg.role==="user"
                    ? "linear-gradient(135deg,#4f46e5,#7c3aed)"
                    : "rgba(255,255,255,0.04)",
                  border: msg.role==="user" ? "none" : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: msg.role==="user" ? "0 4px 18px rgba(99,102,241,0.28)" : "none",
                }}>
                  {msg.role === "assistant" && (
                    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:7}}>
                      <div style={{width:20,height:20,borderRadius:6,background:"linear-gradient(135deg,#7c3aed,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>🧠</div>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#a78bfa",letterSpacing:"0.1em"}}>AI MENTOR</span>
                    </div>
                  )}
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#f1f0ff",lineHeight:1.65}}>
                    <Markdown text={msg.content} />
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {sending && (
              <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{display:"flex",justifyContent:"flex-start"}}>
                <div style={{padding:"12px 16px",borderRadius:"16px 16px 16px 3px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:20,height:20,borderRadius:6,background:"linear-gradient(135deg,#7c3aed,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>🧠</div>
                  <div style={{display:"flex",gap:3,alignItems:"center",padding:"0 4px"}}>
                    {[0,1,2].map(i => (
                      <motion.div key={i} animate={{y:[-2,2,-2]}} transition={{duration:0.5,repeat:Infinity,delay:i*0.12}}
                        style={{width:5,height:5,borderRadius:"50%",background:"#a78bfa"}}/>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {chatError && (
              <div style={{textAlign:"center",padding:"8px 14px",borderRadius:10,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.28)",color:"#fca5a5",fontFamily:"'DM Sans',sans-serif",fontSize:12}}>
                ❌ {chatError}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick actions — show only at start */}
          {messages.length <= 2 && (
            <div style={{padding:"0 18px 10px",display:"flex",gap:6,flexWrap:"wrap"}}>
              {QUICK.map((q,i) => (
                <button key={i} onClick={() => handleSend(q)} disabled={sending}
                  style={{padding:"5px 11px",borderRadius:18,border:"1px solid rgba(124,58,237,0.28)",background:"rgba(124,58,237,0.07)",color:"#a78bfa",fontFamily:"'DM Sans',sans-serif",fontSize:11,cursor:"pointer",transition:"all 0.15s"}}
                  onMouseEnter={e => { e.currentTarget.style.background="rgba(124,58,237,0.15)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="rgba(124,58,237,0.07)"; }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div style={{flexShrink:0,padding:"12px 18px",borderTop:"1px solid rgba(255,255,255,0.07)",background:"rgba(6,4,15,0.7)",backdropFilter:"blur(20px)"}}>
            <div style={{display:"flex",gap:8,alignItems:"flex-end",maxWidth:860,margin:"0 auto"}}>
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask anything... (Enter to send, Shift+Enter for new line)"
                rows={1}
                style={{flex:1,padding:"11px 15px",borderRadius:13,background:"rgba(255,255,255,0.05)",
                  border:"1px solid rgba(255,255,255,0.1)",color:"#f1f0ff",fontSize:13,
                  fontFamily:"'DM Sans',sans-serif",resize:"none",outline:"none",lineHeight:1.5,
                  maxHeight:110,overflowY:"auto"}}
                onFocus={e => e.target.style.borderColor="rgba(124,58,237,0.5)"}
                onBlur={e => e.target.style.borderColor="rgba(255,255,255,0.1)"}
              />
              <button
                onClick={() => handleSend()}
                disabled={sending || !inputText.trim()}
                style={{width:44,height:44,borderRadius:13,border:"none",flexShrink:0,
                  background: inputText.trim() ? "linear-gradient(135deg,#7c3aed,#059669)" : "rgba(255,255,255,0.05)",
                  color:"#fff",fontSize:17,cursor:inputText.trim()?"pointer":"default",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow:inputText.trim()?"0 4px 18px rgba(124,58,237,0.38)":"none",transition:"all 0.2s"}}>
                {sending
                  ? <motion.span animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:"linear"}} style={{display:"inline-block",fontSize:14}}>⚙️</motion.span>
                  : "↑"}
              </button>
            </div>
            <div style={{textAlign:"center",marginTop:5,fontFamily:"'DM Mono',monospace",fontSize:8,color:"rgba(200,195,230,0.22)"}}>
              Enter to send · Shift+Enter for new line · Unlimited messages · Saved to MongoDB
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.35);border-radius:2px;}
        textarea::placeholder{color:rgba(200,195,230,0.2);} *{box-sizing:border-box;}
      `}</style>
    </div>
  );
}