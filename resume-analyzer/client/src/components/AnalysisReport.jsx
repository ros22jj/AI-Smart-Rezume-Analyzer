import { useRef } from "react";
import GitHubMetrics from './GitHubMetrics';
import { motion } from "framer-motion";

// ── Circular Progress ──────────────────────────────────────────
function CircleScore({ score, color, size = 100, stroke = 8 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
        style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
    </svg>
  );
}

// ── Score Card ─────────────────────────────────────────────────
function ScoreCard({ title, score, details, color, icon, delay, extra }) {
  const bg = score >= 75 ? "rgba(52,211,153,0.08)" : score >= 50 ? "rgba(251,191,36,0.08)" : "rgba(248,113,113,0.08)";
  const border = score >= 75 ? "rgba(52,211,153,0.25)" : score >= 50 ? "rgba(251,191,36,0.25)" : "rgba(248,113,113,0.25)";
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      style={{ borderRadius: 18, padding: "22px", background: bg, border: `1px solid ${border}`, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, borderRadius: "0 18px 0 80px", background: `${color}12`, pointerEvents: "none" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14, color: "#f1f0ff" }}>{title}</div>
        </div>
        <div style={{ position: "relative", width: 70, height: 70 }}>
          <CircleScore score={score} color={color} size={70} stroke={6} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 16, color, lineHeight: 1 }}>{score}</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "rgba(200,195,230,0.5)" }}>/ 100</span>
          </div>
        </div>
      </div>
      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.7)", lineHeight: 1.6, marginBottom: extra ? 10 : 0 }}>{details}</div>
      {extra}
    </motion.div>
  );
}

// ── Bar Chart ──────────────────────────────────────────────────
function BarChart({ data, colors }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map((item, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(200,195,230,0.8)" }}>{item.label}</span>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 12, color: colors[i % colors.length] }}>{item.value}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: "easeOut" }}
              style={{ height: "100%", borderRadius: 4, background: colors[i % colors.length], boxShadow: `0 0 8px ${colors[i % colors.length]}` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Radar / Spider ─────────────────────────────────────────────
function RadarChart({ scores }) {
  const keys = Object.keys(scores).slice(0, 8);
  const vals = keys.map(k => scores[k].score);
  const cx = 160, cy = 160, r = 120;
  const n = keys.length;
  const points = (vals, radius) => vals.map((v, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return [cx + radius * (v / 100) * Math.cos(angle), cy + radius * (v / 100) * Math.sin(angle)];
  });
  const gridPoints = (frac) => Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return [cx + r * frac * Math.cos(angle), cy + r * frac * Math.sin(angle)];
  });
  const toPath = (pts) => pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + "Z";
  const dataPoints = points(vals, r);
  const labelPts = Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return [cx + (r + 24) * Math.cos(angle), cy + (r + 24) * Math.sin(angle)];
  });
  const shortLabels = ["Keywords", "Skills", "Experience", "Education", "Projects", "Formatting", "ActionVerbs", "Achievement"];

  return (
    <svg width="320" height="320" style={{ overflow: "visible" }}>
      {[0.25, 0.5, 0.75, 1].map((f, i) => (
        <polygon key={i} points={gridPoints(f).map(p => p.join(",")).join(" ")}
          fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="1" />
      ))}
      {Array.from({ length: n }, (_, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos((i / n) * 2 * Math.PI - Math.PI / 2)} y2={cy + r * Math.sin((i / n) * 2 * Math.PI - Math.PI / 2)}
          stroke="rgba(99,102,241,0.12)" strokeWidth="1" />
      ))}
      <motion.polygon points={dataPoints.map(p => p.join(",")).join(" ")}
        fill="rgba(124,58,237,0.25)" stroke="#7c3aed" strokeWidth="2"
        initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
        style={{ transformOrigin: `${cx}px ${cy}px`, filter: "drop-shadow(0 0 8px rgba(124,58,237,0.5))" }}
        transition={{ duration: 1, delay: 0.4 }} />
      {dataPoints.map((p, i) => (
        <motion.circle key={i} cx={p[0]} cy={p[1]} r={4} fill="#a78bfa"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + i * 0.05 }}
          style={{ filter: "drop-shadow(0 0 4px #a78bfa)" }} />
      ))}
      {labelPts.map((p, i) => (
        <text key={i} x={p[0]} y={p[1]} textAnchor="middle" dominantBaseline="central"
          style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, fill: "rgba(200,195,230,0.6)" }}>
          {shortLabels[i]}
        </text>
      ))}
    </svg>
  );
}

