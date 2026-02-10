import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";
import {
  adminLanguageFormSchema,
  type LanguageFormData,
} from "../../../../src/lib/validations/admin-language-form";

/**
 * Feature: admin-language-management, Property 1: Validation du Schéma de Langue
 *
 * _For any_ language form data, the Zod schema must accept it if and only if:
 * - the code matches pattern ^[a-z]([a-z-]*[a-z])?$ with length between 2 and 10 characters
 * - the name is non-empty and does not exceed 100 characters
 * - the native_name does not exceed 100 characters
 *
 * Any data not meeting these criteria must be rejected with a descriptive error message.
 *
 * **Validates: Requirements 4.5, 4.6, 8.1, 8.2, 8.3**
 */

// --- Generators ---

const CODE_REGEX = /^[a-z]([a-z-]*[a-z])?$/;

/** Generates a valid language code: 2-10 lowercase letters with optional internal hyphens */
const validCodeGenerator = fc
  .tuple(
    fc.integer({ min: 2, max: 10 }),
    fc.shuffledSubarray("abcdefghijklmnopqrstuvwxyz".split(""), {
      minLength: 1,
      maxLength: 1,
    }),
    fc.shuffledSubarray("abcdefghijklmnopqrstuvwxyz".split(""), {
      minLength: 1,
      maxLength: 1,
    })
  )
  .chain(([length, [firstChar], [lastChar]]) => {
    if (length === 2) {
      return fc.constant(`${firstChar}${lastChar}`);
    }
    const middleLength = length - 2;
    return fc
      .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz-".split("")), {
        minLength: middleLength,
        maxLength: middleLength,
      })
      .map((middle) => `${firstChar}${middle.join("")}${lastChar}`);
  })
  .filter((code) => CODE_REGEX.test(code) && code.length >= 2 && code.length <= 10);

/** Generates a valid name: 1-100 non-empty characters */
const validNameGenerator = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

/** Generates a valid native_name: 0-100 characters, optional or empty string */
const validNativeNameGenerator = fc.oneof(
  fc.constant(undefined),
  fc.constant(""),
  fc.string({ minLength: 1, maxLength: 100 })
);

/** Generates a complete valid form data object */
const validFormDataGenerator = fc
  .tuple(validCodeGenerator, validNameGenerator, validNativeNameGenerator)
  .map(([code, name, native_name]) => ({
    code,
    name,
    native_name,
  }));

// --- Invalid generators ---

/** Code too short (0-1 chars) */
const tooShortCodeGenerator = fc.oneof(
  fc.constant(""),
  fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split(""))
);

/** Code too long (11+ chars) */
const tooLongCodeGenerator = fc
  .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")), {
    minLength: 11,
    maxLength: 20,
  })
  .map((chars) => chars.join(""));

/** Code with invalid characters (uppercase, digits, special chars) */
const invalidCharsCodeGenerator = fc
  .stringMatching(/^[a-z]{1,4}[^a-z-][a-z]{1,4}$/)
  .filter((s) => !CODE_REGEX.test(s) && s.length >= 2 && s.length <= 10);

/** Code starting or ending with hyphen */
const hyphenEdgeCodeGenerator = fc.oneof(
  fc.constantFrom("-ab", "ab-", "-a-", "--", "-abc-", "a-b-").filter((s) => !CODE_REGEX.test(s))
);

/** Name that is empty */
const emptyNameGenerator = fc.constant("");

/** Name that exceeds 100 characters */
const tooLongNameGenerator = fc
  .string({ minLength: 101, maxLength: 200 })
  .filter((s) => s.length > 100);

/** Native name that exceeds 100 characters */
const tooLongNativeNameGenerator = fc
  .string({ minLength: 101, maxLength: 200 })
  .filter((s) => s.length > 100);

// --- Tests ---

