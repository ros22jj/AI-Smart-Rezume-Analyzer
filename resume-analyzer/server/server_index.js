











// // const express = require("express");
// // const mongoose = require("mongoose");
// // const cors = require("cors");
// // const multer = require("multer");
// // const path = require("path");
// // const fs = require("fs");
// // require("dotenv").config();
// // const { Octokit } = require("@octokit/rest");

// // const app = express();

// // // ── Middleware ─────────────────────────────────────────────────
// // app.use(cors({ origin: "http://localhost:5173" }));
// // app.use(express.json({ limit: "10mb" }));
// // app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// // app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

// // // ── Multer ─────────────────────────────────────────────────────
// // const storage = multer.diskStorage({
// //   destination: (req, file, cb) => cb(null, "./uploads"),
// //   filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname),
// // });
// // const upload = multer({ storage });

// // // ── MongoDB ────────────────────────────────────────────────────
// // mongoose
// //   .connect(process.env.MONGO_URI, {
// //     serverSelectionTimeoutMS: 30000,
// //     connectTimeoutMS: 30000,
// //   })
// //   .then(() => console.log("✅ MongoDB connected!"))
// //   .catch((err) => console.error("❌ MongoDB error:", err.message));

// // const analysisSchema = new mongoose.Schema({
// //   clerkUserId: { type: String, required: true },
// //   userName: { type: String, default: "" },
// //   userEmail: { type: String, default: "" },
// //   resumeFileName: { type: String, default: "" },
// //   resumeFilePath: { type: String, default: "" },
// //   overallScore: { type: Number, default: 0 },
// //   candidateName: { type: String, default: "" },
// //   githubUsername: { type: String, default: "" },
// //   githubMetrics: { type: Object, default: {} },
// //   analysisData: { type: Object, default: {} },
// //   createdAt: { type: Date, default: Date.now },
// // });
// // const Analysis = mongoose.model("Analysis", analysisSchema);

// // // ── Helper: create octokit (with token if available) ──────────
// // function getOctokit() {
// //   const token = process.env.GITHUB_TOKEN;
// //   return token ? new Octokit({ auth: token }) : new Octokit();
// // }

// // // ── Helper: safe API call (returns null on error) ──────────────
// // async function safeCall(fn) {
// //   try { return await fn(); } catch { return null; }
// // }

// // // ── Helper: get all repos (handles pagination) ─────────────────
// // async function getAllRepos(octokit, username) {
// //   const repos = [];
// //   let page = 1;
// //   while (true) {
// //     const res = await safeCall(() =>
// //       octokit.rest.repos.listForUser({ username, per_page: 100, page })
// //     );
// //     if (!res || res.data.length === 0) break;
// //     repos.push(...res.data);
// //     if (res.data.length < 100) break;
// //     page++;
// //   }
// //   return repos.filter((r) => !r.fork && !r.archived);
// // }

// // // ── Test Route ─────────────────────────────────────────────────
// // app.get("/", (req, res) => {
// //   res.json({
// //     message: "✅ Server running!",
// //     mongoStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
// //     githubAuth: !!process.env.GITHUB_TOKEN,
// //   });
// // });

// // // ══════════════════════════════════════════════════════════════
// // // GITHUB ANALYZE — ALL 10 METRICS
// // // ══════════════════════════════════════════════════════════════
// // app.post("/api/github-analyze", async (req, res) => {
// //   try {
// //     const { githubUsername, resumeSkills = [], resumeProjects = [], claimedYears = 0, resumeText = "" } = req.body;

// //     if (!githubUsername) {
// //       return res.status(400).json({ success: false, error: "GitHub username required" });
// //     }

// //     const octokit = getOctokit();

// //     const userRes = await safeCall(() =>
// //       octokit.rest.users.getByUsername({ username: githubUsername })
// //     );
// //     if (!userRes) {
// //       return res.status(404).json({ success: false, error: `GitHub user "${githubUsername}" not found` });
// //     }
// //     const user = userRes.data;

// //     const repos = await getAllRepos(octokit, githubUsername);
// //     const top15 = repos.slice(0, 15);

// //     const repoLanguageMap = {};
// //     const allLanguages = {};
// //     const repoTopicMap = {};

// //     for (const repo of top15) {
// //       const langRes = await safeCall(() =>
// //         octokit.rest.repos.listLanguages({ owner: githubUsername, repo: repo.name })
// //       );
// //       const langs = langRes ? Object.keys(langRes.data).map((l) => l.toLowerCase()) : [];
// //       repoLanguageMap[repo.name] = langs;
// //       langs.forEach((l) => { allLanguages[l] = (allLanguages[l] || 0) + 1; });
// //       const topics = (repo.topics || []).map((t) => t.toLowerCase());
// //       repoTopicMap[repo.name] = topics;
// //       topics.forEach((t) => { allLanguages[t] = (allLanguages[t] || 0) + 1; });
// //     }

// //     const topLanguages = Object.entries(allLanguages)
// //       .sort((a, b) => b[1] - a[1])
// //       .slice(0, 8)
// //       .map(([name, projects]) => ({ name, projects }));

