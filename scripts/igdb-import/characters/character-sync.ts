/**
 * Synchronisation d'un personnage existant depuis IGDB.
 * Met à jour l'image, les couleurs, le genre, l'espèce, la traduction et les liens jeux.
 */

import { createScriptClient } from "../shared/supabase-client";
import { IGDBService } from "../../../src/lib/services/igdbService";
import { extractColorsFromCover } from "../shared/color-extractor";
import { ensureGender, ensureSpecies } from "./character-importer";
import type { IGDBCharacter } from "../../../src/types/igdb";
import type { CharacterImportResult } from "./character-importer";

/**
 * Sync an existing character with fresh IGDB data.
 * Updates image, colors, gender, species, translation, and game links in parallel.
 */
export async function syncExistingCharacter(
  characterId: string,
  characterSlug: string,
  igdbCharacter: IGDBCharacter,
  verbose: boolean = false
): Promise<CharacterImportResult> {
  try {
    if (verbose) {
      console.log(`[CharSync] Syncing: ${characterSlug} (IGDB ${igdbCharacter.id})`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createScriptClient() as any;

    // Build mug_shot URL
    const mugShotUrl = igdbCharacter.mug_shot?.image_id
      ? IGDBService.buildImageUrl(igdbCharacter.mug_shot.image_id, "cover_big")
      : null;

    // Run color extraction + gender + species in parallel
    const [colors, genderId, speciesId] = await Promise.all([
      mugShotUrl ? extractColorsFromCover(mugShotUrl, verbose) : Promise.resolve(null),
      ensureGender(igdbCharacter.character_gender, verbose),
      ensureSpecies(igdbCharacter.character_species, verbose),
    ]);

    // Update character row + translation + game links in parallel
    await Promise.all([
      updateCharacterRow(
        supabase,
        characterId,
        mugShotUrl,
        colors?.background_color ?? null,
        genderId,
        speciesId
      ),
      upsertTranslation(supabase, characterId, igdbCharacter),
      syncGameLinks(supabase, characterId, igdbCharacter.games ?? [], verbose),
    ]);

    if (verbose) {
      console.log(`[CharSync] Synced: ${characterSlug}`);
    }

    return { success: true, characterSlug };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during character sync",
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateCharacterRow(
  supabase: any,
  characterId: string,
  mugShotUrl: string | null,
  backgroundColor: string | null,
  genderId: string | null,
  speciesId: string | null
): Promise<void> {
  const updates: Record<string, unknown> = {
    gender_id: genderId,
    species_id: speciesId,
  };

  if (mugShotUrl) {
    updates.main_image = mugShotUrl;
  }
  if (backgroundColor) {
    updates.background_color = backgroundColor;
  }

  await supabase.from("characters").update(updates).eq("id", characterId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertTranslation(
  supabase: any,
  characterId: string,
  igdbCharacter: IGDBCharacter
): Promise<void> {
  const genderName = igdbCharacter.character_gender?.name ?? null;
  const speciesName = igdbCharacter.character_species?.name ?? null;
  const roleParts = [genderName, speciesName].filter(Boolean);
  const role = roleParts.length > 0 ? roleParts.join(" — ") : null;

  await supabase.from("character_translations").upsert(
    {
      character_id: characterId,
      language_code: "en",
      name: igdbCharacter.name,
      role,
      description: igdbCharacter.description ?? null,
    },
    { onConflict: "character_id,language_code" }
  );
}

/**
 * Sync game links — delete existing and re-insert from IGDB data.
 * First game in the list is marked as primary.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncGameLinks(
  supabase: any,
  characterId: string,
  igdbGameIds: number[],
  verbose: boolean
): Promise<void> {
  // Delete existing links
  await supabase.from("character_games").delete().eq("character_id", characterId);

  if (igdbGameIds.length === 0) return;

  // Find which IGDB game IDs exist in our DB
  const { data: matchedGames } = await supabase
    .from("games")
    .select("id, igdb_id")
    .in("igdb_id", igdbGameIds);

  if (!matchedGames || matchedGames.length === 0) {
    if (verbose) {
      console.log(`[CharSync] No matching games for ${igdbGameIds.length} IGDB IDs`);
    }
    return;
  }

  const rows = matchedGames.map((game: { id: string; igdb_id: number }, index: number) => ({
    character_id: characterId,
    game_id: game.id,
    is_primary: index === 0,
  }));

  await supabase.from("character_games").insert(rows);

  if (verbose) {
    console.log(`[CharSync] Linked to ${matchedGames.length} game(s)`);
  }
}
