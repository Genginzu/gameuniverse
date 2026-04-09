import {
  CharacterDetails,
  CharacterMedia,
  CharacterGame,
  CharacterRelationship,
} from "@/types/character";
import type { PlatformSummary } from "@/types/platform";
import { createServerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { pickTranslation } from "@/lib/utils/pickTranslation";
import type {
  CharacterDetailsRow,
  GameRow,
  RelatedCharacterRow,
} from "./characterService.types";

/**
 * Récupère les détails d'un personnage directement depuis la base de données
 */
export async function fetchCharacterDetailsFromDB(
  slug: string,
  locale: string = "fr"
): Promise<CharacterDetails | null> {
  const supabase = await createServerClient();

  const { data: character, error } = await supabase
    .from("characters")
    .select(
      `
      id, slug, main_image, background_image, background_color,
      created_at, updated_at,
      character_translations(language_code, name, role, description, biography, weapons),
      character_games(
        is_primary,
        games(
          id, slug, cover_image_url, background_image_url, release_date,
          game_translations(title),
          game_platforms(platforms(id, slug, icon_url, platform_translations(name, abbreviation, language_code)))
        )
      ),
      character_media(id, type, url, thumbnail_url, title, description, alt_text, is_featured, display_order),
      character_relationships(
        id, relationship_type, description,
        related_character:related_character_id(id, slug, main_image, character_translations(language_code, name, role))
      )
    `
    )
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    logger.error("Error fetching character details", { error, slug });
    throw new Error(`Failed to fetch character details: ${error.message}`);
  }
  if (!character) return null;

  const typedCharacter = character as unknown as CharacterDetailsRow;
  const translation = pickTranslation(typedCharacter.character_translations, locale);

  const processedGames = processGames(typedCharacter);
  const primaryGame =
    processedGames.find((g) => g.isPrimary)?.title || processedGames[0]?.title || "Unknown";
  const media = processMedia(typedCharacter);
  const relationships = processRelationships(typedCharacter, locale);
  const platforms = processPlatforms(typedCharacter, locale);
  const { genderObj, speciesObj } = await fetchGenderSpecies(supabase, typedCharacter.id, locale);

  return {
    id: typedCharacter.id,
    slug: typedCharacter.slug,
    name: translation?.name || "Unnamed",
    role: translation?.role || undefined,
    description: translation?.description || undefined,
    biography: translation?.biography || undefined,
    weapons: translation?.weapons || undefined,
    backgroundColor: typedCharacter.background_color || "#0f172a",
    ...(genderObj && { gender: genderObj }),
    ...(speciesObj && { species: speciesObj }),
    games: processedGames,
    primaryGame,
    media,
    relationships,
    platforms,
    createdAt: typedCharacter.created_at,
    updatedAt: typedCharacter.updated_at,
  };
}

function processGames(typedCharacter: CharacterDetailsRow): CharacterGame[] {
  const gamesRaw =
    typedCharacter.character_games?.map((cg) => {
      const game = cg.games as GameRow | null;
      if (!game) return null;
      return {
        id: game.id,
        slug: game.slug,
        title: game.game_translations?.[0]?.title || "Unknown",
        coverImage: game.cover_image_url || undefined,
        backgroundImage: game.background_image_url || undefined,
        releaseYear: game.release_date ? new Date(game.release_date).getFullYear() : undefined,
        isPrimary: cg.is_primary || false,
      };
    }) || [];

  return gamesRaw
    .filter((g): g is NonNullable<typeof g> => g !== null)
    .sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return a.title.localeCompare(b.title);
    });
}

