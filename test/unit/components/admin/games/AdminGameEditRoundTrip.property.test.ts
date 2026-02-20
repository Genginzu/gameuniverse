import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  adminGameFormSchema,
  type AdminGameFormData,
} from "../../../../../src/lib/validations/admin-game-form";

// Feature: admin-game-management, Property 4: Round-Trip de Modification
// **Validates: Requirements 5.1, 5.3**
//
// For any existing game, loading its data into the form then saving without
// modification must preserve all data (idempotence property).

// --- Types matching the API response shape ---

interface GameApiResponse {
  id: string;
  slug: string;
  cover_image_url: string | null;
  release_date: string | null;
  translations: Array<{
    language_code: string;
    title: string;
    description: string | null;
  }>;
  genres: Array<{ genre_id: string }>;
  companies: Array<{
    company_id: string;
    role: string;
    is_primary: boolean;
  }>;
}

// --- Conversion function (mirrors the one in the edit page) ---

function toFormData(game: GameApiResponse): AdminGameFormData {
  return {
    slug: game.slug,
    translations: game.translations.map((t) => ({
      language_code: t.language_code,
      title: t.title,
      description: t.description ?? "",
    })),
    cover_image_url: game.cover_image_url ?? "",
    release_date: game.release_date ?? "",
    genres: game.genres.map((g) => ({ genre_id: g.genre_id })),
    companies: game.companies.map((c) => ({
      company_id: c.company_id,
      role: c.role as "developer" | "publisher",
      is_primary: c.is_primary,
    })),
  };
}

// --- Conversion function: form data â†’ API payload (mirrors useGameForm submit) ---

function toApiPayload(data: AdminGameFormData) {
  return {
    game: {
      slug: data.slug,
      cover_image_url: data.cover_image_url || null,
      release_date: data.release_date || null,
    },
    translations: data.translations.map((t) => ({
      language_code: t.language_code,
      title: t.title,
      description: t.description || null,
    })),
    genres: data.genres,
    companies: data.companies,
  };
}

// --- Generators ---

const validSlug = () =>
  fc.stringMatching(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/).filter((s) => s.length >= 2 && s.length <= 255);

const validUuid = () => fc.uuid();

const validDate = () =>
  fc
    .record({
      year: fc.integer({ min: 2000, max: 2030 }),
      month: fc.integer({ min: 1, max: 12 }),
      day: fc.integer({ min: 1, max: 28 }),
    })
    .map(
      ({ year, month, day }) =>
        `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    );

const validTranslation = () =>
  fc.record({
    language_code: fc.constantFrom("fr", "en"),
    title: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    description: fc.oneof(
      fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
      fc.constant(null)
    ),
  });

const validGenre = () => fc.record({ genre_id: validUuid() });

const validCompany = () =>
  fc.record({
    company_id: validUuid(),
    role: fc.constantFrom("developer" as const, "publisher" as const),
    is_primary: fc.boolean(),
  });

const validGameApiResponse = () =>
  fc.record({
    id: validUuid(),
    slug: validSlug(),
    cover_image_url: fc.oneof(fc.webUrl(), fc.constant(null)),
    release_date: fc.oneof(validDate(), fc.constant(null)),
    translations: fc.array(validTranslation(), { minLength: 1, maxLength: 2 }),
    genres: fc.array(validGenre(), { minLength: 1, maxLength: 5 }),
    companies: fc.array(validCompany(), { minLength: 1, maxLength: 3 }),
  });

// --- Tests ---

describe("Property 4: Round-Trip de Modification", () => {
  it("loading game data into form and saving preserves all fields (API â†’ form â†’ API)", () => {
    fc.assert(
      fc.property(validGameApiResponse(), (apiGame) => {
        // Step 1: Convert API response â†’ form data (simulates loading into form)
        const formData = toFormData(apiGame);

        // Step 2: Validate form data passes schema (simulates form submission)
        const parseResult = adminGameFormSchema.safeParse(formData);
        expect(parseResult.success).toBe(true);
        if (!parseResult.success) return;

        // Step 3: Convert form data â†’ API payload (simulates submit)
        const payload = toApiPayload(parseResult.data);

        // Step 4: Verify round-trip preserves all data
        expect(payload.game.slug).toBe(apiGame.slug);
        expect(payload.game.cover_image_url).toBe(apiGame.cover_image_url);
        expect(payload.game.release_date).toBe(apiGame.release_date);

        // Translations preserved
        expect(payload.translations.length).toBe(apiGame.translations.length);
        for (let i = 0; i < apiGame.translations.length; i++) {
          expect(payload.translations[i].language_code).toBe(apiGame.translations[i].language_code);
          expect(payload.translations[i].title).toBe(apiGame.translations[i].title);
          expect(payload.translations[i].description).toBe(apiGame.translations[i].description);
        }

        // Genres preserved
        expect(payload.genres.length).toBe(apiGame.genres.length);
        for (let i = 0; i < apiGame.genres.length; i++) {
          expect(payload.genres[i].genre_id).toBe(apiGame.genres[i].genre_id);
        }

        // Companies preserved
        expect(payload.companies.length).toBe(apiGame.companies.length);
        for (let i = 0; i < apiGame.companies.length; i++) {
          expect(payload.companies[i].company_id).toBe(apiGame.companies[i].company_id);
          expect(payload.companies[i].role).toBe(apiGame.companies[i].role);
          expect(payload.companies[i].is_primary).toBe(apiGame.companies[i].is_primary);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("form data round-trip through schema is idempotent (form â†’ schema â†’ form)", () => {
    fc.assert(
      fc.property(validGameApiResponse(), (apiGame) => {
        const formData = toFormData(apiGame);

        // Parse once
        const first = adminGameFormSchema.safeParse(formData);
        expect(first.success).toBe(true);
        if (!first.success) return;

        // Parse again from the parsed output
        const second = adminGameFormSchema.safeParse(first.data);
        expect(second.success).toBe(true);
        if (!second.success) return;

        // Both parses should produce identical data
        expect(second.data).toEqual(first.data);
      }),
      { numRuns: 100 }
    );
  });
});
