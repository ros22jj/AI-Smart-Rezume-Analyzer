// ══════════════════════════════════════════════════════════════
// linkedinScraper.js  — Puppeteer-based LinkedIn scraper
// Works for PUBLIC profiles only. If private → returns null.
// No API keys. No paid plans. Free forever.
// ══════════════════════════════════════════════════════════════

const puppeteer = require("puppeteer-core");
const chromium  = require("@sparticuz/chromium");

// Validate & normalise LinkedIn profile URL
function normaliseLinkedInUrl(raw) {
  const trimmed = raw.trim().replace(/\/$/, "");
  const match   = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(in|pub)\/([a-zA-Z0-9\-_%]+)/i
  );
  if (!match) return null;
  return `https://www.linkedin.com/${match[1]}/${match[2]}/`;
}

async function scrapeLinkedIn(rawUrl) {
  const url = normaliseLinkedInUrl(rawUrl);
  if (!url) {
    throw new Error(
      "Invalid LinkedIn URL. Use format: https://www.linkedin.com/in/username"
    );
  }

  let browser = null;
  try {
    // ── Launch headless Chromium ──────────────────────────
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-features=VizDisplayCompositor",
        "--window-size=1280,800",
      ],
      defaultViewport: { width: 1280, height: 800 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Realistic browser headers
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    });

    // Block images/fonts/css to load faster
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "font", "media", "stylesheet"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Go to profile page, wait for network idle
    const response = await page.goto(url, {
      waitUntil: "networkidle2",
      timeout:   30000,
    });

    const finalUrl = page.url();

    // ── Detect private / auth-wall ────────────────────────
    if (
      finalUrl.includes("/login") ||
      finalUrl.includes("/authwall") ||
      finalUrl.includes("/signup") ||
      finalUrl.includes("join")
    ) {
      await browser.close();
      return {
        success:  false,
        private:  true,
        error:    "This LinkedIn profile is private or requires login. Please paste the profile text manually.",
      };
    }

    if (response && response.status() === 404) {
      await browser.close();
      return {
        success: false,
        private: false,
        error:   "LinkedIn profile not found. Check the URL.",
      };
    }

    // ── Wait a bit for JS to render ───────────────────────
    await page.waitForTimeout(2000);

    // ── Extract all visible text ──────────────────────────
    const extracted = await page.evaluate(() => {
      // Remove noise elements
      const remove = ["script","style","noscript","nav","footer","header",
        ".nav","[data-tracking-control-name]"];
      remove.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => el.remove());
      });

      // Try to get structured sections
      const parts = [];

      // Name
      const name = document.querySelector("h1")?.innerText?.trim() || "";
      if (name) parts.push(name);

      // Headline
      const headline =
        document.querySelector(".top-card-layout__headline, .pv-text-details__left-panel h2")
          ?.innerText?.trim() || "";
      if (headline) parts.push(headline);

      // About
      const about =
        document.querySelector(".core-section-container .core-section-container__content")
          ?.innerText?.trim() || "";
      if (about) parts.push("About\n" + about);

      // All section containers
      document.querySelectorAll("section, .artdeco-card").forEach(sec => {
        const t = sec.innerText?.replace(/\s+/g, " ").trim();
        if (t && t.length > 20) parts.push(t);
      });

      // Fallback: full body text
      const bodyText = document.body?.innerText
        ?.replace(/\t/g, " ")
        ?.replace(/[ ]{3,}/g, " ")
        ?.trim() || "";

      const structured = parts.join("\n\n");
      return structured.length > 200 ? structured : bodyText;
    });

    await browser.close();

    if (!extracted || extracted.length < 100) {
      return {
        success: false,
        private: true,
        error:   "Could not extract enough text. Profile may be private or restricted. Please paste text manually.",
      };
    }

    // Trim to analysis-ready size
    const text = extracted.slice(0, 5000);
    const nameMatch = text.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/);

    return {
      success:   true,
      text,
      name:      nameMatch?.[1] || "Unknown",
      charCount: text.length,
      url,
    };

  } catch (err) {
    if (browser) {
      try { await browser.close(); } catch {}
    }
    // Timeout or crash
    return {
      success: false,
      private: false,
      error:   `Scraping failed: ${err.message}. Please paste profile text manually.`,
    };
  }
}

module.exports = { scrapeLinkedIn, normaliseLinkedInUrl };