import { CharacterSummary } from "@/types/character";
import { createServerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { pickTranslationWithName } from "@/lib/utils/pickTranslation";
import type { CharacterListRow, CharactersResponse, GameRow } from "./characterService.types";

// Re-export the details query from its own module
export { fetchCharacterDetailsFromDB } from "./characterService.detailsQuery";

/**
 * Récupère la liste des personnages directement depuis la base de données
 */
export async function fetchCharactersFromDB(
  options: {
    search?: string;
    games?: string[];
    roles?: string[];
    page?: number;
    limit?: number;
    locale?: string;
  } = {}
): Promise<CharactersResponse> {
  const { search = "", games = [], roles = [], page = 1, limit = 20, locale = "fr" } = options;

  const supabase = await createServerClient();
  const offset = (page - 1) * limit;

  let query = supabase.from("characters").select(
    `
      id, slug, main_image, background_color, created_at,
      character_translations(language_code, name, role, description),
      character_games(is_primary, games(id, slug, game_translations(title)))
    `
  );

  let countQuery = supabase
    .from("characters")
    .select("id, character_translations(language_code, name, role)", {
      count: "exact",
      head: true,
    });

  if (search.trim()) {
    query = query.ilike("character_translations.name", `%${search.trim()}%`);
    countQuery = countQuery.ilike("character_translations.name", `%${search.trim()}%`);
  }

  if (roles.length > 0) {
    query = query.in("character_translations.role", roles);
    countQuery = countQuery.in("character_translations.role", roles);
  }

  const { count: totalCount, error: countError } = await countQuery;
  if (countError) {
    logger.error("Error counting characters", { error: countError });
    throw new Error(`Failed to count characters: ${countError.message}`);
  }

  const { data: characters, error } = await query
    .order("name", { referencedTable: "character_translations", ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error("Error fetching characters", { error });
    throw new Error(`Failed to fetch characters: ${error.message}`);
  }

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

  const transformedCharacters: CharacterSummary[] = filteredCharacters
    .map((character) => {
      const translation = pickTranslationWithName(character.character_translations, locale);
      // Skip characters with no usable name
      if (!translation?.name?.trim()) return null;

      const primaryGameRelation = character.character_games?.find((cg) => cg.is_primary === true);
      const primaryGame =
        (primaryGameRelation?.games as GameRow | null)?.game_translations?.[0]?.title ||
        (character.character_games?.[0]?.games as GameRow | null)?.game_translations?.[0]?.title ||
        undefined;
      const gamesCount = character.character_games?.length || 0;

      return {
        id: character.id,
        slug: character.slug,
        name: translation.name,
        role: translation?.role || undefined,
        description: translation?.description || undefined,
        mainImage: character.main_image || undefined,
        backgroundColor: character.background_color || undefined,
        primaryGame,
        gamesCount,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const totalPages = Math.ceil((totalCount || 0) / limit);
  return {
    characters: transformedCharacters,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount: totalCount || 0,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
