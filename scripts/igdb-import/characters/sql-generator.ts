/**
 * SQL Generator for IGDB Character Dump Import.
 *
 * Takes assembled IGDBCharacter objects and generates a SQL file with INSERT statements
 * for all character-related tables. Designed to be executed directly in Supabase.
 */

import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { IGDBService } from "../../../src/lib/services/igdbService";
import { esc, num, slugify } from "../games/sql-entities";
import type { IGDBCharacter } from "../../../src/types/igdb";

// --- Collected entity types ---
type GenderEntry = { igdbId: number; slug: string; name: string };
type SpeciesEntry = { igdbId: number; slug: string; name: string };

/** Collect unique genders from all characters */
function collectGenders(characters: IGDBCharacter[]): Map<number, GenderEntry> {
  const map = new Map<number, GenderEntry>();
  for (const c of characters) {
    const g = c.character_gender;
    if (g && !map.has(g.id)) {
      map.set(g.id, { igdbId: g.id, slug: slugify(g.name), name: g.name });
    }
  }
  return map;
}

/** Collect unique species from all characters */
function collectSpecies(characters: IGDBCharacter[]): Map<number, SpeciesEntry> {
  const map = new Map<number, SpeciesEntry>();
  for (const c of characters) {
    const s = c.character_species;
    if (s && !map.has(s.id)) {
      map.set(s.id, { igdbId: s.id, slug: slugify(s.name), name: s.name });
    }
  }
  return map;
}

/** Generate INSERT statements for genders reference table */
function generateGendersSql(map: Map<number, GenderEntry>): string[] {
  if (map.size === 0) return [];
  const lines = ["-- Genders"];
  for (const [, g] of map) {
    lines.push(
      `INSERT INTO genders (slug, igdb_id) VALUES (${esc(g.slug)}, ${num(g.igdbId)}) ON CONFLICT (igdb_id) DO NOTHING;`
    );
    lines.push(
      `INSERT INTO gender_translations (gender_id, language_code, name) SELECT id, 'en', ${esc(g.name)} FROM genders WHERE igdb_id = ${num(g.igdbId)} ON CONFLICT (gender_id, language_code) DO NOTHING;`
    );
  }
  lines.push("");
  return lines;
}

/** Generate INSERT statements for species reference table */
function generateSpeciesSql(map: Map<number, SpeciesEntry>): string[] {
  if (map.size === 0) return [];
  const lines = ["-- Species"];
  for (const [, s] of map) {
    lines.push(
      `INSERT INTO species (slug, igdb_id) VALUES (${esc(s.slug)}, ${num(s.igdbId)}) ON CONFLICT (igdb_id) DO NOTHING;`
    );
    lines.push(
      `INSERT INTO species_translations (species_id, language_code, name) SELECT id, 'en', ${esc(s.name)} FROM species WHERE igdb_id = ${num(s.igdbId)} ON CONFLICT (species_id, language_code) DO NOTHING;`
    );
  }
  lines.push("");
  return lines;
}

/** Generate all INSERT statements for a single character and its related data */
function generateSingleCharacterSql(character: IGDBCharacter): string[] {
  const lines: string[] = [];
  const igdbId = num(character.id);

  // Mug shot URL
  const mugShotUrl = character.mug_shot?.image_id
    ? IGDBService.buildImageUrl(character.mug_shot.image_id, "cover_big")
    : null;

  // Gender / species FK via igdb_id lookup
  const genderSubquery = character.character_gender
    ? `(SELECT id FROM genders WHERE igdb_id = ${num(character.character_gender.id)})`
    : "NULL";
  const speciesSubquery = character.character_species
    ? `(SELECT id FROM species WHERE igdb_id = ${num(character.character_species.id)})`
    : "NULL";

  // Character row
  lines.push(
    `INSERT INTO characters (slug, igdb_id, main_image, background_color, gender_id, species_id) VALUES (${esc(character.slug)}, ${igdbId}, ${esc(mugShotUrl)}, '#0f172a', ${genderSubquery}, ${speciesSubquery}) ON CONFLICT (igdb_id) DO NOTHING;`
  );

  // English translation
  const genderName = character.character_gender?.name ?? null;
  const speciesName = character.character_species?.name ?? null;
  const roleParts = [genderName, speciesName].filter(Boolean);
  const role = roleParts.length > 0 ? roleParts.join(" — ") : null;

  lines.push(
    `INSERT INTO character_translations (character_id, language_code, name, role, description) SELECT id, 'en', ${esc(character.name)}, ${esc(role)}, ${esc(character.description ?? null)} FROM characters WHERE igdb_id = ${igdbId} ON CONFLICT (character_id, language_code) DO NOTHING;`
  );

  // Game links — first game is primary
  if (character.games?.length) {
    for (let i = 0; i < character.games.length; i++) {
      const gameIgdbId = num(character.games[i]);
      lines.push(
        `INSERT INTO character_games (character_id, game_id, is_primary) SELECT c.id, g.id, ${i === 0} FROM characters c, games g WHERE c.igdb_id = ${igdbId} AND g.igdb_id = ${gameIgdbId} ON CONFLICT DO NOTHING;`
      );
    }
  }

  return lines;
}

/**
 * Generate a single SQL file from assembled IGDBCharacter objects.
 */
export async function generateCharactersSql(
  characters: IGDBCharacter[],
  outputPath: string,
  verbose: boolean
): Promise<void> {
  console.log(`[SQLGen] Generating SQL for ${characters.length} characters...`);

  const genderMap = collectGenders(characters);
  const speciesMap = collectSpecies(characters);

  if (verbose) {
    console.log(`[SQLGen] Entities: ${genderMap.size} genders, ${speciesMap.size} species`);
  }

  await mkdir(dirname(outputPath), { recursive: true });

  const lines: string[] = [
    "-- IGDB Character Dump Import",
    `-- Generated: ${new Date().toISOString()}`,
    `-- Characters: ${characters.length}`,
    "",
    "BEGIN;",
    "",
    ...generateGendersSql(genderMap),
    ...generateSpeciesSql(speciesMap),
  ];

  for (let i = 0; i < characters.length; i++) {
    lines.push(...generateSingleCharacterSql(characters[i]));
    if (verbose && (i + 1) % 10000 === 0) {
      console.log(`[SQLGen] Processed ${i + 1}/${characters.length} characters`);
    }
  }

  lines.push("", "COMMIT;", "");
  await writeFile(outputPath, lines.join("\n"), "utf-8");
  console.log(`[SQLGen] SQL written to ${outputPath} (${lines.length} lines)`);
}
