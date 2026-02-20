import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { adminGameFormSchema } from "../../../../../src/lib/validations/admin-game-form";

// Feature: admin-game-management, Property 3: Validation et Soumission de Formulaire
// **Validates: Requirements 4.3, 4.5, 4.6**

// --- Generators ---

const validSlug = () =>
  fc.stringMatching(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/).filter((s) => s.length >= 2 && s.length <= 255);

const validUuid = () => fc.uuid();

const validTranslation = () =>
  fc.record({
    language_code: fc.constantFrom("fr", "en"),
    title: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    description: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: "" }),
  });

const validGenre = () =>
  fc.record({
    genre_id: validUuid(),
  });

const validCompany = () =>
  fc.record({
    company_id: validUuid(),
    role: fc.constantFrom("developer" as const, "publisher" as const),
    is_primary: fc.boolean(),
  });

const validFormData = () =>
  fc.record({
    slug: validSlug(),
    translations: fc.array(validTranslation(), { minLength: 1, maxLength: 2 }),
    cover_image_url: fc.option(fc.webUrl(), { nil: "" }),
    release_date: fc.option(
      fc
        .record({
          year: fc.integer({ min: 2000, max: 2030 }),
          month: fc.integer({ min: 1, max: 12 }),
          day: fc.integer({ min: 1, max: 28 }),
        })
        .map(
          ({ year, month, day }) =>
            `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        ),
      { nil: "" }
    ),
    genres: fc.array(validGenre(), { minLength: 1, maxLength: 5 }),
    companies: fc.array(validCompany(), { minLength: 1, maxLength: 3 }),
  });

// --- Invalid generators ---

const emptySlug = () => fc.constant("");

const invalidSlugChars = () =>
  fc.string({ minLength: 1, maxLength: 50 }).filter((s) => /[A-Z\s!@#$%^&*()]/.test(s));

const emptyTranslations = () =>
  fc.constant([] as Array<{ language_code: string; title: string; description?: string }>);

const emptyGenres = () => fc.constant([] as Array<{ genre_id: string }>);

const emptyCompanies = () =>
  fc.constant(
    [] as Array<{ company_id: string; role: "developer" | "publisher"; is_primary: boolean }>
  );

describe("Admin Game Form Validation Property Tests", () => {
  describe("Property 3a: Valid forms are accepted", () => {
    it("any form with valid data passes validation", () => {
      fc.assert(
        fc.property(validFormData(), (formData) => {
          const result = adminGameFormSchema.safeParse(formData);
          return result.success === true;
        }),
        { numRuns: 30 }
      );
    });
  });

  describe("Property 3b: Invalid forms are rejected", () => {
    it("form with slug exceeding max length is rejected", () => {
      fc.assert(
        fc.property(validFormData(), (formData) => {
          const tooLongSlug = "a".repeat(256);
          const result = adminGameFormSchema.safeParse({
            ...formData,
            slug: tooLongSlug,
          });
          return result.success === false;
        }),
        { numRuns: 30 }
      );
    });

    it("form with empty slug is accepted (slug is optional)", () => {
      fc.assert(
        fc.property(validFormData(), emptySlug(), (formData, slug) => {
          const result = adminGameFormSchema.safeParse({
            ...formData,
            slug,
          });
          return result.success === true;
        }),
        { numRuns: 30 }
      );
    });

    it("form with empty translations array is rejected", () => {
      fc.assert(
        fc.property(validFormData(), emptyTranslations(), (formData, translations) => {
          const result = adminGameFormSchema.safeParse({
            ...formData,
            translations,
          });
          return result.success === false;
        }),
        { numRuns: 30 }
      );
    });

    it("form with empty genres array is rejected", () => {
      fc.assert(
        fc.property(validFormData(), emptyGenres(), (formData, genres) => {
          const result = adminGameFormSchema.safeParse({
            ...formData,
            genres,
          });
          return result.success === false;
        }),
        { numRuns: 30 }
      );
    });

    it("form with empty companies array is rejected", () => {
      fc.assert(
        fc.property(validFormData(), emptyCompanies(), (formData, companies) => {
          const result = adminGameFormSchema.safeParse({
            ...formData,
            companies,
          });
          return result.success === false;
        }),
        { numRuns: 30 }
      );
    });

    it("form with translation missing title is rejected", () => {
      fc.assert(
        fc.property(validFormData(), (formData) => {
          const badTranslations = formData.translations.map((t) => ({
            ...t,
            title: "",
          }));
          const result = adminGameFormSchema.safeParse({
            ...formData,
            translations: badTranslations,
          });
          return result.success === false;
        }),
        { numRuns: 30 }
      );
    });
  });
});