// //     const SKILL_ALIASES = {
// //       "javascript": ["javascript","js","node.js","nodejs","node","react","vue","angular","next.js","nextjs"],
// //       "typescript": ["typescript","ts"],
// //       "python": ["python","py"],
// //       "java": ["java"],
// //       "c++": ["c++","cpp","c plus plus"],
// //       "c#": ["c#","csharp","dotnet",".net"],
// //       "react": ["react","reactjs","react.js"],
// //       "node": ["node","nodejs","node.js","express","expressjs"],
// //       "vue": ["vue","vuejs","vue.js"],
// //       "angular": ["angular","angularjs"],
// //       "docker": ["docker"],
// //       "kubernetes": ["kubernetes","k8s"],
// //       "aws": ["aws","amazon web services","s3","ec2","lambda"],
// //       "mongodb": ["mongodb","mongo"],
// //       "postgresql": ["postgresql","postgres"],
// //       "mysql": ["mysql"],
// //       "redis": ["redis"],
// //       "graphql": ["graphql"],
// //       "html": ["html","html5"],
// //       "css": ["css","css3","scss","sass"],
// //       "flutter": ["flutter","dart"],
// //       "swift": ["swift"],
// //       "kotlin": ["kotlin"],
// //       "rust": ["rust"],
// //       "go": ["go","golang"],
// //       "php": ["php"],
// //       "ruby": ["ruby","rails"],
// //     };

// //     function normalizeSkill(skill) {
// //       const s = skill.toLowerCase().trim();
// //       for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
// //         if (aliases.some((a) => s.includes(a) || a.includes(s))) return canonical;
// //       }
// //       return s;
// //     }

// //     const githubSkillSet = new Set(Object.keys(allLanguages).map(normalizeSkill));
// //     const normalizedResumeSkills = [...new Set(resumeSkills.map(normalizeSkill))];

// //     const matchedSkills = normalizedResumeSkills.filter((s) => githubSkillSet.has(s));
// //     const unmatchedSkills = normalizedResumeSkills.filter((s) => !githubSkillSet.has(s));
// //     const skillMatchScore = normalizedResumeSkills.length
// //       ? Math.round((matchedSkills.length / normalizedResumeSkills.length) * 100) : 0;

// //     const techUsageVerification = normalizedResumeSkills.slice(0, 10).map((skill) => {
// //       const reposUsing = top15.filter((repo) => {
// //         const langs = repoLanguageMap[repo.name] || [];
// //         const topics = repoTopicMap[repo.name] || [];
// //         return [...langs, ...topics].some((l) => normalizeSkill(l) === skill);
// //       });
// //       const status = reposUsing.length >= 3 ? "✅" : reposUsing.length >= 1 ? "⚠️" : "❌";
// //       return { skill, repoCount: reposUsing.length, status };
// //     });

// //     const techUsageScore = normalizedResumeSkills.length
// //       ? Math.round(
// //           (techUsageVerification.filter((t) => t.status === "✅").length * 100 +
// //             techUsageVerification.filter((t) => t.status === "⚠️").length * 50) /
// //             Math.max(normalizedResumeSkills.length, 1)
// //         ) : 0;

// //     const verifiedProjects = [];
// //     const missingProjects = [];
// //     for (const project of resumeProjects.slice(0, 8)) {
// //       const pClean = project.toLowerCase().replace(/[-_]/g, " ");
// //       const found = repos.find((r) => {
// //         const rName = r.name.toLowerCase().replace(/[-_]/g, " ");
// //         return rName.includes(pClean) || pClean.includes(rName) ||
// //           (r.description || "").toLowerCase().includes(pClean);
// //       });
// //       if (found) verifiedProjects.push({ name: project, repo: found.name, url: found.html_url });
// //       else missingProjects.push(project);
// //     }
// //     const projectMatchScore = resumeProjects.length
// //       ? Math.round((verifiedProjects.length / Math.min(resumeProjects.length, 8)) * 100) : 0;

// //     const projectDepthDetails = [];
// //     for (const vp of verifiedProjects.slice(0, 5)) {
// //       const repo = repos.find((r) => r.name === vp.repo);
// //       if (!repo) continue;
// //       const size = repo.size || 0;
// //       const stars = repo.stargazers_count || 0;
// //       const forks = repo.forks_count || 0;
// //       const hasDescription = !!repo.description;
// //       const hasTopics = (repo.topics || []).length > 0;
// //       const hasHomepage = !!repo.homepage;
// //       let depth = "Basic ⚠️", depthScore = 30;
// //       if (size > 5000 || stars > 10 || forks > 5) { depth = "Advanced ✅"; depthScore = 90; }
// //       else if (size > 500 || (hasDescription && hasTopics)) { depth = "Intermediate ✅"; depthScore = 65; }
// //       projectDepthDetails.push({ name: vp.name, repo: vp.repo, depth, depthScore, size, stars, forks, hasHomepage });
// //     }
// //     const projectDepthScore = projectDepthDetails.length
// //       ? Math.round(projectDepthDetails.reduce((s, p) => s + p.depthScore, 0) / projectDepthDetails.length) : 0;

// //     const allCommitMonths = new Set();
// //     let totalCommits = 0;
// //     for (const repo of top15.slice(0, 5)) {
// //       const commitsRes = await safeCall(() =>
// //         octokit.rest.repos.listCommits({
// //           owner: githubUsername, repo: repo.name,
// //           author: githubUsername, per_page: 100,
// //         })
// //       );
// //       if (commitsRes) {
// //         totalCommits += commitsRes.data.length;
// //         commitsRes.data.forEach((c) => {
// //           const date = c.commit?.author?.date;
// //           if (date) allCommitMonths.add(date.slice(0, 7));
// //         });
// //       }
// //     }

