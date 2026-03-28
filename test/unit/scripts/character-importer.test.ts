import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IGDBCharacter } from "../../../src/types/igdb";

/**
 * Unit tests for character importer gender/species handling.
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
 */

// --- Fluent mock Supabase client ---

/** Table-specific response queues to handle parallel operations deterministically */
const tableQueues: Record<string, Array<{ data: unknown; error: unknown }>> = {};
let insertCalls: Array<{ table: string; rows: unknown }> = [];

/** Push a response for a specific table (or "default" for any table) */
function pushResponse(table: string, response: { data: unknown; error: unknown }) {
  if (!tableQueues[table]) tableQueues[table] = [];
  tableQueues[table].push(response);
}

/** Shift a response: try table-specific queue first, then "default" */
function shiftResponse(table: string): { data: unknown; error: unknown } {
  if (tableQueues[table]?.length) return tableQueues[table].shift()!;
  if (tableQueues["default"]?.length) return tableQueues["default"].shift()!;
  return { data: null, error: null };
}

function createFluentChain(tableName: string) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.single = vi.fn(() => {
    const next = shiftResponse(tableName);
    return Promise.resolve(next);
  });
  chain.insert = vi.fn((rows: unknown) => {
    insertCalls.push({ table: tableName, rows });
    const next = shiftResponse(tableName);
    const insertChain: Record<string, unknown> = { ...next };
    insertChain.select = vi.fn(() => insertChain);
    insertChain.single = vi.fn(() => Promise.resolve(next));
    return insertChain;
  });
  return chain;
}

const mockFrom = vi.fn((table: string) => createFluentChain(table));

vi.mock("../../../scripts/igdb-import/shared/supabase-client", () => ({
  createScriptClient: () => ({ from: mockFrom }),
}));

vi.mock("../../../src/lib/services/igdbService", () => ({
  IGDBService: {
    buildImageUrl: vi.fn(() => "https://img.example.com/mock.jpg"),
  },
}));

vi.mock("../../../scripts/igdb-import/shared/color-extractor", () => ({
  extractColorsFromCover: vi.fn().mockResolvedValue(null),
}));

const { importCharacterFromIGDB, ensureGender, ensureSpecies } =
  await import("../../../scripts/igdb-import/characters/character-importer");

const CHAR_UUID = "char-uuid-001";
const CHAR_SLUG = "mario";
const GENDER_UUID = "gender-uuid-001";
const SPECIES_UUID = "species-uuid-001";

function makeIgdbCharacter(overrides: Partial<IGDBCharacter> = {}): IGDBCharacter {
  return { id: 100, name: "Mario", slug: CHAR_SLUG, ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Clear all table queues
  for (const key of Object.keys(tableQueues)) delete tableQueues[key];
  insertCalls = [];
});

describe("ensureGender", () => {
  it("returns null when igdbGender is undefined", async () => {
    const result = await ensureGender(undefined);
    expect(result).toBeNull();
    expect(insertCalls).toHaveLength(0);
  });

  it("creates gender and translation when not existing", async () => {
    pushResponse("genders", { data: null, error: { code: "PGRST116" } }); // not found
    pushResponse("genders", { data: { id: GENDER_UUID }, error: null }); // insert gender
    pushResponse("gender_translations", { data: null, error: null }); // insert translation

    const result = await ensureGender({ id: 1, name: "Male" });
    expect(result).toBe(GENDER_UUID);

    const genderInserts = insertCalls.filter((c) => c.table === "genders");
    expect(genderInserts).toHaveLength(1);
    expect(genderInserts[0].rows).toMatchObject({ slug: "male", igdb_id: 1 });

    const translationInserts = insertCalls.filter((c) => c.table === "gender_translations");
    expect(translationInserts).toHaveLength(1);
    expect(translationInserts[0].rows).toMatchObject({
      gender_id: GENDER_UUID,
      language_code: "en",
      name: "Male",
    });
  });

  it("returns existing gender ID when already in DB", async () => {
    pushResponse("genders", { data: { id: GENDER_UUID }, error: null }); // found

    const result = await ensureGender({ id: 1, name: "Male" });
    expect(result).toBe(GENDER_UUID);
    expect(insertCalls.filter((c) => c.table === "genders")).toHaveLength(0);
  });

  it("returns null on insert failure", async () => {
    pushResponse("genders", { data: null, error: { code: "PGRST116" } }); // not found
    pushResponse("genders", { data: null, error: { message: "duplicate" } }); // insert fails

    const result = await ensureGender({ id: 1, name: "Male" });
    expect(result).toBeNull();
  });
});

describe("ensureSpecies", () => {
  it("returns null when igdbSpecies is undefined", async () => {
    const result = await ensureSpecies(undefined);
    expect(result).toBeNull();
  });

  it("creates species and translation when not existing", async () => {
    pushResponse("species", { data: null, error: { code: "PGRST116" } });
    pushResponse("species", { data: { id: SPECIES_UUID }, error: null });
    pushResponse("species_translations", { data: null, error: null });

    const result = await ensureSpecies({ id: 10, name: "Human" });
    expect(result).toBe(SPECIES_UUID);

    const speciesInserts = insertCalls.filter((c) => c.table === "species");
    expect(speciesInserts).toHaveLength(1);
    expect(speciesInserts[0].rows).toMatchObject({ slug: "human", igdb_id: 10 });
  });

  it("returns existing species ID when already in DB", async () => {
    pushResponse("species", { data: { id: SPECIES_UUID }, error: null });

    const result = await ensureSpecies({ id: 10, name: "Human" });
    expect(result).toBe(SPECIES_UUID);
    expect(insertCalls.filter((c) => c.table === "species")).toHaveLength(0);
  });
});

