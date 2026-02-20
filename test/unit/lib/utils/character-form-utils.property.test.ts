import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  adminCharacterFormSchema,
  type AdminCharacterFormData,
} from "../../../../src/lib/validations/admin-character-form";
import {
  characterFormToPayload,
  characterPayloadToForm,
} from "../../../../src/lib/utils/character-form-utils";

// =============================================================================
// Property 3: Round-trip serialization (form â†’ payload â†’ form)
// =============================================================================

/**
 * Feature: admin-character-management, Property 3: Round-trip serialization
 *
 * _For any_ valid form data (AdminCharacterFormData), converting to API payload
 * (CharacterPayload) then back to form data MUST produce equivalent data.
 *
 * **Validates: Requirements 5.5**
 */

// --- Generators ---

const validSlug = () =>
  fc.stringMatching(/^[a-z0-9][a-z0-9-]*$/).filter((s) => s.length >= 1 && s.length <= 255);

const validTranslation = () =>
  fc.record({
    language_code: fc.constantFrom("fr", "en"),
    name: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    role: fc.oneof(fc.constant(""), fc.string({ minLength: 1, maxLength: 50 })),
    description: fc.oneof(fc.constant(""), fc.string({ minLength: 1, maxLength: 200 })),
    biography: fc.oneof(fc.constant(""), fc.string({ minLength: 1, maxLength: 200 })),
    weapons: fc.oneof(fc.constant(""), fc.string({ minLength: 1, maxLength: 200 })),
  });

const validHexColor = () =>
  fc.oneof(
    fc.constant(""),
    fc
      .array(fc.constantFrom(..."0123456789abcdef".split("")), {
        minLength: 6,
        maxLength: 6,
      })
      .map((chars) => `#${chars.join("")}`)
  );

const validGame = () =>
  fc.record({
    game_id: fc.uuid(),
    is_primary: fc.boolean(),
  });

const validMedia = () =>
  fc.record({
    type: fc.constantFrom("screenshot" as const, "artwork" as const, "video" as const),
    url: fc.webUrl(),
    thumbnail_url: fc.oneof(fc.constant(""), fc.webUrl()),
    title: fc.oneof(fc.constant(""), fc.string({ minLength: 1, maxLength: 100 })),
    description: fc.oneof(fc.constant(""), fc.string({ minLength: 1, maxLength: 200 })),
    alt_text: fc.oneof(fc.constant(""), fc.string({ minLength: 1, maxLength: 100 })),
    is_featured: fc.boolean(),
    display_order: fc.integer({ min: 0, max: 100 }),
  });

const validRelationship = () =>
  fc.record({
    related_character_id: fc.uuid(),
    relationship_type: fc.constantFrom(
      "ally" as const,
      "enemy" as const,
      "rival" as const,
      "family" as const,
      "romantic" as const,
      "mentor" as const,
      "friend" as const
    ),
    description: fc.oneof(fc.constant(""), fc.string({ minLength: 1, maxLength: 200 })),
  });

const validFormData = () =>
  fc.record({
    slug: validSlug(),
    background_color: validHexColor(),
    main_image_url: fc.oneof(fc.constant(""), fc.webUrl()),
    background_image_url: fc.oneof(fc.constant(""), fc.webUrl()),
    translations: fc.array(validTranslation(), { minLength: 1, maxLength: 2 }),
    games: fc.array(validGame(), { minLength: 0, maxLength: 3 }),
    relationships: fc.array(validRelationship(), { minLength: 0, maxLength: 3 }),
    media: fc.array(validMedia(), { minLength: 0, maxLength: 3 }),
  });

/**
 * Normalise les donnÃ©es de formulaire pour comparaison.
 * Les chaÃ®nes vides et undefined sont Ã©quivalentes pour les champs optionnels
 * aprÃ¨s un round-trip (form â†’ payload â†’ form), car "" â†’ null â†’ "".
 */