// //     const activeMonths = allCommitMonths.size;
// //     const claimedMonths = Math.max(claimedYears * 12, 1);
// //     const activityMatchScore = Math.round(Math.min(activeMonths / claimedMonths, 1) * 100);
// //     const activityScore = Math.min(activeMonths * 5, 100);

// //     const resumeSkillSet = new Set(normalizedResumeSkills);
// //     const frontendSkills = ["react","vue","angular","html","css","javascript","typescript","next.js"];
// //     const backendSkills = ["node","python","java","go","php","ruby","c#","express"];
// //     const devopsSkills = ["docker","kubernetes","aws","azure","ci/cd","terraform"];
// //     const domainScores = {
// //       frontend: frontendSkills.filter((s) => githubSkillSet.has(s) && resumeSkillSet.has(s)).length / Math.max(frontendSkills.filter(s => resumeSkillSet.has(s)).length, 1),
// //       backend: backendSkills.filter((s) => githubSkillSet.has(s) && resumeSkillSet.has(s)).length / Math.max(backendSkills.filter(s => resumeSkillSet.has(s)).length, 1),
// //       devops: devopsSkills.filter((s) => githubSkillSet.has(s) && resumeSkillSet.has(s)).length / Math.max(devopsSkills.filter(s => resumeSkillSet.has(s)).length, 1),
// //     };
// //     const techStackScore = Math.round(Math.max(...Object.values(domainScores)) * 100);

// //     const monthCounts = {};
// //     allCommitMonths.forEach((m) => { monthCounts[m] = (monthCounts[m] || 0) + 1; });
// //     const sortedMonths = Object.keys(monthCounts).sort();
// //     let consecutiveStreaks = 0;
// //     for (let i = 1; i < sortedMonths.length; i++) {
// //       const prev = new Date(sortedMonths[i - 1] + "-01");
// //       const curr = new Date(sortedMonths[i] + "-01");
// //       const diffMonths = (curr.getFullYear() - prev.getFullYear()) * 12 + curr.getMonth() - prev.getMonth();
// //       if (diffMonths === 1) consecutiveStreaks++;
// //     }
// //     const longestStreak = sortedMonths.length > 0 ? Math.min(consecutiveStreaks + 1, 12) : 0;
// //     const consistencyScore = Math.min(
// //       Math.round((longestStreak / 6) * 50 + (activeMonths > 3 ? 50 : activeMonths * 15)), 100
// //     );

// //     const codeEvidenceDetails = techUsageVerification.map((t) => ({
// //       skill: t.skill,
// //       evidence: t.repoCount > 0 ? `Found in ${t.repoCount} repo${t.repoCount > 1 ? "s" : ""}` : "No evidence found",
// //       verified: t.repoCount > 0,
// //       status: t.status,
// //     }));
// //     const codeEvidenceScore = normalizedResumeSkills.length
// //       ? Math.round((codeEvidenceDetails.filter((c) => c.verified).length / normalizedResumeSkills.length) * 100) : 0;

// //     const deployedRepos = repos.filter((r) => !!r.homepage && r.homepage.trim() !== "");
// //     const reposWithPages = repos.filter((r) => r.has_pages);
// //     const totalDeployed = new Set([...deployedRepos.map((r) => r.name), ...reposWithPages.map((r) => r.name)]).size;
// //     const deploymentScore = Math.min(Math.round((totalDeployed / Math.max(repos.length, 1)) * 100 * 3), 100);
// //     const deployedDetails = deployedRepos.slice(0, 5).map((r) => ({ name: r.name, url: r.homepage }));

// //     const trustScore = Math.round(
// //       skillMatchScore * 0.2 + projectMatchScore * 0.2 + activityMatchScore * 0.15 +
// //       codeEvidenceScore * 0.2 + consistencyScore * 0.15 + deploymentScore * 0.1
// //     );

// //     const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
// //     const totalForks = repos.reduce((s, r) => s + r.forks_count, 0);
// //     const accountAgeMonths = Math.round((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30));

// //     const githubMetrics = {
// //       skillMatchScore, techUsageScore, projectMatchScore, projectDepthScore,
// //       activityMatchScore, techStackScore, consistencyScore, codeEvidenceScore,
// //       deploymentScore, trustScore, activityScore,
// //       matchedSkills, unmatchedSkills, resumeSkills: normalizedResumeSkills,
// //       techUsageVerification, verifiedProjects, missingProjects,
// //       projectDepthDetails, codeEvidenceDetails, deployedDetails,
// //       totalRepos: repos.length, totalStars, totalForks, totalCommits,
// //       activeMonths, claimedMonths, longestStreak, accountAgeMonths,
// //       topLanguages,
// //       profileUrl: user.html_url, avatarUrl: user.avatar_url,
// //       name: user.name, bio: user.bio,
// //       followers: user.followers, publicRepos: user.public_repos,
// //       recentRepos: repos.slice(0, 6).map((r) => ({
// //         name: r.name, description: r.description,
// //         stars: r.stargazers_count, forks: r.forks_count,
// //         url: r.html_url, homepage: r.homepage,
// //         language: r.language, updatedAt: r.updated_at,
// //       })),
// //     };

