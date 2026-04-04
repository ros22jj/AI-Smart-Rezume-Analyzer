






import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Score Badge ────────────────────────────────────────────────
function ScoreBadge({ score }) {
  const color = score >= 75 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";
  const bg = score >= 75 ? "rgba(52,211,153,0.1)" : score >= 50 ? "rgba(251,191,36,0.1)" : "rgba(248,113,113,0.1)";
  const border = score >= 75 ? "rgba(52,211,153,0.3)" : score >= 50 ? "rgba(251,191,36,0.3)" : "rgba(248,113,113,0.3)";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 12px", borderRadius: 100,
      background: bg, border: `1px solid ${border}`,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
      <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, color }}>{score}%</span>
    </div>
  );
}

// ── Mini Circle ────────────────────────────────────────────────
function MiniCircle({ score }) {
  const color = score >= 75 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";
  const r = 20, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: 52, height: 52 }}>
      <svg width="52" height="52" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
        <motion.circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 11, color }}>{score}</span>
      </div>
    </div>
  );
}

// ── Resume Card ────────────────────────────────────────────────
function ResumeCard({ analysis, index, onView }) {
  const [hovered, setHovered] = useState(false);
  const date = new Date(analysis.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const time = new Date(analysis.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        borderRadius: 20, padding: "22px",
        background: hovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
        border: hovered ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.07)",
        transition: "all 0.3s", position: "relative", overflow: "hidden",
        cursor: "pointer",
      }}
      onClick={() => onView(analysis)}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, borderRadius: 20, background: "radial-gradient(circle at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        )}
      </AnimatePresence>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: "linear-gradient(135deg, #7c3aed, #2563eb)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, boxShadow: "0 0 16px rgba(124,58,237,0.4)",
          color: "#fff", fontFamily: "'Outfit',sans-serif", fontWeight: 800,
        }}>
          {analysis.candidateName?.charAt(0)?.toUpperCase() || "?"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 15, color: "#f1f0ff", marginBottom: 3 }}>
            {analysis.candidateName || "Unknown"}
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {analysis.resumeFileName || "resume.pdf"}
          </div>
        </div>

        <MiniCircle score={analysis.overallScore || 0} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {analysis.userName && (
          <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 100, background: "rgba(124,58,237,0.15)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.3)", fontFamily: "'DM Mono',monospace" }}>
            👤 {analysis.userName}
          </span>
        )}
        {analysis.userEmail && (
          <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 100, background: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.25)", fontFamily: "'DM Mono',monospace" }}>
            ✉️ {analysis.userEmail}
          </span>
        )}
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(200,195,230,0.4)", letterSpacing: "0.08em" }}>OVERALL SCORE</span>
          <ScoreBadge score={analysis.overallScore || 0} />
        </div>
        <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${analysis.overallScore || 0}%` }}
            transition={{ duration: 1, delay: index * 0.08 + 0.3 }}
            style={{
              height: "100%", borderRadius: 2,
              background: analysis.overallScore >= 75
                ? "linear-gradient(90deg, #059669, #34d399)"
                : analysis.overallScore >= 50
                ? "linear-gradient(90deg, #d97706, #fbbf24)"
                : "linear-gradient(90deg, #dc2626, #f87171)",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(200,195,230,0.35)" }}>
          {date} · {time}
        </span>
        <motion.div
          animate={hovered ? { x: 4 } : { x: 0 }}
          style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#a78bfa", fontWeight: 600 }}
        >
          View Report →
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ icon, value, label, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", bounce: 0.4 }}
      style={{
        padding: "20px 24px", borderRadius: 18,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{
        fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 32,
        background: color, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        marginBottom: 4,
      }}>{value}</div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(200,195,230,0.5)", letterSpacing: "0.08em" }}>{label}</div>
    </motion.div>
  );
}

// ── Resume Modal ───────────────────────────────────────────────
function ResumeModal({ analysis, onClose }) {
  if (!analysis) return null;
  const scores = analysis.analysisData?.scores || {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}
    >
      <motion.div
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 700, maxHeight: "85vh",
          borderRadius: 24, overflow: "hidden",
          background: "linear-gradient(145deg, #0e0820, #060c1c)",
          border: "1px solid rgba(139,92,246,0.3)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.7)",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(124,58,237,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg, #7c3aed, #2563eb)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, boxShadow: "0 0 20px rgba(124,58,237,0.5)",
              color: "#fff", fontFamily: "'Outfit',sans-serif", fontWeight: 800,
            }}>
              {analysis.candidateName?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 18, color: "#f1f0ff" }}>
                {analysis.candidateName}
              </div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.55)" }}>
                {analysis.resumeFileName}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ScoreBadge score={analysis.overallScore} />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "rgba(200,195,230,0.7)", fontSize: 16,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</motion.button>
          </div>
        </div>

        {/* Modal body */}
        <div style={{ overflow: "auto", padding: "24px", flex: 1 }}>
          {analysis.analysisData?.verdict && (
            <div style={{
              padding: "14px 18px", borderRadius: 14, marginBottom: 20,
              background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
            }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#a78bfa", letterSpacing: "0.1em", marginBottom: 6 }}>AI VERDICT</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(200,195,230,0.85)", lineHeight: 1.7 }}>
                {analysis.analysisData.verdict}
              </div>
            </div>
          )}

          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#a78bfa", letterSpacing: "0.1em", marginBottom: 12 }}>SCORE BREAKDOWN</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 20 }}>
            {Object.entries(scores).map(([key, val]) => {
              const label = key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
              const color = val.score >= 75 ? "#34d399" : val.score >= 50 ? "#fbbf24" : "#f87171";
              return (
                <div key={key} style={{
                  padding: "12px 14px", borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(200,195,230,0.7)", fontWeight: 600 }}>{label}</span>
                    <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14, color }}>{val.score}</span>
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${val.score}%` }}
                      transition={{ duration: 0.8 }}
                      style={{ height: "100%", borderRadius: 2, background: color }}
                    />
                  </div>
                  {val.details && (
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "rgba(200,195,230,0.45)", marginTop: 5, lineHeight: 1.5 }}>
                      {val.details.slice(0, 80)}...
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ padding: "14px", borderRadius: 14, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#34d399", letterSpacing: "0.1em", marginBottom: 10 }}>✅ STRENGTHS</div>
              {analysis.analysisData?.topStrengths?.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: "#34d399", fontSize: 12 }}>▸</span>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(200,195,230,0.8)", lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: "14px", borderRadius: 14, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)" }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#f87171", letterSpacing: "0.1em", marginBottom: 10 }}>🔧 IMPROVE</div>
              {analysis.analysisData?.criticalImprovements?.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: "#f87171", fontSize: 12 }}>▸</span>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(200,195,230,0.8)", lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main History Page ──────────────────────────────────────────