// ── Zigzag Line ────────────────────────────────────────────────
function ZigzagLine({ scores }) {
  const vals = Object.values(scores).map(s => s.score);
  const labels = ["KW", "SK", "EX", "ED", "PR", "FT", "AV", "AC", "GR", "AT", "SC"];
  const w = 560, h = 140, pad = 40;
  const xStep = (w - pad * 2) / (vals.length - 1);
  const pts = vals.map((v, i) => [pad + i * xStep, h - pad - (v / 100) * (h - pad * 2)]);
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[25, 50, 75, 100].map(v => {
        const y = h - pad - (v / 100) * (h - pad * 2);
        return <line key={v} x1={pad} y1={y} x2={w - pad} y2={y} stroke="rgba(99,102,241,0.1)" strokeWidth="1" />;
      })}
      <motion.path d={pathD + ` L${pts[pts.length - 1][0]},${h - pad} L${pts[0][0]},${h - pad} Z`}
        fill="url(#areaGrad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />
      <motion.path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: "easeOut" }}
        style={{ filter: "drop-shadow(0 0 4px rgba(124,58,237,0.5))" }} />
      {pts.map((p, i) => (
        <motion.circle key={i} cx={p[0]} cy={p[1]} r={4} fill={vals[i] >= 75 ? "#34d399" : vals[i] >= 50 ? "#fbbf24" : "#f87171"}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 * i + 0.5 }}
          style={{ filter: `drop-shadow(0 0 4px ${vals[i] >= 75 ? "#34d399" : vals[i] >= 50 ? "#fbbf24" : "#f87171"})` }} />
      ))}
      {pts.map((p, i) => (
        <text key={i} x={p[0]} y={h - 8} textAnchor="middle"
          style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, fill: "rgba(200,195,230,0.5)" }}>
          {labels[i]}
        </text>
      ))}
    </svg>
  );
}

// ── Pie Chart ──────────────────────────────────────────────────
function PieChart({ score }) {
  const r = 60, cx = 80, cy = 80;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";
  return (
    <div style={{ position: "relative", width: 160, height: 160 }}>
      <svg width="160" height="160" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
        <motion.circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="14"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.6, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 28, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(200,195,230,0.5)" }}>OVERALL</span>
      </div>
    </div>
  );
}

// ── Tags ───────────────────────────────────────────────────────
function Tags({ items, color }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
      {items.slice(0, 6).map((item, i) => (
        <span key={i} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 100, background: `${color}18`, color, border: `1px solid ${color}33`, fontFamily: "'DM Mono',monospace" }}>{item}</span>
      ))}
    </div>
  );
}