function normalizeFormData(data: AdminCharacterFormData): AdminCharacterFormData {
  return {
    slug: data.slug,
    main_image_url: data.main_image_url || "",
    background_image_url: data.background_image_url || "",
    background_color: data.background_color || "",
    translations: data.translations.map((t) => ({
      language_code: t.language_code,
      name: t.name ?? "",
      role: t.role || "",
      description: t.description || "",
      biography: t.biography || "",
      weapons: t.weapons || "",
    })),
    games: data.games ?? [],
    relationships: (data.relationships ?? []).map((r) => ({
      related_character_id: r.related_character_id,
      relationship_type: r.relationship_type,
      description: r.description || "",
    })),
    media: (data.media ?? []).map((m) => ({
      type: m.type,
      url: m.url,
      thumbnail_url: m.thumbnail_url || "",
      title: m.title || "",
      description: m.description || "",
      alt_text: m.alt_text || "",
      is_featured: m.is_featured ?? false,
      display_order: m.display_order ?? 0,
    })),
  };
}

// --- Tests ---

describe("Property 3: Round-trip serialization (form â†” payload)", () => {
  it("form â†’ payload â†’ form produces equivalent data", () => {
    fc.assert(
      fc.property(validFormData(), (formData) => {
        // Validate form data passes schema
        const parseResult = adminCharacterFormSchema.safeParse(formData);
        expect(parseResult.success).toBe(true);
        if (!parseResult.success) return;

        // Round-trip: form â†’ payload â†’ form
        const payload = characterFormToPayload(parseResult.data);
        const roundTripped = characterPayloadToForm(payload);

        // Compare normalized versions (empty string â†” null equivalence)
        const normalizedOriginal = normalizeFormData(parseResult.data);
        const normalizedRoundTripped = normalizeFormData(roundTripped);

        expect(normalizedRoundTripped).toEqual(normalizedOriginal);
      }),
      { numRuns: 50 }
    );
  });

  it("round-trip through schema is idempotent (form â†’ payload â†’ form â†’ payload)", () => {
    fc.assert(
      fc.property(validFormData(), (formData) => {
        const parseResult = adminCharacterFormSchema.safeParse(formData);
        expect(parseResult.success).toBe(true);
        if (!parseResult.success) return;

        // First round-trip
        const payload1 = characterFormToPayload(parseResult.data);
        const form1 = characterPayloadToForm(payload1);

        // Second round-trip
        const payload2 = characterFormToPayload(form1);

        // Both payloads should be identical
        expect(payload2).toEqual(payload1);
      }),
      { numRuns: 50 }
    );
  });

  it("slug is always preserved exactly through round-trip", () => {
    fc.assert(
      fc.property(validFormData(), (formData) => {
        const parseResult = adminCharacterFormSchema.safeParse(formData);
        expect(parseResult.success).toBe(true);
        if (!parseResult.success) return;

        const payload = characterFormToPayload(parseResult.data);
        const roundTripped = characterPayloadToForm(payload);

        expect(roundTripped.slug).toBe(parseResult.data.slug);
      }),
      { numRuns: 100 }
    );
  });

  it("translation names are preserved through round-trip", () => {
    fc.assert(
      fc.property(validFormData(), (formData) => {
        const parseResult = adminCharacterFormSchema.safeParse(formData);
        expect(parseResult.success).toBe(true);
        if (!parseResult.success) return;

        const payload = characterFormToPayload(parseResult.data);
        const roundTripped = characterPayloadToForm(payload);

        expect(roundTripped.translations.length).toBe(parseResult.data.translations.length);
        for (let i = 0; i < parseResult.data.translations.length; i++) {
          expect(roundTripped.translations[i].language_code).toBe(
            parseResult.data.translations[i].language_code
          );
          // name: "" stays "", non-empty stays non-empty
          expect(roundTripped.translations[i].name).toBe(
            parseResult.data.translations[i].name ?? ""
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  it("games array is preserved through round-trip", () => {
    fc.assert(
      fc.property(validFormData(), (formData) => {
        const parseResult = adminCharacterFormSchema.safeParse(formData);
        expect(parseResult.success).toBe(true);
        if (!parseResult.success) return;

        const payload = characterFormToPayload(parseResult.data);
        const roundTripped = characterPayloadToForm(payload);

        const originalGames = parseResult.data.games ?? [];
        expect(roundTripped.games.length).toBe(originalGames.length);
        for (let i = 0; i < originalGames.length; i++) {
          expect(roundTripped.games[i].game_id).toBe(originalGames[i].game_id);
          expect(roundTripped.games[i].is_primary).toBe(originalGames[i].is_primary);
        }
      }),
      { numRuns: 100 }
    );
  });
});
