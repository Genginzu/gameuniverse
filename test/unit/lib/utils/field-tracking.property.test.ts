import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  detectChangedFields,
  TRACKABLE_FIELDS,
  upsertFieldOverrides,
  type CurrentGameData,
  type SupabaseClientLike,
} from "../../../../src/lib/utils/field-tracking";
import type { AdminGameFormData } from "../../../../src/lib/validations/admin-game-form";
import type { TrackableField } from "../../../../src/types/admin-games";

// =============================================================================
// Generators
// =============================================================================

const validUrl = () => fc.webUrl();
const optionalUrl = () => fc.oneof(fc.constant(""), validUrl());
const optionalDate = () =>
  fc.oneof(
    fc.constant(""),
    fc.integer({ min: 1970, max: 2030 }).chain((year) =>
      fc.integer({ min: 1, max: 12 }).chain((month) =>
        fc.integer({ min: 1, max: 28 }).map((day) => {
          const m = String(month).padStart(2, "0");
          const d = String(day).padStart(2, "0");
          return `${year}-${m}-${d}`;
        })
      )
    )
  );
const optionalMetascore = () => fc.oneof(fc.constant(null), fc.integer({ min: 0, max: 100 }));
const optionalPlaytime = () => fc.oneof(fc.constant(null), fc.integer({ min: 0, max: 500 }));

const translationGen = () =>
  fc.record({
    language_code: fc.constantFrom("fr", "en"),
    title: fc.string({ minLength: 0, maxLength: 50 }),
    description: fc.string({ minLength: 0, maxLength: 100 }),
  });

const genreGen = () => fc.record({ genre_id: fc.uuid() });

const companyGen = () =>
  fc.record({
    company_id: fc.uuid(),
    role: fc.constantFrom("developer" as const, "publisher" as const),
    is_primary: fc.boolean(),
  });

const screenshotGen = () =>
  fc.record({
    url: validUrl(),
    alt_text: fc.constant(""),
    caption: fc.constant(""),
    display_order: fc.constant(0),
    is_featured: fc.constant(false),
  });

const artworkGen = () =>
  fc.record({
    url: validUrl(),
    alt_text: fc.constant(""),
    caption: fc.constant(""),
    artwork_type: fc.constant(""),
    display_order: fc.constant(0),
    is_featured: fc.constant(false),
  });

const ageRatingGen = () =>
  fc.record({
    rating_id: fc.uuid(),
    is_primary: fc.boolean(),
    content_descriptors: fc.array(fc.uuid(), { minLength: 0, maxLength: 2 }),
  });

const versionGen = () =>
  fc.record({
    version_title: fc.string({ minLength: 1, maxLength: 50 }),
    description: fc.oneof(fc.constant(""), fc.string({ minLength: 1, maxLength: 100 })),
  });

const languageGen = () =>
  fc.record({
    language_code: fc.stringMatching(/^[a-z]{2,5}$/),
    language_name: fc.string({ minLength: 1, maxLength: 50 }),
    has_audio: fc.boolean(),
    has_subtitles: fc.boolean(),
    has_interface: fc.boolean(),
  });

const gameDataGen = () =>
  fc.record({
    cover_image_url: optionalUrl(),
    background_image_url: optionalUrl(),
    release_date: optionalDate(),
    metascore: optionalMetascore(),
    playtime_hastily: optionalPlaytime(),
    playtime_normally: optionalPlaytime(),
    playtime_completely: optionalPlaytime(),
    translations: fc.array(translationGen(), { minLength: 1, maxLength: 2 }),
    genres: fc.array(genreGen(), { minLength: 1, maxLength: 3 }),
    companies: fc.array(companyGen(), { minLength: 1, maxLength: 3 }),
    screenshots: fc.array(screenshotGen(), { minLength: 0, maxLength: 3 }),
    artwork: fc.array(artworkGen(), { minLength: 0, maxLength: 3 }),
    age_ratings: fc.array(ageRatingGen(), { minLength: 0, maxLength: 2 }),
    versions: fc.array(versionGen(), { minLength: 0, maxLength: 2 }),
    languages: fc.array(languageGen(), { minLength: 0, maxLength: 3 }),
    game_platforms: fc.array(fc.record({ platform_id: fc.uuid() }), {
      minLength: 0,
      maxLength: 3,
    }),
  });