// ── Main Report ────────────────────────────────────────────────
export default function AnalysisReport({ data, fileName, onBack }) {
  const reportRef = useRef(null);
  const { scores, overallScore, candidateName, topStrengths, criticalImprovements, verdict } = data;

  const scoreColor = (s) => s >= 75 ? "#34d399" : s >= 50 ? "#fbbf24" : "#f87171";

  const barData = Object.entries(scores).map(([k, v]) => ({
    label: k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()),
    value: v.score,
  }));

  const barColors = ["#60a5fa", "#a78bfa", "#f472b6", "#34d399", "#fbbf24", "#f87171", "#c084fc", "#38bdf8", "#4ade80", "#fb923c", "#e879f9"];

  const handleDownload = () => {
    window.print();
  };

  const cards = [
    { key: "keywordMatch", title: "Keyword Match", icon: "🔑", extra: <Tags items={scores.keywordMatch?.keywords} color="#60a5fa" /> },
    { key: "skillsMatch", title: "Skills Match", icon: "💡", extra: (<><Tags items={scores.skillsMatch?.matched} color="#34d399" /><Tags items={scores.skillsMatch?.missing} color="#f87171" /></>) },
    { key: "experienceRelevance", title: "Experience Relevance", icon: "💼", extra: null },
    { key: "educationMatch", title: "Education Match", icon: "🎓", extra: <div style={{ marginTop: 6, fontSize: 11, fontFamily: "'DM Mono',monospace", color: "#a78bfa" }}>{scores.educationMatch?.degree}</div> },
    { key: "projectRelevance", title: "Project Relevance", icon: "🚀", extra: null },
    { key: "formattingScore", title: "Resume Formatting", icon: "📐", extra: <Tags items={scores.formattingScore?.atsIssues} color="#f87171" /> },
    { key: "actionVerbScore", title: "Action Verb Score", icon: "⚡", extra: <Tags items={scores.actionVerbScore?.goodVerbs} color="#34d399" /> },
    { key: "achievementScore", title: "Achievement Score", icon: "🏆", extra: <Tags items={scores.achievementScore?.examples} color="#fbbf24" /> },
    { key: "grammarReadability", title: "Grammar & Readability", icon: "📝", extra: scores.grammarReadability?.fleschScore ? <div style={{ marginTop: 6, fontSize: 11, fontFamily: "'DM Mono',monospace", color: "#60a5fa" }}>Flesch Score: {scores.grammarReadability.fleschScore}</div> : null },
    { key: "atsCompatibility", title: "ATS Compatibility", icon: "🤖", extra: null },
    { key: "sectionCompleteness", title: "Section Completeness", icon: "📋", extra: (<><Tags items={scores.sectionCompleteness?.present} color="#34d399" /><Tags items={scores.sectionCompleteness?.missing} color="#f87171" /></>) },
  ];

  return (
    <div ref={reportRef} style={{
      minHeight: "100vh", background: "linear-gradient(145deg, #06040f 0%, #0e0720 40%, #060c1c 100%)",
      padding: "40px 24px", fontFamily: "'Outfit',sans-serif", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "fixed", width: 600, height: 600, borderRadius: "50%", top: "-15%", left: "-10%", background: "radial-gradient(circle, rgba(109,40,217,0.25) 0%, transparent 70%)", filter: "blur(70px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", width: 500, height: 500, borderRadius: "50%", bottom: "-15%", right: "-10%", background: "radial-gradient(circle, rgba(29,78,216,0.3) 0%, transparent 70%)", filter: "blur(70px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", inset: 0, backgroundImage: `linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)`, backgroundSize: "60px 60px", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, flexWrap: "wrap", gap: 12 }}>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={onBack}
            style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(139,92,246,0.4)", background: "rgba(139,92,246,0.1)", color: "#c4b5fd", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            ← Back
          </motion.button>
          <div style={{ display: "flex", gap: 10 }}>
            <motion.button whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(52,211,153,0.5)" }} whileTap={{ scale: 0.97 }} onClick={handleDownload}
              style={{ padding: "9px 22px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #059669, #34d399)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 0 18px rgba(52,211,153,0.3)" }}>
              ⬇️ Download PDF
            </motion.button>
          </div>
        </div>

        {/* Hero score */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: 50, padding: "40px 24px", borderRadius: 24, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden" }}>
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 5, repeat: Infinity }}
            style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", top: "-50%", left: "50%", transform: "translateX(-50%)", background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: "#a78bfa", letterSpacing: "0.14em", marginBottom: 16 }}>AI RESUME ANALYSIS REPORT</div>
          <h1 style={{ fontWeight: 900, fontSize: "clamp(24px, 4vw, 40px)", color: "#f1f0ff", marginBottom: 6 }}>{candidateName || "Resume Analysis"}</h1>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(200,195,230,0.55)", marginBottom: 32 }}>{fileName}</div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 48, flexWrap: "wrap" }}>
            <PieChart score={overallScore} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "rgba(200,195,230,0.5)", letterSpacing: "0.1em", marginBottom: 8 }}>VERDICT</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: "rgba(200,195,230,0.85)", maxWidth: 380, lineHeight: 1.7, marginBottom: 16 }}>{verdict}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {["🟢 Strong", "🟡 Average", "🔴 Weak"].map((l, i) => (
                  <span key={i} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 100, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(200,195,230,0.6)", fontFamily: "'DM Mono',monospace" }}>{l}: {["≥75", "50-74", "<50"][i]}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Zigzag Line */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ padding: "24px", borderRadius: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: "#a78bfa", letterSpacing: "0.12em", marginBottom: 16 }}>SCORE TREND — ALL METRICS</div>
          <ZigzagLine scores={scores} />
        </motion.div>

        {/* GitHub Metrics Section */}
        <GitHubMetrics data={data} />

        {/* Two column: radar + bar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            style={{ padding: "24px", borderRadius: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: "#a78bfa", letterSpacing: "0.12em", marginBottom: 16, alignSelf: "flex-start" }}>RADAR CHART</div>
            <RadarChart scores={scores} />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
            style={{ padding: "24px", borderRadius: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: "#a78bfa", letterSpacing: "0.12em", marginBottom: 16 }}>BAR CHART — ALL SCORES</div>
            <BarChart data={barData} colors={barColors} />
          </motion.div>
        </div>

        {/* Strengths & Improvements */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ padding: "24px", borderRadius: 20, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}>
            <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: "#34d399", letterSpacing: "0.12em", marginBottom: 14 }}>✅ TOP STRENGTHS</div>
            {topStrengths?.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.1 }}
                style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                <span style={{ color: "#34d399", fontSize: 14, flexShrink: 0, marginTop: 1 }}>▸</span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(200,195,230,0.85)", lineHeight: 1.6 }}>{s}</span>
              </motion.div>
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            style={{ padding: "24px", borderRadius: 20, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)" }}>
            <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: "#f87171", letterSpacing: "0.12em", marginBottom: 14 }}>🔧 CRITICAL IMPROVEMENTS</div>
            {criticalImprovements?.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.1 }}
                style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                <span style={{ color: "#f87171", fontSize: 14, flexShrink: 0, marginTop: 1 }}>▸</span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(200,195,230,0.85)", lineHeight: 1.6 }}>{s}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Individual score cards */}
        <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: "#a78bfa", letterSpacing: "0.12em", marginBottom: 18 }}>DETAILED METRIC BREAKDOWN</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 48 }}>
          {cards.map((c, i) => (
            <ScoreCard key={c.key} title={c.title} score={scores[c.key]?.score || 0}
              details={scores[c.key]?.details || ""} color={scoreColor(scores[c.key]?.score || 0)}
              icon={c.icon} delay={0.05 * i} extra={c.extra} />
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "24px", borderTop: "1px solid rgba(255,255,255,0.06)", fontFamily: "'DM Mono',monospace", fontSize: 11, color: "rgba(167,139,250,0.4)", letterSpacing: "0.08em" }}>
          GENERATED BY RESUMEAI · POWERED BY GOOGLE GEMINI · {new Date().toLocaleDateString()}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:wght@400;500&family=DM+Mono:wght@400;500&display=swap');
        @media print {
          body { background: white !important; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
}