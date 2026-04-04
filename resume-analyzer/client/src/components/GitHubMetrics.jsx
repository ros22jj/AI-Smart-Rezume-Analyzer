import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

// ── Animated circle score ──────────────────────────────────────
function CircleScore({ score, color, size = 80, stroke = 6, delay = 0.3 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(score, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.4, ease: 'easeOut', delay }}
        style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
    </svg>
  );
}

// ── Score pill ─────────────────────────────────────────────────
function ScorePill({ score }) {
  const color = score >= 75 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';
  const label = score >= 75 ? 'Strong' : score >= 50 ? 'Fair' : 'Weak';
  return (
    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100,
      background: `${color}20`, color, border: `1px solid ${color}40`,
      fontFamily: "'DM Mono',monospace" }}>
      {label}
    </span>
  );
}

// ── Metric card ────────────────────────────────────────────────
function MetricCard({ title, score, icon, color, delay, children }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      style={{ borderRadius: 14, background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${color}33`, overflow: 'hidden' }}>
      {/* Header row */}
      <div onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
          cursor: 'pointer', userSelect: 'none' }}>
        <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
          <CircleScore score={score} color={color} size={56} stroke={5} delay={delay + 0.2} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexDirection: 'column' }}>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 13,
              color, lineHeight: 1 }}>{score}</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 14 }}>{icon}</span>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13,
              color: '#f1f0ff' }}>{title}</span>
          </div>
          <ScorePill score={score} />
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
          style={{ color: 'rgba(200,195,230,0.4)', fontSize: 12 }}>▼</motion.div>
      </div>
      {/* Expandable details */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden', borderTop: `1px solid ${color}22` }}>
            <div style={{ padding: '12px 16px' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Tag chip ───────────────────────────────────────────────────
function Chip({ label, color }) {
  return (
    <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 100,
      background: `${color}18`, color, border: `1px solid ${color}33`,
      fontFamily: "'DM Mono',monospace", whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

// ── Trust score ring (big center display) ─────────────────────
function TrustRing({ score }) {
  const color = score >= 75 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';
  const label = score >= 75 ? 'HIGHLY AUTHENTIC' : score >= 50 ? 'PARTIALLY VERIFIED' : 'LOW AUTHENTICITY';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 110, height: 110 }}>
        <CircleScore score={score} color={color} size={110} stroke={9} delay={0.1} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 26,
            color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8,
            color: 'rgba(200,195,230,0.5)', marginTop: 2 }}>/ 100</span>
        </div>
      </div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color,
        letterSpacing: '0.12em', textAlign: 'center' }}>{label}</div>
    </div>
  );
}

// ── Horizontal bar ─────────────────────────────────────────────
function HBar({ label, value, color, delay = 0 }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11,
          color: 'rgba(200,195,230,0.8)' }}>{label}</span>
        <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700,
          fontSize: 11, color }}>{value}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 3, background: color,
            boxShadow: `0 0 6px ${color}` }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function GitHubMetrics({ data }) {
  const { githubMetrics, githubUsername } = data;
  const [activeTab, setActiveTab] = useState('overview');

  if (!githubMetrics || Object.keys(githubMetrics).length < 2) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ padding: '20px', borderRadius: 16, textAlign: 'center',
          color: 'rgba(200,195,230,0.4)', background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🐙</div>
        <div style={{ fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>No GitHub data available</div>
      </motion.div>
    );
  }

  const m = githubMetrics;
  const tabs = ['overview', 'skills', 'projects', 'activity'];

  // Colors per metric
  const COLORS = {
    skillMatch: '#10b981',
    techUsage: '#3b82f6',
    projectMatch: '#8b5cf6',
    projectDepth: '#06b6d4',
    activityMatch: '#f59e0b',
    techStack: '#ec4899',
    consistency: '#a78bfa',
    codeEvidence: '#34d399',
    deployment: '#60a5fa',
    trust: '#fbbf24',
  };

  const metrics10 = [
    { key: 'skillMatchScore', title: 'Skill Match', icon: '🎯', color: COLORS.skillMatch },
    { key: 'techUsageScore', title: 'Tech Usage Depth', icon: '🔬', color: COLORS.techUsage },
    { key: 'projectMatchScore', title: 'Project Verification', icon: '📁', color: COLORS.projectMatch },
    { key: 'projectDepthScore', title: 'Project Depth', icon: '📊', color: COLORS.projectDepth },
    { key: 'activityMatchScore', title: 'Experience vs Activity', icon: '⏳', color: COLORS.activityMatch },
    { key: 'techStackScore', title: 'Tech Stack Relevance', icon: '🧩', color: COLORS.techStack },
    { key: 'consistencyScore', title: 'Consistency', icon: '📅', color: COLORS.consistency },
    { key: 'codeEvidenceScore', title: 'Code Evidence', icon: '💻', color: COLORS.codeEvidence },
    { key: 'deploymentScore', title: 'Deployment Verified', icon: '🚀', color: COLORS.deployment },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ borderRadius: 22, background: 'rgba(16,185,129,0.06)',
        border: '1px solid rgba(16,185,129,0.25)', marginBottom: 24, overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ padding: '20px 24px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: '#059669',
              letterSpacing: '0.12em', marginBottom: 4 }}>🐙 GITHUB VERIFICATION</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 18,
              color: '#f1f0ff' }}>@{githubUsername}</div>
            {m.bio && (
              <div style={{ fontSize: 11, color: 'rgba(200,195,230,0.5)',
                fontFamily: "'DM Sans',sans-serif", marginTop: 3 }}>{m.bio}</div>
            )}
          </div>
          {/* Trust score big ring */}
          <TrustRing score={m.trustScore || 0} />
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', paddingBottom: 16 }}>
          {[
            { label: 'Repos', value: m.totalRepos || 0, icon: '📦' },
            { label: 'Stars', value: m.totalStars || 0, icon: '⭐' },
            { label: 'Commits', value: m.totalCommits || 0, icon: '💬' },
            { label: 'Active Months', value: m.activeMonths || 0, icon: '📅' },
            { label: 'Followers', value: m.followers || 0, icon: '👥' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14 }}>{s.icon}</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 16,
                color: '#f1f0ff' }}>{s.value}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9,
                color: 'rgba(200,195,230,0.4)', letterSpacing: '0.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '8px 16px', borderRadius: '10px 10px 0 0',
                border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                fontFamily: "'Outfit',sans-serif", letterSpacing: '0.05em',
                transition: 'all 0.2s',
                background: activeTab === tab ? 'rgba(16,185,129,0.2)' : 'transparent',
                color: activeTab === tab ? '#10b981' : 'rgba(200,195,230,0.5)',
                borderBottom: activeTab === tab ? '2px solid #10b981' : '2px solid transparent',
              }}>
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding: '20px 24px 24px' }}>

        {/* OVERVIEW TAB — 9 metric bars + top languages */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 12, marginBottom: 20 }}>
              {metrics10.map((metric, i) => (
                <MetricCard key={metric.key} title={metric.title}
                  score={m[metric.key] || 0} icon={metric.icon}
                  color={metric.color} delay={i * 0.05}>
                  <div style={{ fontSize: 11, fontFamily: "'DM Sans',sans-serif",
                    color: 'rgba(200,195,230,0.65)', lineHeight: 1.6 }}>
                    {getMetricDetail(metric.key, m)}
                  </div>
                </MetricCard>
              ))}
            </div>

            {/* Top Languages */}
            {m.topLanguages && m.topLanguages.length > 0 && (
              <div style={{ padding: 16, borderRadius: 14,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(124,58,237,0.2)' }}>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
                  color: '#a78bfa', letterSpacing: '0.1em', marginBottom: 10 }}>
                  TOP LANGUAGES / TECHNOLOGIES
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {m.topLanguages.map((lang, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px', borderRadius: 20,
                      background: 'rgba(124,58,237,0.15)',
                      border: '1px solid rgba(124,58,237,0.25)' }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11,
                        color: '#c4b5fd', fontWeight: 600 }}>{lang.name}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9,
                        color: 'rgba(200,195,230,0.4)' }}>{lang.projects} repos</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* SKILLS TAB */}
        {activeTab === 'skills' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ padding: 16, borderRadius: 14, background: 'rgba(52,211,153,0.06)',
                border: '1px solid rgba(52,211,153,0.2)' }}>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#34d399',
                  letterSpacing: '0.1em', marginBottom: 10 }}>✅ MATCHED SKILLS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(m.matchedSkills || []).map((s, i) => <Chip key={i} label={s} color="#34d399" />)}
                  {(!m.matchedSkills || m.matchedSkills.length === 0) && (
                    <span style={{ fontSize: 11, color: 'rgba(200,195,230,0.4)',
                      fontFamily: "'DM Sans',sans-serif" }}>None found</span>
                  )}
                </div>
              </div>
              <div style={{ padding: 16, borderRadius: 14, background: 'rgba(248,113,113,0.06)',
                border: '1px solid rgba(248,113,113,0.2)' }}>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#f87171',
                  letterSpacing: '0.1em', marginBottom: 10 }}>❌ NOT FOUND IN GITHUB</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(m.unmatchedSkills || []).map((s, i) => <Chip key={i} label={s} color="#f87171" />)}
                  {(!m.unmatchedSkills || m.unmatchedSkills.length === 0) && (
                    <span style={{ fontSize: 11, color: 'rgba(200,195,230,0.4)',
                      fontFamily: "'DM Sans',sans-serif" }}>All skills verified!</span>
                  )}
                </div>
              </div>
            </div>

            {/* Per-skill verification table */}
            {m.techUsageVerification && m.techUsageVerification.length > 0 && (
              <div style={{ padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#60a5fa',
                  letterSpacing: '0.1em', marginBottom: 12 }}>📊 PER-SKILL USAGE DEPTH</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {m.techUsageVerification.map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', padding: '8px 12px',
                      borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12,
                        color: '#f1f0ff', textTransform: 'capitalize' }}>{t.skill}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11,
                          color: 'rgba(200,195,230,0.55)' }}>
                          {t.repoCount} repo{t.repoCount !== 1 ? 's' : ''}
                        </span>
                        <span style={{ fontSize: 14 }}>{t.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Code evidence */}
            {m.codeEvidenceDetails && m.codeEvidenceDetails.length > 0 && (
              <div style={{ padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#34d399',
                  letterSpacing: '0.1em', marginBottom: 12 }}>💻 CODE EVIDENCE</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {m.codeEvidenceDetails.map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '7px 12px', borderRadius: 8,
                      background: c.verified ? 'rgba(52,211,153,0.05)' : 'rgba(248,113,113,0.05)' }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11,
                        color: '#f1f0ff', textTransform: 'capitalize' }}>{c.skill}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, fontFamily: "'DM Sans',sans-serif",
                          color: c.verified ? '#34d399' : '#f87171' }}>{c.evidence}</span>
                        <span>{c.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === 'projects' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Verified projects */}
            <div style={{ padding: 16, borderRadius: 14, background: 'rgba(52,211,153,0.06)',
              border: '1px solid rgba(52,211,153,0.2)' }}>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#34d399',
                letterSpacing: '0.1em', marginBottom: 12 }}>
                ✅ VERIFIED PROJECTS ({(m.verifiedProjects || []).length})
              </div>
              {(m.verifiedProjects || []).length === 0 ? (
                <div style={{ fontSize: 12, color: 'rgba(200,195,230,0.4)',
                  fontFamily: "'DM Sans',sans-serif" }}>No resume projects matched GitHub repos</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(m.verifiedProjects || []).map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(52,211,153,0.08)' }}>
                      <div>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600,
                          fontSize: 13, color: '#f1f0ff' }}>{p.name}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10,
                          color: '#34d399', marginTop: 2 }}>→ {p.repo}</div>
                      </div>
                      {p.url && (
                        <a href={p.url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 10, padding: '3px 10px', borderRadius: 6,
                            background: 'rgba(52,211,153,0.15)', color: '#34d399',
                            textDecoration: 'none', border: '1px solid rgba(52,211,153,0.3)' }}>
                          View →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Missing projects */}
            {(m.missingProjects || []).length > 0 && (
              <div style={{ padding: 16, borderRadius: 14, background: 'rgba(248,113,113,0.06)',
                border: '1px solid rgba(248,113,113,0.2)' }}>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#f87171',
                  letterSpacing: '0.1em', marginBottom: 10 }}>
                  🚩 NOT FOUND ON GITHUB ({m.missingProjects.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {m.missingProjects.map((p, i) => <Chip key={i} label={p} color="#f87171" />)}
                </div>
              </div>
            )}

            {/* Project depth */}
            {(m.projectDepthDetails || []).length > 0 && (
              <div style={{ padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#06b6d4',
                  letterSpacing: '0.1em', marginBottom: 12 }}>📊 PROJECT DEPTH SCORES</div>
                {m.projectDepthDetails.map((p, i) => (
                  <div key={i} style={{ marginBottom: 10, padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600,
                        fontSize: 13, color: '#f1f0ff' }}>{p.name}</span>
                      <span style={{ fontSize: 12 }}>{p.depth}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {[
                        { label: 'Size', value: `${p.size}KB` },
                        { label: 'Stars', value: p.stars },
                        { label: 'Forks', value: p.forks },
                      ].map((stat, j) => (
                        <span key={j} style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
                          color: 'rgba(200,195,230,0.5)' }}>
                          {stat.label}: <span style={{ color: '#c4b5fd' }}>{stat.value}</span>
                        </span>
                      ))}
                      {p.hasHomepage && <Chip label="🚀 Deployed" color="#34d399" />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent GitHub repos */}
            {(m.recentRepos || []).length > 0 && (
              <div style={{ padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#a78bfa',
                  letterSpacing: '0.1em', marginBottom: 12 }}>📦 RECENT REPOS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {m.recentRepos.map((r, i) => (
                    <div key={i} style={{ padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600,
                            fontSize: 12, color: '#f1f0ff' }}>{r.name}</div>
                          {r.description && (
                            <div style={{ fontSize: 10, color: 'rgba(200,195,230,0.45)',
                              fontFamily: "'DM Sans',sans-serif", marginTop: 2,
                              maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap' }}>{r.description}</div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center',
                          flexShrink: 0, marginLeft: 8 }}>
                          {r.language && <Chip label={r.language} color="#a78bfa" />}
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10,
                            color: '#fbbf24' }}>⭐ {r.stars}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Experience match */}
            <div style={{ padding: 16, borderRadius: 14,
              background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#f59e0b',
                letterSpacing: '0.1em', marginBottom: 12 }}>⏳ EXPERIENCE VS ACTIVITY MATCH</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Active Months', value: m.activeMonths || 0, color: '#34d399' },
                  { label: 'Claimed Months', value: m.claimedMonths || 0, color: '#60a5fa' },
                  { label: 'Match Score', value: `${m.activityMatchScore || 0}%`, color: '#f59e0b' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '12px 8px',
                    borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800,
                      fontSize: 22, color: s.color }}>{s.value}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9,
                      color: 'rgba(200,195,230,0.4)', letterSpacing: '0.08em',
                      marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {m.claimedMonths > 0 && (m.activeMonths || 0) < m.claimedMonths * 0.3 && (
                <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
                  fontSize: 11, fontFamily: "'DM Sans',sans-serif", color: '#f87171' }}>
                  🚩 Resume claims {Math.round(m.claimedMonths / 12)} yr experience but only {m.activeMonths} active commit months detected
                </div>
              )}
            </div>

            {/* Consistency */}
            <div style={{ padding: 16, borderRadius: 14,
              background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)' }}>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#a78bfa',
                letterSpacing: '0.1em', marginBottom: 12 }}>📅 CONSISTENCY ANALYSIS</div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800,
                    fontSize: 28, color: '#a78bfa' }}>{m.longestStreak || 0}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9,
                    color: 'rgba(200,195,230,0.4)' }}>LONGEST STREAK (months)</div>
                </div>
                <div style={{ flex: 1 }}>
                  <HBar label="Consistency Score" value={m.consistencyScore || 0}
                    color="#a78bfa" delay={0.2} />
                  <HBar label="Activity Score" value={m.activityScore || 0}
                    color="#60a5fa" delay={0.3} />
                </div>
              </div>
            </div>

            {/* Deployment */}
            <div style={{ padding: 16, borderRadius: 14,
              background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)' }}>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#60a5fa',
                letterSpacing: '0.1em', marginBottom: 12 }}>🚀 DEPLOYMENT VERIFICATION</div>
              {(m.deployedDetails || []).length === 0 ? (
                <div style={{ fontSize: 11, color: 'rgba(200,195,230,0.4)',
                  fontFamily: "'DM Sans',sans-serif" }}>
                  No deployed projects detected (no homepage URLs in repos)
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {m.deployedDetails.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '8px 12px', borderRadius: 8,
                      background: 'rgba(96,165,250,0.08)' }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11,
                        color: '#f1f0ff' }}>{d.name}</span>
                      {d.url && (
                        <a href={d.url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 10, color: '#60a5fa', textDecoration: 'none' }}>
                          {d.url.slice(0, 35)}... →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All 9 scores as bars */}
            <div style={{ padding: 16, borderRadius: 14,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#34d399',
                letterSpacing: '0.1em', marginBottom: 14 }}>📊 ALL METRIC SCORES</div>
              {[
                { label: 'Skill Match', value: m.skillMatchScore || 0, color: '#10b981' },
                { label: 'Tech Usage Depth', value: m.techUsageScore || 0, color: '#3b82f6' },
                { label: 'Project Verification', value: m.projectMatchScore || 0, color: '#8b5cf6' },
                { label: 'Project Depth', value: m.projectDepthScore || 0, color: '#06b6d4' },
                { label: 'Experience vs Activity', value: m.activityMatchScore || 0, color: '#f59e0b' },
                { label: 'Tech Stack Relevance', value: m.techStackScore || 0, color: '#ec4899' },
                { label: 'Consistency', value: m.consistencyScore || 0, color: '#a78bfa' },
                { label: 'Code Evidence', value: m.codeEvidenceScore || 0, color: '#34d399' },
                { label: 'Deployment', value: m.deploymentScore || 0, color: '#60a5fa' },
                { label: '🔥 Trust Score', value: m.trustScore || 0, color: '#fbbf24' },
              ].map((bar, i) => (
                <HBar key={i} label={bar.label} value={bar.value}
                  color={bar.color} delay={i * 0.06} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ── Helper: metric detail text ─────────────────────────────────
function getMetricDetail(key, m) {
  switch (key) {
    case 'skillMatchScore':
      return `${m.matchedSkills?.length || 0} of ${m.resumeSkills?.length || 0} resume skills found in GitHub repos`;
    case 'techUsageScore':
      return `How deeply each claimed skill is actually used across projects`;
    case 'projectMatchScore':
      return `${m.verifiedProjects?.length || 0} resume projects found on GitHub. ${m.missingProjects?.length || 0} not found`;
    case 'projectDepthScore':
      return `Measures complexity and maturity of verified GitHub projects`;
    case 'activityMatchScore':
      return `${m.activeMonths || 0} active months vs ${m.claimedMonths || 0} claimed months of experience`;
    case 'techStackScore':
      return `GitHub projects align with the role implied by resume skills`;
    case 'consistencyScore':
      return `Longest commit streak: ${m.longestStreak || 0} months. Regular coding indicates genuine passion`;
    case 'codeEvidenceScore':
      return `Real implementations exist for claimed skills — not just mentioned on resume`;
    case 'deploymentScore':
      return `${m.deployedDetails?.length || 0} projects with live deployment links detected`;
    default:
      return '';
  }
}