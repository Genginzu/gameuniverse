/**
 * IGDB API Fetcher - handles all IGDB API queries for the bulk import.
 * Encapsulates query building, rate limiting, and retry logic.
 */

import { IGDBService } from "../../../src/lib/services/igdbService";
import type { IGDBGame } from "../../../src/types/igdb";
import type { CLIOptions } from "../shared/types";
import { RateLimiter } from "../shared/rate-limiter";
import { withRetry } from "../shared/retry";

const IGDB_API_URL = "https://api.igdb.com/v4";
const BATCH_SIZE = 500; // Max allowed by IGDB

/**
 * Build the IGDB `where` clause from CLI options.
 * Centralises date range and category filters.
 */
function buildWhereClause(options: CLIOptions): string {
  const timestampFrom = Math.floor(options.fromDate.getTime() / 1000);
  const timestampTo = Math.floor(options.toDate.getTime() / 1000);

  let where = `first_release_date >= ${timestampFrom} & first_release_date <= ${timestampTo}`;
  where += ` & (game_type = 0 | game_type = 4 | game_type = 8 | game_type = 9 | game_type = 10)`;

  return where;
}

/**
 * Check if a game passes the notable-only filter.
 * A game is notable if it has at least one player/press rating, hype, or follows.
 */
export function isNotableGame(game: IGDBGame, notableOnly: boolean): boolean {
  if (!notableOnly) return true;

  const g = game as IGDBGame & {
    total_rating_count?: number;
    aggregated_rating_count?: number;
    hypes?: number;
    follows?: number;
  };

  return (
    (g.total_rating_count ?? 0) > 0 ||
    (g.aggregated_rating_count ?? 0) > 0 ||
    (g.hypes ?? 0) > 0 ||
    (g.follows ?? 0) > 0
  );
}

/**
 * Fetch the total count of games matching the CLI filters.
 * Used to initialize the progress bar with an accurate estimate.
 */
export async function fetchTotalCount(
  options: CLIOptions,
  rateLimiter: RateLimiter
): Promise<number> {
  const query = `
    fields id;
    where ${buildWhereClause(options)};
    limit 1;
  `;

  await rateLimiter.throttle();

  try {
    const result = await withRetry(
      async () => {
        const accessToken = await IGDBService.getAccessToken();
        const clientId = process.env.IGDB_CLIENT_ID;

        if (!clientId) {
          throw new Error("IGDB_CLIENT_ID not configured");
        }

        const response = await fetch(`${IGDB_API_URL}/games/count`, {
          method: "POST",
          headers: {
            "Client-ID": clientId,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "text/plain",
          },
          body: query,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`IGDB count failed: ${response.status} - ${errorText}`);
        }

        const data = (await response.json()) as { count: number };
        return data.count;
      },
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        verbose: options.verbose,
        operationName: "fetchTotalCount",
      }
    );

    return result.value;
  } catch {
    // If count fails, return 0 (progress bar will show "calculating...")
    return 0;
  }
}

/**
 * Fetch a batch of games from IGDB API.
 * Includes all fields needed for import + notable-only filtering.
 */
export async function fetchGamesBatch(
  options: CLIOptions,
  rateLimiter: RateLimiter,
  offset: number,
  limit: number
): Promise<IGDBGame[] | null> {
  const query = `
    fields name, slug, summary, storyline, first_release_date, game_type, aggregated_rating,
           total_rating_count, aggregated_rating_count, hypes, follows,
           cover.image_id,
           screenshots.image_id,
           artworks.image_id,
           genres.id, genres.name, genres.slug,
           involved_companies.company.id, involved_companies.company.name, involved_companies.company.slug,
           involved_companies.developer, involved_companies.publisher,
           language_supports.language.id, language_supports.language.name, language_supports.language.native_name, language_supports.language.locale,
           language_supports.language_support_type.id, language_supports.language_support_type.name,
           age_ratings.id, age_ratings.organization, age_ratings.rating_category, age_ratings.synopsis,
           age_ratings.rating_content_descriptions,
           platforms.id, platforms.name,
           videos.video_id, videos.name,
           dlcs, expansions, bundles;
    where ${buildWhereClause(options)};
    sort first_release_date desc;
    limit ${Math.min(limit, BATCH_SIZE)};
    offset ${offset};
  `;

  await rateLimiter.throttle();

  try {
    const result = await withRetry(
      async () => {
        const accessToken = await IGDBService.getAccessToken();
        const clientId = process.env.IGDB_CLIENT_ID;

        if (!clientId) {
          throw new Error("IGDB_CLIENT_ID not configured");
        }

        const response = await fetch(`${IGDB_API_URL}/games`, {
          method: "POST",
          headers: {
            "Client-ID": clientId,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "text/plain",
          },
          body: query,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `IGDB fetchGamesBatch failed: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

        return response.json() as Promise<IGDBGame[]>;
      },
      {
        maxAttempts: 5,
        initialDelayMs: 2000,
        verbose: options.verbose,
        operationName: `fetchGamesBatch(offset=${offset}, limit=${limit})`,
      }
    );

    if (options.verbose) {
      console.log(`[Fetch] Retrieved ${result.value.length} games from offset ${offset}`);
    }

    return result.value;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Import] fetchGamesBatch failed at offset ${offset}: ${msg}`);
    console.error(`[Import] Waiting 10s before continuing...`);
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    return null;
  }
}

export { BATCH_SIZE };
