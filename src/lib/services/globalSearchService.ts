import type {
  GlobalSearchRequest,
  GlobalSearchResponse,
  GlobalSearchResult,
} from "@/types/global-search";
import { CharacterService } from "./characterService";
import { HybridSearchService } from "./hybridSearchService";
import { PlayerService } from "./playerService";
import { logger } from "@/lib/logger";

const DEFAULT_LIMIT = 5;

/**
 * Orchestrates parallel search across games, characters, and players.
 * Reuses existing services and handles partial failures gracefully.
 */
export class GlobalSearchService {
  /**
   * Executes a global search across all entity types in parallel.
   * If one source fails, results from other sources are still returned.
   *
   * Requirements: 1.1, 1.2, 1.3, 1.5
   */
  static async search(request: GlobalSearchRequest): Promise<GlobalSearchResult> {
    const {
      query,
      locale = "fr",
      gamesLimit,
      charactersLimit = DEFAULT_LIMIT,
      playersLimit = DEFAULT_LIMIT,
    } = request;

    const [gamesResult, charactersResult, playersResult] = await Promise.allSettled([
      this.searchGames(query, locale, gamesLimit),
      this.searchCharacters(query, locale, charactersLimit),
      this.searchPlayers(query, playersLimit),
    ]);

    const errors: string[] = [];

    const games =
      gamesResult.status === "fulfilled"
        ? gamesResult.value
        : {
            local: [] as GlobalSearchResult["games"]["local"],
            igdb: [] as GlobalSearchResult["games"]["igdb"],
          };

    if (gamesResult.status === "rejected") {
      const message = `Games search failed: ${String(gamesResult.reason)}`;
      logger.error(message);
      errors.push(message);
    }

    const characters = charactersResult.status === "fulfilled" ? charactersResult.value : [];

    if (charactersResult.status === "rejected") {
      const message = `Characters search failed: ${String(charactersResult.reason)}`;
      logger.error(message);
      errors.push(message);
    }

    const players = playersResult.status === "fulfilled" ? playersResult.value : [];

    if (playersResult.status === "rejected") {
      const message = `Players search failed: ${String(playersResult.reason)}`;
      logger.error(message);
      errors.push(message);
    }

    // Correlate: if games matched, also fetch characters linked to those games
    const enrichedCharacters = await this.enrichCharactersWithGameCorrelation(
      characters,
      games.local,
      locale,
      charactersLimit
    );

    return { games, characters: enrichedCharacters, players, errors };
  }

  /**
   * Transforms raw GlobalSearchResult into the API-ready GlobalSearchResponse.
   * Maps each entity type to its display-oriented format and computes counts.
   *
   * Requirements: 6.1, 6.2, 6.3, 8.2, 8.3
   */
  static toGlobalSearchResponse(result: GlobalSearchResult): GlobalSearchResponse {
    const localGames = result.games.local.map((game) => ({
      id: game.id,
      igdbId: game.igdbId,
      slug: game.slug,
      title: game.title,
      coverUrl: game.coverImage,
      developer: game.developer || undefined,
      releaseYear: game.releaseYear,
      source: "local" as const,
    }));

    const igdbGames = result.games.igdb.map((game) => ({
      id: String(game.id),
      igdbId: game.id,
      slug: game.slug,
      title: game.name,
      coverUrl: game.cover_url,
      developer: game.developer,
      releaseYear: game.release_year,
      source: "igdb" as const,
    }));

    // Sort by release year descending (newest first), games without year go last
    const games = [...localGames, ...igdbGames].sort((a, b) => {
      if (!a.releaseYear && !b.releaseYear) return 0;
      if (!a.releaseYear) return 1;
      if (!b.releaseYear) return -1;
      return b.releaseYear - a.releaseYear;
    });

    const characters = result.characters.map((character) => ({
      id: character.id,
      slug: character.slug,
      name: character.name,
      mainImage: character.mainImage,
      role: character.role,
      primaryGame: character.primaryGame,
    }));

    const players = result.players.map((player) => ({
      id: player.id,
      username: player.fullName ?? player.id,
      avatarUrl: player.avatarUrl ?? undefined,
    }));

    return {
      games,
      characters,
      players,
      counts: {
        games: games.length,
        characters: characters.length,
        players: players.length,
      },
    };
  }

  /**
   * Searches games via HybridSearchService (local Supabase + IGDB).
   * Returns all matching games from both local DB and IGDB.
   */
  private static async searchGames(
    query: string,
    locale: string,
    limit?: number
  ): Promise<GlobalSearchResult["games"]> {
    // No limit = fetch all matching games (10000 local, 499 IGDB max)
    const effectiveLimit = limit ?? 10000;

    const result = await HybridSearchService.search({
      query,
      locale,
      localLimit: effectiveLimit,
      igdbLimit: 499,
    });

    return {
      local: result.localGames,
      igdb: result.igdbGames,
    };
  }

  /**
   * Searches characters via CharacterService.
   */
  private static async searchCharacters(
    query: string,
    locale: string,
    limit: number
  ): Promise<GlobalSearchResult["characters"]> {
    const result = await CharacterService.fetchCharacters({
      search: query,
      locale,
      limit,
      page: 1,
    });

    return result.characters;
  }

  /**
   * Searches players via PlayerService.
   */
  private static async searchPlayers(
    query: string,
    limit: number
  ): Promise<GlobalSearchResult["players"]> {
    const result = await PlayerService.fetchPlayersFromDB({
      search: query,
      limit,
      page: 1,
    });

    return result.players;
  }

  /**
   * Enriches character results with characters linked to matched local games.
   * Deduplicates by character ID, keeping name-matched characters first.
   */
  private static async enrichCharactersWithGameCorrelation(
    nameMatchedCharacters: GlobalSearchResult["characters"],
    localGames: GlobalSearchResult["games"]["local"],
    locale: string,
    limit: number
  ): Promise<GlobalSearchResult["characters"]> {
    if (localGames.length === 0) return nameMatchedCharacters;

    const gameIds = localGames.map((g) => g.id);

    try {
      // Fetch a larger batch because fetchCharactersFromDB post-filters by game ID
      const result = await CharacterService.fetchCharactersFromDB({
        games: gameIds,
        locale,
        limit: 50,
        page: 1,
      });

      // Deduplicate: name-matched characters take priority
      const existingIds = new Set(nameMatchedCharacters.map((c) => c.id));
      const gameCorrelated = result.characters.filter((c) => !existingIds.has(c.id));

      return [...nameMatchedCharacters, ...gameCorrelated].slice(0, limit);
    } catch (error) {
      logger.error("Game-character correlation failed", { error });
      return nameMatchedCharacters;
    }
  }
}
