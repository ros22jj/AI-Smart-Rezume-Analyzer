import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import API_BASE from "../config";

export default function HistoryPage({ onBack }) {
  const { user } = useUser();
  const [analyses, setAnalyses]   = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [selected, setSelected]   = useState(null);
  const [deleting, setDeleting]   = useState(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // ── FIXED: use API_BASE env variable ──────────────────
      const [analysesRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/analysis/user/${user.id}`),
        fetch(`${API_BASE}/api/stats`),
      ]);

      if (!analysesRes.ok) throw new Error(`Server error: ${analysesRes.status}`);

      const analysesData = await analysesRes.json();
      const statsData    = statsRes.ok ? await statsRes.json() : null;

      setAnalyses(analysesData.analyses || []);
      if (statsData?.success) setStats(statsData);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await fetch(`${API_BASE}/api/analysis/${id}`, { method: "DELETE" });
      setAnalyses((prev) => prev.filter((a) => a._id !== id));
      if (selected?._id === id) setSelected(null);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(null);
    }
  };

  const scoreColor = (score) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#f59e0b";
    if (score >= 40) return "#f97316";
    return "#ef4444";
  };

  const fmt = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #06040f 0%, #0e0720 40%, #060c1c 100%)", padding: "40px 24px", position: "relative" }}>
      {/* Background */}
      <div style={{ position: "fixed", width: 600, height: 600, borderRadius: "50%", top: "-20%", left: "-10%", background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", inset: 0, backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`, backgroundSize: "60px 60px", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: "clamp(22px,4vw,32px)", color: "#f1f0ff", margin: 0, marginBottom: 4 }}>📜 Analysis History</h1>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(200,195,230,0.5)", margin: 0 }}>All your resume analyses in one place</p>
          </div>
          {onBack && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBack}
              style={{ padding: "10px 20px", borderRadius: 12, cursor: "pointer", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600 }}>
              ← Dashboard
            </motion.button>
          )}
        </motion.div>

        {/* Stats bar */}
        {stats && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 28 }}>
            {[
              { label: "Total Resumes", value: stats.totalResumes, icon: "📄" },
              { label: "Total Users",   value: stats.totalUsers,   icon: "👥" },
              { label: "Avg Score",     value: `${stats.avgScore}%`, icon: "⚡" },
              { label: "Your Analyses", value: analyses.length,    icon: "📊" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 22, color: "#f1f0ff" }}>{s.value}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(200,195,230,0.4)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", margin: "0 auto 16px" }} />
            <p style={{ fontFamily: "'DM Sans',sans-serif", color: "rgba(200,195,230,0.5)", fontSize: 14 }}>Loading your history...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ textAlign: "center", padding: "40px", borderRadius: 16, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <p style={{ fontFamily: "'DM Sans',sans-serif", color: "#f87171", fontSize: 14, marginBottom: 16 }}>Could not load history: {error}</p>
            <motion.button whileHover={{ scale: 1.05 }} onClick={fetchData}
              style={{ padding: "8px 20px", borderRadius: 10, cursor: "pointer", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600 }}>
              🔄 Retry
            </motion.button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && analyses.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <h3 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 20, color: "#f1f0ff", marginBottom: 8 }}>No analyses yet</h3>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "rgba(200,195,230,0.5)", marginBottom: 24 }}>Upload your first resume to see results here!</p>
            {onBack && (
              <motion.button whileHover={{ scale: 1.05 }} onClick={onBack}
                style={{ padding: "12px 28px", borderRadius: 14, cursor: "pointer", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700 }}>
                🚀 Analyze a Resume
              </motion.button>
            )}
          </motion.div>
        )}

        {/* List */}
        {!loading && !error && analyses.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: 16 }}>

            {/* Left — cards */}
            <div>
              <AnimatePresence>
                {analyses.map((analysis, i) => (
                  <motion.div key={analysis._id}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelected(selected?._id === analysis._id ? null : analysis)}
                    style={{ padding: "18px 20px", borderRadius: 16, marginBottom: 12, cursor: "pointer", transition: "all 0.2s",
                      background: selected?._id === analysis._id ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${selected?._id === analysis._id ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.07)"}`,
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      {/* Score circle */}
                      <div style={{ width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                        background: `conic-gradient(${scoreColor(analysis.overallScore)} ${analysis.overallScore * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#0e0720", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: 12, color: scoreColor(analysis.overallScore) }}>{analysis.overallScore}</span>
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14, color: "#f1f0ff", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {analysis.candidateName || analysis.resumeFileName || "Resume"}
                        </div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(200,195,230,0.4)" }}>
                          {fmt(analysis.createdAt)}
                          {analysis.githubUsername && ` · @${analysis.githubUsername}`}
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                          {analysis.githubMetrics?.trustScore && (
                            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 100, background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)", fontFamily: "'DM Mono',monospace" }}>
                              🐙 {analysis.githubMetrics.trustScore}
                            </span>
                          )}
                          {analysis.linkedinMetrics?.overallLinkedInScore && (
                            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 100, background: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)", fontFamily: "'DM Mono',monospace" }}>
                              💼 {analysis.linkedinMetrics.overallLinkedInScore}
                            </span>
                          )}
                        </div>
                      </div>

                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); handleDelete(analysis._id); }}
                        disabled={deleting === analysis._id}
                        style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", color: "#f87171", fontSize: 12, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {deleting === analysis._id ? "..." : "✕"}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Right — detail panel */}
            <AnimatePresence>
              {selected && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  style={{ padding: "24px", borderRadius: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", alignSelf: "start", position: "sticky", top: 100 }}>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 18, color: "#f1f0ff", marginBottom: 4 }}>
                    {selected.candidateName || "Resume Analysis"}
                  </div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(200,195,230,0.4)", marginBottom: 20 }}>{fmt(selected.createdAt)}</div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                    {[
                      { label: "ATS Score",  value: `${selected.overallScore}%`,                              color: scoreColor(selected.overallScore) },
                      { label: "GitHub",     value: selected.githubMetrics?.trustScore ? `${selected.githubMetrics.trustScore}` : "N/A", color: "#34d399" },
                      { label: "LinkedIn",   value: selected.linkedinMetrics?.overallLinkedInScore ? `${selected.linkedinMetrics.overallLinkedInScore}` : "N/A", color: "#60a5fa" },
                      { label: "File",       value: selected.resumeFileName || "—",                           color: "#a78bfa" },
                    ].map((s, i) => (
                      <div key={i} style={{ padding: "12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(200,195,230,0.4)", marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 15, color: s.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Strengths */}
                  {selected.analysisData?.topStrengths?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 12, color: "#22c55e", marginBottom: 8 }}>⚡ Top Strengths</div>
                      {selected.analysisData.topStrengths.slice(0, 3).map((s, i) => (
                        <div key={i} style={{ fontSize: 11, padding: "6px 10px", borderRadius: 8, background: "rgba(34,197,94,0.06)", color: "rgba(200,195,230,0.7)", border: "1px solid rgba(34,197,94,0.15)", fontFamily: "'DM Sans',sans-serif", marginBottom: 5 }}>✓ {s}</div>
                      ))}
                    </div>
                  )}

                  {/* Improvements */}
                  {selected.analysisData?.criticalImprovements?.length > 0 && (
                    <div>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 12, color: "#f59e0b", marginBottom: 8 }}>🚀 Key Improvements</div>
                      {selected.analysisData.criticalImprovements.slice(0, 3).map((s, i) => (
                        <div key={i} style={{ fontSize: 11, padding: "6px 10px", borderRadius: 8, background: "rgba(245,158,11,0.06)", color: "rgba(200,195,230,0.7)", border: "1px solid rgba(245,158,11,0.15)", fontFamily: "'DM Sans',sans-serif", marginBottom: 5 }}>→ {s}</div>
                      ))}
                    </div>
                  )}

                  <motion.button whileHover={{ scale: 1.02 }} onClick={() => setSelected(null)}
                    style={{ marginTop: 16, width: "100%", padding: "10px", borderRadius: 10, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(200,195,230,0.6)", fontFamily: "'Outfit',sans-serif", fontSize: 12 }}>
                    Close ✕
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}