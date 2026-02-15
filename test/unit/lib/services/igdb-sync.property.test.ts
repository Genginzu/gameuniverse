import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";
import * as fc from "fast-check";
import type { TrackableField } from "../../../../src/types/admin-games";
import type { IGDBGame } from "../../../../src/types/igdb";
import { TRACKABLE_FIELDS } from "../../../../src/lib/utils/field-tracking";
import {
  syncAllGameFields,
  syncGameField,
  type SyncSupabaseClient,
} from "../../../../src/lib/services/igdb-sync";
import { IGDBService } from "../../../../src/lib/services/igdbService";

// =============================================================================
// Generators
// =============================================================================

const igdbGameGen = (): fc.Arbitrary<IGDBGame> =>
  fc.record({
    id: fc.integer({ min: 1, max: 999999 }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    slug: fc.string({ minLength: 1, maxLength: 50 }).map(
      (s) =>
        s
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .slice(0, 50) || "game"
    ),
    summary: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
    first_release_date: fc.option(fc.integer({ min: 0, max: 2000000000 }), { nil: undefined }),
    cover: fc.option(fc.record({ image_id: fc.string({ minLength: 3, maxLength: 15 }) }), {
      nil: undefined,
    }),
    screenshots: fc.option(
      fc.array(fc.record({ image_id: fc.string({ minLength: 3, maxLength: 15 }) }), {
        minLength: 0,
        maxLength: 3,
      }),
      { nil: undefined }
    ),
    artworks: fc.option(
      fc.array(fc.record({ image_id: fc.string({ minLength: 3, maxLength: 15 }) }), {
        minLength: 0,
        maxLength: 3,
      }),
      { nil: undefined }
    ),
    genres: fc.option(
      fc.array(
        fc.record({
          id: fc.integer({ min: 1, max: 100 }),
          name: fc.string({ minLength: 1, maxLength: 30 }),
          slug: fc
            .string({ minLength: 1, maxLength: 30 })
            .map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, "-") || "genre"),
        }),
        { minLength: 0, maxLength: 3 }
      ),
      { nil: undefined }
    ),
    involved_companies: fc.option(
      fc.array(
        fc.record({
          company: fc.record({
            id: fc.integer({ min: 1, max: 99999 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            slug: fc
              .string({ minLength: 1, maxLength: 50 })
              .map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, "-") || "company"),
          }),
          developer: fc.boolean(),
          publisher: fc.boolean(),
        }),
        { minLength: 0, maxLength: 3 }
      ),
      { nil: undefined }
    ),
    aggregated_rating: fc.option(fc.float({ min: 0, max: 100 }), { nil: undefined }),
  });

// =============================================================================
// Mock Supabase client that tracks which tables were written to
// =============================================================================

/**
 * Chaque champ synchronisable écrit dans une ou plusieurs tables spécifiques.
 * Ce mapping permet de vérifier quels champs ont été effectivement synchronisés.
 */
const FIELD_TO_TABLES: Record<TrackableField, string[]> = {
  translations: ["game_translations"],
  cover_image: ["games"],
  background_image: ["games"],
  release_date: ["games"],
  metascore: ["games"],
  genres: ["game_genres"],
  companies: ["game_companies"],
  screenshots: ["game_screenshots"],
  artworks: ["game_artwork"],
  age_ratings: ["game_ratings"],
  versions: ["game_versions"],
  languages: ["game_languages", "supported_languages"],
  playtime: ["games"],
};

/**
 * Tables qui sont écrites par les champs "directs" (cover, background, release_date, metascore, playtime).
 * Comme ils partagent la table "games", on ne peut pas distinguer lequel a écrit.
 * On les regroupe pour la vérification.
 */
const DIRECT_GAME_FIELDS: TrackableField[] = [
  "cover_image",
  "background_image",
  "release_date",
  "metascore",
  "playtime",
];

/** Tables spécifiques à un seul champ (pas "games" qui est partagé) */
const UNIQUE_TABLE_FIELDS: TrackableField[] = TRACKABLE_FIELDS.filter(
  (f) => !DIRECT_GAME_FIELDS.includes(f)
) as TrackableField[];

interface MockCallLog {
  table: string;
  operation: "update" | "delete" | "insert" | "upsert" | "select";
}