// //     console.log(`✅ GitHub analysis complete for @${githubUsername} — trustScore: ${trustScore}`);
// //     res.json({ success: true, githubMetrics });

// //   } catch (err) {
// //     console.error("GitHub analyze error:", err.message);
// //     res.status(500).json({ success: false, error: err.message });
// //   }
// // });

// // // ══════════════════════════════════════════════════════════════
// // // LINKEDIN ANALYZE — ALL 12 METRICS
// // // ══════════════════════════════════════════════════════════════
// // app.post("/api/linkedin-analyze", async (req, res) => {
// //   try {
// //     const { linkedinText, linkedinUrl, jobRole, resumeSkills = [] } = req.body;

// //     if (!linkedinText || linkedinText.trim().length < 50) {
// //       return res.status(400).json({ success: false, error: "LinkedIn profile text too short" });
// //     }

// //     const text = linkedinText.toLowerCase();
// //     const rawText = linkedinText;

// //     // METRIC 1: Profile Completeness
// //     const sections = {
// //       photo: /profile photo|profile picture|photo|avatar|headshot/i.test(rawText) || linkedinUrl?.length > 0,
// //       headline: /headline|current position|•|—|-\s+at\s+/i.test(rawText),
// //       about: /about|summary|bio|introduction|overview/i.test(rawText),
// //       experience: /experience|work|employment|intern|role|position|company/i.test(rawText),
// //       skills: /skills|technologies|proficient|expertise/i.test(rawText),
// //       projects: /project|built|developed|created|portfolio/i.test(rawText),
// //       education: /education|university|college|degree|b\.tech|b\.e\.|bachelor|master/i.test(rawText),
// //       contact: /email|linkedin\.com|phone|website|github/i.test(rawText),
// //     };
// //     const filledSections = Object.values(sections).filter(Boolean).length;
// //     const completenessScore = Math.round((filledSections / Object.keys(sections).length) * 100);
// //     const missingSections = Object.entries(sections).filter(([, v]) => !v).map(([k]) => k);

// //     // METRIC 2: Headline Quality
// //     const headlinePatterns = [
// //       /([A-Z][a-zA-Z\s]+)\s+(?:at|@)\s+([A-Z][a-zA-Z\s]+)/,
// //       /([A-Z][a-zA-Z\s]+)\s*[|•–-]\s*([A-Z][a-zA-Z\s]+)/,
// //       /(developer|engineer|designer|analyst|scientist|manager|lead|architect|specialist)/i,
// //     ];
// //     const hasRoleClarity = headlinePatterns.some(p => p.test(rawText));
// //     const techKeywordsInHeadline = ["react","node","python","java","ai","ml","fullstack","full-stack","frontend","backend","devops","cloud"].filter(k => text.includes(k));
// //     const headlineScore = Math.min(
// //       (hasRoleClarity ? 40 : 0) + (techKeywordsInHeadline.length * 15) + (rawText.length > 200 ? 20 : 10), 100
// //     );

// //     // METRIC 3: Skills Relevance
// //     const ALL_TECH_SKILLS = [
// //       "javascript","typescript","python","java","c++","c#","go","rust","react","next.js",
// //       "vue","angular","node.js","express","django","flask","spring","docker","kubernetes",
// //       "aws","azure","gcp","mongodb","postgresql","mysql","redis","graphql","git","linux",
// //       "tensorflow","pytorch","machine learning","deep learning","sql","html","css","flutter",
// //       "swift","kotlin","android","ios","devops","ci/cd","terraform","figma",
// //     ];
// //     const foundSkills = ALL_TECH_SKILLS.filter(s => text.includes(s));
// //     const relevantToRole = jobRole
// //       ? foundSkills.filter(s => jobRole.toLowerCase().split(" ").some(w => s.includes(w) || w.includes(s)))
// //       : foundSkills;
// //     const skillsRelevanceScore = foundSkills.length
// //       ? Math.min(Math.round((relevantToRole.length / Math.max(foundSkills.length, 1)) * 100 * 1.2), 100) : 20;

// //     // METRIC 4: Experience Quality
// //     const ACTION_VERBS = ["built","developed","designed","led","managed","created","implemented","architected","optimized","reduced","increased","launched","delivered","collaborated","mentored","automated","integrated","deployed","scaled","improved"];
// //     const foundVerbs = ACTION_VERBS.filter(v => text.includes(v));
// //     const hasNumbers = /\d+%|\d+x|\d+\s*(?:users|clients|projects|teams|million|thousand|k\b)/i.test(rawText);
// //     const hasInternship = /intern|internship|trainee/i.test(rawText);
// //     const hasFullTime = /full.?time|permanent|full stack|senior|junior|associate/i.test(rawText);
// //     const expQualityScore = Math.min(
// //       (foundVerbs.length * 8) + (hasNumbers ? 20 : 0) + (hasInternship ? 15 : 0) + (hasFullTime ? 15 : 0), 100
// //     );

// //     // METRIC 5: Project Presence
// //     const projectMentions = (rawText.match(/(?:project|built|developed|created|designed)\s+[A-Z][a-zA-Z\s\-]+/g) || []);
// //     const hasGithubLinks = /github\.com\/[a-zA-Z0-9_\-]+/i.test(rawText);
// //     const hasLiveLinks = /(?:https?:\/\/|www\.)[a-zA-Z0-9\-]+\.[a-z]{2,}/i.test(rawText);
// //     const projectScore = Math.min(
// //       (projectMentions.length * 20) + (hasGithubLinks ? 25 : 0) + (hasLiveLinks ? 15 : 0), 100
// //     );

