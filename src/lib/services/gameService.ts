import { GameDetails, GameSummary } from "@/types/game";

/**
 * Service pour la gestion des jeux
 * Centralise toute la logique de récupération des données de jeux
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
    try {
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl}/api/games/${slug}?locale=${locale}`;
      console.log(`[GameService] Fetching game details from: ${url}`);

      const response = await fetch(url, {
        cache: "no-store", // Ensure fresh data for each request
      });

      console.log(`[GameService] Response status: ${response.status}`);

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`[GameService] Game not found: ${slug}`);
          return null;
        }
        const errorText = await response.text();
        console.error(`[GameService] Error response: ${errorText}`);
        throw new Error(`Failed to fetch game details: ${response.status} ${response.statusText}`);
      }

      const gameDetails: GameDetails = await response.json();
      return gameDetails;
    } catch (error) {
      console.error("Error fetching game details:", error);
      throw error;
    }
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
  ): Promise<{
    games: GameSummary[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    try {
      const baseUrl = this.getBaseUrl();
      const searchParams = new URLSearchParams();

      if (options.search) searchParams.set("search", options.search);
      if (options.genres?.length) searchParams.set("genres", options.genres.join(","));
      if (options.page) searchParams.set("page", options.page.toString());
      if (options.limit) searchParams.set("limit", options.limit.toString());
      if (options.locale) searchParams.set("locale", options.locale);

      const response = await fetch(`${baseUrl}/api/games?${searchParams.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch games: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching games:", error);
      throw error;
    }
  }

  /**
   * Vérifie si un jeu existe par son slug
   * @param slug - Le slug du jeu
   * @param locale - La locale
   * @returns true si le jeu existe, false sinon
   */
  static async gameExists(slug: string, locale: string = "fr"): Promise<boolean> {
    try {
      const game = await this.fetchGameDetails(slug, locale);
      return game !== null;
    } catch (_error) {
      console.warn(`Failed to check if game exists: ${slug}`, _error);
      return false;
    }
  }

  /**
   * Génère les métadonnées SEO pour un jeu
   * @param slug - Le slug du jeu
   * @param locale - La locale
   * @returns Métadonnées pour le SEO
   */
  static async generateGameMetadata(slug: string, locale: string = "fr") {
    try {
      const game = await this.fetchGameDetails(slug, locale);

      if (!game) {
        return {
          title: locale === "fr" ? "Jeu non trouvé" : "Game not found",
        };
      }

      return {
        title: `${game.title} - Game Universe`,
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
    } catch (error) {
      console.error("Error generating game metadata:", error);
      return {
        title: locale === "fr" ? "Erreur" : "Error",
      };
    }
  }
}
