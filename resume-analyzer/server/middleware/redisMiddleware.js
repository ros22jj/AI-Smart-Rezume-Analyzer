// ══════════════════════════════════════════════════════════════
// middleware/redisMiddleware.js
//
// 1. rateLimiter   — limits Groq API calls per user per minute
// 2. sessionCache  — caches MentorChat sessions in Redis
// ══════════════════════════════════════════════════════════════

"use strict";

const redis = require("../config/redis");

// ── 1. Rate Limiter ───────────────────────────────────────────
// Limits how many Groq-powered requests a single user can make
// per minute. Protects your Groq API key from abuse.
//
// Limits (conservative, well under Groq's 30 req/min):
//   /api/mentor/start  → 3  per minute per user
//   /api/mentor/chat   → 20 per minute per user
//   /api/ats-builder   → 3  per minute per user
//
// If Redis is not configured, rate limiting is silently skipped.
// ─────────────────────────────────────────────────────────────
const RATE_LIMITS = {
  "mentor_start":   { max: 3,  window: 60,  label: "session starts" },
  "mentor_chat":    { max: 20, window: 60,  label: "chat messages"  },
  "ats_build":      { max: 3,  window: 60,  label: "ATS builds"     },
};

/**
 * createRateLimiter(action)
 * Returns an Express middleware that rate-limits by clerkUserId or IP.
 *
 * Usage:
 *   router.post("/start", createRateLimiter("mentor_start"), handler)
 *   router.post("/chat",  createRateLimiter("mentor_chat"),  handler)
 */
function createRateLimiter(action) {
  const limit = RATE_LIMITS[action];
  if (!limit) throw new Error(`Unknown rate-limit action: ${action}`);

  return async (req, res, next) => {
    // Skip if Redis not configured
    if (!redis.isReady()) return next();

    // Identify user by clerkUserId, fall back to IP
    const userId = req.body?.clerkUserId || req.ip || "anonymous";
    const key    = `rl:${action}:${userId}`;

    try {
      const count = await redis.incrWithTTL(key, limit.window);

      if (count === null) {
        // Redis call failed — fail open (don't block user)
        return next();
      }

      // Set helpful rate-limit headers
      res.setHeader("X-RateLimit-Limit",     limit.max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, limit.max - count));
      res.setHeader("X-RateLimit-Window",    `${limit.window}s`);

      if (count > limit.max) {
        console.warn(`🚦 Rate limit hit: ${userId} on ${action} (${count}/${limit.max})`);
        return res.status(429).json({
          success: false,
          error:   `Too many ${limit.label}. Please wait a moment before trying again.`,
          retryAfter: limit.window,
        });
      }

      next();
    } catch (err) {
      // Redis error — fail open
      console.error("Rate limiter error:", err.message);
      next();
    }
  };
}

// ── 2. Session Cache ──────────────────────────────────────────
// Caches MentorChat session data in Redis so /chat doesn't need
// to hit MongoDB on every single message.
//
// TTL: 2 hours (sessions older than 2h are evicted from cache,
//      but still persisted in MongoDB)
// ─────────────────────────────────────────────────────────────
const SESSION_TTL = 60 * 60 * 2; // 2 hours in seconds
const SESSION_PREFIX = "mentor:session:";

const sessionCache = {
  /**
   * Get a session from Redis cache.
   * Returns parsed session object or null if not cached.
   */
  async get(sessionId) {
    if (!redis.isReady()) return null;
    try {
      const raw = await redis.get(SESSION_PREFIX + sessionId);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.error("Session cache get error:", err.message);
      return null;
    }
  },

  /**
   * Store a session in Redis cache.
   * Pass the Mongoose document or a plain object.
   */
  async set(sessionId, sessionData) {
    if (!redis.isReady()) return;
    try {
      // Store only what we need for chat (not the full resume text)
      const cachePayload = {
        sessionId:     sessionData.sessionId,
        resumeText:    sessionData.resumeText,
        jobDescription:sessionData.jobDescription,
        careerContext: sessionData.careerContext,
        messages:      sessionData.messages,
      };
      await redis.set(
        SESSION_PREFIX + sessionId,
        JSON.stringify(cachePayload),
        SESSION_TTL
      );
    } catch (err) {
      console.error("Session cache set error:", err.message);
    }
  },

  /**
   * Remove a session from cache (call on delete).
   */
  async del(sessionId) {
    if (!redis.isReady()) return;
    try {
      await redis.del(SESSION_PREFIX + sessionId);
    } catch (err) {
      console.error("Session cache del error:", err.message);
    }
  },
};

module.exports = { createRateLimiter, sessionCache };  



