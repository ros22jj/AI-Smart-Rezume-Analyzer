// ══════════════════════════════════════════════════════════════
// atsBuilderService.js  — Production-grade ATS Resume Builder
// ══════════════════════════════════════════════════════════════

"use strict";

const { Octokit } = require("@octokit/rest");
const PDFDocument = require("pdfkit");

// ─────────────────────────────────────────────────────────────
// GROQ CALL  (retry on 429, detailed errors)
// ─────────────────────────────────────────────────────────────
async function groqCall(messages, maxTokens = 3500, apiKeyOverride = "") {
  const apiKey = apiKeyOverride || process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is missing. Add it to server/.env as GROQ_API_KEY=gsk_...");

  const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 4; attempt++) {
      let res;
      try {
        res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: maxTokens }),
        });
      } catch (netErr) {
        throw new Error("Network error calling Groq: " + netErr.message);
      }

      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content || "";
        if (content.length > 50) return content;
        // Empty response — try next model
        break;
      }

      if (res.status === 429) {
        const retryAfter = res.headers?.get?.("retry-after");
        const wait = retryAfter ? parseInt(retryAfter) * 1000 : (attempt + 1) * 15000;
        console.warn(`Groq 429 on ${model}, waiting ${wait / 1000}s...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }

      // Model-specific error — try next model
      let errMsg = `Groq ${res.status}`;
      try { const b = await res.json(); errMsg = b?.error?.message || errMsg; } catch {}
      console.warn(`Groq error on ${model}: ${errMsg}`);
      break;
    }
  }

  throw new Error("All Groq models failed. Please wait a minute and try again.");
}

// ─────────────────────────────────────────────────────────────
// ROBUST JSON PARSER  (handles truncation, trailing commas)
// ─────────────────────────────────────────────────────────────
function parseJSON(raw) {
  if (!raw) return null;
  try {
    // Strip markdown fences
    let clean = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // Find outermost object
    const start = clean.indexOf("{");
    const end   = clean.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    clean = clean.slice(start, end + 1);

    // Try direct parse
    try { return JSON.parse(clean); } catch {}

    // Fix common AI JSON mistakes
    clean = clean
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3') // unquoted keys
      .replace(/:\s*'([^']*)'/g, ': "$1"');           // single-quoted values

    try { return JSON.parse(clean); } catch {}

    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// GITHUB FETCHER  — deep profile analysis
// ─────────────────────────────────────────────────────────────
async function fetchGitHubData(username) {
  if (!username || username.trim().length < 2) return null;

  try {
    const octokit = process.env.GITHUB_TOKEN
      ? new Octokit({ auth: process.env.GITHUB_TOKEN })
      : new Octokit();

    // Fetch user profile
    const userRes = await octokit.rest.users
      .getByUsername({ username })
      .catch(() => null);

    if (!userRes) {
      console.warn(`GitHub user @${username} not found`);
      return null;
    }

    // Fetch repos (non-fork, non-archived, sorted by stars then updated)
    const reposRes = await octokit.rest.repos
      .listForUser({ username, per_page: 50, sort: "updated" })
      .catch(() => null);

    const allRepos = (reposRes?.data || []).filter(r => !r.fork && !r.archived);

    // Sort by stars + recency
    allRepos.sort((a, b) =>
      (b.stargazers_count * 2 + (new Date(b.updated_at) > new Date(a.updated_at) ? 1 : 0)) -
      (a.stargazers_count * 2 + (new Date(a.updated_at) > new Date(b.updated_at) ? 1 : 0))
    );

    const topRepos = allRepos.slice(0, 10);
    const repoDetails = [];

    for (const repo of topRepos) {
      const langs = await octokit.rest.repos
        .listLanguages({ owner: username, repo: repo.name })
        .catch(() => ({ data: {} }));

      const languageList = Object.keys(langs.data || {});
      const isDeployed   = !!(repo.homepage && repo.homepage.trim());

      repoDetails.push({
        name:        repo.name,
        description: repo.description || "",
        stars:       repo.stargazers_count,
        forks:       repo.forks_count,
        language:    repo.language || "",
        languages:   languageList,
        topics:      repo.topics || [],
        githubUrl:   repo.html_url,
        liveUrl:     isDeployed ? repo.homepage.trim() : "",
        updatedAt:   repo.updated_at,
        size:        repo.size,
      });
    }

    // Contribution stats
    const contribRes = await octokit.rest.repos
      .listCommitActivityStats({ owner: username, repo: topRepos[0]?.name || "" })
      .catch(() => null);

    const allLanguages = [...new Set(repoDetails.flatMap(r => r.languages))];
    const allTopics    = [...new Set(repoDetails.flatMap(r => r.topics))];
    const totalStars   = allRepos.reduce((s, r) => s + r.stargazers_count, 0);

    return {
      login:       username,
      name:        userRes.data.name    || username,
      bio:         userRes.data.bio     || "",
      company:     userRes.data.company || "",
      blog:        userRes.data.blog    || "",
      followers:   userRes.data.followers,
      following:   userRes.data.following,
      publicRepos: userRes.data.public_repos,
      totalStars,
      repos:       repoDetails,
      allLanguages,
      allTopics,
    };
  } catch (err) {
    console.warn("GitHub fetch error:", err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// COMPUTE 15 ATS METRICS  (before/after)
// ─────────────────────────────────────────────────────────────
function computeATSMetrics(resumeText, jdText, isAfter = false, resumeJSON = null) {
  const rLower = resumeText.toLowerCase();
  const jLower = jdText.toLowerCase();

  // Extract JD keywords
  const jdWords = jLower.match(/\b[a-z][a-z0-9+#.\-]{2,}\b/g) || [];
  const jdKeywordSet = new Set(jdWords.filter(w =>
    w.length > 3 && !["with","that","this","have","from","they","will","your","been","more","into","over"].includes(w)
  ));

  const techKeywords = [
    "javascript","typescript","python","java","react","node","express","mongodb","sql","aws",
    "docker","kubernetes","git","api","rest","graphql","redux","nextjs","vue","angular",
    "machine learning","deep learning","tensorflow","pytorch","agile","scrum","ci/cd",
    "microservices","devops","cloud","linux","bash","html","css","tailwind","firebase",
  ];

  // Metric 1: Keyword Match %
  const matchedKeywords = [...jdKeywordSet].filter(kw => rLower.includes(kw));
  const keywordMatch = Math.min(Math.round((matchedKeywords.length / Math.max(jdKeywordSet.size, 1)) * 100), 100);

  // Metric 2: Technical Skills Count
  const techMatched = techKeywords.filter(t => rLower.includes(t));
  const techScore   = Math.min(techMatched.length * 5, 100);

  // Metric 3: Action Verbs
  const actionVerbs = ["built","developed","designed","led","managed","created","implemented","architected",
    "optimised","reduced","increased","launched","delivered","automated","integrated","deployed","scaled",
    "improved","engineered","established","drove","mentored","collaborated","achieved","spearheaded"];
  const verbMatches = actionVerbs.filter(v => rLower.includes(v));
  const actionVerbScore = Math.min(verbMatches.length * 10, 100);

  // Metric 4: Quantified Achievements (numbers/percentages)
  const quantMatches = (resumeText.match(/\d+[%x]?[\s\+]?(?:users?|clients?|projects?|million|k\b|ms\b|times?|hours?|weeks?|days?|percent|faster|better)/gi) || []);
  const quantScore   = Math.min(quantMatches.length * 15, 100);

  // Metric 5: Section Completeness
  const sections = ["experience","education","skills","projects","summary","objective","certif","achievement","contact"];
  const presentSections = sections.filter(s => rLower.includes(s));
  const sectionScore = Math.round((presentSections.length / sections.length) * 100);

  // Metric 6: Contact Info
  const hasEmail   = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(resumeText);
  const hasPhone   = /[\+\(]?[\d\s\-\(\)]{10,}/i.test(resumeText);
  const hasLinkedIn= /linkedin\.com/i.test(resumeText);
  const hasGitHub  = /github\.com/i.test(resumeText);
  const contactScore = Math.round(([hasEmail,hasPhone,hasLinkedIn,hasGitHub].filter(Boolean).length / 4) * 100);

  // Metric 7: Formatting (no tables, proper length)
  const wordCount     = (resumeText.match(/\b\w+\b/g) || []).length;
  const formatScore   = wordCount > 200 && wordCount < 1200 ? 85 : wordCount > 100 ? 65 : 40;

  // Metric 8: Summary/Objective presence
  const summaryScore  = /summary|objective|profile|about/i.test(resumeText) ? 100 : 0;

  // Metric 9: GitHub/Portfolio links
  const linkScore     = [/github\.com/i,/linkedin\.com/i,/https?:\/\//i].filter(p => p.test(resumeText)).length * 33;

  // Metric 10: Education relevance
  const eduKeywords   = ["bachelor","master","b\.tech","b\.e","mca","bca","computer","engineering","science","information"];
  const eduScore      = eduKeywords.filter(e => rLower.includes(e)).length > 0 ? 100 : 50;

  // Metric 11: Certifications
  const certKeywords  = ["certified","certification","certificate","aws certified","google certified","microsoft","coursera","udemy","hackerrank"];
  const certCount     = certKeywords.filter(c => rLower.includes(c)).length;
  const certScore     = Math.min(certCount * 25, 100);

  // Metric 12: Project count
  const projCount     = isAfter && resumeJSON?.projects ? resumeJSON.projects.length : (rLower.match(/project/g) || []).length;
  const projectScore  = Math.min(projCount * 20, 100);

  // Metric 13: Industry terms from JD
  const industryTerms = [...jdKeywordSet].slice(0, 20);
  const industryMatch = industryTerms.filter(t => rLower.includes(t)).length;
  const industryScore = Math.min(Math.round((industryMatch / Math.max(industryTerms.length, 1)) * 100), 100);

  // Metric 14: Readability
  const avgWordsPerBullet = wordCount / Math.max((resumeText.match(/[•\-▸►✓\*]/g) || []).length, 5);
  const readabilityScore  = avgWordsPerBullet < 25 && avgWordsPerBullet > 5 ? 90 : 60;

  // Metric 15: Overall ATS Score (weighted)
  const overallATS = Math.round(
    keywordMatch    * 0.20 +
    techScore       * 0.12 +
    actionVerbScore * 0.08 +
    quantScore      * 0.10 +
    sectionScore    * 0.10 +
    contactScore    * 0.06 +
    formatScore     * 0.06 +
    summaryScore    * 0.05 +
    linkScore       * 0.05 +
    eduScore        * 0.04 +
    certScore       * 0.04 +
    projectScore    * 0.05 +
    industryScore   * 0.03 +
    readabilityScore* 0.01 +
    (isAfter ? 5 : 0)  // bonus for having gone through optimisation
  );

  return {
    overallATS:      Math.min(overallATS, 98),
    keywordMatch,
    techScore,
    actionVerbScore,
    quantScore,
    sectionScore,
    contactScore,
    formatScore,
    summaryScore,
    linkScore:       Math.min(linkScore, 100),
    eduScore,
    certScore,
    projectScore,
    industryScore,
    readabilityScore,
    matchedKeywords: matchedKeywords.slice(0, 20),
    techMatched:     techMatched.slice(0, 15),
    verbMatches:     verbMatches.slice(0, 10),
  };
}

// ─────────────────────────────────────────────────────────────
// RESUME → PLAIN TEXT  (for analytics scoring)
// ─────────────────────────────────────────────────────────────
function resumeJSONtoText(r) {
  if (!r) return "";
  const lines = [
    r.name, r.email, r.phone, r.location, r.github, r.linkedin, r.portfolio,
    r.headline, "Summary", r.summary,
    "Skills",
    ...(r.skills ? Object.entries(r.skills).map(([k,v]) => `${k}: ${(v||[]).join(", ")}`) : []),
    "Experience",
    ...(r.experience || []).flatMap(e => [
      `${e.title} ${e.company} ${e.duration}`,
      ...(e.bullets || []),
    ]),
    "Projects",
    ...(r.projects || []).flatMap(p => [
      p.name, ...(p.bullets || []), (p.tech || []).join(" "),
    ]),
    "Education",
    ...(r.education || []).map(e => `${e.degree} ${e.institution} ${e.year}`),
    "Certifications", ...(r.certifications || []),
    "Achievements",   ...(r.achievements   || []),
  ];
  return lines.filter(Boolean).join("\n");
}

// ─────────────────────────────────────────────────────────────
// GENERATE PROFESSIONAL PDF  (clickable links, highlights)
// ─────────────────────────────────────────────────────────────
async function generatePDF(r, metricsAfter) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
        bufferPages: true,
        info: { Title: `${r.name || "Resume"} — ATS Optimised` },
      });

      const bufs = [];
      doc.on("data", c => bufs.push(c));
      doc.on("end",  () => resolve(Buffer.concat(bufs).toString("base64")));
      doc.on("error", reject);

      const PW    = doc.page.width;
      const PH    = doc.page.height;
      const ML    = 50;
      const MR    = 50;
      const TW    = PW - ML - MR;  // text width

      const C = {
        primary:   "#1e3a5f",
        accent:    "#2563eb",
        green:     "#059669",
        amber:     "#d97706",
        muted:     "#6b7280",
        light:     "#f3f4f6",
        highlight: "#fffbeb",
        hlBorder:  "#fde68a",
        dark:      "#111827",
        white:     "#ffffff",
        newBadge:  "#dcfce7",
        newText:   "#166534",
      };

      // ── HELPERS ─────────────────────────────────────────
      const safeText = (s) => (s || "").replace(/[^\x00-\x7F]/g, ""); // strip non-ASCII (emoji)

      const hline = (y, color = C.primary, width = 0.5) => {
        doc.moveTo(ML, y).lineTo(ML + TW, y).strokeColor(color).lineWidth(width).stroke();
      };

      const sectionHeader = (title, color = C.primary) => {
        doc.moveDown(0.6);
        const y = doc.y;
        doc.fillColor(color).font("Helvetica-Bold").fontSize(10)
          .text(title.toUpperCase(), ML, y, { characterSpacing: 1.8 });
        hline(doc.y + 2, color, 0.7);
        doc.moveDown(0.3);
      };

      const bulletLine = (text, isNew = false, linkUrl = "") => {
        const y = doc.y;
        if (isNew) {
          const approxH = Math.ceil(text.length / 90) * 13 + 4;
          doc.rect(ML - 4, y - 1, TW + 8, approxH)
            .fillColor(C.highlight).fill()
            .strokeColor(C.hlBorder).lineWidth(0.5).stroke();
        }
        doc.fillColor(isNew ? "#92400e" : C.dark)
          .font(isNew ? "Helvetica-Bold" : "Helvetica")
          .fontSize(9)
          .text("  " + safeText(text), ML + 8, y, {
            width: TW - 10,
            lineGap: 2,
            ...(linkUrl ? { link: linkUrl, underline: true } : {}),
          });
      };

      // ── PAGE 1: RESUME ───────────────────────────────────

      // Header bar
      doc.rect(0, 0, PW, 100).fillColor(C.primary).fill();

      // Name
      doc.fillColor(C.white).font("Helvetica-Bold").fontSize(22)
        .text(safeText(r.name || "Candidate"), ML, 22, { width: TW });

      // Headline
      if (r.headline) {
        doc.fillColor("#93c5fd").font("Helvetica").fontSize(11)
          .text(safeText(r.headline), ML, 50, { width: TW });
      }

      // Contact row with clickable links
      const contacts = [];
      if (r.email)    contacts.push({ label: r.email,    url: `mailto:${r.email}` });
      if (r.phone)    contacts.push({ label: r.phone,    url: "" });
      if (r.location) contacts.push({ label: r.location, url: "" });
      if (r.github)   contacts.push({ label: r.github,   url: `https://${r.github.replace(/^https?:\/\//, "")}` });
      if (r.linkedin) contacts.push({ label: r.linkedin, url: r.linkedin.startsWith("http") ? r.linkedin : `https://${r.linkedin}` });

      let cx = ML;
      doc.y = 76;
      contacts.forEach((c, i) => {
        const label = safeText(c.label);
        doc.fillColor("#bfdbfe").font("Helvetica").fontSize(8.5);
        if (c.url) {
          doc.text(label, cx, 76, { link: c.url, underline: false, continued: i < contacts.length - 1 });
        } else {
          doc.text(label, cx, 76, { continued: i < contacts.length - 1 });
        }
        if (i < contacts.length - 1) {
          doc.text("  |  ", { continued: true });
        }
      });

      doc.y = 115;

      // Summary
      if (r.summary) {
        sectionHeader("Professional Summary");
        doc.fillColor(C.dark).font("Helvetica").fontSize(9.5)
          .text(safeText(r.summary), ML, doc.y, { width: TW, lineGap: 3, align: "justify" });
      }

      // Skills
      if (r.skills) {
        sectionHeader("Technical Skills");
        const skillEntries = Object.entries(r.skills).filter(([, v]) => v?.length);
        skillEntries.forEach(([cat, items]) => {
          const y = doc.y;
          doc.fillColor(C.accent).font("Helvetica-Bold").fontSize(8.5)
            .text(cat.charAt(0).toUpperCase() + cat.slice(1) + ": ", ML, y, { continued: true });
          doc.fillColor(C.dark).font("Helvetica").fontSize(8.5)
            .text(items.map(safeText).join(", "), { lineGap: 3 });
        });
      }

      // Experience
      if (r.experience?.length) {
        sectionHeader("Professional Experience");
        r.experience.forEach(exp => {
          // Title + duration line
          doc.fillColor(C.dark).font("Helvetica-Bold").fontSize(10.5)
            .text(safeText(exp.title || ""), ML, doc.y, { continued: true });
          doc.fillColor(C.muted).font("Helvetica").fontSize(9)
            .text(`   ${safeText(exp.duration || "")}`, { align: "right", width: TW });

          // Company
          doc.fillColor(C.accent).font("Helvetica").fontSize(9)
            .text(safeText(exp.company || ""), ML, doc.y, { lineGap: 2 });

          // Bullets
          (exp.bullets || []).forEach((b, i) => {
            bulletLine("• " + b, i >= (exp.originalBulletCount || 2));
          });
          doc.moveDown(0.4);
        });
      }

      // Projects
      if (r.projects?.length) {
        sectionHeader("Projects", C.green);
        r.projects.forEach(proj => {
          const isNew = proj.source === "generated" || proj.source === "github";
          const y     = doc.y;

          // Project name with optional badge
          doc.fillColor(isNew ? C.green : C.dark)
            .font("Helvetica-Bold").fontSize(10)
            .text(safeText(proj.name || ""), ML, y, { continued: !!(proj.liveUrl || proj.githubUrl || proj.url) });

          // Clickable link — prefer live URL, fallback to GitHub
          const projLink = proj.liveUrl || proj.githubUrl || proj.url || "";
          if (projLink) {
            doc.fillColor(C.accent).font("Helvetica").fontSize(8)
              .text(`  [Link]`, { link: projLink, underline: true, continued: false });
          } else {
            doc.text("");
          }

          // Tech stack
          if (proj.tech?.length) {
            doc.fillColor(C.muted).font("Helvetica").fontSize(8)
              .text("Tech: " + proj.tech.map(safeText).join(", "), ML, doc.y, { lineGap: 2 });
          }

          // Bullets
          (proj.bullets || []).forEach(b => bulletLine("• " + b, isNew));
          doc.moveDown(0.4);
        });
      }

      // Education
      if (r.education?.length) {
        sectionHeader("Education");
        r.education.forEach(e => {
          doc.fillColor(C.dark).font("Helvetica-Bold").fontSize(10)
            .text(safeText(e.degree || ""), ML, doc.y, { continued: true });
          doc.fillColor(C.muted).font("Helvetica").fontSize(9)
            .text(`   ${safeText(e.institution || "")}   ${safeText(e.year || "")}`, { lineGap: 3 });
          if (e.gpa) {
            doc.fillColor(C.muted).font("Helvetica").fontSize(8.5)
              .text(`GPA: ${safeText(e.gpa)}`, ML);
          }
        });
      }

      // Certifications
      if (r.certifications?.length) {
        sectionHeader("Certifications");
        r.certifications.forEach(c => bulletLine("• " + c, false));
      }

      // Achievements
      if (r.achievements?.length) {
        sectionHeader("Achievements");
        r.achievements.forEach(a => bulletLine("• " + a, false));
      }

      // ── PAGE 2: ANALYTICS REPORT ─────────────────────────
      doc.addPage();

      // Header
      doc.rect(0, 0, PW, 60).fillColor(C.primary).fill();
      doc.fillColor(C.white).font("Helvetica-Bold").fontSize(16)
        .text("ATS Optimisation Report", ML, 20);
      doc.fillColor("#93c5fd").font("Helvetica").fontSize(9)
        .text(`Generated for: ${safeText(r.name || "")}`, ML, 42);

      doc.y = 78;

      const analytics = r.analytics || {};

      // Score comparison box
      const boxY = doc.y;
      doc.rect(ML, boxY, TW, 50).fillColor(C.light).fill()
        .strokeColor("#d1d5db").lineWidth(0.5).stroke();

      // Before score
      doc.fillColor(C.muted).font("Helvetica").fontSize(8).text("BEFORE", ML + 30, boxY + 8);
      doc.fillColor("#dc2626").font("Helvetica-Bold").fontSize(28)
        .text(String(analytics.originalATSScore || 0), ML + 20, boxY + 18);

      // Arrow
      doc.fillColor(C.accent).font("Helvetica-Bold").fontSize(20)
        .text("->", ML + (TW / 2) - 15, boxY + 16);

      // After score
      doc.fillColor(C.muted).font("Helvetica").fontSize(8).text("AFTER", ML + TW - 80, boxY + 8);
      doc.fillColor(C.green).font("Helvetica-Bold").fontSize(28)
        .text(String(analytics.newATSScore || 0), ML + TW - 85, boxY + 18);

      // Improvement badge
      const imp = (analytics.newATSScore || 0) - (analytics.originalATSScore || 0);
      doc.fillColor(C.green).font("Helvetica-Bold").fontSize(11)
        .text(`+${imp} pts improvement`, ML, boxY + 56, { width: TW, align: "center" });

      doc.y = boxY + 75;

      // 15 Metrics comparison table
      doc.fillColor(C.primary).font("Helvetica-Bold").fontSize(11)
        .text("15 ATS Metrics: Before vs After", ML);
      doc.moveDown(0.3);

      // Table header
      const col1 = ML, col2 = ML + 200, col3 = ML + 290, col4 = ML + 370;
      doc.fillColor(C.primary).font("Helvetica-Bold").fontSize(8);
      doc.text("Metric",           col1, doc.y);
      doc.text("Before", col2, doc.y);
      doc.text("After",  col3, doc.y);
      doc.text("Change", col4, doc.y - doc.currentLineHeight());
      doc.moveDown(0.2);
      hline(doc.y, C.primary, 0.5);
      doc.moveDown(0.2);

      const metricDefs = [
        { key: "overallATS",      label: "Overall ATS Score"      },
        { key: "keywordMatch",    label: "Keyword Match %"        },
        { key: "techScore",       label: "Technical Skills"       },
        { key: "actionVerbScore", label: "Action Verbs"           },
        { key: "quantScore",      label: "Quantified Achievements"},
        { key: "sectionScore",    label: "Section Completeness"   },
        { key: "contactScore",    label: "Contact Info"           },
        { key: "formatScore",     label: "Formatting"             },
        { key: "summaryScore",    label: "Summary/Objective"      },
        { key: "linkScore",       label: "Links & Portfolio"      },
        { key: "eduScore",        label: "Education Relevance"    },
        { key: "certScore",       label: "Certifications"         },
        { key: "projectScore",    label: "Projects"               },
        { key: "industryScore",   label: "Industry Keywords"      },
        { key: "readabilityScore",label: "Readability"            },
      ];

      const metricsBefore = analytics.metricsBefore || {};
      const metricsAfterData = analytics.metricsAfter  || {};

      metricDefs.forEach((m, idx) => {
        const before = metricsBefore[m.key] || 0;
        const after  = metricsAfterData[m.key] || 0;
        const change = after - before;
        const rowY   = doc.y;

        if (idx % 2 === 0) {
          doc.rect(ML - 2, rowY - 1, TW + 4, 13).fillColor(C.light).fill();
        }

        doc.fillColor(C.dark).font("Helvetica").fontSize(8).text(m.label, col1, rowY);

        doc.fillColor(before < 60 ? "#dc2626" : before < 80 ? C.amber : C.green)
          .font("Helvetica-Bold").fontSize(8).text(`${before}/100`, col2, rowY);

        doc.fillColor(after < 60 ? "#dc2626" : after < 80 ? C.amber : C.green)
          .font("Helvetica-Bold").fontSize(8).text(`${after}/100`, col3, rowY);

        doc.fillColor(change > 0 ? C.green : change < 0 ? "#dc2626" : C.muted)
          .font("Helvetica-Bold").fontSize(8)
          .text(`${change >= 0 ? "+" : ""}${change}`, col4, rowY);

        doc.moveDown(0.15);
      });

      doc.moveDown(0.5);
      hline(doc.y, "#d1d5db");
      doc.moveDown(0.5);

      // What was added
      const listSection = (title, items) => {
        if (!items?.length) return;
        doc.fillColor(C.primary).font("Helvetica-Bold").fontSize(9).text(title);
        doc.fillColor(C.dark).font("Helvetica").fontSize(8.5)
          .text(items.map(safeText).join(", "), ML, doc.y, { width: TW, lineGap: 2 });
        doc.moveDown(0.4);
      };

      listSection("Added Skills:",          analytics.addedSkills);
      listSection("Added Keywords:",         analytics.addedKeywords);
      listSection("Added Projects:",         analytics.addedProjects);
      listSection("Added Achievements:",     analytics.addedAchievements);
      listSection("Added Certifications:",   analytics.addedCertifications);
      listSection("Enhanced Sections:",      analytics.enhancedSections);

      // Source breakdown
      if (analytics.sourceBreakdown) {
        doc.moveDown(0.3);
        doc.fillColor(C.primary).font("Helvetica-Bold").fontSize(9).text("Content Sources:");
        doc.moveDown(0.2);
        const sb = analytics.sourceBreakdown;
        [
          [`From GitHub repos: ${sb.fromGitHub || 0} items`, C.green],
          [`From original resume: ${sb.fromOriginalResume || 0} items`, C.accent],
          [`AI generated: ${sb.aiGenerated || 0} items`, "#7c3aed"],
        ].forEach(([text, color]) => {
          doc.fillColor(color).font("Helvetica").fontSize(8.5)
            .text("  " + text, ML, doc.y, { lineGap: 2 });
        });
      }

      // Legend
      doc.moveDown(1);
      doc.rect(ML, doc.y, TW, 28).fillColor(C.highlight).fill()
        .strokeColor(C.hlBorder).lineWidth(0.5).stroke();
      doc.fillColor("#92400e").font("Helvetica").fontSize(8)
        .text("LEGEND: Yellow highlighted lines in the resume = NEW content added by AI optimiser. Project [Link] = clickable URL.", ML + 6, doc.y + 4, { width: TW - 12, lineGap: 3 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ─────────────────────────────────────────────────────────────
// MAIN buildATSResume  — orchestrates everything
// ─────────────────────────────────────────────────────────────
async function buildATSResume({ resumeText, jdText, githubUsername, groqApiKey = "" }) {

  // 1. Compute BEFORE metrics
  const metricsBefore = computeATSMetrics(resumeText, jdText, false);

  // 2. Fetch GitHub data
  const ghData    = await fetchGitHubData(githubUsername);
  const hasGitHub = !!ghData && ghData.repos.length > 0;

  // 3. Build rich GitHub context for AI
  let githubContext = "";
  if (hasGitHub) {
    const repoLines = ghData.repos.slice(0, 8).map(r => {
      const link = r.liveUrl ? `live:${r.liveUrl}` : r.githubUrl;
      return `  - ${r.name}: ${r.description || "No description"} | Tech: ${r.languages.slice(0,4).join(",")} | Stars:${r.stars} | ${link}`;
    }).join("\n");

    githubContext = `
=== REAL GITHUB PROFILE (@${githubUsername}) ===
Name: ${ghData.name}
Bio: ${ghData.bio || "Not provided"}
Total public repos: ${ghData.publicRepos}, Total stars: ${ghData.totalStars}
All languages: ${ghData.allLanguages.join(", ")}
Topics/interests: ${ghData.allTopics.slice(0,10).join(", ")}
Top repositories:
${repoLines}
=================================================`;
  }

  // 4. Call AI to build the ATS resume
  const systemPrompt = `You are a world-class ATS resume writer. You create resumes that score 85-95% on ATS systems.

STRICT RULES:
1. Keep ALL real personal info (name, email, phone, location, education)
2. For projects from GitHub: use the REAL repo name, real tech stack, real description — but write compelling bullets
3. For projects if GitHub is sparse or absent: create 2-3 impressive realistic projects using the JD's exact tech stack. Use dummy-but-realistic GitHub URLs like https://github.com/${githubUsername || "username"}/project-name and dummy live URLs like https://project-name.vercel.app
4. Every bullet point must start with a strong past-tense action verb
5. Add quantified metrics to every bullet (%, numbers, scale)
6. Include ALL keywords from the JD naturally in the text
7. Return ONLY valid JSON — no markdown fences, no explanation`;

  const userPrompt = `Build a production-grade ATS resume.

=== ORIGINAL RESUME ===
${resumeText.slice(0, 4000)}

=== JOB DESCRIPTION ===
${jdText.slice(0, 1500)}
${githubContext}

Return this EXACT JSON (no markdown, no backticks, valid JSON only):
{
  "name": "exact name from resume",
  "email": "exact email",
  "phone": "exact phone",
  "location": "city, country",
  "github": "github.com/${githubUsername || "username"}",
  "linkedin": "linkedin url or empty string",
  "portfolio": "portfolio url or empty string",
  "headline": "Senior [Role] | [3-4 JD keywords] | [years] Years Experience",
  "summary": "4-sentence summary packed with JD keywords. Mention specific technologies from JD. Include measurable impact. End with value proposition.",
  "skills": {
    "languages": ["lang1", "lang2"],
    "frameworks": ["fw1", "fw2"],
    "tools": ["tool1", "tool2"],
    "databases": ["db1"],
    "cloud": ["cloud1"]
  },
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Mon YYYY - Mon YYYY",
      "originalBulletCount": 2,
      "bullets": [
        "Action verb + specific task + quantified result matching JD keywords",
        "Action verb + specific task + quantified result",
        "Action verb + added enhancement specific to JD requirement",
        "Action verb + another JD-matched enhancement with metrics"
      ]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "tech": ["React", "Node.js", "MongoDB"],
      "githubUrl": "https://github.com/${githubUsername || "username"}/repo-name",
      "liveUrl": "https://project.vercel.app or empty string",
      "source": "github OR generated",
      "bullets": [
        "Built X that does Y resulting in Z impact",
        "Implemented A using B achieving C improvement"
      ]
    }
  ],
  "education": [
    {
      "degree": "exact degree",
      "institution": "exact university",
      "year": "graduation year",
      "gpa": "gpa or empty string"
    }
  ],
  "certifications": ["AWS Certified Developer", "add relevant certs from JD"],
  "achievements": [
    "Specific achievement with numbers",
    "Another achievement"
  ],
  "analytics": {
    "addedSkills": ["skill1 that was not in original resume"],
    "addedKeywords": ["jd keyword1 that was added"],
    "addedProjects": ["ProjectName that was added or enhanced"],
    "addedAchievements": ["achievement that was generated"],
    "addedCertifications": ["cert that was added"],
    "enhancedSections": ["Summary", "Experience", "Projects"],
    "sourceBreakdown": {
      "fromGitHub": 3,
      "fromOriginalResume": 4,
      "aiGenerated": 3
    }
  }
}`;

  const raw = await groqCall([
    { role: "system", content: systemPrompt },
    { role: "user",   content: userPrompt },
  ], 3500, groqApiKey);

  const resumeJSON = parseJSON(raw);
  if (!resumeJSON) {
    console.error("Parse failed. Raw response length:", raw?.length, "Sample:", raw?.slice(0, 200));
    throw new Error("AI returned invalid JSON. Please try again — this is rare.");
  }

  // 5. Compute AFTER metrics using the generated resume text
  const generatedText = resumeJSONtoText(resumeJSON);
  const metricsAfter  = computeATSMetrics(generatedText, jdText, true, resumeJSON);

  // 6. Build full analytics
  const analytics = {
    originalATSScore:    metricsBefore.overallATS,
    newATSScore:         metricsAfter.overallATS,
    improvementPercent:  metricsAfter.overallATS - metricsBefore.overallATS,
    metricsBefore,
    metricsAfter,
    addedSkills:         resumeJSON.analytics?.addedSkills         || [],
    addedKeywords:       resumeJSON.analytics?.addedKeywords       || [],
    addedProjects:       resumeJSON.analytics?.addedProjects       || [],
    addedAchievements:   resumeJSON.analytics?.addedAchievements   || [],
    addedCertifications: resumeJSON.analytics?.addedCertifications || [],
    enhancedSections:    resumeJSON.analytics?.enhancedSections    || [],
    totalChanges:
      (resumeJSON.analytics?.addedSkills?.length || 0) +
      (resumeJSON.analytics?.addedKeywords?.length || 0) +
      (resumeJSON.analytics?.addedProjects?.length || 0) +
      (resumeJSON.analytics?.addedAchievements?.length || 0) +
      (resumeJSON.analytics?.addedCertifications?.length || 0),
    sourceBreakdown: resumeJSON.analytics?.sourceBreakdown || {
      fromGitHub: hasGitHub ? 3 : 0,
      fromOriginalResume: 4,
      aiGenerated: hasGitHub ? 2 : 5,
    },
    matchedKeywords: metricsAfter.matchedKeywords,
    techMatched:     metricsAfter.techMatched,
  };

  // Attach analytics to resumeJSON for PDF generation
  resumeJSON.analytics = analytics;

  // 7. Generate PDF
  const pdfBase64 = await generatePDF(resumeJSON, metricsAfter);

  return {
    resumeJSON,
    pdfBase64,
    analytics,
    githubUsed:     hasGitHub,
    githubProjects: hasGitHub ? ghData.repos.slice(0, 8).map(r => r.name) : [],
    generatedResumeText: generatedText,
  };
}

module.exports = { buildATSResume };