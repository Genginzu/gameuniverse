import { CharacterDetails, CharacterSummary } from "@/types/character";

/**
 * Service pour la gestion des personnages
 * Centralise toute la logique de récupération des données de personnages
 */
export class CharacterService {
  private static getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  }

  /**
   * Récupère les détails d'un personnage par son slug
   * @param slug - Le slug du personnage
   * @param locale - La locale (fr, en)
   * @returns Les détails du personnage ou null si non trouvé
   */
  static async fetchCharacterDetails(
    slug: string,
    locale: string = "fr"
  ): Promise<CharacterDetails | null> {
    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/api/characters/${slug}?locale=${locale}`, {
        cache: "no-store", // Ensure fresh data for each request
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(
          `Failed to fetch character details: ${response.status} ${response.statusText}`
        );
      }

      const characterDetails: CharacterDetails = await response.json();
      return characterDetails;
    } catch (error) {
      console.error("Error fetching character details:", error);
      throw error;
    }
  }

  /**
   * Récupère la liste des personnages avec pagination et filtres
   * @param options - Options de recherche et pagination
   * @returns Liste des personnages avec métadonnées de pagination
   */
  static async fetchCharacters(
    options: {
      search?: string;
      games?: string[];
      roles?: string[];
      page?: number;
      limit?: number;
      locale?: string;
    } = {}
  ): Promise<{
    characters: CharacterSummary[];
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
      if (options.games?.length) searchParams.set("games", options.games.join(","));
      if (options.roles?.length) searchParams.set("roles", options.roles.join(","));
      if (options.page) searchParams.set("page", options.page.toString());
      if (options.limit) searchParams.set("limit", options.limit.toString());
      if (options.locale) searchParams.set("locale", options.locale);

      const response = await fetch(`${baseUrl}/api/characters?${searchParams.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch characters: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching characters:", error);
      throw error;
    }
  }

  /**
   * Vérifie si un personnage existe par son slug
   * @param slug - Le slug du personnage
   * @param locale - La locale
   * @returns true si le personnage existe, false sinon
   */
  static async characterExists(slug: string, locale: string = "fr"): Promise<boolean> {
    try {
      const character = await this.fetchCharacterDetails(slug, locale);
      return character !== null;
    } catch (_error) {
      console.warn(`Failed to check if character exists: ${slug}`, _error);
      return false;
    }
  }

  /**
   * Génère les métadonnées SEO pour un personnage
   * @param slug - Le slug du personnage
   * @param locale - La locale
   * @returns Métadonnées pour le SEO
   */
  static async generateCharacterMetadata(slug: string, locale: string = "fr") {
    try {
      const character = await this.fetchCharacterDetails(slug, locale);

      if (!character) {
        return {
          title: locale === "fr" ? "Personnage non trouvé" : "Character not found",
        };
      }

      return {
        title: `${character.name} - Game Universe`,
        description:
          character.description ||
          (locale === "fr"
            ? `Découvrez ${character.name}, personnage de ${character.primaryGame}`
            : `Discover ${character.name}, character from ${character.primaryGame}`),
        openGraph: {
          title: character.name,
          description: character.description,
          images: character.media?.mainImage ? [character.media.mainImage] : [],
        },
      };
    } catch (error) {
      console.error("Error generating character metadata:", error);
      return {
        title: locale === "fr" ? "Erreur" : "Error",
      };
    }
  }
}
