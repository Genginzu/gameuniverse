import {
  PlayerSummary,
  PlayerDetails,
  PlayerStats,
  PlayerLibraryGame,
  PlayersResponse,
  GAME_COUNT_RANGES,
  GameCountRangeKey,
} from "@/types/player";
import { createServerClient } from "@/lib/supabase-server";
import { BaseService, FetchOptions, PaginatedResponse, EntityMetadata } from "./baseService";
import { isStatsPrivate } from "./playerStatsDbHelpers";
import { logger } from "@/lib/logger";

// Type definitions for Supabase query results
interface ProfileRow {
  id: string;
  username: string | null;
  avatar_url: string | null;
  preferred_locale: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Type definitions for library entry from Supabase
interface LibraryEntryGame {
  id: string;
  slug: string;
  cover_image_url: string | null;
  game_translations: Array<{
    title: string;
    language_code: string;
  }> | null;
}

interface LibraryEntry {
  id: string;
  game_id: string;
  status: string;
  play_time_hours: number | null;
  play_time_hastily: number | null;
  play_time_normally: number | null;
  play_time_completely: number | null;
  rating: number | null;
  added_at: string;
  games: LibraryEntryGame | null;
}

/**
 * Player-specific fetch options
 */
interface PlayerFetchOptions extends FetchOptions {
  gameCountRange?: string;
}

/**
 * Internal PlayerService implementation extending BaseService
 */
class PlayerServiceImpl extends BaseService<PlayerDetails, PlayerSummary> {
  protected readonly entityName = "player";
  protected readonly apiPath = "/api/players";

  /**
   * Builds SEO metadata from a player entity
   */
  protected buildMetadata(player: PlayerDetails, locale: string): EntityMetadata {
    const displayName = player.fullName || (locale === "fr" ? "Joueur" : "Player");
    const totalGames = player.stats?.totalGames ?? 0;

    return {
      title: `${displayName} - Game Universe`,
      description:
        locale === "fr"
          ? `Profil de ${displayName} - ${totalGames} jeux dans sa bibliothèque`
          : `${displayName}'s profile - ${totalGames} games in library`,
      openGraph: {
        title: displayName,
        images: player.avatarUrl ? [player.avatarUrl] : [],
      },
    };
  }
}

// Singleton instance for internal use
const playerServiceInstance = new PlayerServiceImpl();

/**
 * Service pour la gestion des joueurs (profils publics)
 * Centralise toute la logique de récupération des données de joueurs
 */
export class PlayerService {
  private static getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  }

