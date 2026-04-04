// ══════════════════════════════════════════════════════════════
// LINKEDIN SERVICE — All 12 metric computations
// ══════════════════════════════════════════════════════════════

const ALL_TECH_SKILLS = [
  "javascript","typescript","python","java","c++","c#","go","rust",
  "react","next.js","vue","angular","node.js","express","django","flask",
  "spring","docker","kubernetes","aws","azure","gcp","mongodb","postgresql",
  "mysql","redis","graphql","git","linux","tensorflow","pytorch",
  "machine learning","deep learning","sql","html","css","flutter",
  "swift","kotlin","android","ios","devops","ci/cd","terraform","figma",
];

const ACTION_VERBS = [
  "built","developed","designed","led","managed","created","implemented",
  "architected","optimized","reduced","increased","launched","delivered",
  "collaborated","mentored","automated","integrated","deployed","scaled","improved",
];

const ATS_KEYWORDS = [
  "developer","engineer","software","technical","leadership","communication",
  "problem.solving","agile","scrum","team","collaborate","deliver",
  "impact","results","solution",
];

const CERT_KEYWORDS = [
  "certification","certified","certificate","aws certified","google certified",
  "microsoft certified","coursera","udemy","nptel","hackerrank","leetcode",
  "kaggle","credential","badge","license",
];

