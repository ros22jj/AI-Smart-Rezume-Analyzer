import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// ══════════════════════════════════════════════════════════════
// TEXT EXTRACTION
// ══════════════════════════════════════════════════════════════
async function readFileAsText(file) {
  if (file.type === "application/pdf") {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item) => item.str).join(" ") + "\n";
      }
      return text.trim();
    } catch (err) {
      throw new Error("Could not extract text from PDF. Try uploading as DOCX.");
    }
  } else {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
}

// ══════════════════════════════════════════════════════════════
// SMART SKILL EXTRACTION — covers 100+ tech keywords
// ══════════════════════════════════════════════════════════════
const SKILL_KEYWORDS = [
  // Languages
  "javascript","typescript","python","java","c++","c#","c","go","golang","rust","ruby","php",
  "swift","kotlin","scala","perl","r","matlab","dart","lua","haskell","elixir","clojure",
  // Frontend
  "react","next.js","nextjs","vue","nuxt","angular","svelte","html","html5","css","css3",
  "sass","scss","tailwind","bootstrap","material-ui","chakra-ui","styled-components",
  "redux","zustand","recoil","mobx","webpack","vite","babel","three.js","d3.js","jquery",
  // Backend
  "node.js","nodejs","express","nestjs","fastapi","django","flask","spring boot","spring",
  "laravel","rails","asp.net","graphql","rest api","grpc","websocket","socket.io",
  // Database
  "mongodb","mysql","postgresql","postgres","sqlite","redis","elasticsearch","cassandra",
  "dynamodb","firebase","supabase","prisma","mongoose","sequelize","typeorm",
  // Cloud / DevOps
  "aws","azure","gcp","google cloud","docker","kubernetes","k8s","terraform","ansible",
  "jenkins","github actions","ci/cd","nginx","apache","linux","bash","shell","helm",
  // Mobile
  "react native","flutter","android","ios","xcode","expo","ionic",
  // AI / ML
  "tensorflow","pytorch","keras","scikit-learn","pandas","numpy","opencv","nlp",
  "machine learning","deep learning","llm","langchain","hugging face",
  // Tools
  "git","github","gitlab","jira","figma","postman","swagger","jest","cypress","mocha",
  "pytest","junit","selenium","storybook","nx","turborepo",
];

function extractSkillsFromText(text) {
  const lower = text.toLowerCase();
  const found = new Set();
  for (const skill of SKILL_KEYWORDS) {
    // word-boundary-style check
    const escaped = skill.replace(/[.+]/g, "\\$&");
    const regex = new RegExp(`(?<![a-z])${escaped}(?![a-z])`, "i");
    if (regex.test(lower)) found.add(skill);
  }
  return [...found];
}

// ══════════════════════════════════════════════════════════════
// SMART PROJECT EXTRACTION
// ══════════════════════════════════════════════════════════════
function extractProjectsFromText(text) {
  const projects = new Set();

  // Pattern 1: "Project: XYZ" or "Projects\n XYZ"
  const labelPattern = /(?:project[s]?\s*[:\-–—]\s*)([A-Z][A-Za-z0-9 \-_]+)/gm;
  let m;
  while ((m = labelPattern.exec(text)) !== null) {
    const name = m[1].trim().slice(0, 40);
    if (name.length > 3) projects.add(name);
  }

  // Pattern 2: Capitalized noun phrases after built/developed/created
  const verbPattern = /(?:built|developed|created|designed|implemented|worked on)\s+(?:a\s+|an\s+|the\s+)?([A-Z][A-Za-z0-9 \-_]{3,35}?)(?:\s+using|\s+with|\s+in|\s+for|[.,\n])/g;
  while ((m = verbPattern.exec(text)) !== null) {
    const name = m[1].trim();
    if (name.length > 3) projects.add(name);
  }

  // Pattern 3: Lines with | github.com/user/REPONAME pattern
  const repoPattern = /github\.com\/[a-zA-Z0-9_\-]+\/([a-zA-Z0-9_\-]+)/g;
  while ((m = repoPattern.exec(text)) !== null) {
    projects.add(m[1].replace(/-/g, " ").replace(/_/g, " "));
  }

  return [...projects].slice(0, 10);
}

