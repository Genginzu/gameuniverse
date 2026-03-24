import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { pickTranslation } from "@/lib/utils/pickTranslation";

// Feature: character-genders-species, Property 5: Character detail displays translated gender/species in current locale
// **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

// We test the pickTranslation + transformation logic directly rather than
// going through the full HTTP handler, keeping the test fast and focused.

/** Build a gender DB row with translations for both locales */
function buildGenderRow(
  id: string,
  slug: string,
  translations: Array<{ language_code: string; name: string }>
) {
  return { id, slug, gender_translations: translations };
}

/** Build a species DB row with translations for both locales */
function buildSpeciesRow(
  id: string,
  slug: string,
  translations: Array<{ language_code: string; name: string }>
) {
  return { id, slug, species_translations: translations };
}

/**
 * Mirrors the transformation logic from the character detail API route.
 * Given raw DB data + locale, returns the public-facing gender/species objects.
 */
function transformGenderSpecies(
  genderRow: ReturnType<typeof buildGenderRow> | null,
  speciesRow: ReturnType<typeof buildSpeciesRow> | null,
  locale: string
) {
  const genderObj = genderRow
    ? (() => {
        const gt = pickTranslation(genderRow.gender_translations, locale);
        return gt ? { id: genderRow.id, slug: genderRow.slug, name: gt.name } : undefined;
      })()
    : undefined;

  const speciesObj = speciesRow
    ? (() => {
        const st = pickTranslation(speciesRow.species_translations, locale);
        return st ? { id: speciesRow.id, slug: speciesRow.slug, name: st.name } : undefined;
      })()
    : undefined;

  // Spread-omit pattern used in the real route
  return {
    ...(genderObj && { gender: genderObj }),
    ...(speciesObj && { species: speciesObj }),
  };
}

// ── Arbitraries ──

const localeArb = fc.constantFrom("fr", "en");
const uuidArb = fc.uuid();
const slugArb = fc.stringMatching(/^[a-z][a-z0-9-]{0,29}$/).filter((s) => s.length >= 1);
const nameArb = fc.string({ minLength: 1, maxLength: 60 }).filter((s) => s.trim().length > 0);

/** Generates a pair of translations (FR + EN) */
const translationPairArb = fc.tuple(nameArb, nameArb).map(([frName, enName]) => [
  { language_code: "fr", name: frName },
  { language_code: "en", name: enName },
]);

describe("Property 5: Character detail displays translated gender/species in current locale", () => {
  it("should return the correct locale translation for gender when assigned", () => {
    fc.assert(
      fc.property(
        uuidArb,
        slugArb,
        translationPairArb,
        localeArb,
        (id, slug, translations, locale) => {
          const genderRow = buildGenderRow(id, slug, translations);
          const result = transformGenderSpecies(genderRow, null, locale);

          expect(result.gender).toBeDefined();
          expect(result.gender!.id).toBe(id);
          expect(result.gender!.slug).toBe(slug);

          const expectedTranslation = translations.find((t) => t.language_code === locale);
          expect(result.gender!.name).toBe(expectedTranslation!.name);

          // species should be omitted
          expect(result).not.toHaveProperty("species");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return the correct locale translation for species when assigned", () => {
    fc.assert(
      fc.property(
        uuidArb,
        slugArb,
        translationPairArb,
        localeArb,
        (id, slug, translations, locale) => {
          const speciesRow = buildSpeciesRow(id, slug, translations);
          const result = transformGenderSpecies(null, speciesRow, locale);

          expect(result.species).toBeDefined();
          expect(result.species!.id).toBe(id);
          expect(result.species!.slug).toBe(slug);

          const expectedTranslation = translations.find((t) => t.language_code === locale);
          expect(result.species!.name).toBe(expectedTranslation!.name);

          // gender should be omitted
          expect(result).not.toHaveProperty("gender");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should omit both gender and species when NULL", () => {
    fc.assert(
      fc.property(localeArb, (locale) => {
        const result = transformGenderSpecies(null, null, locale);

        expect(result).not.toHaveProperty("gender");
        expect(result).not.toHaveProperty("species");
        expect(Object.keys(result)).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it("should return both gender and species with correct locale translations when both assigned", () => {
    fc.assert(
      fc.property(
        uuidArb,
        slugArb,
        translationPairArb,
        uuidArb,
        slugArb,
        translationPairArb,
        localeArb,
        (gId, gSlug, gTranslations, sId, sSlug, sTranslations, locale) => {
          const genderRow = buildGenderRow(gId, gSlug, gTranslations);
          const speciesRow = buildSpeciesRow(sId, sSlug, sTranslations);
          const result = transformGenderSpecies(genderRow, speciesRow, locale);

          // Both should be present
          expect(result.gender).toBeDefined();
          expect(result.species).toBeDefined();

          // Gender uses correct locale
          const expectedGender = gTranslations.find((t) => t.language_code === locale);
          expect(result.gender!.name).toBe(expectedGender!.name);

          // Species uses correct locale
          const expectedSpecies = sTranslations.find((t) => t.language_code === locale);
          expect(result.species!.name).toBe(expectedSpecies!.name);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should fallback to EN when requested locale translation is missing", () => {
    fc.assert(
      fc.property(uuidArb, slugArb, nameArb, (id, slug, enName) => {
        // Only EN translation available, requesting FR
        const genderRow = buildGenderRow(id, slug, [{ language_code: "en", name: enName }]);
        const result = transformGenderSpecies(genderRow, null, "fr");

        expect(result.gender).toBeDefined();
        expect(result.gender!.name).toBe(enName);
      }),
      { numRuns: 100 }
    );
  });
});
