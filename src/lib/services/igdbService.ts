import {
  IGDBAuthToken,
  IGDBGame,
  IGDBSearchResult,
  IGDBImageSize,
  IGDBTimeToBeat,
  IGDBAgeRating,
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

    // IGDB uses a custom query language called Apicalypse
    const body = `
      search "${query.replace(/"/g, '\\"')}";
      fields name, slug, cover.image_id, first_release_date, involved_companies.company.name, involved_companies.developer;
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
             age_ratings.id, age_ratings.category, age_ratings.rating, 
             age_ratings.content_descriptions.id, age_ratings.content_descriptions.category, age_ratings.content_descriptions.description;
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
   * @returns Array of age rating data
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
    `;

    console.warn(`[IGDBService] Fetching age ratings with body:`, body);

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
    return results;
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
