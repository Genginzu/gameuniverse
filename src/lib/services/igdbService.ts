import {
  IGDBAuthToken,
  IGDBGame,
  IGDBSearchResult,
  IGDBImageSize,
  IGDBTimeToBeat,
  IGDBAgeRating,
  IGDBGameVersion,
  IGDBDlcExtension,
  IGDBCharacter,
} from "@/types/igdb";
import { logger } from "@/lib/logger";

/**
 * Service for interacting with the IGDB (Internet Game Database) API
 * Handles authentication via Twitch OAuth and provides methods for searching and fetching game data
 */
export class IGDBService {
  private static tokenCache: IGDBAuthToken | null = null;

  private static readonly TWITCH_AUTH_URL = "https://id.twitch.tv/oauth2/token";
  private static readonly IGDB_API_URL = "https://api.igdb.com/v4";
  private static readonly IMAGE_BASE_URL = "https://images.igdb.com/igdb/image/upload";

  /**
   * Gets a valid access token for IGDB API requests
   * Uses cached token if still valid, otherwise fetches a new one
   * @returns The access token string
   * @throws Error if authentication fails
   */
  static async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.tokenCache && this.isTokenValid(this.tokenCache)) {
      return this.tokenCache.access_token;
    }

    // Fetch new token
    const clientId = process.env.IGDB_CLIENT_ID;
    const clientSecret = process.env.IGDB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        "IGDB credentials not configured. Please set IGDB_CLIENT_ID and IGDB_CLIENT_SECRET environment variables."
      );
    }

    const response = await fetch(this.TWITCH_AUTH_URL, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to authenticate with Twitch: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const tokenData = await response.json();

    // Calculate expiration timestamp (with 5 minute buffer)
    const expiresAt = Date.now() + (tokenData.expires_in - 300) * 1000;

    this.tokenCache = {
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      expires_at: expiresAt,
    };

    return this.tokenCache.access_token;
  }

  /**
   * Checks if a token is still valid
   * @param token The token to check
   * @returns true if the token is valid, false otherwise
   */
  private static isTokenValid(token: IGDBAuthToken): boolean {
    return token.expires_at > Date.now();
  }

  /**
   * Builds an IGDB image URL from an image ID and size
   * @param imageId The IGDB image ID
   * @param size The desired image size
   * @returns The full image URL
   */
  static buildImageUrl(imageId: string, size: IGDBImageSize): string {
    return `${this.IMAGE_BASE_URL}/t_${size}/${imageId}.jpg`;
  }

  /**
   * Authenticated POST to an arbitrary IGDB endpoint. Prefer one of the
   * dedicated helpers above; use this for endpoints that don't have one.
   */
  static async rawQuery(endpoint: string, body: string): Promise<Response> {
    return this.igdbFetch(endpoint, body);
  }

  /**
   * Makes an authenticated POST request to the IGDB API.
   * Uses cache: 'no-store' to prevent Next.js from caching responses.
   */
  private static async igdbFetch(endpoint: string, body: string): Promise<Response> {
    const accessToken = await this.getAccessToken();
    const clientId = process.env.IGDB_CLIENT_ID;

    if (!clientId) {
      throw new Error("IGDB_CLIENT_ID not configured");
    }

    return fetch(`${this.IGDB_API_URL}/${endpoint}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body,
    });
  }

  /**
   * Searches for games in the IGDB database
   * Supports partial word matching (e.g., "Dragon Quest Rei" finds "Dragon Quest Reimagined")
   * @param query The search query string
   * @param limit Maximum number of results to return (default: 10)
   * @returns Array of search results
   */
  static async searchGames(query: string, limit: number = 10): Promise<IGDBSearchResult[]> {
    // Split query into words and build a where clause that matches all words
    // Using case-insensitive contains (~) for each word to support partial matching
    const words = query.trim().split(/\s+/).filter(Boolean);
    const escapedWords = words.map((word) => word.replace(/"/g, '\\"').replace(/\*/g, "\\*"));

    // Build where conditions: each word must appear in the name (case-insensitive)
    // Exclude game versions (editions) which have a version_parent
    // Only keep main games (0) and standalone expansions (4) via game_type (replaces deprecated category)
    const whereConditions = escapedWords.map((word) => `name ~ *"${word}"*`).join(" & ");

    const body = `
      fields name, slug, cover.image_id, first_release_date, involved_companies.company.name, involved_companies.developer;
      where ${whereConditions} & version_parent = null & (game_type = 0 | game_type = 4);
      limit ${limit};
    `;

    const response = await this.igdbFetch("games", body);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `IGDB search failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const games: IGDBGame[] = await response.json();

    return games.map((game) => this.transformToSearchResult(game));
  }

  /**
   * Transforms an IGDBGame to IGDBSearchResult format
   * @param game The IGDB game data
   * @returns The transformed search result
   */
  private static transformToSearchResult(game: IGDBGame): IGDBSearchResult {
    // Find the developer from involved_companies
    const developerCompany = game.involved_companies?.find((ic) => ic.developer);

    // Extract release year from Unix timestamp
    const releaseYear = game.first_release_date
      ? new Date(game.first_release_date * 1000).getFullYear()
      : undefined;

    // Build cover URL if available
    const coverUrl = game.cover?.image_id
      ? this.buildImageUrl(game.cover.image_id, "cover_big")
      : undefined;

    return {
      id: game.id,
      name: game.name,
      slug: game.slug,
      cover_url: coverUrl,
      release_year: releaseYear,
      developer: developerCompany?.company?.name,
    };
  }

  /**
   * Fetches complete details for a specific game from IGDB
   * @param igdbId The IGDB game ID
   * @returns The full game details or null if not found
   */
  static async getGameDetails(igdbId: number): Promise<IGDBGame | null> {
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

    const response = await this.igdbFetch("games", body);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `IGDB getGameDetails failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const games: IGDBGame[] = await response.json();
    return games.length === 0 ? null : games[0];
  }

  // ---------------------------------------------------------------------------
  // Batch methods for granular enrichment tabs
  // ---------------------------------------------------------------------------

  /** Batch fetch screenshots for multiple games */
  static async getScreenshotsBatch(
    igdbIds: number[]
  ): Promise<Map<number, Array<{ image_id: string }>>> {
    return this.batchGameFields(igdbIds, "screenshots.image_id", "screenshots");
  }

  /** Batch fetch artworks for multiple games */
  static async getArtworksBatch(
    igdbIds: number[]
  ): Promise<Map<number, Array<{ image_id: string }>>> {
    return this.batchGameFields(igdbIds, "artworks.image_id", "artworks");
  }

  /** Batch fetch videos for multiple games */
  static async getVideosBatch(
    igdbIds: number[]
  ): Promise<Map<number, Array<{ video_id: string; name?: string }>>> {
    return this.batchGameFields(igdbIds, "videos.video_id, videos.name", "videos");
  }

  /** Batch fetch age ratings for multiple games */
  static async getClassificationsBatch(igdbIds: number[]): Promise<Map<number, IGDBGame>> {
    return this.batchGameFieldsRaw(
      igdbIds,
      "age_ratings.id, age_ratings.organization, age_ratings.rating_category, age_ratings.synopsis, age_ratings.rating_content_descriptions"
    );
  }

  /** Batch fetch language supports for multiple games */
  static async getLanguagesBatch(igdbIds: number[]): Promise<Map<number, IGDBGame>> {
    return this.batchGameFieldsRaw(
      igdbIds,
      "language_supports.language.id, language_supports.language.name, language_supports.language.native_name, language_supports.language.locale, language_supports.language_support_type.id, language_supports.language_support_type.name"
    );
  }

  /** Batch fetch game versions (editions) */
  static async getVersionsBatch(igdbIds: number[]): Promise<Map<number, IGDBGameVersion[]>> {
    const map = new Map<number, IGDBGameVersion[]>();
    if (igdbIds.length === 0) return map;
    const body = `
      fields id, name, slug, version_title, summary, cover.image_id, version_parent;
      where version_parent = (${igdbIds.join(",")});
      limit 500;
    `;
    const response = await this.igdbFetch("games", body);
    if (!response.ok) return map;
    const results: (IGDBGameVersion & { version_parent: number })[] = await response.json();
    for (const v of results) {
      if (!map.has(v.version_parent)) map.set(v.version_parent, []);
      map.get(v.version_parent)!.push(v);
    }
    return map;
  }

  /** Batch fetch time-to-beat for multiple games */
  static async getPlaytimeBatch(igdbIds: number[]): Promise<Map<number, IGDBTimeToBeat>> {
    const map = new Map<number, IGDBTimeToBeat>();
    if (igdbIds.length === 0) return map;
    const body = `
      fields game_id, hastily, normally, completely, count;
      where game_id = (${igdbIds.join(",")});
      limit 500;
    `;
    const response = await this.igdbFetch("game_time_to_beats", body);
    if (!response.ok) return map;
    const results: IGDBTimeToBeat[] = await response.json();
    for (const r of results) {
      if (r.game_id && !map.has(r.game_id)) map.set(r.game_id, r);
    }
    return map;
  }

  /** Batch fetch popularity primitives for multiple games */
  static async getPopularityBatch(
    igdbIds: number[]
  ): Promise<
    Map<number, { visits: number | null; wantToPlay: number | null; playing: number | null }>
  > {
    const map = new Map<
      number,
      { visits: number | null; wantToPlay: number | null; playing: number | null }
    >();
    if (igdbIds.length === 0) return map;
    const body = `
      fields game_id, popularity_type, value;
      where game_id = (${igdbIds.join(",")}) & popularity_type = (1,2,3);
      limit 500;
    `;
    const response = await this.igdbFetch("popularity_primitives", body);
    if (!response.ok) return map;
    const rows = (await response.json()) as Array<{
      game_id: number;
      popularity_type: number;
      value: number;
    }>;
    const grouped = new Map<number, Array<{ popularity_type: number; value: number }>>();
    for (const r of rows) {
      if (!grouped.has(r.game_id)) grouped.set(r.game_id, []);
      grouped.get(r.game_id)!.push(r);
    }
    for (const [gameId, vals] of grouped) {
      const pickMax = (type: number): number | null => {
        const v = vals.filter((r) => r.popularity_type === type).map((r) => r.value);
        return v.length === 0 ? null : Math.max(...v);
      };
      map.set(gameId, { visits: pickMax(1), wantToPlay: pickMax(2), playing: pickMax(3) });
    }
    return map;
  }

  // ---------------------------------------------------------------------------
  // Internal batch helpers
  // ---------------------------------------------------------------------------

  /** Generic batch: fetch a single array field from /games for multiple IDs */
  private static async batchGameFields<T>(
    igdbIds: number[],
    fields: string,
    key: string
  ): Promise<Map<number, T[]>> {
    const map = new Map<number, T[]>();
    if (igdbIds.length === 0) return map;
    const body = `fields ${fields}; where id = (${igdbIds.join(",")}); limit ${igdbIds.length};`;
    const response = await this.igdbFetch("games", body);
    if (!response.ok) return map;
    const games = (await response.json()) as Array<{ id: number; [k: string]: unknown }>;
    for (const g of games) {
      map.set(g.id, (g[key] as T[]) ?? []);
    }
    return map;
  }

  /** Generic batch: fetch raw IGDBGame-like objects with specific fields */
  private static async batchGameFieldsRaw(
    igdbIds: number[],
    fields: string
  ): Promise<Map<number, IGDBGame>> {
    const map = new Map<number, IGDBGame>();
    if (igdbIds.length === 0) return map;
    const body = `fields ${fields}; where id = (${igdbIds.join(",")}); limit ${igdbIds.length};`;
    const response = await this.igdbFetch("games", body);
    if (!response.ok) return map;
    const games: IGDBGame[] = await response.json();
    for (const g of games) map.set(g.id, g);
    return map;
  }

  /**
   * Fetches IGDB popularity primitives for a game. Returns the max observed
   * value for each of types 1 (Visits), 2 (Want to Play), 3 (Playing).
   * Returns null if the fetch fails; missing primitives come back as null
   * fields rather than null result so the caller can still write a row.
   * @param igdbId The IGDB game ID
   */
  static async getPopularityPrimitives(igdbId: number): Promise<{
    visits: number | null;
    wantToPlay: number | null;
    playing: number | null;
  } | null> {
    const body = `
      fields popularity_type, value;
      where game_id = ${igdbId} & popularity_type = (1,2,3);
      limit 50;
    `;

    const response = await this.igdbFetch("popularity_primitives", body);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("IGDB getPopularityPrimitives failed", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return null;
    }

    const rows = (await response.json()) as Array<{ popularity_type: number; value: number }>;

    const pickMax = (type: number): number | null => {
      const vals = rows.filter((r) => r.popularity_type === type).map((r) => r.value);
      return vals.length === 0 ? null : Math.max(...vals);
    };

    return {
      visits: pickMax(1),
      wantToPlay: pickMax(2),
      playing: pickMax(3),
    };
  }

  /**
   * Fetches time to beat data for a game from IGDB
   * @param igdbId The IGDB game ID
   * @returns Time to beat data or null if not found
   */
  static async getTimeToBeat(igdbId: number): Promise<IGDBTimeToBeat | null> {
    const body = `
      fields game_id, hastily, normally, completely, count;
      where game_id = ${igdbId};
    `;

    const response = await this.igdbFetch("game_time_to_beats", body);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("IGDB getTimeToBeat failed", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return null;
    }

    const results: IGDBTimeToBeat[] = await response.json();
    return results.length === 0 ? null : results[0];
  }

  /**
   * Fetches age ratings for a game from IGDB
   * @param ageRatingIds Array of age rating IDs from the game
   * @returns Array of age rating data with content descriptions
   */
  static async getAgeRatings(ageRatingIds: number[]): Promise<IGDBAgeRating[]> {
    if (!ageRatingIds || ageRatingIds.length === 0) {
      return [];
    }

    const body = `
      fields id, organization, rating_category, synopsis, rating_content_descriptions, rating_cover_url;
      where id = (${ageRatingIds.join(",")});
      limit 50;
    `;

    const response = await this.igdbFetch("age_ratings", body);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("IGDB getAgeRatings failed", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return [];
    }

    const rawText = await response.text();

    const results: IGDBAgeRating[] = JSON.parse(rawText);

    // Collect all content description IDs to fetch
    const allContentDescIds: number[] = [];
    for (const rating of results) {
      if (rating.rating_content_descriptions) {
        allContentDescIds.push(...rating.rating_content_descriptions);
      }
    }

    // Fetch content descriptions if any
    if (allContentDescIds.length > 0) {
      const contentDescriptions = await this.getAgeRatingContentDescriptions(allContentDescIds);
      const contentDescMap = new Map(contentDescriptions.map((cd) => [cd.id, cd]));

      // Attach content descriptions to each rating
      for (const rating of results) {
        if (rating.rating_content_descriptions) {
          rating.content_descriptions = rating.rating_content_descriptions
            .map((id) => contentDescMap.get(id))
            .filter(
              (cd): cd is { id: number; category: number; description: string } => cd !== undefined
            )
            .map((cd) => ({ category: cd.category, description: cd.description }));
        }
      }
    }

    return results;
  }

  /**
   * Fetches age rating content descriptions from IGDB
   * @param contentDescIds Array of content description IDs
   * @returns Array of content description data
   */
  static async getAgeRatingContentDescriptions(
    contentDescIds: number[]
  ): Promise<Array<{ id: number; category: number; description: string }>> {
    if (!contentDescIds || contentDescIds.length === 0) {
      return [];
    }

    const uniqueIds = [...new Set(contentDescIds)];
    const body = `
      fields id, category, description;
      where id = (${uniqueIds.join(",")});
      limit 100;
    `;

    const response = await this.igdbFetch("age_rating_content_descriptions", body);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("IGDB getAgeRatingContentDescriptions failed", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return [];
    }

    const results = await response.json();
    return results;
  }

  /**
   * Fetches all versions (editions) of a game from IGDB
   * Versions are games that have the specified game as their version_parent
   * @param igdbId The IGDB game ID of the parent game
   * @returns Array of game versions (editions like Collector's, Deluxe, GOTY, etc.)
   */
  static async getGameVersions(igdbId: number): Promise<IGDBGameVersion[]> {
    const body = `
      fields id, name, slug, version_title, summary, cover.image_id;
      where version_parent = ${igdbId};
      limit 50;
    `;

    const response = await this.igdbFetch("games", body);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("IGDB getGameVersions failed", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return [];
    }

    return response.json();
  }

  /**
   * Fetches DLC, expansion, and bundle details from IGDB by their IDs
   * Performs a batch query to /games with where id = (id1, id2, ...)
   * @param ids - Array of IGDB game IDs to fetch
   * @returns Array of DLC/extension details, or empty array if none found or on error
   */
  static async getDlcExtensions(ids: number[]): Promise<IGDBDlcExtension[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    try {
      const uniqueIds = [...new Set(ids)];
      const body = `
        fields name, slug, summary, game_type, first_release_date, cover.image_id;
        where id = (${uniqueIds.join(",")});
        limit 500;
      `;

      const response = await this.igdbFetch("games", body);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("IGDB getDlcExtensions failed", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        return [];
      }

      return response.json();
    } catch (error) {
      logger.error("Error fetching DLC/extensions from IGDB", { error });
      return [];
    }
  }

  /**
   * Clears the token cache (useful for testing or forcing re-authentication)
   */
  static clearTokenCache(): void {
    this.tokenCache = null;
  }

  /**
   * Fetch a batch of characters from IGDB with expanded sub-resources.
   * Uses character_gender and character_species (non-deprecated fields).
   */
  static async getCharactersBatch(offset: number, limit: number): Promise<IGDBCharacter[]> {
    const query = `
      fields name, slug, description, country_name, url, akas,
             character_gender.id, character_gender.name,
             character_species.id, character_species.name,
             mug_shot.image_id,
             games;
      sort id asc;
      limit ${limit};
      offset ${offset};
    `;

    try {
      const response = await this.igdbFetch("characters", query);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("IGDB getCharactersBatch failed", {
          status: response.status,
          error: errorText,
        });
        return [];
      }

      return response.json();
    } catch (error) {
      logger.error("Error fetching characters from IGDB", { error });
      return [];
    }
  }

  /**
   * Fetch the total count of characters in IGDB.
   */
  static async getCharactersCount(): Promise<number> {
    try {
      const response = await this.igdbFetch("characters/count", "fields id;");

      if (!response.ok) {
        return 0;
      }

      const data = (await response.json()) as { count: number };
      return data.count;
    } catch {
      return 0;
    }
  }

  /**
   * Gets the current token cache state (useful for testing)
   * @returns The current cached token or null
   */
  static getTokenCache(): IGDBAuthToken | null {
    return this.tokenCache;
  }

  /**
   * Fetches a batch of games from IGDB with minimal fields (id, name, cover).
   * Uses cursor-based pagination (id > lastId) to avoid IGDB's 10k offset limit.
   * @param afterId Fetch games with id greater than this value (0 for first batch)
   * @param limit Batch size (max 500)
   * @returns Array of minimal game objects sorted by id asc
   */
  static async getGamesBatch(
    afterId: number,
    limit: number = 500
  ): Promise<Array<{ id: number; name: string; cover?: { image_id: string } }>> {
    const body = `
      fields name, cover.image_id;
      where version_parent = null & (game_type = 0 | game_type = 4) & id > ${afterId};
      sort id asc;
      limit ${limit};
    `;

    const response = await this.igdbFetch("games", body);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`IGDB batch fetch failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Fetches only the aggregated_rating for a game — lightweight IGDB call.
   * @returns The rating or null if not available
   */
  static async getAggregatedRating(igdbId: number): Promise<number | null> {
    const body = `fields aggregated_rating; where id = ${igdbId};`;
    const response = await this.igdbFetch("games", body);

    if (!response.ok) return null;

    const games = await response.json();
    return games.length > 0 && games[0].aggregated_rating ? games[0].aggregated_rating : null;
  }
}