export default function HistoryPage({ onBack }) {
  const [analyses, setAnalyses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching history from server...");

      const analysesRes = await fetch("https://ai-smart-resume-analyzer-so1y.vercel.app/api/analysis/all");
      const analysesData = await analysesRes.json();
      console.log("History data received:", analysesData);

      const statsRes = await fetch("https://ai-smart-resume-analyzer-so1y.vercel.app/api/stats");
      const statsData = await statsRes.json();
      console.log("Stats data received:", statsData);

      setAnalyses(analysesData.analyses || []);
      setStats(statsData);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = analyses.filter(a => {
    const matchSearch = search === "" ||
      a.candidateName?.toLowerCase().includes(search.toLowerCase()) ||
      a.userName?.toLowerCase().includes(search.toLowerCase()) ||
      a.userEmail?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "strong" && a.overallScore >= 75) ||
      (filter === "average" && a.overallScore >= 50 && a.overallScore < 75) ||
      (filter === "weak" && a.overallScore < 50);
    return matchSearch && matchFilter;
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #06040f 0%, #0e0720 40%, #060c1c 100%)",
      padding: "40px 24px", position: "relative", overflow: "hidden",
      fontFamily: "'Outfit',sans-serif",
    }}>
      <div style={{ position: "fixed", width: 600, height: 600, borderRadius: "50%", top: "-15%", left: "-10%", background: "radial-gradient(circle, rgba(109,40,217,0.25) 0%, transparent 70%)", filter: "blur(70px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", width: 500, height: 500, borderRadius: "50%", bottom: "-15%", right: "-10%", background: "radial-gradient(circle, rgba(29,78,216,0.3) 0%, transparent 70%)", filter: "blur(70px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", inset: 0, backgroundImage: `linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)`, backgroundSize: "60px 60px", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, flexWrap: "wrap", gap: 12 }}>
          <div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#a78bfa", letterSpacing: "0.12em", marginBottom: 8 }}>
              RESUME HISTORY
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{ fontWeight: 800, fontSize: "clamp(24px, 4vw, 36px)", color: "#f1f0ff", margin: 0 }}>
              All Uploaded Resumes
            </motion.h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={fetchData}
              style={{
                padding: "10px 18px", borderRadius: 12,
                border: "1px solid rgba(52,211,153,0.4)",
                background: "rgba(52,211,153,0.1)",
                color: "#34d399", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>🔄 Refresh</motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={onBack}
              style={{
                padding: "10px 22px", borderRadius: 12,
                border: "1px solid rgba(139,92,246,0.4)",
                background: "rgba(139,92,246,0.1)",
                color: "#c4b5fd", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>← Back</motion.button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              padding: "16px 20px", borderRadius: 14, marginBottom: 24,
              background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
              fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#f87171",
            }}>
            ❌ Error connecting to server: {error}. Make sure server is running on port 5000.
          </motion.div>
        )}

        {/* Stats */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 36 }}>
            <StatCard icon="📄" value={stats.totalResumes || 0} label="TOTAL RESUMES" color="linear-gradient(90deg, #c4b5fd, #818cf8)" delay={0.1} />
            <StatCard icon="👥" value={stats.totalUsers || 0} label="UNIQUE USERS" color="linear-gradient(90deg, #60a5fa, #34d399)" delay={0.2} />
            <StatCard icon="⭐" value={`${stats.avgScore || 0}%`} label="AVERAGE SCORE" color="linear-gradient(90deg, #fbbf24, #f87171)" delay={0.3} />
          </div>
        )}

        {/* Search + Filter */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search by name or email..."
            style={{
              flex: 1, minWidth: 200, padding: "10px 16px", borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#f1f0ff", fontSize: 13,
              fontFamily: "'DM Sans',sans-serif", outline: "none",
            }}
          />
          {["all", "strong", "average", "weak"].map((f) => (
            <motion.button
              key={f}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => setFilter(f)}
              style={{
                padding: "10px 18px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                fontFamily: "'Outfit',sans-serif", cursor: "pointer",
                border: filter === f ? "1px solid rgba(139,92,246,0.6)" : "1px solid rgba(255,255,255,0.08)",
                background: filter === f ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.03)",
                color: filter === f ? "#c4b5fd" : "rgba(200,195,230,0.6)",
              }}
            >
              {f === "all" ? "All" : f === "strong" ? "🟢 Strong" : f === "average" ? "🟡 Average" : "🔴 Weak"}
            </motion.button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ fontSize: 36, display: "inline-block" }}>⚙️</motion.div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "#a78bfa", marginTop: 14 }}>Loading history...</div>
          </div>
        )}

        {/* No results */}
        {!loading && !error && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 20, color: "#f1f0ff", marginBottom: 8 }}>
              {search ? "No resumes found" : "No resumes yet"}
            </div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "rgba(200,195,230,0.55)" }}>
              {search ? "Try a different search term" : "Analyze a resume first and it will appear here!"}
            </div>
          </motion.div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(200,195,230,0.4)", letterSpacing: "0.08em", marginBottom: 16 }}>
              SHOWING {filtered.length} RESUME{filtered.length !== 1 ? "S" : ""}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
              {filtered.map((analysis, i) => (
                <ResumeCard key={analysis._id} analysis={analysis} index={i} onView={setSelectedAnalysis} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedAnalysis && (
          <ResumeModal analysis={selectedAnalysis} onClose={() => setSelectedAnalysis(null)} />
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=DM+Sans:wght@400;500&family=DM+Mono:wght@400;500&display=swap');
        input::placeholder { color: rgba(200,195,230,0.3); }
        input:focus { border-color: rgba(139,92,246,0.5) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.4); border-radius: 2px; }
      `}</style>
    </div>
  );
}