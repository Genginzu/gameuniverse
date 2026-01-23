import {
  CharacterDetails,
  CharacterSummary,
  CharacterMedia,
  CharacterGame,
} from "@/types/character";
import { createServerClient } from "@/lib/supabase-server";

// Type definitions for Supabase query results
interface CharacterTranslationRow {
  name: string;
  role: string | null;
  description: string | null;
  biography?: string | null;
}

interface GameTranslationRow {
  title: string;
}

interface GameRow {
  id: string;
  slug: string;
  cover_image_url: string | null;
  release_date: string | null;
  game_translations: GameTranslationRow[];
}

interface CharacterGameRow {
  is_primary: boolean;
  games: GameRow | null;
}

interface CharacterMediaRow {
  id: string;
  type: string;
  url: string;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  alt_text: string | null;
  is_featured: boolean | null;
  display_order: number | null;
}

interface CharacterListRow {
  id: string;
  slug: string;
  main_image: string | null;
  background_color: string | null;
  created_at: string;
  character_translations: CharacterTranslationRow[];
  character_games: CharacterGameRow[];
}

interface CharacterDetailsRow extends CharacterListRow {
  background_image: string | null;
  updated_at: string;
  character_media: CharacterMediaRow[];
}

/**
 * Service pour la gestion des personnages
 * Centralise toute la logique de récupération des données de personnages
 */