// //     // METRIC 6: Activity Score
// //     const activityKeywords = ["posts","articles","published","shared","commented","wrote","newsletter","blog","speaking","conference","hackathon","open source","contributor"];
// //     const activityFound = activityKeywords.filter(k => text.includes(k));
// //     const activityScore = Math.min(activityFound.length * 14, 100);

// //     // METRIC 7: Network Strength
// //     const connectionMatch = rawText.match(/(\d[\d,]+)\s*(?:\+\s*)?connections?/i);
// //     const connections = connectionMatch ? parseInt(connectionMatch[1].replace(/,/g, "")) : 0;
// //     const networkScore = connections >= 500 ? 100 : connections >= 100 ? 65 : connections >= 50 ? 40 : connections > 0 ? 20 : 30;
// //     const networkLabel = connections >= 500 ? "Strong (500+)" : connections >= 100 ? "Medium (100–500)" : connections > 0 ? `Low (${connections})` : "Unknown";

// //     // METRIC 8: Certification Score
// //     const CERT_KEYWORDS = ["certification","certified","certificate","aws certified","google certified","microsoft certified","coursera","udemy","nptel","hackerrank","leetcode","kaggle","credential","badge","license"];
// //     const certsFound = CERT_KEYWORDS.filter(k => text.includes(k));
// //     const certScore = Math.min(certsFound.length * 22, 100);

// //     // METRIC 9: Recommendation Score
// //     const recMatch = rawText.match(/(\d+)\s*recommendation/i);
// //     const recCount = recMatch ? parseInt(recMatch[1]) : /recommendation|endorsed|recommend/i.test(rawText) ? 1 : 0;
// //     const recommendationScore = Math.min(recCount * 30 + (recCount > 0 ? 10 : 0), 100);

// //     // METRIC 10: Consistency (Resume Match)
// //     const resumeSkillSet = new Set(resumeSkills.map(s => s.toLowerCase()));
// //     const linkedinSkillSet = new Set(foundSkills);
// //     const matchingSkills = [...resumeSkillSet].filter(s => linkedinSkillSet.has(s));
// //     const consistencyScore = resumeSkills.length
// //       ? Math.round((matchingSkills.length / resumeSkills.length) * 100) : 50;

// //     // METRIC 11: Professional Branding
// //     const hasNiche = /(full.?stack|frontend|backend|devops|ml engineer|ai developer|data scientist|cloud architect|mobile developer)/i.test(rawText);
// //     const hasStory = rawText.length > 800;
// //     const hasStructure = sections.about && sections.experience && sections.skills;
// //     const brandingScore = Math.min(
// //       (hasNiche ? 40 : 0) + (hasStory ? 25 : 10) + (hasStructure ? 35 : 15), 100
// //     );

// //     // METRIC 12: Keyword Optimization
// //     const ATS_KEYWORDS = ["developer","engineer","software","technical","leadership","communication","problem.solving","agile","scrum","team","collaborate","deliver","impact","results","solution"];
// //     const foundATS = ATS_KEYWORDS.filter(k => new RegExp(k, "i").test(rawText));
// //     const keywordScore = Math.min(
// //       Math.round((foundATS.length / ATS_KEYWORDS.length) * 50) + Math.min(foundSkills.length * 4, 50), 100
// //     );

// //     // OVERALL LINKEDIN SCORE (weighted)
// //     const overallLinkedInScore = Math.round(
// //       completenessScore * 0.12 + headlineScore * 0.08 + skillsRelevanceScore * 0.10 +
// //       expQualityScore * 0.15 + projectScore * 0.10 + activityScore * 0.05 +
// //       networkScore * 0.05 + certScore * 0.07 + recommendationScore * 0.08 +
// //       consistencyScore * 0.05 + brandingScore * 0.08 + keywordScore * 0.07
// //     );

// //     const linkedinMetrics = {
// //       overallLinkedInScore,
// //       scores: {
// //         completenessScore, headlineScore, skillsRelevanceScore, expQualityScore,
// //         projectScore, activityScore, networkScore, certScore,
// //         recommendationScore, consistencyScore, brandingScore, keywordScore,
// //       },
// //       details: {
// //         missingSections, foundSkills, relevantSkills: relevantToRole,
// //         actionVerbs: foundVerbs, hasNumbers, hasInternship, hasFullTime,
// //         projectCount: projectMentions.length, hasGithubLinks, hasLiveLinks,
// //         activityFound, connections, networkLabel, certsFound, recCount,
// //         matchingSkills, hasNiche, hasStory, techKeywordsInHeadline, foundATS,
// //       },
// //     };

// //     console.log(`✅ LinkedIn analysis complete — overallScore: ${overallLinkedInScore}`);
// //     res.json({ success: true, linkedinMetrics });

// //   } catch (err) {
// //     console.error("LinkedIn analyze error:", err.message);
// //     res.status(500).json({ success: false, error: err.message });
// //   }
// // });

