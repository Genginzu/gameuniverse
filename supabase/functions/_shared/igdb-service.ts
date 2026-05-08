/**
 * IGDB API service — Deno port of src/lib/services/igdbService.ts.
 *
 * Only the methods actually used by the webhook processor are kept here.
 * Bulk admin operations (batch fetches, character fetching) stay on the
 * Next.js side and aren't duplicated.
 *
 * All outbound fetches are bounded by AbortSignal timeouts so that a slow
 * IGDB call cannot eat the Edge Function's CPU budget or trigger the
 * Postgres statement_timeout further down the pipeline.
 */

import { logger } from "./logger.ts";
import type {
  IGDBAgeRating,
  IGDBAuthToken,
  IGDBDlcExtension,
  IGDBGame,
  IGDBGameVersion,
  IGDBImageSize,
  IGDBTimeToBeat,
} from "./igdb-types.ts";

const TWITCH_AUTH_URL = "https://id.twitch.tv/oauth2/token";
const IGDB_API_URL = "https://api.igdb.com/v4";
const IMAGE_BASE_URL = "https://images.igdb.com/igdb/image/upload";

/** Per-request timeout (ms) for IGDB API calls. */
const IGDB_FETCH_TIMEOUT_MS = 3000;
/** Auth round-trip with Twitch is allowed slightly more time. */
const TWITCH_AUTH_TIMEOUT_MS = 5000;

interface TimeoutHandle {
  signal: AbortSignal;
  cancel: () => void;
}

function withTimeout(ms: number): TimeoutHandle {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

let tokenCache: IGDBAuthToken | null = null;

function isTokenValid(token: IGDBAuthToken): boolean {
  return token.expires_at > Date.now();
}

async function getAccessToken(): Promise<string> {
  if (tokenCache && isTokenValid(tokenCache)) {
    return tokenCache.access_token;
  }

  const clientId = Deno.env.get("IGDB_CLIENT_ID");
  const clientSecret = Deno.env.get("IGDB_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error(
      "IGDB credentials not configured (IGDB_CLIENT_ID, IGDB_CLIENT_SECRET)",
    );
  }

  const t = withTimeout(TWITCH_AUTH_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(TWITCH_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
      signal: t.signal,
    });
  } finally {
    t.cancel();
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to authenticate with Twitch: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const tokenData = await response.json();
  // 5-minute safety buffer before actual expiration
  const expiresAt = Date.now() + (tokenData.expires_in - 300) * 1000;

  tokenCache = {
    access_token: tokenData.access_token,
    expires_in: tokenData.expires_in,
    token_type: tokenData.token_type,
    expires_at: expiresAt,
  };

  return tokenCache.access_token;
}