function createTrackingSupabase() {
  const calls: MockCallLog[] = [];
  const deletedOverrides: string[] = [];

  const noopResult = { data: null, error: null };
  const noopPromise = () => Promise.resolve(noopResult);

  const client: SyncSupabaseClient = {
    from: (table: string) => ({
      update: (data: Record<string, unknown>) => {
        calls.push({ table, operation: "update" });
        return {
          eq: () => Promise.resolve({ error: null }),
        };
      },
      delete: () => {
        calls.push({ table, operation: "delete" });
        return {
          eq: (_col: string, val: string) => {
            // Track override deletions
            if (table === "game_field_overrides") {
              return {
                eq: (_col2: string, fieldName: string) => {
                  deletedOverrides.push(fieldName);
                  return Promise.resolve({ error: null });
                },
                in: (_col2: string, fieldNames: string[]) => {
                  deletedOverrides.push(...fieldNames);
                  return Promise.resolve({ error: null });
                },
              };
            }
            return {
              eq: () => Promise.resolve({ error: null }),
              in: () => Promise.resolve({ error: null }),
            };
          },
        };
      },
      insert: (_data: Record<string, unknown> | Record<string, unknown>[]) => {
        calls.push({ table, operation: "insert" });
        return {
          select: () => ({
            single: () => Promise.resolve({ data: { id: "mock-id" }, error: null }),
          }),
        };
      },
      upsert: (_data: unknown, _opts?: unknown) => {
        calls.push({ table, operation: "upsert" });
        return Promise.resolve({ error: null });
      },
      select: (_cols?: string) => {
        calls.push({ table, operation: "select" });
        return {
          eq: (_col: string, _val: string | number) => ({
            single: () => Promise.resolve({ data: { id: "mock-id" }, error: null }),
            eq: (_col2: string, _val2: string) => ({
              single: () => Promise.resolve({ data: { id: "mock-id" }, error: null }),
            }),
          }),
          in: () => Promise.resolve({ data: [], error: null }),
        };
      },
    }),
  };

  return { client, calls, deletedOverrides };
}

// =============================================================================
// Property 3 : La synchronisation respecte les overrides
// Feature: igdb-field-tracking, Property 3: La synchronisation respecte les overrides
// **Validates: Requirements 2.2, 2.3**
// =============================================================================

