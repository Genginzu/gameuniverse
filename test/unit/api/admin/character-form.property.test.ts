import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { adminCharacterFormSchema } from "@/lib/validations/admin-character-form";

/**
 * Feature: character-genders-species, Property 4: Character gender/species save round-trip
 *
 * _For any_ character and any valid gender and species selection (including NULL),
 * saving the character form and then reloading it should display the same gender
 * and species selections. Deselecting (setting to NULL) and saving should also
 * round-trip correctly.
 *
 * Since we can't test actual API calls in unit tests, we test the form data
 * transformation through the Zod schema: valid UUIDs pass, NULL passes,
 * invalid values are rejected.
 *
 * **Validates: Requirements 5.3, 5.4, 5.5, 5.6, 5.7**
 */

// --- Generators ---

const validUuidGenerator = fc.uuid();

const nullableUuidGenerator = fc.oneof(validUuidGenerator, fc.constant(null));

const baseFormData = {
  slug: "test-character",
  translations: [{ language_code: "fr", name: "Test", role: "", description: "", biography: "" }],
  games: [],
  relationships: [],
  media: [],
  role_ids: [],
};

const invalidUuidGenerator = fc.oneof(
  fc.constant("not-a-uuid"),
  fc.constant("12345"),
  fc.constant("zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz"),
  fc.stringMatching(/^[a-z]{5,20}$/),
  fc.constant("")
);

// --- Tests ---

describe("Character Form Gender/Species Save Round-Trip - Property-Based Tests", () => {
  describe("Property 4: Character gender/species save round-trip", () => {
    it("valid UUID gender_id passes validation and round-trips through schema", () => {
      fc.assert(
        fc.property(validUuidGenerator, (genderId) => {
          const data = { ...baseFormData, gender_id: genderId, species_id: null };
          const result = adminCharacterFormSchema.safeParse(data);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.gender_id).toBe(genderId);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("valid UUID species_id passes validation and round-trips through schema", () => {
      fc.assert(
        fc.property(validUuidGenerator, (speciesId) => {
          const data = { ...baseFormData, gender_id: null, species_id: speciesId };
          const result = adminCharacterFormSchema.safeParse(data);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.species_id).toBe(speciesId);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("NULL gender_id and species_id pass validation (deselection)", () => {
      fc.assert(
        fc.property(fc.constant(null), fc.constant(null), (genderId, speciesId) => {
          const data = { ...baseFormData, gender_id: genderId, species_id: speciesId };
          const result = adminCharacterFormSchema.safeParse(data);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.gender_id).toBeNull();
            expect(result.data.species_id).toBeNull();
          }
        }),
        { numRuns: 100 }
      );
    });

    it("any combination of valid UUID or NULL for gender_id/species_id round-trips", () => {
      fc.assert(
        fc.property(nullableUuidGenerator, nullableUuidGenerator, (genderId, speciesId) => {
          const data = { ...baseFormData, gender_id: genderId, species_id: speciesId };
          const result = adminCharacterFormSchema.safeParse(data);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.gender_id).toBe(genderId);
            expect(result.data.species_id).toBe(speciesId);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("invalid gender_id fails validation", () => {
      fc.assert(
        fc.property(invalidUuidGenerator, (badId) => {
          const data = { ...baseFormData, gender_id: badId, species_id: null };
          const result = adminCharacterFormSchema.safeParse(data);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("invalid species_id fails validation", () => {
      fc.assert(
        fc.property(invalidUuidGenerator, (badId) => {
          const data = { ...baseFormData, gender_id: null, species_id: badId };
          const result = adminCharacterFormSchema.safeParse(data);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("omitting gender_id/species_id entirely passes validation (optional fields)", () => {
      fc.assert(
        fc.property(fc.constant(undefined), () => {
          const data = { ...baseFormData };
          const result = adminCharacterFormSchema.safeParse(data);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.gender_id).toBeUndefined();
            expect(result.data.species_id).toBeUndefined();
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