// =============================================================================
// Helpers
// =============================================================================

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

type GameDataShape = ReturnType<typeof gameDataGen> extends fc.Arbitrary<infer T> ? T : never;

function toCurrentData(data: GameDataShape): CurrentGameData {
  return deepClone(data);
}

function toSubmittedData(data: GameDataShape): AdminGameFormData {
  return deepClone({ ...data, slug: "" }) as AdminGameFormData;
}

/** Applique une modification garantie a un champ specifique */
function applyFieldChange(data: AdminGameFormData, field: string): void {
  switch (field) {
    case "translations":
      data.translations[0].title = (data.translations[0].title ?? "") + "_changed";
      break;
    case "cover_image":
      data.cover_image_url = (data.cover_image_url ?? "") + "_changed";
      break;
    case "background_image":
      data.background_image_url = (data.background_image_url ?? "") + "_changed";
      break;
    case "release_date":
      data.release_date = data.release_date === "2020-01-01" ? "2021-06-15" : "2020-01-01";
      break;
    case "metascore":
      data.metascore = ((data.metascore as number) ?? 50) === 99 ? 1 : 99;
      break;
    case "genres":
      data.genres = [{ genre_id: "00000000-0000-0000-0000-000000000099" }];
      break;
    case "companies":
      data.companies = [
        { company_id: "00000000-0000-0000-0000-000000000099", role: "developer", is_primary: true },
      ];
      break;
    case "screenshots":
      data.screenshots = [
        {
          url: "https://changed.test/s.png",
          alt_text: "",
          caption: "",
          display_order: 0,
          is_featured: false,
        },
      ];
      break;
    case "artworks":
      data.artwork = [
        {
          url: "https://changed.test/a.png",
          alt_text: "",
          caption: "",
          artwork_type: "",
          display_order: 0,
          is_featured: false,
        },
      ];
      break;
    case "age_ratings":
      data.age_ratings = [
        {
          rating_id: "00000000-0000-0000-0000-000000000099",
          is_primary: true,
          content_descriptors: [],
        },
      ];
      break;
    case "versions":
      data.versions = [{ version_title: "Changed Edition", description: "" }];
      break;
    case "languages":
      data.languages = [
        {
          language_code: "zz",
          language_name: "Changed",
          has_audio: true,
          has_subtitles: true,
          has_interface: true,
        },
      ];
      break;
    case "playtime":
      data.playtime_hastily = ((data.playtime_hastily as number) ?? 10) === 999 ? 1 : 999;
      break;
    case "platforms":
      (data as Record<string, unknown>).game_platforms = [
        { platform_id: "00000000-0000-0000-0000-000000000099" },
      ];
      break;
  }
}

// =============================================================================
// Property 1 : Detection des modifications de champs
// Feature: igdb-field-tracking, Property 1: Detection des modifications de champs
// **Validates: Requirements 1.1, 1.2**
// =============================================================================

describe("Property 1: Detection des modifications de champs", () => {
  it("donnees identiques -> aucun champ modifie detecte", () => {
    fc.assert(
      fc.property(gameDataGen(), (gameData) => {
        const current = toCurrentData(gameData);
        const submitted = toSubmittedData(gameData);
        const changed = detectChangedFields(current, submitted);
        expect(changed).toEqual([]);
      }),
      { numRuns: 30 }
    );
  });

  it("chaque champ retourne est un TrackableField valide et sans doublons", () => {
    fc.assert(
      fc.property(gameDataGen(), gameDataGen(), (currentRaw, submittedRaw) => {
        const current = toCurrentData(currentRaw);
        const submitted = toSubmittedData(submittedRaw);
        const changed = detectChangedFields(current, submitted);

        for (const field of changed) {
          expect(TRACKABLE_FIELDS).toContain(field);
        }
        expect(new Set(changed).size).toBe(changed.length);
      }),
      { numRuns: 30 }
    );
  });

  it("modifier un seul champ produit un resultat contenant ce champ", () => {
    // "videos" is not detectable via admin form (no form field for videos)
    const formComparableFields = TRACKABLE_FIELDS.filter((f) => f !== "videos");
    fc.assert(
      fc.property(
        gameDataGen(),
        fc.constantFrom(...formComparableFields),
        (gameData, fieldToChange) => {
          const current = toCurrentData(gameData);
          const submitted = toSubmittedData(gameData);
          applyFieldChange(submitted, fieldToChange);
          const changed = detectChangedFields(current, submitted);
          expect(changed).toContain(fieldToChange);
        }
      ),
      { numRuns: 30 }
    );
  });
});

