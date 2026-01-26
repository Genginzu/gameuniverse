import { GameSummary } from "@/types/game";
import { IGDBSearchResult } from "@/types/igdb";
import { SearchResultItem } from "@/types/search";
import { GameService } from "./gameService";
import { IGDBService } from "./igdbService";

/**
 * Result from the hybrid search combining local and IGDB sources
 */
export interface HybridSearchResult {
  localGames: GameSummary[];
  igdbGames: IGDBSearchResult[];
  hasMore: boolean;
}

/**
 * Options for performing a hybrid search
 */
export interface SearchOptions {
  query: string;
  locale?: string;
  localLimit?: number;
  igdbLimit?: number;
}

/**
 * Default limits for search results
 */
const DEFAULT_LOCAL_LIMIT = 5;
const DEFAULT_IGDB_LIMIT = 5;

/**
 * Service orchestrating parallel search across Supabase (local) and IGDB sources
 * Handles deduplication and result aggregation
 */
export class HybridSearchService {
  /**
   * Performs a parallel search in both local database and IGDB
   * Returns combined results with deduplication and proper ordering
   *
   * @param options Search options including query, locale, and limits
   * @returns Combined search results from both sources
   *
   * Requirements: 1.1, 1.2, 1.3, 1.4
   */
  static async search(options: SearchOptions): Promise<HybridSearchResult> {
    const {
      query,
      locale = "fr",
      localLimit = DEFAULT_LOCAL_LIMIT,
      igdbLimit = DEFAULT_IGDB_LIMIT,
    } = options;

    // Fetch extra results to determine hasMore
    const localFetchLimit = localLimit + 1;
    const igdbFetchLimit = igdbLimit + 1;

    // Execute both searches in parallel using Promise.allSettled
    // This ensures one failing source doesn't break the entire search
    const [localResult, igdbResult] = await Promise.allSettled([
      this.searchLocal(query, locale, localFetchLimit),
      this.searchIGDB(query, igdbFetchLimit),
    ]);

    // Extract results, handling partial failures
    const localGames = localResult.status === "fulfilled" ? localResult.value : [];
    const igdbGames = igdbResult.status === "fulfilled" ? igdbResult.value : [];

    // Log errors for debugging but don't fail the search
    if (localResult.status === "rejected") {
      console.error("Local search failed:", localResult.reason);
    }
    if (igdbResult.status === "rejected") {
      console.error("IGDB search failed:", igdbResult.reason);
    }

    // Deduplicate IGDB results (remove games already in local)
    const deduplicatedIgdbGames = this.deduplicateResults(localGames, igdbGames);

    // Check if there are more results than the limit
    const hasMoreLocal = localGames.length > localLimit;
    const hasMoreIgdb = deduplicatedIgdbGames.length > igdbLimit;
    const hasMore = hasMoreLocal || hasMoreIgdb;

    // Apply limits to final results
    const limitedLocalGames = localGames.slice(0, localLimit);
    const limitedIgdbGames = deduplicatedIgdbGames.slice(0, igdbLimit);

    return {
      localGames: limitedLocalGames,
      igdbGames: limitedIgdbGames,
      hasMore,
    };
  }

  /**
   * Searches the local Supabase database for games
   *
   * @param query Search query string
   * @param locale Locale for translations
   * @param limit Maximum results to fetch
   * @returns Array of local game summaries
   */
  private static async searchLocal(
    query: string,
    locale: string,
    limit: number
  ): Promise<GameSummary[]> {
    const result = await GameService.fetchGames({
      search: query,
      locale,
      limit,
      page: 1,
    });
    return result.games;
  }

  /**
   * Searches the IGDB API for games
   *
   * @param query Search query string
   * @param limit Maximum results to fetch
   * @returns Array of IGDB search results
   */
  private static async searchIGDB(query: string, limit: number): Promise<IGDBSearchResult[]> {
    return IGDBService.searchGames(query, limit);
  }

  /**
   * Removes IGDB games that already exist in the local database
   * Uses igdbId as primary matching key, falls back to slug matching
   *
   * @param localGames Games from local database
   * @param igdbGames Games from IGDB
   * @returns IGDB games not present in local database
   *
   * Requirements: 3.1, 3.2, 3.3
   */
  static deduplicateResults(
    localGames: GameSummary[],
    igdbGames: IGDBSearchResult[]
  ): IGDBSearchResult[] {
    // Build a set of IGDB IDs from local games for O(1) lookup
    const localIgdbIds = new Set<number>();
    // Also build a set of slugs for fallback matching
    const localSlugs = new Set<string>();
    // And normalized titles for fuzzy matching
    const localTitles = new Set<string>();

    for (const game of localGames) {
      if (game.igdbId !== undefined && game.igdbId !== null) {
        localIgdbIds.add(game.igdbId);
      }
      if (game.slug) {
        localSlugs.add(game.slug.toLowerCase());
      }
      if (game.title) {
        localTitles.add(this.normalizeTitle(game.title));
      }
    }

    // Filter out IGDB games that exist locally
    return igdbGames.filter((igdbGame) => {
      // Primary check: IGDB ID match
      if (localIgdbIds.has(igdbGame.id)) {
        return false;
      }
      // Fallback: slug match
      if (igdbGame.slug && localSlugs.has(igdbGame.slug.toLowerCase())) {
        return false;
      }
      // Fallback: normalized title match
      if (igdbGame.name && localTitles.has(this.normalizeTitle(igdbGame.name))) {
        return false;
      }
      return true;
    });
  }

  /**
   * Normalizes a title for comparison (lowercase, remove special chars)
   */
  private static normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }

  /**
   * Converts search results to a unified SearchResultItem format
   * Local games come first, followed by IGDB games
   *
   * @param localGames Games from local database
   * @param igdbGames Games from IGDB (already deduplicated)
   * @returns Unified array of search result items
   */
  static toSearchResultItems(
    localGames: GameSummary[],
    igdbGames: IGDBSearchResult[]
  ): SearchResultItem[] {
    const localItems: SearchResultItem[] = localGames.map((game) => ({
      id: game.id,
      igdbId: game.igdbId,
      slug: game.slug,
      title: game.title,
      coverUrl: game.coverImage,
      developer: game.developer,
      releaseYear: game.releaseYear,
      source: "local" as const,
    }));

    const igdbItems: SearchResultItem[] = igdbGames.map((game) => ({
      id: game.id.toString(),
      igdbId: game.id,
      slug: game.slug,
      title: game.name,
      coverUrl: game.cover_url,
      developer: game.developer,
      releaseYear: game.release_year,
      source: "igdb" as const,
    }));

    // Local games first, then IGDB games (Requirements: 2.2, 3.3)
    return [...localItems, ...igdbItems];
  }
}
