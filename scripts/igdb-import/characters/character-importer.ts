/**
 * Character Importer — imports a single IGDB character into Supabase.
 * Handles deduplication via igdb_id, translations, game links, and mug_shot.
 */

import { createScriptClient } from "../shared/supabase-client";
import { IGDBService } from "../../../src/lib/services/igdbService";
import type { IGDBCharacter } from "../../../src/types/igdb";
import { extractColorsFromCover } from "../shared/color-extractor";

export interface CharacterImportResult {
  success: boolean;
  characterSlug?: string;
  skipped?: boolean;
  error?: string;
}

/**
 * Import a single IGDB character into Supabase.
 * - Skips if igdb_id already exists
 * - Creates character, English translation, mug_shot image, and game links
 */
export async function importCharacterFromIGDB(
  igdbCharacter: IGDBCharacter,
  verbose: boolean = false
): Promise<CharacterImportResult> {
  try {
    const supabase = createScriptClient();

    // Check if character already exists by igdb_id
    const { data: existing } = await supabase
      .from("characters")
      .select("id, slug")
      .eq("igdb_id", igdbCharacter.id)
      .single();

    if (existing) {
      if (verbose) {
        console.log(
          `[CharImporter] Skipped (exists): ${igdbCharacter.name} (IGDB ${igdbCharacter.id})`
        );
      }
      return { success: true, characterSlug: existing.slug, skipped: true };
    }

    // Build mug_shot URL
    const mugShotUrl = igdbCharacter.mug_shot?.image_id
      ? IGDBService.buildImageUrl(igdbCharacter.mug_shot.image_id, "cover_big")
      : null;

    // Extract background color from mug_shot
    let backgroundColor: string | null = null;
    if (mugShotUrl) {
      const colors = await extractColorsFromCover(mugShotUrl, verbose);
      if (colors) {
        backgroundColor = colors.background_color;
      }
    }

    // Insert character
    const { data: newCharacter, error: insertError } = await supabase
      .from("characters")
      .insert({
        slug: igdbCharacter.slug,
        igdb_id: igdbCharacter.id,
        main_image: mugShotUrl,
        background_color: backgroundColor ?? "#0f172a",
      })
      .select("id, slug")
      .single();

    if (insertError || !newCharacter) {
      return {
        success: false,
        error: `Failed to insert character: ${insertError?.message ?? "Unknown error"}`,
      };
    }

    if (verbose) {
      console.log(`[CharImporter] Created: ${newCharacter.slug}`);
    }

    // Create English translation (IGDB data is English only)
    await createTranslation(newCharacter.id, igdbCharacter);

    // Link to games that already exist in our DB
    await linkGames(newCharacter.id, igdbCharacter.games ?? [], verbose);

    // Save mug_shot as character_media
    if (mugShotUrl) {
      await saveMugShotMedia(newCharacter.id, mugShotUrl);
    }

    return { success: true, characterSlug: newCharacter.slug };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during character import",
    };
  }
}

async function createTranslation(characterId: string, igdbCharacter: IGDBCharacter): Promise<void> {
  const supabase = createScriptClient();

  const genderName = igdbCharacter.character_gender?.name ?? null;
  const speciesName = igdbCharacter.character_species?.name ?? null;

  // Build a role string from gender + species when available
  const roleParts = [genderName, speciesName].filter(Boolean);
  const role = roleParts.length > 0 ? roleParts.join(" — ") : null;

  await supabase.from("character_translations").insert({
    character_id: characterId,
    language_code: "en",
    name: igdbCharacter.name,
    role,
    description: igdbCharacter.description ?? null,
  });
}

/**
 * Link character to games that already exist in our DB (matched by igdb_id).
 * The first game in the list is marked as primary.
 */
async function linkGames(
  characterId: string,
  igdbGameIds: number[],
  verbose: boolean
): Promise<void> {
  if (igdbGameIds.length === 0) return;

  const supabase = createScriptClient();

  // Find which of these IGDB game IDs exist in our games table
  const { data: matchedGames } = await supabase
    .from("games")
    .select("id, igdb_id")
    .in("igdb_id", igdbGameIds);

  if (!matchedGames || matchedGames.length === 0) {
    if (verbose) {
      console.log(`[CharImporter] No matching games found for ${igdbGameIds.length} IGDB IDs`);
    }
    return;
  }

  const rows = matchedGames.map((game, index) => ({
    character_id: characterId,
    game_id: game.id,
    is_primary: index === 0,
  }));

  const { error } = await supabase.from("character_games").insert(rows);

  if (error && verbose) {
    console.log(`[CharImporter] Error linking games: ${error.message}`);
  } else if (verbose) {
    console.log(`[CharImporter] Linked to ${matchedGames.length} game(s)`);
  }
}

async function saveMugShotMedia(characterId: string, mugShotUrl: string): Promise<void> {
  const supabase = createScriptClient();

  await supabase.from("character_media").insert({
    character_id: characterId,
    type: "artwork",
    url: mugShotUrl,
    is_featured: true,
    display_order: 0,
  });
}