  /**
   * Récupère la liste des joueurs directement depuis la base de données
   * avec pagination, recherche et filtres
   * @param options - Options de recherche et pagination
   * @returns Liste des joueurs avec métadonnées de pagination
   */
  static async fetchPlayersFromDB(
    options: {
      search?: string;
      gameCountRange?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PlayersResponse> {
    const { search = "", gameCountRange, page = 1, limit = 20 } = options;

    const supabase = await createServerClient();
    const offset = (page - 1) * limit;

    // Build the base query for profiles (without join - user_library references auth.users, not profiles)
    let query = supabase.from("profiles").select(
      `
        id,
        username,
        avatar_url,
        created_at
      `,
      { count: "exact" }
    );

    // Add search filter if provided (case-insensitive on username)
    if (search.trim()) {
      query = query.ilike("username", `%${search.trim()}%`);
    }

    // Execute the query to get all matching profiles
    const { data: allProfiles, error: queryError } = await query;

    if (queryError) {
      logger.error("Error fetching players", { error: queryError });
      throw new Error(`Failed to fetch players: ${queryError.message}`);
    }

    // Get game counts for all profiles in a separate query
    const profileIds = (allProfiles || []).map((p) => p.id);

    const gameCounts: Record<string, number> = {};
    const reviewCounts: Record<string, number> = {};

    if (profileIds.length > 0) {
      // Query user_library to get counts per user
      const { data: libraryCounts, error: countError } = await supabase
        .from("user_library")
        .select("user_id")
        .in("user_id", profileIds);

      if (countError) {
        logger.warn("Error fetching library counts", { error: countError });
      } else if (libraryCounts) {
        for (const entry of libraryCounts) {
          gameCounts[entry.user_id] = (gameCounts[entry.user_id] || 0) + 1;
        }
      }

      // Query game_reviews to get review counts per user
      const { data: reviewData, error: reviewError } = await supabase
        .from("game_reviews")
        .select("user_id")
        .in("user_id", profileIds);

      if (reviewError) {
        logger.warn("Error fetching review counts", { error: reviewError });
      } else if (reviewData) {
        for (const entry of reviewData) {
          reviewCounts[entry.user_id] = (reviewCounts[entry.user_id] || 0) + 1;
        }
      }
    }

    // Transform and filter by game count range
    let transformedPlayers: PlayerSummary[] = ((allProfiles as unknown as ProfileRow[]) || []).map(
      (profile) => {
        const gamesCount = gameCounts[profile.id] || 0;
        return {
          id: profile.id,
          fullName: profile.username,
          avatarUrl: profile.avatar_url,
          gamesCount,
          level: 1,
          socialLinks: {},
          reviewCount: reviewCounts[profile.id] || 0,
          createdAt: profile.created_at || new Date().toISOString(),
        };
      }
    );

    // Apply game count range filter if specified
    if (gameCountRange && gameCountRange in GAME_COUNT_RANGES) {
      const range = GAME_COUNT_RANGES[gameCountRange as GameCountRangeKey];
      transformedPlayers = transformedPlayers.filter(
        (player) => player.gamesCount >= range.min && player.gamesCount <= range.max
      );
    }

    // Sort by created_at descending
    transformedPlayers.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Calculate pagination after filtering
    const totalCount = transformedPlayers.length;
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Apply pagination
    const paginatedPlayers = transformedPlayers.slice(offset, offset + limit);

    return {
      players: paginatedPlayers,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  /**
   * Récupère les détails d'un joueur directement depuis la base de données
   * @param playerId - L'ID du joueur (UUID)
   * @param locale - La locale pour les traductions de jeux (fr, en)
   * @returns Les détails du joueur ou null si non trouvé
   */
  static async fetchPlayerDetailsFromDB(
    playerId: string,
    locale: string = "fr"
  ): Promise<PlayerDetails | null> {
    const supabase = await createServerClient();

    // Fetch player profile (without join - user_library references auth.users, not profiles)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        `
        id,
        username,
        avatar_url,
        preferred_locale,
        created_at,
        updated_at
      `
      )
      .eq("id", playerId)
      .single();

    if (profileError) {
      if (profileError.code === "PGRST116") {
        // No rows returned - player not found
        return null;
      }
      logger.error("Error fetching player details", { playerId, error: profileError });
      throw new Error(`Failed to fetch player details: ${profileError.message}`);
    }

    if (!profile) {
      return null;
    }

    // Fetch user library separately
    const { data: libraryData, error: libraryError } = await supabase
      .from("user_library")
      .select(
        `
        id,
        game_id,
        status,
        play_time_hours,
        play_time_hastily,
        play_time_normally,
        play_time_completely,
        rating,
        added_at,
        games(
          id,
          slug,
          cover_image_url,
          game_translations(
            title,
            language_code
          )
        )
      `
      )
      .eq("user_id", playerId);

    if (libraryError) {
      logger.warn("Error fetching user library", { error: libraryError });
      // Continue without library rather than failing
    }

    // Transform library entries
    const library: PlayerLibraryGame[] = ((libraryData || []) as LibraryEntry[])
      .map((entry) => {
        const game = entry.games;
        if (!game) return null;

        // Find translation for the requested locale
        const translation =
          game.game_translations?.find((t) => t.language_code === locale) ||
          game.game_translations?.[0];

        return {
          id: entry.id,
          gameId: entry.game_id,
          slug: game.slug,
          title: translation?.title || "Unknown",
          coverImage: game.cover_image_url,
          status: entry.status as PlayerLibraryGame["status"],
          // Take the highest playtime category the player has filled in
          // (completely > normally > hastily) to represent actual time spent
          playTimeHours: Math.max(
            entry.play_time_completely || 0,
            entry.play_time_normally || 0,
            entry.play_time_hastily || 0
          ),
          rating: entry.rating,
          addedAt: entry.added_at,
        };
      })
      .filter((entry): entry is PlayerLibraryGame => entry !== null)
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());

    // Calculate stats
    const stats = this.calculateStats(library);

    // Check stats privacy via helper (graceful if column doesn't exist yet)
    const statsPrivate = await isStatsPrivate(supabase, playerId);

    return {
      id: profile.id,
      fullName: profile.username,
      avatarUrl: profile.avatar_url,
      bannerUrl: null,
      socialLinks: {},
      level: 1,
      preferredLocale: profile.preferred_locale || "fr",
      createdAt: profile.created_at || new Date().toISOString(),
      updatedAt: profile.updated_at || new Date().toISOString(),
      statsPrivate,
      stats,
      library,
    };
  }

  /**
   * Calcule les statistiques à partir de la bibliothèque d'un joueur
   * @param library - Liste des jeux dans la bibliothèque
   * @returns Statistiques calculées
   */
  static calculateStats(library: PlayerLibraryGame[]): PlayerStats {
    const totalGames = library.length;
    const ownedGames = library.filter(
      (g) => g.status === "owned" || g.status === "completed" || g.status === "playing"
    ).length;
    const completedGames = library.filter((g) => g.status === "completed").length;
    const totalPlayTime = library.reduce((sum, g) => sum + (g.playTimeHours || 0), 0);

    // Calculate average rating (only for games with ratings)
    const gamesWithRatings = library.filter((g) => g.rating !== null);
    const averageRating =
      gamesWithRatings.length > 0
        ? gamesWithRatings.reduce((sum, g) => sum + (g.rating || 0), 0) / gamesWithRatings.length
        : null;

    return {
      totalGames,
      ownedGames,
      completedGames,
      totalPlayTime,
      averageRating,
    };
  }

  /**
   * Récupère les détails d'un joueur via l'API
   * @param playerId - L'ID du joueur
   * @param locale - La locale
   * @returns Les détails du joueur ou null si non trouvé
   */
  static async fetchPlayerDetails(
    playerId: string,
    locale: string = "fr"
  ): Promise<PlayerDetails | null> {
    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/api/players/${playerId}?locale=${locale}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(
          `Failed to fetch player details: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.player;
    } catch (error) {
      logger.error("Error fetching player details via API", { error });
      throw error;
    }
  }

  /**
   * Récupère la liste des joueurs via l'API
   * @param options - Options de recherche et pagination
   * @returns Liste des joueurs avec métadonnées de pagination
   */
  static async fetchPlayers(
    options: {
      search?: string;
      gameCountRange?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PlayersResponse> {
    // Use the base service fetchList and transform the response
    const response = await playerServiceInstance.fetchList(options as PlayerFetchOptions);

    // Transform to maintain backward compatibility
    // The API returns { players: [...], pagination: {...} } format
    const rawResponse = response as unknown as PlayersResponse | PaginatedResponse<PlayerSummary>;

    if ("players" in rawResponse) {
      return rawResponse;
    }

    return {
      players: response.items,
      pagination: response.pagination,
    };
  }

  /**
   * Vérifie si un joueur existe par son ID
   * @param playerId - L'ID du joueur
   * @returns true si le joueur existe, false sinon
   */
  static async playerExists(playerId: string): Promise<boolean> {
    return playerServiceInstance.exists(playerId);
  }

  /**
   * Valide le format d'un ID de joueur (UUID)
   * @param id - L'ID à valider
   * @returns true si l'ID est un UUID valide
   */
  static validatePlayerId(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  /**
   * Génère les métadonnées SEO pour un joueur
   * @param playerId - L'ID du joueur
   * @param locale - La locale
   * @returns Métadonnées pour le SEO
   */
  static async generatePlayerMetadata(playerId: string, locale: string = "fr") {
    return playerServiceInstance.generateMetadata(playerId, locale);
  }
}