// // // ── Save Analysis ──────────────────────────────────────────────
// // app.post("/api/analysis/save", upload.single("resume"), async (req, res) => {
// //   try {
// //     const { clerkUserId, userName, userEmail, resumeFileName, overallScore, candidateName, analysisData } = req.body;
// //     const resumeFilePath = req.file ? `/uploads/${req.file.filename}` : "";
// //     const analysis = new Analysis({
// //       clerkUserId: clerkUserId || "unknown",
// //       userName: userName || "",
// //       userEmail: userEmail || "",
// //       resumeFileName: resumeFileName || "",
// //       resumeFilePath,
// //       githubUsername: req.body.githubUsername || "",
// //       githubMetrics: req.body.githubMetrics ? JSON.parse(req.body.githubMetrics) : {},
// //       overallScore: Number(overallScore) || 0,
// //       candidateName: candidateName || "",
// //       analysisData: typeof analysisData === "string" ? JSON.parse(analysisData) : analysisData,
// //     });
// //     await analysis.save();
// //     res.json({ success: true, analysis });
// //   } catch (err) {
// //     res.status(500).json({ success: false, error: err.message });
// //   }
// // });

// // // ── Get User Analyses ──────────────────────────────────────────
// // app.get("/api/analysis/user/:clerkUserId", async (req, res) => {
// //   try {
// //     const analyses = await Analysis.find({ clerkUserId: req.params.clerkUserId }).sort({ createdAt: -1 });
// //     res.json({ success: true, analyses });
// //   } catch (err) {
// //     res.status(500).json({ success: false, error: err.message, analyses: [] });
// //   }
// // });

// // app.get("/api/analysis/all", async (req, res) => {
// //   try {
// //     const analyses = await Analysis.find().sort({ createdAt: -1 });
// //     res.json({ success: true, analyses });
// //   } catch (err) {
// //     res.status(500).json({ success: false, error: err.message, analyses: [] });
// //   }
// // });

// // app.get("/api/analysis/:id", async (req, res) => {
// //   try {
// //     const analysis = await Analysis.findById(req.params.id);
// //     res.json({ success: true, analysis });
// //   } catch (err) {
// //     res.status(500).json({ success: false, error: err.message });
// //   }
// // });

// // app.delete("/api/analysis/:id", async (req, res) => {
// //   try {
// //     await Analysis.findByIdAndDelete(req.params.id);
// //     res.json({ success: true });
// //   } catch (err) {
// //     res.status(500).json({ success: false, error: err.message });
// //   }
// // });

// // app.get("/api/stats", async (req, res) => {
// //   try {
// //     const totalResumes = await Analysis.countDocuments();
// //     const uniqueUsers = await Analysis.distinct("clerkUserId");
// //     const avgResult = await Analysis.aggregate([{ $group: { _id: null, avg: { $avg: "$overallScore" } } }]);
// //     res.json({ success: true, totalResumes, totalUsers: uniqueUsers.length, avgScore: avgResult[0]?.avg?.toFixed(1) || 0 });
// //   } catch (err) {
// //     res.status(500).json({ success: false, error: err.message, totalResumes: 0, totalUsers: 0, avgScore: 0 });
// //   }
// // });

// // // ── Start Server ───────────────────────────────────────────────
// // const PORT = process.env.PORT || 5000;
// // app.listen(PORT, () => {
// //   console.log(`🚀 Server running on port ${PORT}`);
// //   console.log(`🔐 GitHub Auth: ${process.env.GITHUB_TOKEN ? "✅ Token found" : "⚠️  No token — 60 req/hr limit"}`);
// // });





























































// // const express       = require("express");
// // const path          = require("path");
// // const fs            = require("fs");
// // const cors          = require("cors");
// // require("dotenv").config();

// // const connectDB      = require("./config/db");
// // const errorHandler   = require("./middleware/errorHandler");
// // const logger         = require("./middleware/logger");

// // const analysisRoutes = require("./routes/analysisRoutes");
// // const githubRoutes   = require("./routes/githubRoutes");
// // const linkedinRoutes = require("./routes/linkedinRoutes");
// // const statsRoutes    = require("./routes/statsRoutes");

// // // ── Connect to MongoDB ─────────────────────────────────────────
// // connectDB();

// // const app = express();

// // // ── Ensure uploads folder exists ──────────────────────────────
// // if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

// // // ── Core Middleware ────────────────────────────────────────────
// // app.use(cors({ origin: "http://localhost:5173" }));
// // app.use(express.json({ limit: "10mb" }));
// // app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// // app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// // app.use(logger);

// // // ── Routes ─────────────────────────────────────────────────────
// // app.use("/api/analysis",         analysisRoutes);
// // app.use("/api/github-analyze",   githubRoutes);
// // app.use("/api/linkedin-analyze", linkedinRoutes);
// // app.use("/api/stats",            statsRoutes);

// // // ── Health check ───────────────────────────────────────────────
// // const mongoose = require("mongoose");
// // app.get("/", (req, res) => {
// //   res.json({
// //     message:     "✅ ResumeAI Server running!",
// //     mongoStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
// //     githubAuth:  !!process.env.GITHUB_TOKEN,
// //   });
// // });

// // // ── Global error handler (must be last) ───────────────────────
// // app.use(errorHandler);

// // // ── Start Server ───────────────────────────────────────────────
// // const PORT = process.env.PORT || 5000;
// // app.listen(PORT, () => {
// //   console.log(`🚀 Server running on port ${PORT}`);
// //   console.log(`🔐 GitHub Auth: ${process.env.GITHUB_TOKEN ? "✅ Token found" : "⚠️  No token — 60 req/hr limit"}`);
// // });