async function igdbFetch(endpoint: string, body: string): Promise<Response> {
  const accessToken = await getAccessToken();
  const clientId = Deno.env.get("IGDB_CLIENT_ID");

  if (!clientId) {
    throw new Error("IGDB_CLIENT_ID not configured");
  }

  const t = withTimeout(IGDB_FETCH_TIMEOUT_MS);
  try {
    return await fetch(`${IGDB_API_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body,
      signal: t.signal,
    });
  } finally {
    t.cancel();
  }
}

export const IGDBService = {
  buildImageUrl(imageId: string, size: IGDBImageSize): string {
    return `${IMAGE_BASE_URL}/t_${size}/${imageId}.jpg`;
  },

  async getGameDetails(igdbId: number): Promise<IGDBGame | null> {
    const body = `
      fields name, slug, summary, storyline, first_release_date, aggregated_rating,
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
             dlcs, expansions, bundles, similar_games;
      where id = ${igdbId};
    `;

    const response = await igdbFetch("games", body);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `IGDB getGameDetails failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const games: IGDBGame[] = await response.json();
    return games.length === 0 ? null : games[0];
  },

  async getPopularityPrimitives(igdbId: number): Promise<{
    visits: number | null;
    wantToPlay: number | null;
    playing: number | null;
  } | null> {
    const body = `
      fields popularity_type, value;
      where game_id = ${igdbId} & popularity_type = (1,2,3);
      limit 50;
    `;

    const response = await igdbFetch("popularity_primitives", body);

    if (!response.ok) {
      logger.error("IGDB getPopularityPrimitives failed", {
        status: response.status,
        body: await response.text(),
      });
      return null;
    }

    const rows = (await response.json()) as Array<{
      popularity_type: number;
      value: number;
    }>;

    const pickMax = (type: number): number | null => {
      const vals = rows
        .filter((r) => r.popularity_type === type)
        .map((r) => r.value);
      return vals.length === 0 ? null : Math.max(...vals);
    };

    return {
      visits: pickMax(1),
      wantToPlay: pickMax(2),
      playing: pickMax(3),
    };
  },

  async getTimeToBeat(igdbId: number): Promise<IGDBTimeToBeat | null> {
    const body = `
      fields game_id, hastily, normally, completely, count;
      where game_id = ${igdbId};
    `;

    const response = await igdbFetch("game_time_to_beats", body);

    if (!response.ok) {
      logger.error("IGDB getTimeToBeat failed", {
        status: response.status,
        body: await response.text(),
      });
      return null;
    }

    const results: IGDBTimeToBeat[] = await response.json();
    return results.length === 0 ? null : results[0];
  },

  async getAgeRatings(ageRatingIds: number[]): Promise<IGDBAgeRating[]> {
    if (!ageRatingIds || ageRatingIds.length === 0) return [];

    const body = `
      fields id, organization, rating_category, synopsis, rating_content_descriptions, rating_cover_url;
      where id = (${ageRatingIds.join(",")});
      limit 50;
    `;

    const response = await igdbFetch("age_ratings", body);

    if (!response.ok) {
      logger.error("IGDB getAgeRatings failed", {
        status: response.status,
        body: await response.text(),
      });
      return [];
    }

    const results: IGDBAgeRating[] = await response.json();

    const allContentDescIds: number[] = [];
    for (const rating of results) {
      if (rating.rating_content_descriptions) {
        allContentDescIds.push(...rating.rating_content_descriptions);
      }
    }

    if (allContentDescIds.length > 0) {
      const contentDescriptions = await IGDBService.getAgeRatingContentDescriptions(
        allContentDescIds,
      );
      const contentDescMap = new Map(contentDescriptions.map((cd) => [cd.id, cd]));

      for (const rating of results) {
        if (rating.rating_content_descriptions) {
          rating.content_descriptions = rating.rating_content_descriptions
            .map((id) => contentDescMap.get(id))
            .filter(
              (cd): cd is { id: number; category: number; description: string } =>
                cd !== undefined,
            )
            .map((cd) => ({ category: cd.category, description: cd.description }));
        }
      }
    }

    return results;
  },

  async getAgeRatingContentDescriptions(
    contentDescIds: number[],
  ): Promise<Array<{ id: number; category: number; description: string }>> {
    if (!contentDescIds || contentDescIds.length === 0) return [];

    const uniqueIds = [...new Set(contentDescIds)];
    const body = `
      fields id, category, description;
      where id = (${uniqueIds.join(",")});
      limit 100;
    `;

    const response = await igdbFetch("age_rating_content_descriptions", body);

    if (!response.ok) {
      logger.error("IGDB getAgeRatingContentDescriptions failed", {
        status: response.status,
        body: await response.text(),
      });
      return [];
    }

    return await response.json();
  },

  async getGameVersions(igdbId: number): Promise<IGDBGameVersion[]> {
    const body = `
      fields id, name, slug, version_title, summary, cover.image_id;
      where version_parent = ${igdbId};
      limit 50;
    `;

    const response = await igdbFetch("games", body);

    if (!response.ok) {
      logger.error("IGDB getGameVersions failed", {
        status: response.status,
        body: await response.text(),
      });
      return [];
    }

    return await response.json();
  },

  async getDlcExtensions(ids: number[]): Promise<IGDBDlcExtension[]> {
    if (!ids || ids.length === 0) return [];

    try {
      const uniqueIds = [...new Set(ids)];
      const body = `
        fields name, slug, summary, game_type, first_release_date, cover.image_id;
        where id = (${uniqueIds.join(",")});
        limit 500;
      `;

      const response = await igdbFetch("games", body);

      if (!response.ok) {
        logger.error("IGDB getDlcExtensions failed", {
          status: response.status,
          body: await response.text(),
        });
        return [];
      }

      return await response.json();
    } catch (error) {
      logger.error("Error fetching DLC/extensions from IGDB", { error });
      return [];
    }
  },
};
