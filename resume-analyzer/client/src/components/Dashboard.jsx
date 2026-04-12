import { useState } from "react";
import { useUser, UserButton } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import UploadResume from "./UploadResume";
import AnalysisReport from "./AnalysisReport";
import HistoryPage from "./HistoryPage";
import GitHubExport from "./GitHubExport";
import LinkedInAnalyzer from "./LinkedInAnalyzer";
import ResumeRanker from "./ResumeRanker";
import ATSBuilder from "./ATSBuilder";
import CareerMentor from "./CareerMentor";
import { useGitHub } from "../hooks/useGitHub";
import API_BASE from "../config";

export default function Dashboard() {
  const { user } = useUser();
  const [view, setView] = useState("home");
  const [reportData, setReportData] = useState(null);
  const [resumeFileName, setResumeFileName] = useState("");
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const github = useGitHub();

  const handleAnalysisComplete = async (data, fileName) => {
    setReportData(data);
    setResumeFileName(fileName);
    try {
      const formData = new FormData();
      formData.append("clerkUserId",     user.id);
      formData.append("userName",        `${user.firstName || ""} ${user.lastName || ""}`.trim());
      formData.append("userEmail",       user.emailAddresses[0]?.emailAddress || "");
      formData.append("resumeFileName",  fileName);
      formData.append("overallScore",    data.overallScore);
      formData.append("candidateName",   data.candidateName || "");
      formData.append("analysisData",    JSON.stringify(data));
      formData.append("githubUsername",  data.githubUsername || "");
      formData.append("githubMetrics",   JSON.stringify(data.githubMetrics || {}));
      formData.append("linkedinMetrics", JSON.stringify(data.linkedinMetrics || {}));
      await fetch(`${API_BASE}/api/analysis/save`, { method: "POST", body: formData });
      console.log("✅ Analysis saved to history");
    } catch (err) {
      console.warn("Could not save to history:", err.message);
    }
    setView("report");
  };

  
  const navItems = [
    { label: "🏠 Home",     key: "home"     },
    { label: "📋 Analyze",  key: "upload"   },
    { label: "🏆 Ranker",   key: "ranker"   },
    { label: "💼 LinkedIn", key: "linkedin" },
    { label: "📜 History",  key: "history"  },
    { label: "🎯 ATS Builder", key: "atsbuilder" },
    { label: "🧠 Mentor",      key: "mentor"     },
    { label: "💾 GitHub",   key: "github", onClick: () => setGithubModalOpen(true) },
  ];


  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #06040f 0%, #0e0720 40%, #060c1c 100%)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", width: 600, height: 600, borderRadius: "50%", top: "-20%", left: "-10%", background: "radial-gradient(circle, rgba(109,40,217,0.3) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", width: 500, height: 500, borderRadius: "50%", bottom: "-20%", right: "-10%", background: "radial-gradient(circle, rgba(29,78,216,0.35) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, backgroundImage: `linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)`, backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 22px", borderRadius: 18, width: "min(96vw, 1020px)", background: "rgba(10,6,25,0.75)", border: "1px solid rgba(139,92,246,0.25)", backdropFilter: "blur(24px)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
        <div onClick={() => setView("home")} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 17, color: "#f1f0ff", cursor: "pointer", flexShrink: 0 }}>
          <span style={{ display: "inline-block", animation: "wobble 3s ease-in-out infinite" }}>⚡</span>
          ResumeAI
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          {navItems.map((item) => {
            const isLinkedIn = item.key === "linkedin";
            const isRanker = item.key === "ranker";
            const isActive = view === item.key;
            const activeColor = isLinkedIn ? { border: "rgba(14,165,233,0.6)", bg: "rgba(14,165,233,0.15)", text: "#38bdf8" } : isRanker ? { border: "rgba(250,204,21,0.6)", bg: "rgba(250,204,21,0.12)", text: "#fde047" } : { border: "rgba(139,92,246,0.6)", bg: "rgba(124,58,237,0.2)", text: "#c4b5fd" };
            return (
              <motion.button key={item.key} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={item.onClick || (() => setView(item.key))} style={{ padding: "7px 13px", borderRadius: 10, fontSize: 12, fontWeight: 600, fontFamily: "'Outfit',sans-serif", cursor: "pointer", border: isActive ? `1px solid ${activeColor.border}` : "1px solid transparent", background: isActive ? activeColor.bg : "transparent", color: isActive ? activeColor.text : "rgba(200,195,230,0.6)", transition: "all 0.2s", position: "relative" }}>
                {item.label}
                {isRanker && !isActive && (<span style={{ position: "absolute", top: -4, right: -4, fontSize: 8, padding: "1px 5px", borderRadius: 100, background: "rgba(250,204,21,0.2)", color: "#fde047", border: "1px solid rgba(250,204,21,0.4)", fontFamily: "'DM Mono',monospace" }}>NEW</span>)}
              </motion.button>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(200,195,230,0.6)" }}>{user?.firstName} {user?.lastName}</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === "home" && (
          <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 24px 40px", position: "relative", zIndex: 1, textAlign: "center" }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 24px", boxShadow: "0 0 40px rgba(124,58,237,0.5)" }}>👋</motion.div>
            <h1 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: "clamp(26px, 5vw, 46px)", color: "#f1f0ff", marginBottom: 12 }}>
              Welcome back,{" "}
              <span style={{ background: "linear-gradient(90deg, #c084fc, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{user?.firstName || "there"}!</span>
            </h1>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 16, color: "rgba(200,195,230,0.65)", marginBottom: 48, maxWidth: 480 }}>Upload your resume and paste a job description to get a full AI-powered analysis with scores, feedback, and improvement tips.</p>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginBottom: 48 }}>
              {[
                { icon: "📋", title: "Analyze Resume",    sub: "Upload & get AI feedback",        color: "124,58,237",  onClick: () => setView("upload")   },
                { icon: "🏆", title: "Resume Ranker",     sub: "Compare & rank up to 5 resumes",  color: "250,204,21",  onClick: () => setView("ranker")   },
                { icon: "💼", title: "LinkedIn Analyzer", sub: "12 professional metrics",         color: "14,165,233",  onClick: () => setView("linkedin") },
                { icon: "📜", title: "View History",      sub: "See all analyzed resumes",        color: "96,165,250",  onClick: () => setView("history")  },
                { icon: "🎯", title: "ATS Builder",       sub: "Build JD-matched ATS resume",     color: "5,150,105",   onClick: () => setView("atsbuilder") },
                { icon: "🧠", title: "Career Mentor",     sub: "AI mentor for skills & career",   color: "139,92,246",  onClick: () => setView("mentor") },
              ].map((card, i) => (
                <motion.div key={i} whileHover={{ y: -6, boxShadow: `0 20px 60px rgba(${card.color},0.3)` }} onClick={card.onClick}
                  style={{ padding: "28px 32px", borderRadius: 20, cursor: "pointer", background: `rgba(${card.color},0.08)`, border: `1px solid rgba(${card.color},0.3)`, backdropFilter: "blur(16px)", textAlign: "center", minWidth: 180, transition: "box-shadow 0.3s" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{card.icon}</div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 16, color: "#f1f0ff", marginBottom: 6 }}>{card.title}</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.6)" }}>{card.sub}</div>
                </motion.div>
              ))}
              {reportData && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ y: -6, boxShadow: "0 20px 60px rgba(52,211,153,0.2)" }} onClick={() => setView("report")}
                  style={{ padding: "28px 32px", borderRadius: 20, cursor: "pointer", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)", backdropFilter: "blur(16px)", textAlign: "center", minWidth: 180, transition: "box-shadow 0.3s" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 16, color: "#f1f0ff", marginBottom: 6 }}>Last Report</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.6)" }}>Score: {reportData.overallScore}%</div>
                </motion.div>
              )}
            </div>

            <motion.button whileHover={{ scale: 1.06, boxShadow: "0 0 50px rgba(124,58,237,0.7)" }} whileTap={{ scale: 0.97 }} onClick={() => setView("upload")}
              style={{ padding: "16px 48px", borderRadius: 16, border: "none", background: "linear-gradient(135deg, #7c3aed, #4f46e5, #2563eb)", color: "#fff", fontSize: 17, fontWeight: 700, fontFamily: "'Outfit',sans-serif", cursor: "pointer", boxShadow: "0 0 28px rgba(124,58,237,0.4)" }}>
              🚀 Upload Resume to Analyze
            </motion.button>
          </motion.div>
        )}
        {view === "upload" && (<motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ paddingTop: 70 }}><UploadResume onAnalysisComplete={handleAnalysisComplete} /></motion.div>)}
        {view === "ranker" && (<motion.div key="ranker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ paddingTop: 70 }}><ResumeRanker onBack={() => setView("home")} /></motion.div>)}
        {view === "linkedin" && (<motion.div key="linkedin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ paddingTop: 0 }}><LinkedInAnalyzer onBack={() => setView("home")} resumeScore={reportData?.overallScore ?? null} resumeSkills={reportData?.scores?.skillsMatch?.matched || []} /></motion.div>)}
        {view === "report" && reportData && (<motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ paddingTop: 70 }}><AnalysisReport data={reportData} fileName={resumeFileName} onBack={() => setView("home")} /></motion.div>)}
        {view === "atsbuilder" && (<motion.div key="atsbuilder" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ paddingTop:70 }}><ATSBuilder onBack={() => setView("home")} /></motion.div>)}
        {view === "mentor" && (<div key="mentor" style={{ paddingTop:0 }}><CareerMentor onBack={() => setView("home")} /></div>)}
        {view === "history" && (<motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ paddingTop: 70 }}><HistoryPage onBack={() => setView("home")} /></motion.div>)}
      </AnimatePresence>

      <GitHubExport reportData={reportData} isOpen={githubModalOpen} onClose={() => setGithubModalOpen(false)} />
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=DM+Sans:wght@400;500&family=DM+Mono:wght@400;500&display=swap'); @keyframes wobble { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(15deg)} 75%{transform:rotate(-10deg)} }`}</style>
    </div>
  );
}











