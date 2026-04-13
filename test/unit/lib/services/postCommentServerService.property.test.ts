import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: notifications-system, Property 1: Validation du contenu des commentaires
 *
 * _Pour toute_ chaîne de caractères, la création d'un commentaire de post doit
 * réussir si et seulement si la longueur est comprise entre 1 et 500 caractères
 * (après trim). Les chaînes vides, composées uniquement d'espaces, ou dépassant
 * 500 caractères doivent être rejetées.
 *
 * **Validates: Requirements 1.9**
 */

// --- Validation function (will be enforced by PostCommentServerService + DB CHECK) ---

/**
 * Validates post comment content.
 * Accepts content with trimmed length between 1 and 500 characters.
 * Rejects empty, whitespace-only, or >500 char content.
 */
function validatePostCommentContent(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.length >= 1 && trimmed.length <= 500;
}

// --- Generators ---

/** Generates valid content: trimmed length between 1 and 500, with optional surrounding whitespace */
const validContentGenerator = fc
  .tuple(
    fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0),
    fc.integer({ min: 0, max: 5 }),
    fc.integer({ min: 0, max: 5 })
  )
  .map(
    ([core, leadCount, trailCount]) => `${" ".repeat(leadCount)}${core}${" ".repeat(trailCount)}`
  )
  .filter((s) => s.trim().length >= 1 && s.trim().length <= 500);

/** Generates whitespace-only content (should be rejected) */
const whitespaceOnlyGenerator = fc
  .array(fc.constantFrom(" ", "\t", "\n", "\r"), { minLength: 1, maxLength: 50 })
  .map((chars) => chars.join(""))
  .filter((s) => s.trim().length === 0);

/** Generates content exceeding 500 characters after trim */
const tooLongContentGenerator = fc
  .string({ minLength: 501, maxLength: 800 })
  .filter((s) => s.trim().length > 500);

/** Generates empty string */
const emptyContentGenerator = fc.constant("");

// --- Tests ---

describe("PostCommentServerService - Property-Based Tests", () => {
  describe("Feature: notifications-system, Property 1: Validation du contenu des commentaires", () => {
    it("accepts all valid content (trimmed length 1-500)", () => {
      fc.assert(
        fc.property(validContentGenerator, (content) => {
          expect(validatePostCommentContent(content)).toBe(true);
        }),
        { numRuns: 200 }
      );
    });

    it("rejects empty string content", () => {
      fc.assert(
        fc.property(emptyContentGenerator, (content) => {
          expect(validatePostCommentContent(content)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects whitespace-only content", () => {
      fc.assert(
        fc.property(whitespaceOnlyGenerator, (content) => {
          expect(validatePostCommentContent(content)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects content exceeding 500 characters after trim", () => {
      fc.assert(
        fc.property(tooLongContentGenerator, (content) => {
          expect(validatePostCommentContent(content)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("accepts content at exactly 500 trimmed characters", () => {
      fc.assert(
        fc.property(fc.constantFrom("a", "b", "z", "é", "1", "!"), (char) => {
          const content = char.repeat(500);
          if (content.trim().length === 500) {
            expect(validatePostCommentContent(content)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("rejects content at exactly 501 trimmed characters", () => {
      fc.assert(
        fc.property(fc.constantFrom("a", "b", "z", "1", "!"), (char) => {
          const content = char.repeat(501);
          expect(validatePostCommentContent(content)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("bijectivity: validates iff trimmed content is non-empty and ≤500 chars", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 700 }), (content) => {
          const trimmed = content.trim();
          const shouldAccept = trimmed.length > 0 && trimmed.length <= 500;
          expect(validatePostCommentContent(content)).toBe(shouldAccept);
        }),
        { numRuns: 500 }
      );
    });
  });
});
