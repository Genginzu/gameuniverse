import { CharacterDetails, CharacterSummary } from "@/types/character";
import { BaseService, PaginatedResponse, EntityMetadata } from "./baseService";
import type { CharacterFetchOptions, CharactersResponse } from "./characterService.types";
import {
  fetchCharactersFromDB as fetchCharactersFromDBQuery,
  fetchCharacterDetailsFromDB as fetchCharacterDetailsFromDBQuery,
} from "./characterService.queries";

/**
 * Internal CharacterService implementation extending BaseService
 */
class CharacterServiceImpl extends BaseService<CharacterDetails, CharacterSummary> {
  protected readonly entityName = "character";
  protected readonly apiPath = "/api/characters";

  protected buildMetadata(character: CharacterDetails, locale: string): EntityMetadata {
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
  }
}

const characterServiceInstance = new CharacterServiceImpl();

/**
 * Service pour la gestion des personnages
 */
export class CharacterService {
  private static getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  }

  static async fetchCharactersFromDB(
    options: {
      search?: string;
      games?: string[];
      roles?: string[];
      page?: number;
      limit?: number;
      locale?: string;
    } = {}
  ): Promise<CharactersResponse> {
    return fetchCharactersFromDBQuery(options);
  }

  static async fetchCharacterDetailsFromDB(
    slug: string,
    locale: string = "fr"
  ): Promise<CharacterDetails | null> {
    return fetchCharacterDetailsFromDBQuery(slug, locale);
  }

  static async fetchCharacterDetails(
    slug: string,
    locale: string = "fr"
  ): Promise<CharacterDetails | null> {
    return characterServiceInstance.fetchDetails(slug, locale);
  }

  static async fetchCharacters(
    options: {
      search?: string;
      games?: string[];
      roles?: string[];
      page?: number;
      limit?: number;
      locale?: string;
    } = {}
  ): Promise<CharactersResponse> {
    const response = await characterServiceInstance.fetchList(options as CharacterFetchOptions);
    const rawResponse = response as unknown as
      | CharactersResponse
      | PaginatedResponse<CharacterSummary>;

    if ("characters" in rawResponse) {
      return rawResponse;
    }

    return {
      characters: response.items,
      pagination: response.pagination,
    };
  }

  static async characterExists(slug: string, locale: string = "fr"): Promise<boolean> {
    return characterServiceInstance.exists(slug, locale);
  }

  static async generateCharacterMetadata(slug: string, locale: string = "fr") {
    return characterServiceInstance.generateMetadata(slug, locale);
  }
}