function processMedia(typedCharacter: CharacterDetailsRow): CharacterMedia {
  const mediaItems = typedCharacter.character_media || [];
  const sortByOrder = (a: { display_order: number | null }, b: { display_order: number | null }) =>
    (a.display_order || 0) - (b.display_order || 0);

  return {
    mainImage: typedCharacter.main_image || undefined,
    backgroundImage: typedCharacter.background_image || undefined,
    screenshots: mediaItems
      .filter((m) => m.type === "screenshot")
      .sort(sortByOrder)
      .map((m) => ({ id: m.id, url: m.url, altText: m.alt_text || undefined, caption: m.description || undefined, isFeatured: m.is_featured || false })),
    artwork: mediaItems
      .filter((m) => m.type === "artwork")
      .sort(sortByOrder)
      .map((m) => ({ id: m.id, url: m.url, altText: m.alt_text || undefined, caption: m.description || undefined, type: m.title || "artwork", isFeatured: m.is_featured || false })),
    videos: mediaItems
      .filter((m) => m.type === "video")
      .sort(sortByOrder)
      .map((m) => ({ id: m.id, title: m.title || "Video", description: m.description || undefined, url: m.url, thumbnailUrl: m.thumbnail_url || undefined, type: "video", isFeatured: m.is_featured || false })),
  };
}

function processRelationships(typedCharacter: CharacterDetailsRow, locale: string): CharacterRelationship[] {
  const raw =
    typedCharacter.character_relationships?.map((rel) => {
      const related = rel.related_character as RelatedCharacterRow | null;
      if (!related) return null;
      const relatedTranslation = pickTranslation(related.character_translations, locale);
      return {
        id: rel.id,
        relatedCharacter: {
          id: related.id, slug: related.slug,
          name: relatedTranslation?.name || "Unknown",
          mainImage: related.main_image || undefined,
          role: relatedTranslation?.role || undefined,
        },
        relationshipType: rel.relationship_type,
        description: rel.description || undefined,
      };
    }) || [];
  return raw.filter((r): r is NonNullable<typeof r> => r !== null);
}

function processPlatforms(typedCharacter: CharacterDetailsRow, locale: string): PlatformSummary[] {
  const platformMap = new Map<string, PlatformSummary>();
  for (const cg of typedCharacter.character_games ?? []) {
    const game = cg.games as GameRow | null;
    if (!game?.game_platforms) continue;
    for (const gp of game.game_platforms) {
      const platform = gp.platforms;
      if (!platform || platformMap.has(platform.id)) continue;
      const translations = platform.platform_translations ?? [];
      const tr =
        translations.find((t) => t.language_code === locale) ||
        translations.find((t) => t.language_code === "en") ||
        translations[0];
      platformMap.set(platform.id, {
        id: platform.id, slug: platform.slug,
        name: tr?.name || platform.slug,
        abbreviation: tr?.abbreviation || undefined,
        iconUrl: platform.icon_url || undefined,
      });
    }
  }
  return Array.from(platformMap.values());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchGenderSpecies(supabase: any, characterId: string, locale: string) {
  let genderObj: { id: string; slug: string; name: string } | undefined;
  let speciesObj: { id: string; slug: string; name: string } | undefined;
  try {
    const { data: gsData } = await supabase
      .from("characters")
      .select("gender_id, species_id")
      .eq("id", characterId)
      .single();

    if (gsData?.gender_id) {
      const { data: genderData } = await supabase
        .from("genders")
        .select("id, slug, gender_translations(language_code, name)")
        .eq("id", gsData.gender_id)
        .single();
      if (genderData) {
        const gt = pickTranslation(
          genderData.gender_translations as { language_code: string; name: string }[],
          locale
        );
        if (gt) genderObj = { id: genderData.id, slug: genderData.slug, name: gt.name };
      }
    }

    if (gsData?.species_id) {
      const { data: speciesData } = await supabase
        .from("species")
        .select("id, slug, species_translations(language_code, name)")
        .eq("id", gsData.species_id)
        .single();
      if (speciesData) {
        const st = pickTranslation(
          speciesData.species_translations as { language_code: string; name: string }[],
          locale
        );
        if (st) speciesObj = { id: speciesData.id, slug: speciesData.slug, name: st.name };
      }
    }
  } catch {
    // Migration not applied yet
  }
  return { genderObj, speciesObj };
}
