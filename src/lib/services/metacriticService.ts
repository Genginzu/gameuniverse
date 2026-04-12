import { logger } from "@/lib/logger";

const METACRITIC_BASE = "https://www.metacritic.com/game";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** Delay between requests to avoid being blocked */
const RATE_LIMIT_MS = 1500;

let lastRequestAt = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const wait = Math.max(0, RATE_LIMIT_MS - (now - lastRequestAt));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();

  return fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    cache: "no-store",
  });
}

/**
 * Attempts to scrape the Metascore from metacritic.com for a given game slug.
 * Returns the score (0-100) or null if not found.
 */
export async function fetchMetacriticScore(slug: string): Promise<number | null> {
  // Metacritic slugs use hyphens, same as IGDB in most cases
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
    logger.warn("Metacritic: fetch failed", { slug, error });
    return null;
  }
}

/**
 * Parse the metascore from Metacritic HTML.
 * Looks for patterns like "Metascore X out of 100" in the page content.
 */
function parseMetascore(html: string): number | null {
  // Pattern 1: JSON-LD structured data (most reliable)
  const jsonLdMatch = html.match(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i
  );
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      const rating = data?.aggregateRating?.ratingValue;
      if (typeof rating === "number" && rating >= 0 && rating <= 100) {
        return Math.round(rating);
      }
    } catch {
      // JSON-LD parse failed, try other patterns
    }
  }

  // Pattern 2: "ratingValue" in any script tag
  const ratingMatch = html.match(/"ratingValue"\s*:\s*"?(\d+)"?/);
  if (ratingMatch) {
    const score = parseInt(ratingMatch[1], 10);
    if (score >= 0 && score <= 100) return score;
  }

  // Pattern 3: Meta tag with metascore
  const metaMatch = html.match(/Metascore\s+(\d+)\s+out\s+of\s+100/i);
  if (metaMatch) {
    const score = parseInt(metaMatch[1], 10);
    if (score >= 0 && score <= 100) return score;
  }

  return null;
}
