const { Octokit } = require("@octokit/rest");

// ── Create Octokit instance (with token if available) ─────────
function getOctokit() {
  const token = process.env.GITHUB_TOKEN;
  return token ? new Octokit({ auth: token }) : new Octokit();
}

// ── Safe API call — returns null on any error ─────────────────
async function safeCall(fn) {
  try {
    return await fn();
  } catch {
    return null;
  }
}

// ── Get all non-forked, non-archived repos (paginated) ────────
async function getAllRepos(octokit, username) {
  const repos = [];
  let page = 1;
  while (true) {
    const res = await safeCall(() =>
      octokit.rest.repos.listForUser({ username, per_page: 100, page })
    );
    if (!res || res.data.length === 0) break;
    repos.push(...res.data);
    if (res.data.length < 100) break;
    page++;
  }
  return repos.filter((r) => !r.fork && !r.archived);
}

// ── Skill alias map for normalization ─────────────────────────
const SKILL_ALIASES = {
  javascript:   ["javascript","js","node.js","nodejs","node","react","vue","angular","next.js","nextjs"],
  typescript:   ["typescript","ts"],
  python:       ["python","py"],
  java:         ["java"],
  "c++":        ["c++","cpp","c plus plus"],
  "c#":         ["c#","csharp","dotnet",".net"],
  react:        ["react","reactjs","react.js"],
  node:         ["node","nodejs","node.js","express","expressjs"],
  vue:          ["vue","vuejs","vue.js"],
  angular:      ["angular","angularjs"],
  docker:       ["docker"],
  kubernetes:   ["kubernetes","k8s"],
  aws:          ["aws","amazon web services","s3","ec2","lambda"],
  mongodb:      ["mongodb","mongo"],
  postgresql:   ["postgresql","postgres"],
  mysql:        ["mysql"],
  redis:        ["redis"],
  graphql:      ["graphql"],
  html:         ["html","html5"],
  css:          ["css","css3","scss","sass"],
  flutter:      ["flutter","dart"],
  swift:        ["swift"],
  kotlin:       ["kotlin"],
  rust:         ["rust"],
  go:           ["go","golang"],
  php:          ["php"],
  ruby:         ["ruby","rails"],
};

function normalizeSkill(skill) {
  const s = skill.toLowerCase().trim();
  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    if (aliases.some((a) => s.includes(a) || a.includes(s))) return canonical;
  }
  return s;
}