describe("Admin Language Form Schema - Property-Based Tests", () => {
  describe("Property 1: Validation du Schéma de Langue", () => {
    it("accepts all valid language form data", () => {
      fc.assert(
        fc.property(validFormDataGenerator, (data) => {
          const result = adminLanguageFormSchema.safeParse(data);
          expect(result.success).toBe(true);
        }),
        { numRuns: 200 }
      );
    });

    describe("Code validation", () => {
      it("accepts valid codes matching ^[a-z]([a-z-]*[a-z])?$ with 2-10 chars", () => {
        fc.assert(
          fc.property(validCodeGenerator, validNameGenerator, (code, name) => {
            const result = adminLanguageFormSchema.safeParse({ code, name });
            expect(result.success).toBe(true);
          }),
          { numRuns: 200 }
        );
      });

      it("rejects codes that are too short (< 2 chars)", () => {
        fc.assert(
          fc.property(tooShortCodeGenerator, validNameGenerator, (code, name) => {
            const result = adminLanguageFormSchema.safeParse({ code, name });
            expect(result.success).toBe(false);
          }),
          { numRuns: 100 }
        );
      });

      it("rejects codes that are too long (> 10 chars)", () => {
        fc.assert(
          fc.property(tooLongCodeGenerator, validNameGenerator, (code, name) => {
            const result = adminLanguageFormSchema.safeParse({ code, name });
            expect(result.success).toBe(false);
          }),
          { numRuns: 100 }
        );
      });

      it("rejects codes with invalid characters", () => {
        fc.assert(
          fc.property(invalidCharsCodeGenerator, validNameGenerator, (code, name) => {
            const result = adminLanguageFormSchema.safeParse({ code, name });
            expect(result.success).toBe(false);
          }),
          { numRuns: 100 }
        );
      });

      it("rejects codes starting or ending with hyphens", () => {
        fc.assert(
          fc.property(hyphenEdgeCodeGenerator, validNameGenerator, (code, name) => {
            const result = adminLanguageFormSchema.safeParse({ code, name });
            expect(result.success).toBe(false);
          }),
          { numRuns: 100 }
        );
      });
    });

    describe("Name validation", () => {
      it("rejects empty names", () => {
        fc.assert(
          fc.property(validCodeGenerator, (code) => {
            const result = adminLanguageFormSchema.safeParse({ code, name: "" });
            expect(result.success).toBe(false);
            if (!result.success) {
              const nameErrors = result.error.issues.filter((i) => i.path.includes("name"));
              expect(nameErrors.length).toBeGreaterThan(0);
            }
          }),
          { numRuns: 100 }
        );
      });

      it("rejects names exceeding 100 characters", () => {
        fc.assert(
          fc.property(validCodeGenerator, tooLongNameGenerator, (code, name) => {
            const result = adminLanguageFormSchema.safeParse({ code, name });
            expect(result.success).toBe(false);
            if (!result.success) {
              const nameErrors = result.error.issues.filter((i) => i.path.includes("name"));
              expect(nameErrors.length).toBeGreaterThan(0);
            }
          }),
          { numRuns: 100 }
        );
      });
    });

    describe("Native name validation", () => {
      it("accepts undefined or empty native_name", () => {
        fc.assert(
          fc.property(
            validCodeGenerator,
            validNameGenerator,
            fc.oneof(fc.constant(undefined), fc.constant("")),
            (code, name, native_name) => {
              const result = adminLanguageFormSchema.safeParse({ code, name, native_name });
              expect(result.success).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });

      it("rejects native_name exceeding 100 characters", () => {
        fc.assert(
          fc.property(
            validCodeGenerator,
            validNameGenerator,
            tooLongNativeNameGenerator,
            (code, name, native_name) => {
              const result = adminLanguageFormSchema.safeParse({ code, name, native_name });
              expect(result.success).toBe(false);
              if (!result.success) {
                const nativeNameErrors = result.error.issues.filter((i) =>
                  i.path.includes("native_name")
                );
                expect(nativeNameErrors.length).toBeGreaterThan(0);
              }
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe("Error messages", () => {
      it("provides descriptive error messages for all invalid inputs", () => {
        fc.assert(
          fc.property(
            fc.oneof(
              // Invalid code
              fc.tuple(tooShortCodeGenerator, validNameGenerator, validNativeNameGenerator),
              // Invalid name
              fc.tuple(validCodeGenerator, emptyNameGenerator, validNativeNameGenerator),
              // Invalid native_name
              fc.tuple(validCodeGenerator, validNameGenerator, tooLongNativeNameGenerator)
            ),
            ([code, name, native_name]) => {
              const result = adminLanguageFormSchema.safeParse({ code, name, native_name });
              expect(result.success).toBe(false);
              if (!result.success) {
                // Every issue must have a non-empty message
                for (const issue of result.error.issues) {
                  expect(typeof issue.message).toBe("string");
                  expect(issue.message.length).toBeGreaterThan(0);
                }
              }
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe("Schema bijectivity", () => {
      it("valid data round-trips through parse without data loss", () => {
        fc.assert(
          fc.property(validFormDataGenerator, (data) => {
            const result = adminLanguageFormSchema.safeParse(data);
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.code).toBe(data.code);
              expect(result.data.name).toBe(data.name);
              // native_name: undefined stays undefined, "" stays ""
              if (data.native_name === undefined) {
                expect(result.data.native_name).toBeUndefined();
              } else {
                expect(result.data.native_name).toBe(data.native_name);
              }
            }
          }),
          { numRuns: 200 }
        );
      });
    });
  });
});