// =============================================================================
// Property 2 : Idempotence de l'upsert des overrides
// Feature: igdb-field-tracking, Property 2: Idempotence de l'upsert des overrides
// **Validates: Requirements 1.3, 5.2**

/** Cree un mock Supabase qui stocke les rows en memoire et simule l'upsert */
function createMockSupabase() {
  const store: Map<
    string,
    { game_id: string; field_name: string; modified_by: string | null; modified_at: string }
  > = new Map();

  const client: SupabaseClientLike = {
    from: (_table: string) => ({
      upsert: (
        rows: Array<{
          game_id: string;
          field_name: string;
          modified_by: string | null;
          modified_at: string;
        }>,
        _options?: { onConflict: string }
      ) => {
        // Simule l'upsert : cle = game_id + field_name
        for (const row of rows) {
          store.set(`${row.game_id}:${row.field_name}`, { ...row });
        }
        return {
          select: () => Promise.resolve({ data: rows, error: null }),
        };
      },
    }),
  };

  return { client, store };
}

describe("Property 2: Idempotence de l'upsert des overrides", () => {
  it("un double upsert produit exactement une entree par (game_id, field_name)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.subarray([...TRACKABLE_FIELDS] as TrackableField[], { minLength: 1 }),
        fc.oneof(fc.uuid(), fc.constant(null)),
        async (gameId, fields, userId) => {
          const { client, store } = createMockSupabase();

          // Premier upsert
          await upsertFieldOverrides(client, gameId, fields, userId);
          const countAfterFirst = store.size;

          // Deuxieme upsert (memes donnees)
          await upsertFieldOverrides(client, gameId, fields, userId);
          const countAfterSecond = store.size;

          // Le nombre d'entrees ne doit pas changer
          expect(countAfterSecond).toBe(countAfterFirst);
          expect(countAfterSecond).toBe(fields.length);
        }
      ),
      { numRuns: 30 }
    );
  });

  it("l'upsert met a jour modified_at sans creer de doublon", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.constantFrom(...TRACKABLE_FIELDS),
        fc.oneof(fc.uuid(), fc.constant(null)),
        async (gameId, field, userId) => {
          const { client, store } = createMockSupabase();

          await upsertFieldOverrides(client, gameId, [field], userId);
          const firstDate = store.get(`${gameId}:${field}`)?.modified_at;

          // Second upsert — timestamp is always >= first (same ms is valid)
          await upsertFieldOverrides(client, gameId, [field], userId);
          const secondDate = store.get(`${gameId}:${field}`)?.modified_at;

          // Une seule entree, date mise a jour
          expect(store.size).toBe(1);
          expect(secondDate).toBeDefined();
          expect(new Date(secondDate!).getTime()).toBeGreaterThanOrEqual(
            new Date(firstDate!).getTime()
          );
        }
      ),
      { numRuns: 50 }
    );
  });

  it("un upsert avec un tableau vide ne cree aucune entree", async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), fc.uuid(), async (gameId, userId) => {
        const { client, store } = createMockSupabase();
        await upsertFieldOverrides(client, gameId, [], userId);
        expect(store.size).toBe(0);
      }),
      { numRuns: 30 }
    );
  });
});