// ══════════════════════════════════════════════════════════════
// AUTO-DETECT GITHUB USERNAME FROM RESUME
// ══════════════════════════════════════════════════════════════
function extractGithubFromText(text) {
  // Match github.com/username — skip known non-username paths
  const patterns = [
    /github\.com\/([a-zA-Z0-9_\-]{2,39})(?:\/|$|\s|"|')/g,
    /github:\s*@?([a-zA-Z0-9_\-]{2,39})/gi,
    /github\.io\/([a-zA-Z0-9_\-]{2,39})/g,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      const username = match[1];
      // Filter out common paths that aren't usernames
      const skip = ["features","topics","explore","marketplace","enterprise","sponsors","about","login","signup","orgs","repos","pulls","issues","settings","notifications","search"];
      if (!skip.includes(username.toLowerCase())) return username;
    }
  }
  return "";
}

// ══════════════════════════════════════════════════════════════
// EXTRACT YEARS OF EXPERIENCE FROM RESUME
// ══════════════════════════════════════════════════════════════
function extractYearsExp(text) {
  const patterns = [
    /(\d+)\+?\s*years?\s+(?:of\s+)?(?:experience|exp)/i,
    /experience\s*(?:of\s+)?(\d+)\+?\s*years?/i,
    /(\d+)\+?\s*yr[s]?\s+exp/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return parseInt(m[1]);
  }
  return 1; // default 1 year if not mentioned
}

