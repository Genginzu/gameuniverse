import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import type { IGDBCharacter } from "../../../src/types/igdb";

/**
 * Property tests for character importer gender/species handling.
 * Feature: character-genders-species, Property 6 & 7
 */

// --- Fluent mock Supabase client ---

let responseQueue: Array<{ data: unknown; error: unknown }> = [];
let insertCalls: Array<{ table: string; rows: unknown }> = [];

function createFluentChain(tableName: string) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.single = vi.fn(() => {
    const next = responseQueue.shift() ?? { data: null, error: null };
    return Promise.resolve(next);
  });
  chain.insert = vi.fn((rows: unknown) => {
    insertCalls.push({ table: tableName, rows });
    const next = responseQueue.shift() ?? { data: null, error: null };
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

// --- Arbitraries ---

const igdbGenderArb = fc.record({
  id: fc.integer({ min: 1, max: 99999 }),
  name: fc.stringMatching(/^[A-Za-z][A-Za-z ]{0,19}$/),
});

const igdbSpeciesArb = fc.record({
  id: fc.integer({ min: 1, max: 99999 }),
  name: fc.stringMatching(/^[A-Za-z][A-Za-z ]{0,19}$/),
});

const CHAR_UUID = "char-uuid-001";
const CHAR_SLUG = "test-char";
const GENDER_UUID = "gender-uuid-001";
const SPECIES_UUID = "species-uuid-001";

function makeIgdbCharacter(overrides: Partial<IGDBCharacter> = {}): IGDBCharacter {
  return {
    id: 1000,
    name: "Test Character",
    slug: CHAR_SLUG,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  responseQueue = [];
  insertCalls = [];
});

// Feature: character-genders-species, Property 6: Importer creates gender/species and assigns correct FKs
describe("Property 6: Importer creates gender/species and assigns correct FKs", () => {
  it("should create gender/species and pass FKs to character insert", async () => {
    await fc.assert(
      fc.asyncProperty(igdbGenderArb, igdbSpeciesArb, async (gender, species) => {
        vi.clearAllMocks();
        responseQueue = [];
        insertCalls = [];

        // character check → not found
        responseQueue.push({ data: null, error: { code: "PGRST116" } });
        // ensureGender: check existing → not found
        responseQueue.push({ data: null, error: { code: "PGRST116" } });
        // ensureGender: insert gender → success
        responseQueue.push({ data: { id: GENDER_UUID }, error: null });
        // ensureGender: insert gender_translations → success
        responseQueue.push({ data: null, error: null });
        // ensureSpecies: check existing → not found
        responseQueue.push({ data: null, error: { code: "PGRST116" } });
        // ensureSpecies: insert species → success
        responseQueue.push({ data: { id: SPECIES_UUID }, error: null });
        // ensureSpecies: insert species_translations → success
        responseQueue.push({ data: null, error: null });
        // insert character → success
        responseQueue.push({ data: { id: CHAR_UUID, slug: CHAR_SLUG }, error: null });
        // createTranslation → success
        responseQueue.push({ data: null, error: null });

        const igdbChar = makeIgdbCharacter({
          character_gender: gender,
          character_species: species,
        });

        const result = await importCharacterFromIGDB(igdbChar, false);
        expect(result.success).toBe(true);

        // Verify gender was inserted with correct slug
        const genderInserts = insertCalls.filter((c) => c.table === "genders");
        expect(genderInserts).toHaveLength(1);
        const genderRow = genderInserts[0].rows as Record<string, unknown>;
        expect(genderRow.igdb_id).toBe(gender.id);
        expect(genderRow.slug).toBe(gender.name.toLowerCase().replace(/\s+/g, "-"));

        // Verify species was inserted with correct slug
        const speciesInserts = insertCalls.filter((c) => c.table === "species");
        expect(speciesInserts).toHaveLength(1);
        const speciesRow = speciesInserts[0].rows as Record<string, unknown>;
        expect(speciesRow.igdb_id).toBe(species.id);

        // Verify character insert includes gender_id and species_id
        const charInserts = insertCalls.filter((c) => c.table === "characters");
        expect(charInserts).toHaveLength(1);
        const charRow = charInserts[0].rows as Record<string, unknown>;
        expect(charRow).toHaveProperty("gender_id", GENDER_UUID);
        expect(charRow).toHaveProperty("species_id", SPECIES_UUID);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 7.5**
   * When IGDB character has no gender/species, FKs should be NULL.
   */
  it("should leave FKs NULL when IGDB character has no gender/species", async () => {
    // character check → not found
    responseQueue.push({ data: null, error: { code: "PGRST116" } });
    // insert character → success
    responseQueue.push({ data: { id: CHAR_UUID, slug: CHAR_SLUG }, error: null });
    // createTranslation → success
    responseQueue.push({ data: null, error: null });

    const igdbChar = makeIgdbCharacter();
    const result = await importCharacterFromIGDB(igdbChar, false);

    expect(result.success).toBe(true);
    const charInserts = insertCalls.filter((c) => c.table === "characters");
    expect(charInserts).toHaveLength(1);
    const charRow = charInserts[0].rows as Record<string, unknown>;
    expect(charRow).toHaveProperty("gender_id", null);
    expect(charRow).toHaveProperty("species_id", null);
  });
});

// Feature: character-genders-species, Property 7: Importer gender/species upsert is idempotent
describe("Property 7: Importer gender/species upsert is idempotent", () => {
  /**
   * **Validates: Requirements 7.3**
   * Importing the same igdb_id twice should reuse the existing row.
   */
  it("ensureGender returns existing ID when gender already exists by igdb_id", async () => {
    await fc.assert(
      fc.asyncProperty(igdbGenderArb, async (gender) => {
        vi.clearAllMocks();
        responseQueue = [];
        insertCalls = [];

        // First call: not found → create
        responseQueue.push({ data: null, error: { code: "PGRST116" } });
        responseQueue.push({ data: { id: GENDER_UUID }, error: null });
        responseQueue.push({ data: null, error: null }); // translation

        const id1 = await ensureGender(gender, false);
        expect(id1).toBe(GENDER_UUID);

        // Second call: found → reuse
        responseQueue.push({ data: { id: GENDER_UUID }, error: null });

        const id2 = await ensureGender(gender, false);
        expect(id2).toBe(GENDER_UUID);

        // Only one insert into genders table (from first call)
        const genderInserts = insertCalls.filter((c) => c.table === "genders");
        expect(genderInserts).toHaveLength(1);
      }),
      { numRuns: 100 }
    );
  });

  it("ensureSpecies returns existing ID when species already exists by igdb_id", async () => {
    await fc.assert(
      fc.asyncProperty(igdbSpeciesArb, async (species) => {
        vi.clearAllMocks();
        responseQueue = [];
        insertCalls = [];

        // First call: not found → create
        responseQueue.push({ data: null, error: { code: "PGRST116" } });
        responseQueue.push({ data: { id: SPECIES_UUID }, error: null });
        responseQueue.push({ data: null, error: null }); // translation

        const id1 = await ensureSpecies(species, false);
        expect(id1).toBe(SPECIES_UUID);

        // Second call: found → reuse
        responseQueue.push({ data: { id: SPECIES_UUID }, error: null });

        const id2 = await ensureSpecies(species, false);
        expect(id2).toBe(SPECIES_UUID);

        // Only one insert into species table
        const speciesInserts = insertCalls.filter((c) => c.table === "species");
        expect(speciesInserts).toHaveLength(1);
      }),
      { numRuns: 100 }
    );
  });
});
