import {
  PlayerSummary,
  PlayerDetails,
  PlayerStats,
  PlayerLibraryGame,
  PlayersResponse,
} from "@/types/player";
import { BaseService, PaginatedResponse, EntityMetadata } from "./baseService";
import { logger } from "@/lib/logger";
import type { PlayerFetchOptions } from "./playerService.types";
import {
  fetchPlayersFromDB as fetchPlayersFromDBQuery,
  fetchPlayerDetailsFromDB as fetchPlayerDetailsFromDBQuery,
} from "./playerService.queries";
import { calculatePlayerStats } from "./playerService.stats";

class PlayerServiceImpl extends BaseService<PlayerDetails, PlayerSummary> {
  protected readonly entityName = "player";
  protected readonly apiPath = "/api/players";

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

const playerServiceInstance = new PlayerServiceImpl();

/**
 * Service pour la gestion des joueurs (profils publics)
 */
export class PlayerService {
  private static getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  }

  static async fetchPlayersFromDB(
    options: {
      search?: string;
      gameCountRange?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PlayersResponse> {
    return fetchPlayersFromDBQuery(options);
  }

  static async fetchPlayerDetailsFromDB(
    playerId: string,
    locale: string = "fr"
  ): Promise<PlayerDetails | null> {
    return fetchPlayerDetailsFromDBQuery(playerId, locale);
  }

  static calculateStats(library: PlayerLibraryGame[]): PlayerStats {
    return calculatePlayerStats(library);
  }

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
        if (response.status === 404) return null;
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

  static async fetchPlayers(
    options: {
      search?: string;
      gameCountRange?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PlayersResponse> {
    const response = await playerServiceInstance.fetchList(options as PlayerFetchOptions);
    const rawResponse = response as unknown as PlayersResponse | PaginatedResponse<PlayerSummary>;
    if ("players" in rawResponse) return rawResponse;
    return { players: response.items, pagination: response.pagination };
  }

  static async playerExists(playerId: string): Promise<boolean> {
    return playerServiceInstance.exists(playerId);
  }

  static validatePlayerId(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  static async generatePlayerMetadata(playerId: string, locale: string = "fr") {
    return playerServiceInstance.generateMetadata(playerId, locale);
  }
}