export class CharacterService {
  private static getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  }

  /**
   * Récupère la liste des personnages directement depuis la base de données
   * avec pagination et filtres
   * @param options - Options de recherche et pagination
   * @returns Liste des personnages avec métadonnées de pagination
   */
  static async fetchCharactersFromDB(
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
    const { search = "", games = [], roles = [], page = 1, limit = 20, locale = "fr" } = options;

    const supabase = await createServerClient();
    const offset = (page - 1) * limit;

    // Build the base query with joins for translations and games
    let query = supabase
      .from("characters")
      .select(
        `
        id,
        slug,
        main_image,
        background_color,
        created_at,
        character_translations!inner(
          name,
          role,
          description
        ),
        character_games(
          is_primary,
          games(
            id,
            slug,
            game_translations(
              title
            )
          )
        )
      `
      )
      .eq("character_translations.language_code", locale);

    // Add search filter if provided (case-insensitive)
    if (search.trim()) {
      query = query.ilike("character_translations.name", `%${search.trim()}%`);
    }

    // Add role filter if provided
    if (roles.length > 0) {
      query = query.in("character_translations.role", roles);
    }

    // Get total count for pagination (separate query for performance)
    let countQuery = supabase
      .from("characters")
      .select("id, character_translations!inner(language_code, name, role)", {
        count: "exact",
        head: true,
      })
      .eq("character_translations.language_code", locale);

    if (search.trim()) {
      countQuery = countQuery.ilike("character_translations.name", `%${search.trim()}%`);
    }

    if (roles.length > 0) {
      countQuery = countQuery.in("character_translations.role", roles);
    }

    // Execute count query
    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error("Error counting characters:", countError);
      throw new Error(`Failed to count characters: ${countError.message}`);
    }

    // Apply pagination and execute main query
    const { data: characters, error } = await query
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching characters:", error);
      throw new Error(`Failed to fetch characters: ${error.message}`);
    }

    // Filter by games if specified (post-processing due to Supabase limitations)
    let filteredCharacters = (characters as unknown as CharacterListRow[]) || [];
    if (games.length > 0) {
      filteredCharacters = filteredCharacters.filter((character) => {
        const characterGameIds =
          character.character_games
            ?.map((cg) => cg.games?.id)
            .filter((id): id is string => id !== null && id !== undefined) || [];
        return games.some((gameId) => characterGameIds.includes(gameId));
      });
    }

    // Transform the data to match the expected CharacterSummary format
    const transformedCharacters: CharacterSummary[] = filteredCharacters.map((character) => {
      const translation = character.character_translations?.[0];

      // Get primary game title
      const primaryGameRelation = character.character_games?.find((cg) => cg.is_primary === true);
      const primaryGame =
        (primaryGameRelation?.games as GameRow | null)?.game_translations?.[0]?.title ||
        (character.character_games?.[0]?.games as GameRow | null)?.game_translations?.[0]?.title ||
        "Unknown";

      // Count total games
      const gamesCount = character.character_games?.length || 0;

      return {
        id: character.id,
        slug: character.slug,
        name: translation?.name || "Unnamed",
        role: translation?.role || undefined,
        description: translation?.description || undefined,
        mainImage: character.main_image || undefined,
        backgroundColor: character.background_color || undefined,
        primaryGame,
        gamesCount,
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil((totalCount || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      characters: transformedCharacters,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: totalCount || 0,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  /**
   * Récupère les détails d'un personnage directement depuis la base de données
   * @param slug - Le slug du personnage
   * @param locale - La locale (fr, en)
   * @returns Les détails du personnage ou null si non trouvé
   */
  static async fetchCharacterDetailsFromDB(
    slug: string,
    locale: string = "fr"
  ): Promise<CharacterDetails | null> {
    const supabase = await createServerClient();

    // Fetch character details by slug with all related data
    const { data: character, error } = await supabase
      .from("characters")
      .select(
        `
        id,
        slug,
        main_image,
        background_image,
        background_color,
        created_at,
        updated_at,
        character_translations!inner(
          name,
          role,
          description,
          biography
        ),
        character_games(
          is_primary,
          games(
            id,
            slug,
            cover_image_url,
            release_date,
            game_translations(
              title
            )
          )
        ),
        character_media(
          id,
          type,
          url,
          thumbnail_url,
          title,
          description,
          alt_text,
          is_featured,
          display_order
        )
      `
      )
      .eq("character_translations.language_code", locale)
      .eq("slug", slug)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - character not found
        return null;
      }
      console.error("Error fetching character details:", error);
      throw new Error(`Failed to fetch character details: ${error.message}`);
    }

    if (!character) {
      return null;
    }

    const typedCharacter = character as unknown as CharacterDetailsRow;
    const translation = typedCharacter.character_translations?.[0];

    // Process games with locale-based field selection
    const games: CharacterGame[] =
      typedCharacter.character_games
        ?.map((cg) => {
          const game = cg.games as GameRow | null;
          if (!game) return null;

          return {
            id: game.id,
            slug: game.slug,
            title: game.game_translations?.[0]?.title || "Unknown",
            coverImage: game.cover_image_url || undefined,
            releaseYear: game.release_date ? new Date(game.release_date).getFullYear() : undefined,
            isPrimary: cg.is_primary || false,
          };
        })
        .filter((g): g is CharacterGame => g !== null)
        .sort((a, b) => {
          // Sort primary game first, then alphabetically
          if (a.isPrimary && !b.isPrimary) return -1;
          if (!a.isPrimary && b.isPrimary) return 1;
          return a.title.localeCompare(b.title);
        }) || [];

    // Get primary game name
    const primaryGame = games.find((g) => g.isPrimary)?.title || games[0]?.title || "Unknown";

    // Process media with JSON aggregation pattern
    const mediaItems = typedCharacter.character_media || [];

    const screenshots = mediaItems
      .filter((m) => m.type === "screenshot")
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map((m) => ({
        id: m.id,
        url: m.url,
        altText: m.alt_text || undefined,
        caption: m.description || undefined,
        isFeatured: m.is_featured || false,
      }));

    const artwork = mediaItems
      .filter((m) => m.type === "artwork")
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map((m) => ({
        id: m.id,
        url: m.url,
        altText: m.alt_text || undefined,
        caption: m.description || undefined,
        type: m.title || "artwork",
        isFeatured: m.is_featured || false,
      }));

    const videos = mediaItems
      .filter((m) => m.type === "video")
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map((m) => ({
        id: m.id,
        title: m.title || "Video",
        description: m.description || undefined,
        url: m.url,
        thumbnailUrl: m.thumbnail_url || undefined,
        type: "video",
        isFeatured: m.is_featured || false,
      }));

    const media: CharacterMedia = {
      mainImage: typedCharacter.main_image || undefined,
      backgroundImage: typedCharacter.background_image || undefined,
      screenshots,
      artwork,
      videos,
    };

    return {
      id: typedCharacter.id,
      slug: typedCharacter.slug,
      name: translation?.name || "Unnamed",
      role: translation?.role || undefined,
      description: translation?.description || undefined,
      biography: translation?.biography || undefined,
      backgroundColor: typedCharacter.background_color || "#0f172a",
      games,
      primaryGame,
      media,
      createdAt: typedCharacter.created_at,
      updatedAt: typedCharacter.updated_at,
    };
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