describe("importCharacterFromIGDB with gender/species", () => {
  it("imports character with gender and species FKs (Req 7.1, 7.2, 7.4)", async () => {
    // character check → not found
    pushResponse("characters", { data: null, error: { code: "PGRST116" } });
    // ensureGender: not found → create
    pushResponse("genders", { data: null, error: { code: "PGRST116" } });
    pushResponse("genders", { data: { id: GENDER_UUID }, error: null });
    pushResponse("gender_translations", { data: null, error: null });
    // ensureSpecies: not found → create
    pushResponse("species", { data: null, error: { code: "PGRST116" } });
    pushResponse("species", { data: { id: SPECIES_UUID }, error: null });
    pushResponse("species_translations", { data: null, error: null });
    // insert character
    pushResponse("characters", { data: { id: CHAR_UUID, slug: CHAR_SLUG }, error: null });
    // createTranslation
    pushResponse("character_translations", { data: null, error: null });

    const igdbChar = makeIgdbCharacter({
      character_gender: { id: 1, name: "Male" },
      character_species: { id: 10, name: "Human" },
    });

    const result = await importCharacterFromIGDB(igdbChar, false);
    expect(result.success).toBe(true);
    expect(result.characterSlug).toBe(CHAR_SLUG);

    const charInserts = insertCalls.filter((c) => c.table === "characters");
    expect(charInserts).toHaveLength(1);
    const charRow = charInserts[0].rows as Record<string, unknown>;
    expect(charRow.gender_id).toBe(GENDER_UUID);
    expect(charRow.species_id).toBe(SPECIES_UUID);
  });

  it("imports character without gender/species — FKs are NULL (Req 7.5)", async () => {
    // character check → not found
    pushResponse("characters", { data: null, error: { code: "PGRST116" } });
    // insert character (no ensureGender/ensureSpecies calls since both undefined)
    pushResponse("characters", { data: { id: CHAR_UUID, slug: CHAR_SLUG }, error: null });
    // createTranslation
    pushResponse("character_translations", { data: null, error: null });

    const result = await importCharacterFromIGDB(makeIgdbCharacter(), false);
    expect(result.success).toBe(true);

    const charInserts = insertCalls.filter((c) => c.table === "characters");
    const charRow = charInserts[0].rows as Record<string, unknown>;
    expect(charRow.gender_id).toBeNull();
    expect(charRow.species_id).toBeNull();
  });

  it("handles gender upsert failure gracefully — FK stays NULL (Req 7.5)", async () => {
    // character check → not found
    pushResponse("characters", { data: null, error: { code: "PGRST116" } });
    // ensureGender: not found → insert fails
    pushResponse("genders", { data: null, error: { code: "PGRST116" } });
    pushResponse("genders", { data: null, error: { message: "db error" } });
    // ensureSpecies: not found → create OK
    pushResponse("species", { data: null, error: { code: "PGRST116" } });
    pushResponse("species", { data: { id: SPECIES_UUID }, error: null });
    pushResponse("species_translations", { data: null, error: null });
    // insert character
    pushResponse("characters", { data: { id: CHAR_UUID, slug: CHAR_SLUG }, error: null });
    // createTranslation
    pushResponse("character_translations", { data: null, error: null });

    const igdbChar = makeIgdbCharacter({
      character_gender: { id: 1, name: "Male" },
      character_species: { id: 10, name: "Human" },
    });

    const result = await importCharacterFromIGDB(igdbChar, false);
    expect(result.success).toBe(true);

    const charInserts = insertCalls.filter((c) => c.table === "characters");
    const charRow = charInserts[0].rows as Record<string, unknown>;
    expect(charRow.gender_id).toBeNull();
    expect(charRow.species_id).toBe(SPECIES_UUID);
  });

  it("reuses existing gender/species on idempotent import (Req 7.3)", async () => {
    // character check → not found
    pushResponse("characters", { data: null, error: { code: "PGRST116" } });
    // ensureGender: found existing
    pushResponse("genders", { data: { id: GENDER_UUID }, error: null });
    // ensureSpecies: found existing
    pushResponse("species", { data: { id: SPECIES_UUID }, error: null });
    // insert character
    pushResponse("characters", { data: { id: CHAR_UUID, slug: CHAR_SLUG }, error: null });
    // createTranslation
    pushResponse("character_translations", { data: null, error: null });

    const igdbChar = makeIgdbCharacter({
      character_gender: { id: 1, name: "Male" },
      character_species: { id: 10, name: "Human" },
    });

    const result = await importCharacterFromIGDB(igdbChar, false);
    expect(result.success).toBe(true);

    // No inserts into genders or species tables (reused existing)
    expect(insertCalls.filter((c) => c.table === "genders")).toHaveLength(0);
    expect(insertCalls.filter((c) => c.table === "species")).toHaveLength(0);

    const charRow = insertCalls.filter((c) => c.table === "characters")[0].rows as Record<
      string,
      unknown
    >;
    expect(charRow.gender_id).toBe(GENDER_UUID);
    expect(charRow.species_id).toBe(SPECIES_UUID);
  });
});