// // const express       = require("express");
// // const path          = require("path");
// // const fs            = require("fs");
// // const cors          = require("cors");
// // require("dotenv").config();

// // const connectDB          = require("./config/db");
// // const errorHandler       = require("./middleware/errorHandler");
// // const logger             = require("./middleware/logger");

// // const analysisRoutes     = require("./routes/analysisRoutes");
// // const githubRoutes       = require("./routes/githubRoutes");
// // const linkedinRoutes     = require("./routes/linkedinRoutes");
// // const linkedinSaveRoutes = require("./routes/linkedinSaveRoutes");
// // const statsRoutes        = require("./routes/statsRoutes");

// // // ── Connect to MongoDB
// // connectDB();

// // const app = express();

// // // ── Ensure uploads folder exists
// // if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

// // // ── Core Middleware
// // app.use(cors({ origin: "http://localhost:5173" }));
// // app.use(express.json({ limit: "10mb" }));
// // app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// // app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// // app.use(logger);

// // // ── Routes
// // app.use("/api/analysis",         analysisRoutes);
// // app.use("/api/github-analyze",   githubRoutes);
// // app.use("/api/linkedin-analyze", linkedinRoutes);
// // app.use("/api/linkedin",         linkedinSaveRoutes);
// // app.use("/api/stats",            statsRoutes);

// // // ── Health check
// // const mongoose = require("mongoose");
// // app.get("/", (req, res) => {
// //   res.json({
// //     message:     "✅ ResumeAI Server running!",
// //     mongoStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
// //     githubAuth:  !!process.env.GITHUB_TOKEN,
// //   });
// // });

// // // ── Global error handler (must be last)
// // app.use(errorHandler);

// // // ── Start Server
// // const PORT = process.env.PORT || 5000;
// // app.listen(PORT, () => {
// //   console.log(`🚀 Server running on port ${PORT}`);
// //   console.log(`🔐 GitHub Auth: ${process.env.GITHUB_TOKEN ? "✅ Token found" : "⚠️  No token"}`);
// // });












// // const express       = require("express");
// // const path          = require("path");
// // const fs            = require("fs");
// // const cors          = require("cors");
// // require("dotenv").config();

// // const connectDB          = require("./config/db");
// // const errorHandler       = require("./middleware/errorHandler");
// // const logger             = require("./middleware/logger");

// // const analysisRoutes     = require("./routes/analysisRoutes");
// // const githubRoutes       = require("./routes/githubRoutes");
// // const linkedinRoutes     = require("./routes/linkedinRoutes");
// // const linkedinSaveRoutes = require("./routes/linkedinSaveRoutes");
// // const rankingRoutes      = require("./routes/rankingRoutes");
// // const statsRoutes        = require("./routes/statsRoutes");

// // // Connect to MongoDB
// // connectDB();

// // const app = express();

// // // Ensure uploads folder exists
// // if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

// // // Core Middleware
// // app.use(cors({ origin: "http://localhost:5173" }));
// // app.use(express.json({ limit: "10mb" }));
// // app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// // app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// // app.use(logger);

// // // Routes
// // app.use("/api/analysis",         analysisRoutes);
// // app.use("/api/github-analyze",   githubRoutes);
// // app.use("/api/linkedin-analyze", linkedinRoutes);
// // app.use("/api/linkedin",         linkedinSaveRoutes);
// // app.use("/api/rankings",         rankingRoutes);
// // app.use("/api/stats",            statsRoutes);

// // // Health check
// // const mongoose = require("mongoose");
// // app.get("/", (req, res) => {
// //   res.json({
// //     message:     "✅ ResumeAI Server running!",
// //     mongoStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
// //     githubAuth:  !!process.env.GITHUB_TOKEN,
// //   });
// // });

// // // Global error handler
// // app.use(errorHandler);

// // // Start Server
// // const PORT = process.env.PORT || 5000;
// // app.listen(PORT, () => {
// //   console.log(`🚀 Server running on port ${PORT}`);
// //   console.log(`🔐 GitHub Auth: ${process.env.GITHUB_TOKEN ? "✅ Token found" : "⚠️  No token"}`);
// // });










// // const express       = require("express");
// // const path          = require("path");
// // const fs            = require("fs");
// // const cors          = require("cors");
// // require("dotenv").config();

// // const connectDB          = require("./config/db");
// // const errorHandler       = require("./middleware/errorHandler");
// // const logger             = require("./middleware/logger");

// // const analysisRoutes     = require("./routes/analysisRoutes");
// // const githubRoutes       = require("./routes/githubRoutes");
// // const linkedinRoutes     = require("./routes/linkedinRoutes");
// // const linkedinSaveRoutes = require("./routes/linkedinSaveRoutes");
// // const rankingRoutes      = require("./routes/rankingRoutes");
// // const statsRoutes        = require("./routes/statsRoutes");

// // // Connect to MongoDB
// // connectDB();

// // const app = express();

// // // ✅ Vercel Fix: Read-only error se bachne ke liye ye change kiya
// // // Local par uploads folder banayega, Vercel par /tmp use karega
// // const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp' : './uploads';
// // if (!fs.existsSync(uploadDir)) {
// //     try {
// //         fs.mkdirSync(uploadDir);
// //     } catch (err) {
// //         console.log("Directory creation skipped or handled by Vercel");
// //     }
// // }

