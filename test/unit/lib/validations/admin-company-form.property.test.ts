import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { adminCompanyFormSchema } from "../../../../src/lib/validations/admin-company-form";

// --- Shared helpers ---

const SLUG_REGEX = /^[a-z]([a-z0-9-]*[a-z0-9])?$/;
const CURRENT_YEAR = new Date().getFullYear();

/** Minimal valid base form to isolate individual field validation */
function validBase(overrides: Record<string, unknown> = {}) {
  return {
    name: "Test Company",
    slug: "test-company",
    company_type: "developer" as const,
    ...overrides,
  };
}

// ============================================================
// Property 5: Validation du slug
// ============================================================

/**
 * Feature: admin-company-management, Property 5: Validation du slug
 *
 * _Pour toute_ chaine de caracteres, le schema de validation du slug accepte
 * la chaine si et seulement si elle contient uniquement des lettres minuscules,
 * des chiffres et des tirets, commence par une lettre, se termine par une
 * lettre ou un chiffre, et a entre 2 et 100 caracteres.
 *
 * **Validates: Requirements 2.4**
 */

function isValidSlug(s: string): boolean {
  return s.length >= 2 && s.length <= 100 && SLUG_REGEX.test(s);
}

const validSlugGenerator = fc
  .tuple(
    fc.integer({ min: 2, max: 100 }),
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789".split(""))
  )
  .chain(([length, firstChar, lastChar]) => {
    if (length === 2) {
      return fc.constant(`${firstChar}${lastChar}`);
    }
    const middleLength = length - 2;
    return fc
      .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-".split("")), {
        minLength: middleLength,
        maxLength: middleLength,
      })
      .map((middle) => `${firstChar}${middle.join("")}${lastChar}`);
  })
  .filter((slug) => isValidSlug(slug));

const tooShortSlugGenerator = fc.oneof(
  fc.constant(""),
  fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split(""))
);

const tooLongSlugGenerator = fc
  .tuple(
    fc.integer({ min: 101, max: 130 }),
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split(""))
  )
  .chain(([length, lastChar]) => {
    const middleLength = length - 2;
    return fc
      .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-".split("")), {
        minLength: middleLength,
        maxLength: middleLength,
      })
      .map((middle) => `a${middle.join("")}${lastChar}`);
  })
  .filter((slug) => SLUG_REGEX.test(slug));

const invalidStartSlugGenerator = fc
  .tuple(fc.constantFrom(..."0123456789-".split("")), fc.stringMatching(/^[a-z0-9]{1,10}$/))
  .map(([start, rest]) => `${start}${rest}`)
  .filter((slug) => slug.length >= 2 && slug.length <= 100 && !isValidSlug(slug));

const hyphenEndSlugGenerator = fc
  .tuple(
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
    fc.array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-".split("")), {
      minLength: 0,
      maxLength: 10,
    })
  )
  .map(([first, middle]) => `${first}${middle.join("")}-`)
  .filter((slug) => slug.length >= 2 && slug.length <= 100);

const uppercaseSlugGenerator = fc
  .tuple(
    fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
    fc.stringMatching(/^[a-z0-9]{0,8}$/),
    fc.constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")),
    fc.stringMatching(/^[a-z0-9]{0,8}$/)
  )
  .map(([first, mid1, upper, mid2]) => `${first}${mid1}${upper}${mid2}`)
  .filter((slug) => slug.length >= 2 && slug.length <= 100);

// --- Property 5 Tests ---