// ══════════════════════════════════════════════════════════════
// PARSE JSON SAFELY
// ══════════════════════════════════════════════════════════════
function parseJSON(raw) {
  let clean = raw.replace(/```json/gi, "").replace(/```/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  const s = clean.indexOf("{"), e = clean.lastIndexOf("}");
  if (s === -1 || e === -1) throw new Error("No valid JSON found");
  clean = clean.slice(s, e + 1);
  try { return JSON.parse(clean); } catch {}
  try { return JSON.parse(clean.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]")); } catch {}
  const scoreMatch = clean.match(/"overallScore"\s*:\s*(\d+)/);
  if (scoreMatch) {
    return {
      candidateName: clean.match(/"candidateName"\s*:\s*"([^"]+)"/)?.[1] || "Candidate",
      overallScore: parseInt(scoreMatch[1]),
      scores: Object.fromEntries(
        ["keywordMatch","skillsMatch","experienceRelevance","educationMatch","projectRelevance",
         "formattingScore","actionVerbScore","achievementScore","grammarReadability","atsCompatibility","sectionCompleteness"]
        .map(k => [k, { score: 50, details: "Partial analysis", keywords: [], matched: [], missing: [], goodVerbs: [], weakPhrases: [], examples: [], atsIssues: [], present: [], degree: "" }])
      ),
      topStrengths: ["Resume analyzed successfully"],
      criticalImprovements: ["Review detailed feedback"],
      verdict: "Analysis completed.",
    };
  }
  throw new Error("Could not parse AI response. Please try again.");
}

// ══════════════════════════════════════════════════════════════
// UPLOAD BOX COMPONENT
// ══════════════════════════════════════════════════════════════
function UploadBox({ type, accept, icon, label, color, gradientFrom, gradientTo, onFileSelect, file, onRemove, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const validate = (f) => {
    if (type === "pdf" && f.type !== "application/pdf") { alert("❌ Only PDF files!"); return false; }
    if (type === "docx" && f.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") { alert("❌ Only DOCX files!"); return false; }
    return true;
  };

  const fmt = (b) => b < 1024 * 1024 ? (b/1024).toFixed(1)+" KB" : (b/(1024*1024)).toFixed(1)+" MB";

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: disabled ? 0.35 : 1, y: 0 }}
      transition={{ duration: 0.5 }} style={{ flex: 1, minWidth: 240 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8,
          background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, boxShadow: `0 0 12px ${color}55` }}>{icon}</div>
        <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14, color: "#f1f0ff" }}>{label}</span>
        <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 100,
          background: `${color}22`, color, border: `1px solid ${color}44`,
          fontFamily: "'DM Mono',monospace", letterSpacing: "0.06em" }}>.{type.toUpperCase()} ONLY</span>
      </div>
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); if (disabled) return; const f = e.dataTransfer.files[0]; if (f && validate(f)) onFileSelect(f); }}
            onClick={() => !disabled && inputRef.current.click()}
            style={{ borderRadius: 16, border: `2px dashed ${dragging ? color : color+"44"}`,
              background: dragging ? `${color}10` : "rgba(255,255,255,0.02)",
              padding: "28px 20px", textAlign: "center",
              cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.25s",
              position: "relative", overflow: "hidden" }}>
            {disabled && (
              <div style={{ position: "absolute", inset: 0, borderRadius: 16,
                background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center",
                justifyContent: "center", zIndex: 2, flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 22 }}>🔒</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10,
                  color: "rgba(200,195,230,0.6)", letterSpacing: "0.08em" }}>LOCKED</span>
              </div>
            )}
            <motion.div animate={dragging ? { scale: 1.2, y: -4 } : { scale: 1, y: 0 }}
              style={{ fontSize: 34, marginBottom: 10 }}>{dragging ? "📂" : icon}</motion.div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 13,
              color: "#f1f0ff", marginBottom: 4 }}>{dragging ? "Drop it!" : `Drag & drop .${type.toUpperCase()}`}</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11,
              color: "rgba(200,195,230,0.5)", marginBottom: 14 }}>or click to browse</div>
            <div style={{ display: "inline-block", padding: "8px 20px", borderRadius: 9,
              background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
              color: "#fff", fontSize: 12, fontWeight: 600, fontFamily: "'Outfit',sans-serif",
              boxShadow: `0 0 14px ${color}44` }}>Choose .{type.toUpperCase()}</div>
            <input ref={inputRef} type="file" accept={accept}
              onChange={(e) => { const f = e.target.files[0]; if (f && validate(f)) onFileSelect(f); e.target.value = ""; }}
              style={{ display: "none" }} />
          </motion.div>
        ) : (
          <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{ borderRadius: 16, border: `1.5px solid ${color}55`,
              background: `${color}0c`, padding: "18px", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, boxShadow: `0 0 16px ${color}55` }}>{icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13,
                  color: "#f1f0ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10,
                  color: `${color}cc`, marginTop: 2 }}>{fmt(file.size)} · .{type.toUpperCase()}</div>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onRemove}
                style={{ width: 28, height: 28, borderRadius: 7,
                  border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.1)",
                  color: "#f87171", fontSize: 13, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>✕</motion.button>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }}
                  transition={{ duration: 0.8 }}
                  style={{ height: "100%", borderRadius: 2,
                    background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`,
                    boxShadow: `0 0 6px ${color}` }} />
              </div>
            </div>
            <input ref={inputRef} type="file" accept={accept}
              onChange={(e) => { const f = e.target.files[0]; if (f && validate(f)) onFileSelect(f); e.target.value = ""; }}
              style={{ display: "none" }} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// JD TEXT BOX
// ══════════════════════════════════════════════════════════════
function JDTextBox({ jdText, setJdText }) {
  const maxChars = 800;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8,
          background: "linear-gradient(135deg, #059669, #34d399)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, boxShadow: "0 0 12px #34d39955" }}>💼</div>
        <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14, color: "#f1f0ff" }}>Job Description</span>
      </div>
      <textarea value={jdText} onChange={(e) => setJdText(e.target.value.slice(0, maxChars))}
        placeholder={`Paste key parts of job description here...\n\nExample:\nJob Title: Frontend Developer\nRequired: React.js, Node.js, JavaScript\nQualifications: B.Tech CSE, 0-2 years`}
        style={{ width: "100%", minHeight: 160, borderRadius: 14, padding: "14px 16px",
          background: "rgba(255,255,255,0.03)",
          border: jdText ? "1.5px solid #34d39966" : "2px dashed #34d39944",
          color: "#f1f0ff", fontSize: 13, fontFamily: "'DM Sans',sans-serif",
          lineHeight: 1.7, resize: "vertical", outline: "none", boxSizing: "border-box" }}
        onFocus={(e) => e.target.style.border = "1.5px solid #34d399"}
        onBlur={(e) => e.target.style.border = jdText ? "1.5px solid #34d39966" : "2px dashed #34d39944"} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10,
          color: jdText.length > maxChars * 0.9 ? "#f87171" : "rgba(200,195,230,0.4)" }}>
          {jdText.length}/{maxChars}
        </span>
        {jdText && (
          <motion.button whileHover={{ scale: 1.05 }} onClick={() => setJdText("")}
            style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
              color: "#f87171", fontSize: 11, padding: "3px 10px", borderRadius: 6,
              cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Clear</motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// LOADING SCREEN
// ══════════════════════════════════════════════════════════════
function LoadingScreen({ hasGithub }) {
  const steps = [
    "Parsing resume content...",
    "Extracting skills & projects...",
    "Analyzing job description...",
    ...(hasGithub ? [
      "🐙 Connecting to GitHub API...",
      "📦 Fetching repositories...",
      "🔬 Analyzing tech usage per skill...",
      "📁 Verifying projects on GitHub...",
      "⏳ Checking activity vs experience...",
      "🚀 Detecting deployed projects...",
      "🔥 Computing Trust Score...",
    ] : []),
    "Checking ATS compatibility...",
    "Scoring grammar & readability...",
    "Calculating achievement impact...",
    "Generating full report...",
  ];

  const [current, setCurrent] = useState(0);
  useState(() => {
    const interval = setInterval(() => setCurrent((p) => (p + 1) % steps.length), 900);
    return () => clearInterval(interval);
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ textAlign: "center", padding: "80px 24px" }}>
      <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 32px" }}>
        {[0, 1, 2].map((i) => (
          <motion.div key={i} animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 1.8, delay: i * 0.5, repeat: Infinity }}
            style={{ position: "absolute", inset: 0, borderRadius: "50%",
              border: "2px solid rgba(124,58,237,0.5)" }} />
        ))}
        <div style={{ position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: 36 }}>🧠</div>
      </div>
      <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700,
        fontSize: 22, color: "#f1f0ff", marginBottom: 10 }}>
        {hasGithub ? "Analyzing Resume + GitHub..." : "Groq AI is Analyzing..."}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: "#a78bfa", letterSpacing: "0.08em" }}>
          {steps[current]}
        </motion.div>
      </AnimatePresence>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 24 }}>
        {steps.slice(0, 10).map((_, i) => (
          <motion.div key={i}
            animate={{ scale: i === current ? 1.4 : 1,
              background: i === current ? "#7c3aed" : "rgba(124,58,237,0.25)" }}
            style={{ width: 8, height: 8, borderRadius: "50%", transition: "all 0.3s" }} />
        ))}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function UploadResume({ onAnalysisComplete }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [docxFile, setDocxFile] = useState(null);
  const [jdText, setJdText] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [detectedGithub, setDetectedGithub] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const resumeFile = pdfFile || docxFile;
  const canAnalyze = resumeFile && jdText.trim().length >= 20;

  // Auto-detect GitHub from resume when file selected
  const handleFileSelect = async (file, type) => {
    if (type === "pdf") { setPdfFile(file); setDocxFile(null); }
    else { setDocxFile(file); setPdfFile(null); }

    try {
      const text = await readFileAsText(file);
      const detected = extractGithubFromText(text);
      if (detected && !githubUsername) {
        setDetectedGithub(detected);
        setGithubUsername(detected);
      }
    } catch {}
  };

  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    setAnalyzing(true);

    try {
      const resumeText = await readFileAsText(resumeFile);
      if (!resumeText || resumeText.length < 10) {
        alert("❌ Could not extract text from resume. Try DOCX instead.");
        setAnalyzing(false);
        return;
      }

      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        alert("❌ Groq API key not found! Add VITE_GROQ_API_KEY to client/.env");
        setAnalyzing(false);
        return;
      }

      const shortResume = resumeText.slice(0, 1500);
      const shortJD = jdText.slice(0, 800);

      // ── Groq AI analysis ───────────────────────────────────
      const prompt = `You are an ATS resume analyzer. Analyze the resume vs job description.
Return ONLY a valid JSON object. No text before or after. No markdown. No backticks.

{
  "candidateName": "full name from resume",
  "overallScore": 75,
  "scores": {
    "keywordMatch": { "score": 70, "details": "explanation", "keywords": ["React", "Node.js"] },
    "skillsMatch": { "score": 80, "details": "explanation", "matched": ["React"], "missing": ["Docker"] },
    "experienceRelevance": { "score": 60, "details": "explanation" },
    "educationMatch": { "score": 90, "details": "explanation", "degree": "B.Tech CSE" },
    "projectRelevance": { "score": 70, "details": "explanation" },
    "formattingScore": { "score": 75, "details": "explanation", "atsIssues": ["issue1"] },
    "actionVerbScore": { "score": 80, "details": "explanation", "goodVerbs": ["Built"], "weakPhrases": ["Worked on"] },
    "achievementScore": { "score": 65, "details": "explanation", "examples": ["example1"] },
    "grammarReadability": { "score": 85, "details": "explanation", "fleschScore": 65 },
    "atsCompatibility": { "score": 70, "details": "explanation" },
    "sectionCompleteness": { "score": 75, "details": "explanation", "present": ["Skills"], "missing": ["Certifications"] }
  },
  "topStrengths": ["strength1", "strength2", "strength3"],
  "criticalImprovements": ["improvement1", "improvement2", "improvement3"],
  "verdict": "Overall assessment"
}

RESUME:
${shortResume}

JOB DESCRIPTION:
${shortJD}`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: "You are an ATS resume analyzer. Always respond with valid JSON only. No markdown, no backticks, no explanation." },
            { role: "user", content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        alert(`❌ Groq Error: ${err?.error?.message || "Check your API key"}`);
        setAnalyzing(false);
        return;
      }

      const data = await response.json();
      const raw = data?.choices?.[0]?.message?.content;
      if (!raw) { alert("❌ Empty response from Groq. Try again."); setAnalyzing(false); return; }

      const result = parseJSON(raw);

      // ── GitHub metrics ─────────────────────────────────────
      let githubMetrics = {};
      const usernameToUse = githubUsername.trim();

      if (usernameToUse) {
        try {
          // Smart extractions
          const resumeSkills = extractSkillsFromText(resumeText);
          const resumeProjects = extractProjectsFromText(resumeText);
          const claimedYears = extractYearsExp(resumeText);

          console.log("🔍 Extracted skills:", resumeSkills);
          console.log("🔍 Extracted projects:", resumeProjects);
          console.log("🔍 Claimed years:", claimedYears);

          const ghResponse = await fetch("http://localhost:5000/api/github-analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              githubUsername: usernameToUse,
              resumeText: shortResume,
              resumeSkills,
              resumeProjects,
              claimedYears,
            }),
          });

          const ghData = await ghResponse.json();
          if (ghData.success) {
            githubMetrics = ghData.githubMetrics;
            console.log("✅ GitHub metrics received:", Object.keys(githubMetrics));
          } else {
            console.warn("⚠️ GitHub analysis failed:", ghData.error);
          }
        } catch (ghErr) {
          console.warn("⚠️ GitHub metrics error:", ghErr.message);
        }
      }

      result.githubMetrics = githubMetrics;
      result.githubUsername = usernameToUse;

      setAnalyzing(false);
      onAnalysisComplete(result, resumeFile.name);

    } catch (err) {
      console.error("Error:", err);
      setAnalyzing(false);
      alert(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div style={{ minHeight: "100vh",
      background: "linear-gradient(145deg, #06040f 0%, #0e0720 40%, #060c1c 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 24px", position: "relative", overflow: "hidden" }}>

      {/* BG effects */}
      <div style={{ position: "fixed", width: 600, height: 600, borderRadius: "50%", top: "-15%", left: "-10%",
        background: "radial-gradient(circle, rgba(109,40,217,0.3) 0%, transparent 70%)",
        filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", width: 500, height: 500, borderRadius: "50%", bottom: "-15%", right: "-10%",
        background: "radial-gradient(circle, rgba(29,78,216,0.35) 0%, transparent 70%)",
        filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", inset: 0,
        backgroundImage: `linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)`,
        backgroundSize: "60px 60px", pointerEvents: "none" }} />

      <AnimatePresence mode="wait">
        {analyzing ? (
          <LoadingScreen key="loading" hasGithub={!!githubUsername.trim()} />
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ width: "100%", maxWidth: 860, position: "relative", zIndex: 1 }}>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: "center", marginBottom: 40 }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 16px",
                  background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, boxShadow: "0 0 40px rgba(124,58,237,0.5)" }}>📋</motion.div>
              <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800,
                fontSize: "clamp(22px, 4vw, 34px)", color: "#f1f0ff", marginBottom: 8 }}>
                Upload Resume & Job Description
              </h2>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14,
                color: "rgba(200,195,230,0.65)" }}>
                Upload your resume and paste the job description to get your full AI analysis
              </p>
            </motion.div>

            {/* Step 1 — Upload */}
            <div style={{ padding: "24px", borderRadius: 20,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10,
                color: "#a78bfa", letterSpacing: "0.12em", marginBottom: 16 }}>
                STEP 1 — UPLOAD YOUR RESUME (PDF or DOCX — pick one)
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <UploadBox type="pdf" accept=".pdf,application/pdf" icon="📄" label="PDF Resume"
                  color="#60a5fa" gradientFrom="#2563eb" gradientTo="#0ea5e9"
                  onFileSelect={(f) => handleFileSelect(f, "pdf")}
                  file={pdfFile} onRemove={() => setPdfFile(null)} disabled={!!docxFile} />
                <UploadBox type="docx" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  icon="📝" label="DOCX Resume" color="#a78bfa" gradientFrom="#7c3aed" gradientTo="#6d28d9"
                  onFileSelect={(f) => handleFileSelect(f, "docx")}
                  file={docxFile} onRemove={() => setDocxFile(null)} disabled={!!pdfFile} />
              </div>
            </div>

            {/* Step 2 — JD */}
            <div style={{ padding: "24px", borderRadius: 20,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10,
                color: "#34d399", letterSpacing: "0.12em", marginBottom: 16 }}>
                STEP 2 — PASTE JOB DESCRIPTION
              </div>
              <JDTextBox jdText={jdText} setJdText={setJdText} />
            </div>

            {/* Step 3 — GitHub */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: "24px", borderRadius: 20,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 28 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10,
                color: "#f59e0b", letterSpacing: "0.12em", marginBottom: 14 }}>
                STEP 3 — GITHUB USERNAME (OPTIONAL — for 10-metric verification)
              </div>
              <input type="text" value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value.trim())}
                placeholder="e.g., torvalds"
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12,
                  border: "1px solid rgba(234,179,8,0.3)",
                  background: "rgba(251,191,36,0.06)", color: "#f1f0ff", fontSize: 14,
                  fontFamily: "'DM Mono',monospace", outline: "none", boxSizing: "border-box" }} />
              {detectedGithub && (
                <div style={{ marginTop: 8, fontSize: 11, fontFamily: "'DM Sans',sans-serif",
                  color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>✅</span>
                  <span>Auto-detected from resume: <strong>@{detectedGithub}</strong></span>
                </div>
              )}
              {!detectedGithub && (
                <div style={{ fontSize: 11, color: "rgba(251,191,36,0.6)", marginTop: 6,
                  fontFamily: "'DM Sans',sans-serif" }}>
                  GitHub link detected in resume will auto-fill this field. Unlocks 10 verification metrics.
                </div>
              )}
              {githubUsername && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10,
                    background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <div style={{ fontSize: 12, color: "#34d399", fontFamily: "'DM Sans',sans-serif",
                    fontWeight: 600, marginBottom: 4 }}>
                    🐙 Will analyze @{githubUsername} with all 10 metrics:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {["Skill Match","Tech Usage","Project Verification","Project Depth",
                      "Activity Match","Tech Stack","Consistency","Code Evidence","Deployment","Trust Score"]
                      .map((m, i) => (
                        <span key={i} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 100,
                          background: 'rgba(16,185,129,0.1)', color: '#34d399',
                          border: '1px solid rgba(16,185,129,0.2)', fontFamily: "'DM Mono',monospace" }}>
                          {m}
                        </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Analyze button */}
            <AnimatePresence>
              {canAnalyze && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} style={{ textAlign: "center" }}>
                  <motion.button whileHover={{ scale: 1.06, boxShadow: "0 0 60px rgba(124,58,237,0.75)" }}
                    whileTap={{ scale: 0.96 }} onClick={handleAnalyze}
                    style={{ padding: "18px 64px", borderRadius: 18, border: "none",
                      background: "linear-gradient(135deg, #7c3aed, #4f46e5, #2563eb)",
                      color: "#fff", fontSize: 18, fontWeight: 800,
                      fontFamily: "'Outfit',sans-serif", cursor: "pointer",
                      boxShadow: "0 0 36px rgba(124,58,237,0.5)",
                      letterSpacing: "0.04em", position: "relative", overflow: "hidden" }}>
                    <motion.div animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                        pointerEvents: "none" }} />
                    {githubUsername ? "🔍 CHECK + VERIFY GITHUB" : "🔍 CHECK"}
                  </motion.button>
                  <div style={{ marginTop: 10, fontFamily: "'DM Mono',monospace",
                    fontSize: 10, color: "rgba(167,139,250,0.5)", letterSpacing: "0.1em" }}>
                    POWERED BY GROQ AI · LLAMA 3{githubUsername ? " + GITHUB API" : ""}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=DM+Sans:wght@400;500&family=DM+Mono:wght@400;500&display=swap');
        textarea::placeholder { color: rgba(200,195,230,0.25); }
        textarea::-webkit-scrollbar { width: 4px; }
        textarea::-webkit-scrollbar-track { background: transparent; }
        textarea::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.4); border-radius: 2px; }
        input::placeholder { color: rgba(200,195,230,0.3); }
      `}</style>
    </div>
  );
}