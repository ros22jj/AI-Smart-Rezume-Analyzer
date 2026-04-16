// ══════════════════════════════════════════════════════════════
// config/redis.js — Upstash Redis client
// Works on Vercel serverless (HTTP-based, no persistent connection)
//
// Setup:
//   1. Go to https://upstash.com → Create free Redis database
//   2. Copy REST URL and REST TOKEN
//   3. Add to Vercel server env vars:
//        UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
//        UPSTASH_REDIS_REST_TOKEN=your_token_here
// ══════════════════════════════════════════════════════════════

"use strict";

// ── Upstash Redis REST client (no TCP socket — works serverless) ─
class UpstashRedis {
  constructor() {
    this.url   = process.env.UPSTASH_REDIS_REST_URL;
    this.token = process.env.UPSTASH_REDIS_REST_TOKEN;
    this.ready = !!(this.url && this.token);

    if (!this.ready) {
      console.warn(
        "⚠️  Redis not configured — UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN missing.\n" +
        "   Rate limiting and session caching are DISABLED.\n" +
        "   Add them to Vercel → Settings → Environment Variables to enable."
      );
    } else {
      console.log("✅ Upstash Redis configured");
    }
  }

  // ── Internal HTTP call to Upstash REST API ──────────────────
  async _call(command) {
    if (!this.ready) return null;
    try {
      const res = await fetch(`${this.url}/${command.map(encodeURIComponent).join("/")}`, {
        method:  "GET",
        headers: { Authorization: `Bearer ${this.token}` },
      });
      if (!res.ok) {
        console.error(`Redis error ${res.status}:`, await res.text());
        return null;
      }
      const data = await res.json();
      return data.result ?? null;
    } catch (err) {
      console.error("Redis fetch error:", err.message);
      return null;
    }
  }

  // ── Pipeline (multiple commands in one HTTP call) ───────────
  async _pipeline(commands) {
    if (!this.ready) return null;
    try {
      const res = await fetch(`${this.url}/pipeline`, {
        method:  "POST",
        headers: {
          Authorization:  `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(commands),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("Redis pipeline error:", err.message);
      return null;
    }
  }

  // ── Public API ───────────────────────────────────────────────

  /** GET key → string | null */
  async get(key) {
    return this._call(["GET", key]);
  }

  /** SET key value EX ttlSeconds */
  async set(key, value, ttlSeconds = null) {
    if (ttlSeconds) return this._call(["SET", key, value, "EX", String(ttlSeconds)]);
    return this._call(["SET", key, value]);
  }

  /** DEL key */
  async del(key) {
    return this._call(["DEL", key]);
  }

  /**
   * INCR key + set TTL if key is new (atomic-ish via pipeline)
   * Returns the new integer value, or null if Redis unavailable
   */
  async incrWithTTL(key, ttlSeconds) {
    const results = await this._pipeline([
      ["INCR", key],
      ["EXPIRE", key, String(ttlSeconds)],
    ]);
    if (!results) return null;
    return results[0]?.result ?? null;
  }

  /** True if Redis is configured and reachable */
  isReady() {
    return this.ready;
  }
}

// Export a singleton
const redis = new UpstashRedis();
module.exports = redis;