describe("Admin Company Form Schema - Property-Based Tests", () => {
  describe("Property 5: Validation du slug", () => {
    it("accepts all valid slugs", () => {
      fc.assert(
        fc.property(validSlugGenerator, (slug) => {
          const result = adminCompanyFormSchema.safeParse(validBase({ slug }));
          expect(result.success).toBe(true);
        }),
        { numRuns: 200 }
      );
    });

    it("rejects slugs that are too short (< 2 chars)", () => {
      fc.assert(
        fc.property(tooShortSlugGenerator, (slug) => {
          const result = adminCompanyFormSchema.safeParse(validBase({ slug }));
          expect(result.success).toBe(false);
        }),
        { numRuns: 30 }
      );
    });

    it("rejects slugs that are too long (> 100 chars)", () => {
      fc.assert(
        fc.property(tooLongSlugGenerator, (slug) => {
          const result = adminCompanyFormSchema.safeParse(validBase({ slug }));
          expect(result.success).toBe(false);
        }),
        { numRuns: 30 }
      );
    });

    it("rejects slugs starting with a digit or hyphen", () => {
      fc.assert(
        fc.property(invalidStartSlugGenerator, (slug) => {
          const result = adminCompanyFormSchema.safeParse(validBase({ slug }));
          expect(result.success).toBe(false);
        }),
        { numRuns: 30 }
      );
    });

    it("rejects slugs ending with a hyphen", () => {
      fc.assert(
        fc.property(hyphenEndSlugGenerator, (slug) => {
          const result = adminCompanyFormSchema.safeParse(validBase({ slug }));
          expect(result.success).toBe(false);
        }),
        { numRuns: 30 }
      );
    });

    it("rejects slugs with uppercase letters", () => {
      fc.assert(
        fc.property(uppercaseSlugGenerator, (slug) => {
          const result = adminCompanyFormSchema.safeParse(validBase({ slug }));
          expect(result.success).toBe(false);
        }),
        { numRuns: 30 }
      );
    });

    it("bijectivity: isValidSlug matches schema acceptance for arbitrary strings", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            validSlugGenerator,
            tooShortSlugGenerator,
            tooLongSlugGenerator,
            invalidStartSlugGenerator,
            hyphenEndSlugGenerator,
            uppercaseSlugGenerator,
            fc.string({ minLength: 0, maxLength: 120 })
          ),
          (slug) => {
            const result = adminCompanyFormSchema.safeParse(validBase({ slug }));
            expect(result.success).toBe(isValidSlug(slug));
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  // ============================================================
  // Property 6: Validation des champs du formulaire
  // ============================================================

  /**
   * Feature: admin-company-management, Property 6: Validation des champs du formulaire
   *
   * _Pour toute_ combinaison de nom, type et siege social, le schema
   * de validation accepte les donnees si et seulement si : le nom est non vide et
   * <=255 caracteres, le type est developer/publisher/both, et le siege social
   * est <=255 caracteres.
   *
   * **Validates: Requirements 2.5, 2.6, 2.7**
   */

  describe("Property 6: Validation des champs du formulaire", () => {
    const validNameGen = fc.string({ minLength: 1, maxLength: 255 });
    const invalidNameTooLongGen = fc.string({ minLength: 256, maxLength: 400 });

    const validTypeGen = fc.constantFrom("developer", "publisher", "both");
    const invalidTypeGen = fc.constantFrom("studio", "indie", "unknown", "");

    const validHeadquartersGen = fc.string({ minLength: 0, maxLength: 255 });
    const invalidHeadquartersGen = fc.string({ minLength: 256, maxLength: 400 });

    it("accepts valid name + type + headquarters", () => {
      fc.assert(
        fc.property(
          validNameGen,
          validTypeGen,
          validHeadquartersGen,
          (name, company_type, headquarters) => {
            const result = adminCompanyFormSchema.safeParse(
              validBase({ name, company_type, headquarters })
            );
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 200 }
      );
    });

    it("rejects empty name", () => {
      fc.assert(
        fc.property(validTypeGen, (company_type) => {
          const result = adminCompanyFormSchema.safeParse(validBase({ name: "", company_type }));
          expect(result.success).toBe(false);
        }),
        { numRuns: 30 }
      );
    });

    it("rejects name exceeding 255 characters", () => {
      fc.assert(
        fc.property(invalidNameTooLongGen, validTypeGen, (name, company_type) => {
          const result = adminCompanyFormSchema.safeParse(validBase({ name, company_type }));
          expect(result.success).toBe(false);
        }),
        { numRuns: 30 }
      );
    });

    it("rejects invalid company_type", () => {
      fc.assert(
        fc.property(invalidTypeGen, (company_type) => {
          const result = adminCompanyFormSchema.safeParse(validBase({ company_type }));
          expect(result.success).toBe(false);
        }),
        { numRuns: 30 }
      );
    });

    it("rejects headquarters exceeding 255 characters", () => {
      fc.assert(
        fc.property(invalidHeadquartersGen, (headquarters) => {
          const result = adminCompanyFormSchema.safeParse(validBase({ headquarters }));
          expect(result.success).toBe(false);
        }),
        { numRuns: 30 }
      );
    });
  });

  // ============================================================
  // Property 7: Validation de l'annee de fondation
  // ============================================================

  /**
   * Feature: admin-company-management, Property 7: Validation de l'annee de fondation
   *
   * _Pour tout_ entier, le schema de validation de l'annee de fondation accepte
   * la valeur si et seulement si elle est comprise entre 1800 et l'annee courante
   * incluse.
   *
   * **Validates: Requirements 2.9**
   */

  describe("Property 7: Validation de l'annee de fondation", () => {
    const validYearGen = fc.integer({ min: 1800, max: CURRENT_YEAR });
    const tooOldYearGen = fc.integer({ min: 1, max: 1799 });
    const futureYearGen = fc.integer({ min: CURRENT_YEAR + 1, max: CURRENT_YEAR + 500 });

    it("accepts years between 1800 and current year", () => {
      fc.assert(
        fc.property(validYearGen, (founded_year) => {
          const result = adminCompanyFormSchema.safeParse(validBase({ founded_year }));
          expect(result.success).toBe(true);
        }),
        { numRuns: 200 }
      );
    });

    it("rejects years before 1800", () => {
      fc.assert(
        fc.property(tooOldYearGen, (founded_year) => {
          const result = adminCompanyFormSchema.safeParse(validBase({ founded_year }));
          expect(result.success).toBe(false);
        }),
        { numRuns: 30 }
      );
    });

    it("rejects years after current year", () => {
      fc.assert(
        fc.property(futureYearGen, (founded_year) => {
          const result = adminCompanyFormSchema.safeParse(validBase({ founded_year }));
          expect(result.success).toBe(false);
        }),
        { numRuns: 30 }
      );
    });

    it("accepts empty string (optional field)", () => {
      const result = adminCompanyFormSchema.safeParse(validBase({ founded_year: "" }));
      expect(result.success).toBe(true);
    });

    it("accepts undefined (optional field)", () => {
      const result = adminCompanyFormSchema.safeParse(validBase({ founded_year: undefined }));
      expect(result.success).toBe(true);
    });
  });
});
