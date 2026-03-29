/**
 * Character Dump Assembler.
 *
 * Reads the downloaded IGDB CSV dumps and assembles them into IGDBCharacter
 * objects by joining the related tables (mug_shots, genders, species).
 */

import { buildLookupMap, parseCsvFile } from "../shared/dump-csv-parser";
import type { IGDBCharacter } from "../../../src/types/igdb";

interface RawCharacter {
  id: number;
  name: string;
  slug: string;
  description?: string;
  mug_shot?: number;
  character_gender?: number;
  character_species?: number;
  games?: number[];
  akas?: string[];
  url?: string;
  country_name?: string;
  [k: string]: unknown;
}

interface RawMugShot {
  id: number;
  image_id: string;
  [k: string]: unknown;
}
interface RawGender {
  id: number;
  name: string;
  [k: string]: unknown;
}
interface RawSpecies {
  id: number;
  name: string;
  [k: string]: unknown;
}

/**
 * Load all CSV dumps and assemble IGDBCharacter objects.
 * @param csvPaths Map of endpoint name → local CSV file path
 * @param verbose Enable logging
 */
export async function assembleCharactersFromDumps(
  csvPaths: Map<string, string>,
  verbose: boolean
): Promise<IGDBCharacter[]> {
  console.log("[DumpAssembler] Loading character CSV files...");

  const [rawCharacters, mugShotMap, genderMap, speciesMap] = await Promise.all([
    parseCsvFile<RawCharacter>(csvPaths.get("characters")!),
    csvPaths.has("character_mug_shots")
      ? buildLookupMap<RawMugShot>(csvPaths.get("character_mug_shots")!)
      : Promise.resolve(new Map<number, RawMugShot>()),
    csvPaths.has("character_genders")
      ? buildLookupMap<RawGender>(csvPaths.get("character_genders")!)
      : Promise.resolve(new Map<number, RawGender>()),
    csvPaths.has("character_species")
      ? buildLookupMap<RawSpecies>(csvPaths.get("character_species")!)
      : Promise.resolve(new Map<number, RawSpecies>()),
  ]);

  if (verbose) {
    console.log(`[DumpAssembler] Loaded ${rawCharacters.length} raw characters`);
  }

  const characters: IGDBCharacter[] = rawCharacters.map((raw) => {
    const mugShot = raw.mug_shot ? mugShotMap.get(raw.mug_shot) : undefined;
    const gender = raw.character_gender ? genderMap.get(raw.character_gender) : undefined;
    const species = raw.character_species ? speciesMap.get(raw.character_species) : undefined;

    const games = Array.isArray(raw.games)
      ? raw.games.map(Number).filter((n) => !isNaN(n))
      : undefined;

    return {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      description: raw.description as string | undefined,
      mug_shot: mugShot ? { image_id: mugShot.image_id } : undefined,
      character_gender: gender ? { id: gender.id, name: gender.name } : undefined,
      character_species: species ? { id: species.id, name: species.name } : undefined,
      games: games && games.length > 0 ? games : undefined,
      akas: Array.isArray(raw.akas) ? (raw.akas as string[]) : undefined,
      url: raw.url as string | undefined,
      country_name: raw.country_name as string | undefined,
    };
  });

  console.log(`[DumpAssembler] Assembled ${characters.length} characters from dumps`);
  return characters;
}
