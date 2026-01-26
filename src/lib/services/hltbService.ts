/**
 * Playtime data structure
 */
export interface GamePlaytime {
  main: number | null;
  mainExtra: number | null;
  completionist: number | null;
  allStyles: number | null;
  hltbId?: number;
  lastUpdated: string;
}

/**
 * Service for fetching game playtime data from HowLongToBeat
 * Uses the npm package with fallback handling
 */
export class HLTBService {
  private static lastRequestTime = 0;
  private static MIN_REQUEST_INTERVAL = 2000;

  /**
   * Wait to avoid rate limiting
   */
  private static async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Search for a game on HowLongToBeat and return playtime data
   */
  static async getPlaytime(gameName: string): Promise<GamePlaytime | null> {
    try {
      await this.throttle();

      const cleanedName = this.cleanGameName(gameName);
      console.log(`[HLTBService] Searching for: ${cleanedName}`);

      // Dynamic import to avoid issues with SSR
      const { HowLongToBeatService } = await import("howlongtobeat");
      const hltbService = new HowLongToBeatService();

      const results = await hltbService.search(cleanedName);

      if (!results || results.length === 0) {
        console.log(`[HLTBService] No results found for: ${cleanedName}`);
        return null;
      }

      // Find best match
      const bestMatch = this.findBestMatch(cleanedName, results);
      if (!bestMatch) {
        return null;
      }

      console.log(`[HLTBService] Found match: ${bestMatch.name} (${bestMatch.gameplayMain}h)`);
      return this.transformToPlaytime(bestMatch);
    } catch (error) {
      // Log error but don't fail - playtime is optional
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[HLTBService] Error fetching playtime for ${gameName}: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Clean up game name for better search results
   */
  private static cleanGameName(name: string): string {
    return (
      name
        // Remove edition suffixes
        .replace(
          /:\s*(Definitive|Ultimate|Complete|Game of the Year|GOTY|Remastered|Enhanced|Special)\s*Edition/gi,
          ""
        )
        .replace(
          /\s*-\s*(Definitive|Ultimate|Complete|Remastered|Enhanced|Special)\s*Edition/gi,
          ""
        )
        // Remove year in parentheses
        .replace(/\s*\(\d{4}\)\s*/g, "")
        // Remove platform indicators
        .replace(/\s*\((PC|PS[45]|Xbox|Switch|Steam)\)\s*/gi, "")
        // Clean up extra spaces
        .replace(/\s+/g, " ")
        .trim()
    );
  }

  /**
   * Find the best matching game from search results
   */
  private static findBestMatch(
    searchTerm: string,
    results: Array<{
      id: string;
      name: string;
      gameplayMain: number;
      gameplayMainExtra: number;
      gameplayCompletionist: number;
      similarity: number;
    }>
  ): (typeof results)[0] | null {
    if (results.length === 0) return null;

    const normalizedSearch = this.normalizeTitle(searchTerm);

    // Try exact match first
    const exactMatch = results.find((r) => this.normalizeTitle(r.name) === normalizedSearch);
    if (exactMatch) return exactMatch;

    // Try high similarity match
    const highSimilarity = results.find((r) => r.similarity >= 0.8);
    if (highSimilarity) return highSimilarity;

    // Try contains match
    const containsMatch = results.find(
      (r) =>
        this.normalizeTitle(r.name).includes(normalizedSearch) ||
        normalizedSearch.includes(this.normalizeTitle(r.name))
    );
    if (containsMatch) return containsMatch;

    // Return first result if similarity is reasonable
    if (results[0].similarity >= 0.4) {
      return results[0];
    }

    return null;
  }

  /**
   * Normalize a title for comparison
   */
  private static normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }

  /**
   * Transform HLTB entry to our playtime format
   */
  private static transformToPlaytime(entry: {
    id: string;
    name: string;
    gameplayMain: number;
    gameplayMainExtra: number;
    gameplayCompletionist: number;
  }): GamePlaytime {
    const main = entry.gameplayMain > 0 ? entry.gameplayMain : null;
    const mainExtra = entry.gameplayMainExtra > 0 ? entry.gameplayMainExtra : null;
    const completionist = entry.gameplayCompletionist > 0 ? entry.gameplayCompletionist : null;

    // Calculate average
    const times = [main, mainExtra, completionist].filter((t): t is number => t !== null);
    const allStyles =
      times.length > 0
        ? Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10
        : null;

    return {
      main,
      mainExtra,
      completionist,
      allStyles,
      hltbId: parseInt(entry.id, 10) || undefined,
      lastUpdated: new Date().toISOString(),
    };
  }
}
