// ══════════════════════════════════════════════════════════════
// POST /api/linkedin-scrape
// Body:    { url: "https://www.linkedin.com/in/username" }
// Returns: { success, text, name, charCount }  on success
//          { success:false, private, error }    on failure
// ══════════════════════════════════════════════════════════════

const express            = require("express");
const router             = express.Router();
const { scrapeLinkedIn } = require("../services/linkedinScraper");

router.post("/", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.trim()) {
      return res.json({ success: false, error: "LinkedIn URL is required" });
    }

    console.log(`🔍 Scraping LinkedIn: ${url}`);
    const result = await scrapeLinkedIn(url.trim());

    if (result.success) {
      console.log(`✅ LinkedIn scraped — ${result.charCount} chars — ${result.name}`);
    } else {
      console.warn(`⚠️ LinkedIn scrape failed — private:${result.private} — ${result.error}`);
    }

    // Always 200 — client decides what to do based on success flag
    res.json(result);

  } catch (err) {
    console.error("LinkedIn scrape route error:", err.message);
    res.json({
      success: false,
      private: false,
      error:   `Server error: ${err.message}. Please paste profile text manually.`,
    });
  }
});

module.exports = router;   


