import { GameDetails, GameSummary } from "@/types/game";
import { BaseService, FetchOptions, PaginatedResponse, EntityMetadata } from "./baseService";

/** Couleurs minimales d'un jeu, pour le skeleton de chargement */
export interface GameColorHints {
  backgroundColor: string | null;
  accentColor: string | null;
  labelColor: string | null;
  textColor: string | null;
}

/**
 * Game-specific fetch options extending base options
 */
interface GameFetchOptions extends FetchOptions {
  genres?: string[];
}

/**
 * Game-specific paginated response format for backward compatibility
 */
interface GamesResponse {
  games: GameSummary[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Service pour la gestion des jeux
 * Centralise toute la logique de récupération des données de jeux
 */
class GameServiceImpl extends BaseService<GameDetails, GameSummary> {
  protected readonly entityName = "game";
  protected readonly apiPath = "/api/games";
  protected readonly revalidate = 60;

  /**
   * Builds SEO metadata from a game entity
   */
  protected buildMetadata(game: GameDetails, locale: string): EntityMetadata {
    return {
      title: `${game.title} - Gamers Universe`,
      description:
        game.description ||
        (locale === "fr"
          ? `Découvrez ${game.title}, développé par ${game.developer}`
          : `Discover ${game.title}, developed by ${game.developer}`),
      openGraph: {
        title: game.title,
        description: game.description,
        images: game.media?.coverImage ? [game.media.coverImage] : [],
      },
    };
  }
}

// Singleton instance for internal use
const gameServiceInstance = new GameServiceImpl();

/**
 * Static GameService class for backward compatibility
 * Maintains the same API as the original implementation
 */
export class GameService {
  private static getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  }

  /**
   * Récupère les détails d'un jeu par son slug
   * @param slug - Le slug du jeu
   * @param locale - La locale (fr, en)
   * @returns Les détails du jeu ou null si non trouvé
   */
  static async fetchGameDetails(slug: string, locale: string = "fr"): Promise<GameDetails | null> {
    return gameServiceInstance.fetchDetails(slug, locale);
  }

  /**
   * Récupère la liste des jeux avec pagination et filtres
   * @param options - Options de recherche et pagination
   * @returns Liste des jeux avec métadonnées de pagination
   */
  static async fetchGames(
    options: {
      search?: string;
      genres?: string[];
      page?: number;
      limit?: number;
      locale?: string;
    } = {}
  ): Promise<GamesResponse> {
    // Use the base service fetchList and transform the response
    const response = await gameServiceInstance.fetchList(options as GameFetchOptions);

    // Transform to maintain backward compatibility
    // The API returns { games: [...], pagination: {...} } format
    // but BaseService expects { items: [...], pagination: {...} }
    // We need to handle both formats
    const rawResponse = response as unknown as GamesResponse | PaginatedResponse<GameSummary>;

    if ("games" in rawResponse) {
      return rawResponse;
    }

    return {
      games: response.items,
      pagination: response.pagination,
    };
  }

  /**
   * Vérifie si un jeu existe par son slug
   * @param slug - Le slug du jeu
   * @param locale - La locale
   * @returns true si le jeu existe, false sinon
   */
  static async gameExists(slug: string, locale: string = "fr"): Promise<boolean> {
    return gameServiceInstance.exists(slug, locale);
  }

  /**
   * Génère les métadonnées SEO pour un jeu
   * @param slug - Le slug du jeu
   * @param locale - La locale
   * @returns Métadonnées pour le SEO
   */
  static async generateGameMetadata(slug: string, locale: string = "fr") {
    return gameServiceInstance.generateMetadata(slug, locale);
  }

  /**
   * Fetch léger : uniquement les colonnes de couleurs d'un jeu.
   * Utilisé pour colorer le skeleton avant que les données complètes arrivent.
   */
  static async fetchGameColors(slug: string): Promise<GameColorHints | null> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const res = await fetch(`${baseUrl}/api/games/${slug}?fields=colors`, {
        next: { revalidate: 60 },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        backgroundColor: data.backgroundColor ?? data.background_color ?? null,
        accentColor: data.accentColor ?? data.accent_color ?? null,
        labelColor: data.labelColor ?? data.label_color ?? null,
        textColor: data.textColor ?? data.text_color ?? null,
      };
    } catch {
      return null;
    }
  }
}
