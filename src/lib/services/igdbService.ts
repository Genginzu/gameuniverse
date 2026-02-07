import {
  IGDBAuthToken,
  IGDBGame,
  IGDBSearchResult,
  IGDBImageSize,
  IGDBTimeToBeat,
  IGDBAgeRating,
  IGDBGameVersion,
} from "@/types/igdb";

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
   * Searches for games in the IGDB database
   * Supports partial word matching (e.g., "Dragon Quest Rei" finds "Dragon Quest Reimagined")
   * @param query The search query string
   * @param limit Maximum number of results to return (default: 10)
   * @returns Array of search results
   */
  static async searchGames(query: string, limit: number = 10): Promise<IGDBSearchResult[]> {
    const accessToken = await this.getAccessToken();
    const clientId = process.env.IGDB_CLIENT_ID;

    if (!clientId) {
      throw new Error("IGDB_CLIENT_ID not configured");
    }

    // Split query into words and build a where clause that matches all words
    // Using case-insensitive contains (~) for each word to support partial matching
    const words = query.trim().split(/\s+/).filter(Boolean);
    const escapedWords = words.map(word => word.replace(/"/g, '\\"').replace(/\*/g, '\\*'));
    
    // Build where conditions: each word must appear in the name (case-insensitive)
    const whereConditions = escapedWords.map(word => `name ~ *"${word}"*`).join(" & ");

    // IGDB uses a custom query language called Apicalypse
    const body = `
      fields name, slug, cover.image_id, first_release_date, involved_companies.company.name, involved_companies.developer;
      where ${whereConditions};
      limit ${limit};
    `;

    const response = await fetch(`${this.IGDB_API_URL}/games`, {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `IGDB search failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const games: IGDBGame[] = await response.json();

    // Transform to IGDBSearchResult format
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
    const accessToken = await this.getAccessToken();
    const clientId = process.env.IGDB_CLIENT_ID;

    if (!clientId) {
      throw new Error("IGDB_CLIENT_ID not configured");
    }

    // Fetch comprehensive game data including related entities
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
             age_ratings.rating_content_descriptions;
      where id = ${igdbId};
    `;

    const response = await fetch(`${this.IGDB_API_URL}/games`, {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `IGDB getGameDetails failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const games: IGDBGame[] = await response.json();

    if (games.length === 0) {
      return null;
    }

    return games[0];
  }

  /**
   * Fetches time to beat data for a game from IGDB
   * @param igdbId The IGDB game ID
   * @returns Time to beat data or null if not found
   */
  static async getTimeToBeat(igdbId: number): Promise<IGDBTimeToBeat | null> {
    const accessToken = await this.getAccessToken();
    const clientId = process.env.IGDB_CLIENT_ID;

    if (!clientId) {
      throw new Error("IGDB_CLIENT_ID not configured");
    }

    const body = `
      fields game_id, hastily, normally, completely, count;
      where game_id = ${igdbId};
    `;

    const response = await fetch(`${this.IGDB_API_URL}/game_time_to_beats`, {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `IGDB getTimeToBeat failed: ${response.status} ${response.statusText} - ${errorText}`
      );
      return null;
    }

    const results: IGDBTimeToBeat[] = await response.json();

    if (results.length === 0) {
      return null;
    }

    return results[0];
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

    const accessToken = await this.getAccessToken();
    const clientId = process.env.IGDB_CLIENT_ID;

    if (!clientId) {
      throw new Error("IGDB_CLIENT_ID not configured");
    }

    const body = `
      fields id, organization, rating_category, synopsis, rating_content_descriptions, rating_cover_url;
      where id = (${ageRatingIds.join(",")});
      limit 50;
    `;

    console.warn(`[IGDBService] Fetching age ratings for IDs:`, ageRatingIds);

    const response = await fetch(`${this.IGDB_API_URL}/age_ratings`, {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `IGDB getAgeRatings failed: ${response.status} ${response.statusText} - ${errorText}`
      );
      return [];
    }

    const rawText = await response.text();
    console.warn(`[IGDBService] Age ratings raw response:`, rawText);

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

    const accessToken = await this.getAccessToken();
    const clientId = process.env.IGDB_CLIENT_ID;

    if (!clientId) {
      throw new Error("IGDB_CLIENT_ID not configured");
    }

    const uniqueIds = [...new Set(contentDescIds)];
    const body = `
      fields id, category, description;
      where id = (${uniqueIds.join(",")});
      limit 100;
    `;

    console.warn(`[IGDBService] Fetching content descriptions for IDs:`, uniqueIds);

    const response = await fetch(`${this.IGDB_API_URL}/age_rating_content_descriptions`, {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `IGDB getAgeRatingContentDescriptions failed: ${response.status} ${response.statusText} - ${errorText}`
      );
      return [];
    }

    const results = await response.json();
    console.warn(`[IGDBService] Content descriptions response:`, JSON.stringify(results));
    return results;
  }

  /**
   * Fetches all versions (editions) of a game from IGDB
   * Versions are games that have the specified game as their version_parent
   * @param igdbId The IGDB game ID of the parent game
   * @returns Array of game versions (editions like Collector's, Deluxe, GOTY, etc.)
   */
  static async getGameVersions(igdbId: number): Promise<IGDBGameVersion[]> {
    const accessToken = await this.getAccessToken();
    const clientId = process.env.IGDB_CLIENT_ID;

    if (!clientId) {
      throw new Error("IGDB_CLIENT_ID not configured");
    }

    const body = `
      fields id, name, slug, version_title, summary, cover.image_id;
      where version_parent = ${igdbId};
      limit 50;
    `;

    const response = await fetch(`${this.IGDB_API_URL}/games`, {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `IGDB getGameVersions failed: ${response.status} ${response.statusText} - ${errorText}`
      );
      return [];
    }

    return response.json();
  }

  /**
   * Clears the token cache (useful for testing or forcing re-authentication)
   */
  static clearTokenCache(): void {
    this.tokenCache = null;
  }

  /**
   * Gets the current token cache state (useful for testing)
   * @returns The current cached token or null
   */
  static getTokenCache(): IGDBAuthToken | null {
    return this.tokenCache;
  }
}