describe("Property 3: La synchronisation respecte les overrides", () => {
  let getGameDetailsSpy: ReturnType<typeof spyOn>;
  let getTimeToBeatSpy: ReturnType<typeof spyOn>;
  let getGameVersionsSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    // Mock les appels IGDB pour éviter les vrais appels réseau
    getGameDetailsSpy = spyOn(IGDBService, "getGameDetails");
    getTimeToBeatSpy = spyOn(IGDBService, "getTimeToBeat");
    getGameVersionsSpy = spyOn(IGDBService, "getGameVersions");

    getTimeToBeatSpy.mockResolvedValue({
      game_id: 1,
      hastily: 3600,
      normally: 7200,
      completely: 14400,
      count: 10,
    });
    getGameVersionsSpy.mockResolvedValue([]);
  });

  afterEach(() => {
    getGameDetailsSpy.mockRestore();
    getTimeToBeatSpy.mockRestore();
    getGameVersionsSpy.mockRestore();
  });

  it("les champs overridés ne sont pas synchronisés, les autres le sont", async () => {
    await fc.assert(
      fc.asyncProperty(
        igdbGameGen(),
        fc.uuid(),
        // Générer un sous-ensemble non-vide de champs à protéger (overrides)
        fc.subarray([...TRACKABLE_FIELDS] as TrackableField[], { minLength: 1 }),
        async (igdbGame, gameId, overriddenFields) => {
          getGameDetailsSpy.mockResolvedValue(igdbGame);

          const { client, calls } = createTrackingSupabase();
          const result = await syncAllGameFields(client, gameId, igdbGame.id, overriddenFields);

          expect(result.success).toBe(true);

          // Les champs synchronisés ne doivent PAS inclure les champs overridés
          const overrideSet = new Set(overriddenFields);
          for (const syncedField of result.syncedFields) {
            expect(overrideSet.has(syncedField)).toBe(false);
          }

          // Les champs NON overridés doivent être dans syncedFields
          const expectedSynced = TRACKABLE_FIELDS.filter((f) => !overrideSet.has(f));
          expect(result.syncedFields).toEqual(expectedSynced);

          // Vérifier qu'aucune écriture n'a été faite pour les tables
          // spécifiques aux champs overridés (hors table "games" partagée)
          const writtenTables = new Set(
            calls.filter((c) => c.operation !== "select").map((c) => c.table)
          );

          for (const overriddenField of overriddenFields) {
            // Ne vérifier que les champs avec des tables uniques
            if (UNIQUE_TABLE_FIELDS.includes(overriddenField)) {
              const expectedTables = FIELD_TO_TABLES[overriddenField];
              for (const table of expectedTables) {
                // Si TOUS les champs qui écrivent dans cette table sont overridés,
                // alors la table ne doit pas avoir été écrite
                const allFieldsForTable = TRACKABLE_FIELDS.filter((f) =>
                  FIELD_TO_TABLES[f].includes(table)
                );
                const allOverridden = allFieldsForTable.every((f) => overrideSet.has(f));
                if (allOverridden) {
                  const writeOps = calls.filter(
                    (c) => c.table === table && c.operation !== "select"
                  );
                  // delete + insert/upsert ne doivent pas apparaître
                  // (sauf le delete initial qui nettoie avant insert)
                  // En fait, si le champ est overridé, la fonction de sync
                  // n'est jamais appelée, donc aucune opération sur cette table
                  expect(writeOps.length).toBe(0);
                }
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =============================================================================
// Property 4 : La synchronisation forcée supprime les overrides
// Feature: igdb-field-tracking, Property 4: La synchronisation forcée supprime les overrides
// **Validates: Requirements 3.5, 4.1**
// =============================================================================

describe("Property 4: La synchronisation forcée supprime les overrides", () => {
  let getGameDetailsSpy: ReturnType<typeof spyOn>;
  let getTimeToBeatSpy: ReturnType<typeof spyOn>;
  let getGameVersionsSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    getGameDetailsSpy = spyOn(IGDBService, "getGameDetails");
    getTimeToBeatSpy = spyOn(IGDBService, "getTimeToBeat");
    getGameVersionsSpy = spyOn(IGDBService, "getGameVersions");

    getTimeToBeatSpy.mockResolvedValue({
      game_id: 1,
      hastily: 3600,
      normally: 7200,
      completely: 14400,
      count: 10,
    });
    getGameVersionsSpy.mockResolvedValue([]);
  });

  afterEach(() => {
    getGameDetailsSpy.mockRestore();
    getTimeToBeatSpy.mockRestore();
    getGameVersionsSpy.mockRestore();
  });

  it("syncAllGameFields sans overriddenFields supprime tous les overrides", async () => {
    await fc.assert(
      fc.asyncProperty(igdbGameGen(), fc.uuid(), async (igdbGame, gameId) => {
        getGameDetailsSpy.mockResolvedValue(igdbGame);

        const { client, deletedOverrides } = createTrackingSupabase();

        // Sync forcée = pas d'overriddenFields
        const result = await syncAllGameFields(client, gameId, igdbGame.id);

        expect(result.success).toBe(true);
        // Tous les champs doivent être synchronisés
        expect(result.syncedFields).toEqual([...TRACKABLE_FIELDS]);

        // Tous les overrides doivent avoir été supprimés
        // (removeOverrides est appelé avec TRACKABLE_FIELDS)
        for (const field of TRACKABLE_FIELDS) {
          expect(deletedOverrides).toContain(field);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("syncGameField supprime l'override du champ synchronisé", async () => {
    await fc.assert(
      fc.asyncProperty(
        igdbGameGen(),
        fc.uuid(),
        fc.constantFrom(...TRACKABLE_FIELDS),
        async (igdbGame, gameId, field) => {
          getGameDetailsSpy.mockResolvedValue(igdbGame);

          const { client, deletedOverrides } = createTrackingSupabase();
          const result = await syncGameField(client, gameId, igdbGame.id, field);

          expect(result.success).toBe(true);
          expect(result.syncedFields).toEqual([field]);

          // L'override de ce champ doit avoir été supprimé
          expect(deletedOverrides).toContain(field);
          // Seul ce champ doit avoir été supprimé
          expect(deletedOverrides.filter((d) => d === field).length).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