// ══════════════════════════════════════════════════════════════
// MAIN: analyzeGitHub — returns all 10 metrics
// ══════════════════════════════════════════════════════════════
async function analyzeGitHub({ githubUsername, resumeSkills = [], resumeProjects = [], claimedYears = 0 }) {
  const octokit = getOctokit();

  // ── User profile ───────────────────────────────────────────
  const userRes = await safeCall(() =>
    octokit.rest.users.getByUsername({ username: githubUsername })
  );
  if (!userRes) throw new Error(`GitHub user "${githubUsername}" not found`);
  const user = userRes.data;

  const repos    = await getAllRepos(octokit, githubUsername);
  const top15    = repos.slice(0, 15);

  // ── Language & topic map per repo ─────────────────────────
  const repoLanguageMap = {};
  const allLanguages    = {};
  const repoTopicMap    = {};

  for (const repo of top15) {
    const langRes = await safeCall(() =>
      octokit.rest.repos.listLanguages({ owner: githubUsername, repo: repo.name })
    );
    const langs = langRes ? Object.keys(langRes.data).map((l) => l.toLowerCase()) : [];
    repoLanguageMap[repo.name] = langs;
    langs.forEach((l) => { allLanguages[l] = (allLanguages[l] || 0) + 1; });

    const topics = (repo.topics || []).map((t) => t.toLowerCase());
    repoTopicMap[repo.name] = topics;
    topics.forEach((t) => { allLanguages[t] = (allLanguages[t] || 0) + 1; });
  }

  const topLanguages = Object.entries(allLanguages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, projects]) => ({ name, projects }));

  // ── METRIC 1: Skill Match ──────────────────────────────────
  const githubSkillSet         = new Set(Object.keys(allLanguages).map(normalizeSkill));
  const normalizedResumeSkills = [...new Set(resumeSkills.map(normalizeSkill))];
  const matchedSkills          = normalizedResumeSkills.filter((s) => githubSkillSet.has(s));
  const unmatchedSkills        = normalizedResumeSkills.filter((s) => !githubSkillSet.has(s));
  const skillMatchScore        = normalizedResumeSkills.length
    ? Math.round((matchedSkills.length / normalizedResumeSkills.length) * 100) : 0;

  // ── METRIC 2: Tech Usage Depth ────────────────────────────
  const techUsageVerification = normalizedResumeSkills.slice(0, 10).map((skill) => {
    const reposUsing = top15.filter((repo) => {
      const langs  = repoLanguageMap[repo.name] || [];
      const topics = repoTopicMap[repo.name]    || [];
      return [...langs, ...topics].some((l) => normalizeSkill(l) === skill);
    });
    const status = reposUsing.length >= 3 ? "✅" : reposUsing.length >= 1 ? "⚠️" : "❌";
    return { skill, repoCount: reposUsing.length, status };
  });

  const techUsageScore = normalizedResumeSkills.length
    ? Math.round(
        (techUsageVerification.filter((t) => t.status === "✅").length * 100 +
          techUsageVerification.filter((t) => t.status === "⚠️").length * 50) /
          Math.max(normalizedResumeSkills.length, 1)
      ) : 0;

  // ── METRIC 3: Project Verification ────────────────────────
  const verifiedProjects = [];
  const missingProjects  = [];
  for (const project of resumeProjects.slice(0, 8)) {
    const pClean = project.toLowerCase().replace(/[-_]/g, " ");
    const found  = repos.find((r) => {
      const rName = r.name.toLowerCase().replace(/[-_]/g, " ");
      return (
        rName.includes(pClean) || pClean.includes(rName) ||
        (r.description || "").toLowerCase().includes(pClean)
      );
    });
    if (found) verifiedProjects.push({ name: project, repo: found.name, url: found.html_url });
    else missingProjects.push(project);
  }
  const projectMatchScore = resumeProjects.length
    ? Math.round((verifiedProjects.length / Math.min(resumeProjects.length, 8)) * 100) : 0;

  // ── METRIC 4: Project Depth ───────────────────────────────
  const projectDepthDetails = [];
  for (const vp of verifiedProjects.slice(0, 5)) {
    const repo = repos.find((r) => r.name === vp.repo);
    if (!repo) continue;
    const size        = repo.size || 0;
    const stars       = repo.stargazers_count || 0;
    const forks       = repo.forks_count || 0;
    const hasDesc     = !!repo.description;
    const hasTopics   = (repo.topics || []).length > 0;
    const hasHomepage = !!repo.homepage;
    let depth = "Basic ⚠️", depthScore = 30;
    if (size > 5000 || stars > 10 || forks > 5)           { depth = "Advanced ✅";      depthScore = 90; }
    else if (size > 500 || (hasDesc && hasTopics))         { depth = "Intermediate ✅";  depthScore = 65; }
    projectDepthDetails.push({ name: vp.name, repo: vp.repo, depth, depthScore, size, stars, forks, hasHomepage });
  }
  const projectDepthScore = projectDepthDetails.length
    ? Math.round(projectDepthDetails.reduce((s, p) => s + p.depthScore, 0) / projectDepthDetails.length) : 0;

  // ── METRIC 5: Activity Match ──────────────────────────────
  const allCommitMonths = new Set();
  let   totalCommits    = 0;
  for (const repo of top15.slice(0, 5)) {
    const commitsRes = await safeCall(() =>
      octokit.rest.repos.listCommits({
        owner: githubUsername, repo: repo.name,
        author: githubUsername, per_page: 100,
      })
    );
    if (commitsRes) {
      totalCommits += commitsRes.data.length;
      commitsRes.data.forEach((c) => {
        const date = c.commit?.author?.date;
        if (date) allCommitMonths.add(date.slice(0, 7));
      });
    }
  }
  const activeMonths      = allCommitMonths.size;
  const claimedMonths     = Math.max(claimedYears * 12, 1);
  const activityMatchScore = Math.round(Math.min(activeMonths / claimedMonths, 1) * 100);
  const activityScore      = Math.min(activeMonths * 5, 100);

  // ── METRIC 6: Tech Stack Relevance ────────────────────────
  const resumeSkillSet   = new Set(normalizedResumeSkills);
  const frontendSkills   = ["react","vue","angular","html","css","javascript","typescript","next.js"];
  const backendSkills    = ["node","python","java","go","php","ruby","c#","express"];
  const devopsSkills     = ["docker","kubernetes","aws","azure","ci/cd","terraform"];
  const domainScores     = {
    frontend: frontendSkills.filter((s) => githubSkillSet.has(s) && resumeSkillSet.has(s)).length /
              Math.max(frontendSkills.filter((s) => resumeSkillSet.has(s)).length, 1),
    backend:  backendSkills.filter((s) => githubSkillSet.has(s) && resumeSkillSet.has(s)).length /
              Math.max(backendSkills.filter((s) => resumeSkillSet.has(s)).length, 1),
    devops:   devopsSkills.filter((s) => githubSkillSet.has(s) && resumeSkillSet.has(s)).length /
              Math.max(devopsSkills.filter((s) => resumeSkillSet.has(s)).length, 1),
  };
  const techStackScore = Math.round(Math.max(...Object.values(domainScores)) * 100);

  // ── METRIC 7: Consistency ─────────────────────────────────
  const monthCounts     = {};
  allCommitMonths.forEach((m) => { monthCounts[m] = (monthCounts[m] || 0) + 1; });
  const sortedMonths    = Object.keys(monthCounts).sort();
  let consecutiveStreaks = 0;
  for (let i = 1; i < sortedMonths.length; i++) {
    const prev      = new Date(sortedMonths[i - 1] + "-01");
    const curr      = new Date(sortedMonths[i]     + "-01");
    const diffMonths = (curr.getFullYear() - prev.getFullYear()) * 12 + curr.getMonth() - prev.getMonth();
    if (diffMonths === 1) consecutiveStreaks++;
  }
  const longestStreak    = sortedMonths.length > 0 ? Math.min(consecutiveStreaks + 1, 12) : 0;
  const consistencyScore = Math.min(
    Math.round((longestStreak / 6) * 50 + (activeMonths > 3 ? 50 : activeMonths * 15)), 100
  );

  // ── METRIC 8: Code Evidence ───────────────────────────────
  const codeEvidenceDetails = techUsageVerification.map((t) => ({
    skill:    t.skill,
    evidence: t.repoCount > 0 ? `Found in ${t.repoCount} repo${t.repoCount > 1 ? "s" : ""}` : "No evidence found",
    verified: t.repoCount > 0,
    status:   t.status,
  }));
  const codeEvidenceScore = normalizedResumeSkills.length
    ? Math.round((codeEvidenceDetails.filter((c) => c.verified).length / normalizedResumeSkills.length) * 100) : 0;

  // ── METRIC 9: Deployment Verified ────────────────────────
  const deployedRepos  = repos.filter((r) => !!r.homepage && r.homepage.trim() !== "");
  const reposWithPages = repos.filter((r) => r.has_pages);
  const totalDeployed  = new Set([
    ...deployedRepos.map((r) => r.name),
    ...reposWithPages.map((r) => r.name),
  ]).size;
  const deploymentScore  = Math.min(Math.round((totalDeployed / Math.max(repos.length, 1)) * 100 * 3), 100);
  const deployedDetails  = deployedRepos.slice(0, 5).map((r) => ({ name: r.name, url: r.homepage }));

  // ── METRIC 10: Trust Score (composite) ───────────────────
  const trustScore = Math.round(
    skillMatchScore    * 0.2 +
    projectMatchScore  * 0.2 +
    activityMatchScore * 0.15 +
    codeEvidenceScore  * 0.2 +
    consistencyScore   * 0.15 +
    deploymentScore    * 0.1
  );

  // ── Summary stats ─────────────────────────────────────────
  const totalStars       = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const accountAgeMonths = Math.round(
    (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  return {
    // scores
    skillMatchScore, techUsageScore, projectMatchScore, projectDepthScore,
    activityMatchScore, techStackScore, consistencyScore, codeEvidenceScore,
    deploymentScore, trustScore, activityScore,
    // details
    matchedSkills, unmatchedSkills, resumeSkills: normalizedResumeSkills,
    techUsageVerification, verifiedProjects, missingProjects,
    projectDepthDetails, codeEvidenceDetails, deployedDetails,
    // stats
    totalRepos: repos.length, totalStars, totalCommits,
    activeMonths, claimedMonths, longestStreak, accountAgeMonths,
    topLanguages,
    // profile
    profileUrl: user.html_url, avatarUrl: user.avatar_url,
    name: user.name, bio: user.bio,
    followers: user.followers, publicRepos: user.public_repos,
    recentRepos: repos.slice(0, 6).map((r) => ({
      name:        r.name,
      description: r.description,
      stars:       r.stargazers_count,
      forks:       r.forks_count,
      url:         r.html_url,
      homepage:    r.homepage,
      language:    r.language,
      updatedAt:   r.updated_at,
    })),
  };
}

module.exports = { analyzeGitHub };