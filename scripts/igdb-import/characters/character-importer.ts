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
 * Ensure a gender exists in the DB by igdb_id, creating it if needed.
 * Returns the gender UUID or null on failure.
 */
export async function ensureGender(
  igdbGender: { id: number; name: string } | undefined,
  verbose: boolean = false
): Promise<string | null> {
  if (!igdbGender) return null;

  try {
    // Tables genders/gender_translations are not in generated Supabase types yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createScriptClient() as any;
    const slug = igdbGender.name.toLowerCase().replace(/\s+/g, "-");

    // Check if gender already exists by igdb_id
    const { data: existing } = await supabase
      .from("genders")
      .select("id")
      .eq("igdb_id", igdbGender.id)
      .single();

    if (existing) {
      if (verbose) {
        console.log(`[CharImporter] Gender exists: ${igdbGender.name} (IGDB ${igdbGender.id})`);
      }
      return existing.id;
    }

    // Create gender
    const { data: newGender, error: genderError } = await supabase
      .from("genders")
      .insert({ slug, igdb_id: igdbGender.id })
      .select("id")
      .single();

    if (genderError || !newGender) {
      if (verbose) {
        console.log(`[CharImporter] Failed to create gender: ${genderError?.message}`);
      }
      return null;
    }

    // Create English translation
    await supabase.from("gender_translations").insert({
      gender_id: newGender.id,
      language_code: "en",
      name: igdbGender.name,
    });

    if (verbose) {
      console.log(`[CharImporter] Created gender: ${igdbGender.name} → ${newGender.id}`);
    }

    return newGender.id;
  } catch (error) {
    if (verbose) {
      console.log(
        `[CharImporter] Error ensuring gender: ${error instanceof Error ? error.message : "Unknown"}`
      );
    }
    return null;
  }
}

/**
 * Ensure a species exists in the DB by igdb_id, creating it if needed.
 * Returns the species UUID or null on failure.
 */
export async function ensureSpecies(
  igdbSpecies: { id: number; name: string } | undefined,
  verbose: boolean = false
): Promise<string | null> {
  if (!igdbSpecies) return null;

  try {
    // Tables species/species_translations are not in generated Supabase types yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createScriptClient() as any;
    const slug = igdbSpecies.name.toLowerCase().replace(/\s+/g, "-");

    // Check if species already exists by igdb_id
    const { data: existing } = await supabase
      .from("species")
      .select("id")
      .eq("igdb_id", igdbSpecies.id)
      .single();

    if (existing) {
      if (verbose) {
        console.log(`[CharImporter] Species exists: ${igdbSpecies.name} (IGDB ${igdbSpecies.id})`);
      }
      return existing.id;
    }

    // Create species
    const { data: newSpecies, error: speciesError } = await supabase
      .from("species")
      .insert({ slug, igdb_id: igdbSpecies.id })
      .select("id")
      .single();

    if (speciesError || !newSpecies) {
      if (verbose) {
        console.log(`[CharImporter] Failed to create species: ${speciesError?.message}`);
      }
      return null;
    }

    // Create English translation
    await supabase.from("species_translations").insert({
      species_id: newSpecies.id,
      language_code: "en",
      name: igdbSpecies.name,
    });

    if (verbose) {
      console.log(`[CharImporter] Created species: ${igdbSpecies.name} → ${newSpecies.id}`);
    }

    return newSpecies.id;
  } catch (error) {
    if (verbose) {
      console.log(
        `[CharImporter] Error ensuring species: ${error instanceof Error ? error.message : "Unknown"}`
      );
    }
    return null;
  }
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
    // gender_id/species_id columns are not yet in generated Supabase types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createScriptClient() as any;

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

    // Ensure gender and species exist before character insert
    const genderId = await ensureGender(igdbCharacter.character_gender, verbose);
    const speciesId = await ensureSpecies(igdbCharacter.character_species, verbose);

    // Insert character
    const { data: newCharacter, error: insertError } = await supabase
      .from("characters")
      .insert({
        slug: igdbCharacter.slug,
        igdb_id: igdbCharacter.id,
        main_image: mugShotUrl,
        background_color: backgroundColor ?? "#0f172a",
        gender_id: genderId,
        species_id: speciesId,
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

    return { success: true, characterSlug: newCharacter.slug };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during character import",
    };
  }
}

async function createTranslation(characterId: string, igdbCharacter: IGDBCharacter): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createScriptClient() as any;

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createScriptClient() as any;

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

  const rows = matchedGames.map((game: { id: string; igdb_id: number }, index: number) => ({
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
