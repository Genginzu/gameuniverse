/**
 * Metacritic Metascore scraper.
 * Deno port of src/lib/services/metacriticService.ts.
 *
 * Best-effort: failures (network, parse, 404, timeout) return null and
 * the caller keeps going. The Edge Function won't fail an import for a
 * missing score.
 */

import { logger } from "./logger.ts";

const METACRITIC_BASE = "https://www.metacritic.com/game";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const RATE_LIMIT_MS = 150;
/** Hard cap on each Metacritic request — we mustn't burn the Edge
 * Function budget waiting on a slow third-party scrape. */
const FETCH_TIMEOUT_MS = 5000;

let lastRequestAt = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const wait = Math.max(0, RATE_LIMIT_MS - (now - lastRequestAt));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchMetacriticScore(slug: string): Promise<number | null> {
  const url = `${METACRITIC_BASE}/${slug}`;

  try {
    const res = await rateLimitedFetch(url);
    if (!res.ok) {
      if (res.status === 404) {
        logger.info("Metacritic: game not found", { slug });
        return null;
      }
      logger.warn("Metacritic: unexpected status", { slug, status: res.status });
      return null;
    }

    const html = await res.text();
    return parseMetascore(html);
  } catch (error) {
    // AbortError when the timeout fires — keep this at info level since
    // it's expected and recoverable.
    const isAbort =
      error instanceof Error &&
      (error.name === "AbortError" || error.name === "TimeoutError");
    if (isAbort) {
      logger.info("Metacritic: fetch timed out", { slug, timeoutMs: FETCH_TIMEOUT_MS });
    } else {
      logger.warn("Metacritic: fetch failed", { slug, error });
    }
    return null;
  }
}

function parseMetascore(html: string): number | null {
  if (html.includes("Critic reviews are not available yet")) {
    return null;
  }

  // JSON-LD first (most reliable)
  const jsonLdMatch = html.match(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i,
  );
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      const rating = data?.aggregateRating?.ratingValue;
      if (typeof rating === "number" && rating >= 0 && rating <= 100) {
        return Math.round(rating);
      }
      if (typeof rating === "string") {
        const parsed = parseInt(rating, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) return parsed;
      }
    } catch {
      // fall through to regex pattern
    }
  }

  const metaMatch = html.match(/Metascore\s+(\d+)\s+out\s+of\s+100/i);
  if (metaMatch) {
    const score = parseInt(metaMatch[1], 10);
    if (score >= 0 && score <= 100) return score;
  }

  return null;
}