// ══════════════════════════════════════════════════════════════
// MAIN: analyzeLinkedIn — returns all 12 metrics
// ══════════════════════════════════════════════════════════════
function analyzeLinkedIn({ linkedinText, jobRole = "", resumeSkills = [] }) {
  const text    = linkedinText.toLowerCase();
  const rawText = linkedinText;

  // ── METRIC 1: Profile Completeness ────────────────────────
  const sections = {
    photo:      /profile photo|profile picture|photo|avatar|headshot/i.test(rawText),
    headline:   /headline|current position|•|—|-\s+at\s+/i.test(rawText),
    about:      /about|summary|bio|introduction|overview/i.test(rawText),
    experience: /experience|work|employment|intern|role|position|company/i.test(rawText),
    skills:     /skills|technologies|proficient|expertise/i.test(rawText),
    projects:   /project|built|developed|created|portfolio/i.test(rawText),
    education:  /education|university|college|degree|b\.tech|b\.e\.|bachelor|master/i.test(rawText),
    contact:    /email|linkedin\.com|phone|website|github/i.test(rawText),
  };
  const filledSections    = Object.values(sections).filter(Boolean).length;
  const completenessScore = Math.round((filledSections / Object.keys(sections).length) * 100);
  const missingSections   = Object.entries(sections).filter(([, v]) => !v).map(([k]) => k);

  // ── METRIC 2: Headline Quality ────────────────────────────
  const headlinePatterns = [
    /([A-Z][a-zA-Z\s]+)\s+(?:at|@)\s+([A-Z][a-zA-Z\s]+)/,
    /([A-Z][a-zA-Z\s]+)\s*[|•–-]\s*([A-Z][a-zA-Z\s]+)/,
    /(developer|engineer|designer|analyst|scientist|manager|lead|architect|specialist)/i,
  ];
  const hasRoleClarity          = headlinePatterns.some((p) => p.test(rawText));
  const techKeywordsInHeadline  = [
    "react","node","python","java","ai","ml","fullstack","full-stack",
    "frontend","backend","devops","cloud",
  ].filter((k) => text.includes(k));
  const headlineScore = Math.min(
    (hasRoleClarity ? 40 : 0) + techKeywordsInHeadline.length * 15 + (rawText.length > 200 ? 20 : 10),
    100
  );

  // ── METRIC 3: Skills Relevance ────────────────────────────
  const foundSkills    = ALL_TECH_SKILLS.filter((s) => text.includes(s));
  const relevantToRole = jobRole
    ? foundSkills.filter((s) =>
        jobRole.toLowerCase().split(" ").some((w) => s.includes(w) || w.includes(s))
      )
    : foundSkills;
  const skillsRelevanceScore = foundSkills.length
    ? Math.min(Math.round((relevantToRole.length / Math.max(foundSkills.length, 1)) * 120), 100)
    : 20;

  // ── METRIC 4: Experience Quality ─────────────────────────
  const actionVerbs    = ACTION_VERBS.filter((v) => text.includes(v));
  const hasNumbers     = /\d+%|\d+x|\d+\s*(?:users|clients|projects|teams|million|thousand|k\b)/i.test(rawText);
  const hasInternship  = /intern|internship|trainee/i.test(rawText);
  const hasFullTime    = /full.?time|permanent|full stack|senior|junior|associate/i.test(rawText);
  const expQualityScore = Math.min(
    actionVerbs.length * 8 + (hasNumbers ? 20 : 0) + (hasInternship ? 15 : 0) + (hasFullTime ? 15 : 0),
    100
  );

  // ── METRIC 5: Project Presence ────────────────────────────
  const projectMentions = rawText.match(
    /(?:project|built|developed|created|designed)\s+[A-Z][a-zA-Z\s\-]+/g
  ) || [];
  const hasGithubLinks = /github\.com\/[a-zA-Z0-9_\-]+/i.test(rawText);
  const hasLiveLinks   = /(?:https?:\/\/|www\.)[a-zA-Z0-9\-]+\.[a-z]{2,}/i.test(rawText);
  const projectScore   = Math.min(
    projectMentions.length * 20 + (hasGithubLinks ? 25 : 0) + (hasLiveLinks ? 15 : 0),
    100
  );

  // ── METRIC 6: Activity & Engagement ──────────────────────
  const activityKeywords = [
    "posts","articles","published","shared","commented","wrote","newsletter",
    "blog","speaking","conference","hackathon","open source","contributor",
  ];
  const activityFound = activityKeywords.filter((k) => text.includes(k));
  const activityScore = Math.min(activityFound.length * 14, 100);

  // ── METRIC 7: Network Strength ────────────────────────────
  const connectionMatch = rawText.match(/(\d[\d,]+)\s*(?:\+\s*)?connections?/i);
  const connections     = connectionMatch ? parseInt(connectionMatch[1].replace(/,/g, "")) : 0;
  const networkScore    = connections >= 500 ? 100 : connections >= 100 ? 65 : connections >= 50 ? 40 : connections > 0 ? 20 : 30;
  const networkLabel    = connections >= 500 ? "Strong (500+)" : connections >= 100 ? "Medium (100–500)" : connections > 0 ? `Low (${connections})` : "Unknown";

  // ── METRIC 8: Certifications ──────────────────────────────
  const certsFound = CERT_KEYWORDS.filter((k) => text.includes(k));
  const certScore  = Math.min(certsFound.length * 22, 100);

  // ── METRIC 9: Recommendations ────────────────────────────
  const recMatch  = rawText.match(/(\d+)\s*recommendation/i);
  const recCount  = recMatch ? parseInt(recMatch[1]) : /recommendation|endorsed|recommend/i.test(rawText) ? 1 : 0;
  const recommendationScore = Math.min(recCount * 30 + (recCount > 0 ? 10 : 0), 100);

  // ── METRIC 10: Resume Consistency ────────────────────────
  const resumeSkillSet   = new Set(resumeSkills.map((s) => s.toLowerCase()));
  const linkedinSkillSet = new Set(foundSkills);
  const matchingSkills   = [...resumeSkillSet].filter((s) => linkedinSkillSet.has(s));
  const consistencyScore = resumeSkills.length
    ? Math.round((matchingSkills.length / resumeSkills.length) * 100)
    : 50;

  // ── METRIC 11: Professional Branding ─────────────────────
  const hasNiche = /(full.?stack|frontend|backend|devops|ml engineer|ai developer|data scientist|cloud architect|mobile developer)/i.test(rawText);
  const hasStory = rawText.length > 800;
  const hasStructure = sections.about && sections.experience && sections.skills;
  const brandingScore = Math.min(
    (hasNiche ? 40 : 0) + (hasStory ? 25 : 10) + (hasStructure ? 35 : 15),
    100
  );

  // ── METRIC 12: Keyword Optimization ──────────────────────
  const foundATS     = ATS_KEYWORDS.filter((k) => new RegExp(k, "i").test(rawText));
  const keywordScore = Math.min(
    Math.round((foundATS.length / ATS_KEYWORDS.length) * 50) + Math.min(foundSkills.length * 4, 50),
    100
  );

  // ── Overall LinkedIn Score (weighted) ────────────────────
  const overallLinkedInScore = Math.round(
    completenessScore    * 0.12 +
    headlineScore        * 0.08 +
    skillsRelevanceScore * 0.10 +
    expQualityScore      * 0.15 +
    projectScore         * 0.10 +
    activityScore        * 0.05 +
    networkScore         * 0.05 +
    certScore            * 0.07 +
    recommendationScore  * 0.08 +
    consistencyScore     * 0.05 +
    brandingScore        * 0.08 +
    keywordScore         * 0.07
  );

  return {
    overallLinkedInScore,
    scores: {
      completenessScore, headlineScore, skillsRelevanceScore, expQualityScore,
      projectScore, activityScore, networkScore, certScore,
      recommendationScore, consistencyScore, brandingScore, keywordScore,
    },
    details: {
      missingSections, foundSkills, relevantSkills: relevantToRole,
      actionVerbs, hasNumbers, hasInternship, hasFullTime,
      projectCount: projectMentions.length, hasGithubLinks, hasLiveLinks,
      activityFound, connections, networkLabel, certsFound, recCount,
      matchingSkills, hasNiche, hasStory, techKeywordsInHeadline, foundATS,
    },
  };
}

module.exports = { analyzeLinkedIn };