// // // Core Middleware
// // // ✅ CORS update: Sab allow kar diya taaki deployment mein error na aaye
// // app.use(cors()); 
// // app.use(express.json({ limit: "10mb" }));
// // app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// // app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// // app.use(logger);

// // // Routes
// // app.use("/api/analysis",         analysisRoutes);
// // app.use("/api/github-analyze",   githubRoutes);
// // app.use("/api/linkedin-analyze", linkedinRoutes);
// // app.use("/api/linkedin",         linkedinSaveRoutes);
// // app.use("/api/rankings",         rankingRoutes);
// // app.use("/api/stats",            statsRoutes);

// // // Health check
// // const mongoose = require("mongoose");
// // app.get("/", (req, res) => {
// //   res.json({
// //     message:     "✅ ResumeAI Server running!",
// //     mongoStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
// //     githubAuth:  !!process.env.GITHUB_TOKEN,
// //   });
// // });

// // // Global error handler
// // app.use(errorHandler);

// // // Start Server
// // const PORT = process.env.PORT || 5000;

// // // Local development ke liye listen chalega
// // if (process.env.NODE_ENV !== 'production') {
// //     app.listen(PORT, () => {
// //         console.log(`🚀 Server running on port ${PORT}`);
// //     });
// // }

// // // ✅ SABSE IMPORTANT: Vercel ko ye export chahiye
// // module.exports = app;




























// const express       = require("express");
// const path          = require("path");
// const fs            = require("fs");
// const cors          = require("cors");
// require("dotenv").config();

// const connectDB          = require("./config/db");
// const errorHandler       = require("./middleware/errorHandler");
// const logger             = require("./middleware/logger");

// const analysisRoutes     = require("./routes/analysisRoutes");
// const githubRoutes       = require("./routes/githubRoutes");
// const linkedinRoutes     = require("./routes/linkedinRoutes");
// const linkedinSaveRoutes = require("./routes/linkedinSaveRoutes");
// const rankingRoutes      = require("./routes/rankingRoutes");
// const statsRoutes        = require("./routes/statsRoutes");

// // Connect to MongoDB
// connectDB();

// const app = express();

// // ✅ Vercel Fix: Read-only error se bachne ke liye ye change kiya
// const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp' : './uploads';
// if (!fs.existsSync(uploadDir)) {
//     try {
//         fs.mkdirSync(uploadDir);
//     } catch (err) {
//         console.log("Directory creation skipped or handled by Vercel");
//     }
// }

// // Core Middleware
// app.use(cors()); 
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.use(logger);

// // Routes
// app.use("/api/analysis",         analysisRoutes);
// app.use("/api/github-analyze",   githubRoutes);
// app.use("/api/linkedin-analyze", linkedinRoutes);
// app.use("/api/linkedin",         linkedinSaveRoutes);
// app.use("/api/rankings",         rankingRoutes);
// app.use("/api/stats",            statsRoutes);

// // Health check
// const mongoose = require("mongoose");
// // ✅ Fix: async add kiya taaki status check karne se pehle connection finish hone ka wait kare
// app.get("/", async (req, res) => {
//   if (mongoose.connection.readyState !== 1) {
//     await connectDB();
//   }
  
//   res.json({
//     message:     "✅ ResumeAI Server running!",
//     mongoStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
//     githubAuth:  !!process.env.GITHUB_TOKEN,
//   });
// });

// // Global error handler
// app.use(errorHandler);

// // Start Server
// const PORT = process.env.PORT || 5000;

// if (process.env.NODE_ENV !== 'production') {
//     app.listen(PORT, () => {
//         console.log(`🚀 Server running on port ${PORT}`);
//     });
// }

// // ✅ SABSE IMPORTANT: Vercel ko ye export chahiye
// module.exports = app;

































































const express       = require("express");
const path          = require("path");
const fs            = require("fs");
const cors          = require("cors");
require("dotenv").config();

const connectDB          = require("./config/db");
const errorHandler       = require("./middleware/errorHandler");
const logger             = require("./middleware/logger");

const analysisRoutes     = require("./routes/analysisRoutes");
const githubRoutes       = require("./routes/githubRoutes");
const linkedinRoutes     = require("./routes/linkedinRoutes");
const linkedinSaveRoutes = require("./routes/linkedinSaveRoutes");
const rankingRoutes      = require("./routes/rankingRoutes");
const statsRoutes        = require("./routes/statsRoutes");

connectDB();

const app = express();

if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

// ── FIXED CORS — allows both localhost and Vercel ─────────────
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://ai-smart-rezume-analyzer.vercel.app",
    "https://ai-smart-rezume-analyzer-6zfbxok7f.vercel.app",
  ],
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(logger);

app.use("/api/analysis",         analysisRoutes);
app.use("/api/github-analyze",   githubRoutes);
app.use("/api/linkedin-analyze", linkedinRoutes);
app.use("/api/linkedin",         linkedinSaveRoutes);
app.use("/api/rankings",         rankingRoutes);
app.use("/api/stats",            statsRoutes);

const mongoose = require("mongoose");
app.get("/", (req, res) => {
  res.json({
    message:     "✅ ResumeAI Server running!",
    mongoStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    githubAuth:  !!process.env.GITHUB_TOKEN,
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔐 GitHub Auth: ${process.env.GITHUB_TOKEN ? "✅ Token found" : "⚠️  No token"}`);
});