import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { sendMessageSchema } from "../../../../src/lib/validations/discussion";

/**
 * Feature: player-discussions, Property 7: Message validation rejects invalid content
 *
 * _Pour tout_ contenu textuel, le `sendMessageSchema` doit accepter le contenu si et
 * seulement si le contenu trimé (sans espaces de début/fin) est non-vide et contient
 * au plus 2000 caractères. Toute chaîne composée uniquement d'espaces ou dépassant
 * 2000 caractères (après trim) doit être rejetée.
 *
 * **Validates: Requirements 4.4, 4.5, 4.6**
 */

// --- Generators ---

/** Generates valid content: trimmed length between 1 and 2000, with optional surrounding whitespace */
const validContentGenerator = fc
  .tuple(
    fc.string({ minLength: 1, maxLength: 2000 }).filter((s) => s.trim().length > 0),
    fc.integer({ min: 0, max: 5 }),
    fc.integer({ min: 0, max: 5 })
  )
  .map(
    ([core, leadCount, trailCount]) => `${" ".repeat(leadCount)}${core}${" ".repeat(trailCount)}`
  )
  .filter((s) => s.trim().length >= 1 && s.trim().length <= 2000);

/** Generates whitespace-only content (should be rejected) */
const whitespaceOnlyGenerator = fc
  .array(fc.constantFrom(" ", "\t", "\n", "\r"), { minLength: 1, maxLength: 50 })
  .map((chars) => chars.join(""))
  .filter((s) => s.trim().length === 0);

/** Generates content exceeding 2000 characters after trim */
const tooLongContentGenerator = fc
  .string({ minLength: 2001, maxLength: 2500 })
  .filter((s) => s.trim().length > 2000);

/** Generates empty string */
const emptyContentGenerator = fc.constant("");

// --- Tests ---

describe("Discussion Validation Schema - Property-Based Tests", () => {
  describe("Feature: player-discussions, Property 7: Message validation rejects invalid content", () => {
    it("accepts all valid content (trimmed length 1-2000)", () => {
      fc.assert(
        fc.property(validContentGenerator, (content) => {
          const result = sendMessageSchema.safeParse({ content });
          expect(result.success).toBe(true);
        }),
        { numRuns: 200 }
      );
    });

    it("rejects empty string content", () => {
      fc.assert(
        fc.property(emptyContentGenerator, (content) => {
          const result = sendMessageSchema.safeParse({ content });
          expect(result.success).toBe(false);
        }),
        { numRuns: 30 }
      );
    });

    it("rejects whitespace-only content", () => {
      fc.assert(
        fc.property(whitespaceOnlyGenerator, (content) => {
          const result = sendMessageSchema.safeParse({ content });
          expect(result.success).toBe(false);
        }),
        { numRuns: 30 }
      );
    });

    it("rejects content exceeding 2000 characters after trim", () => {
      fc.assert(
        fc.property(tooLongContentGenerator, (content) => {
          const result = sendMessageSchema.safeParse({ content });
          expect(result.success).toBe(false);
        }),
        { numRuns: 30 }
      );
    });

    it("accepts content at exactly 2000 trimmed characters", () => {
      fc.assert(
        fc.property(fc.constantFrom("a", "b", "z", "é", "1", "!"), (char) => {
          const content = char.repeat(2000);
          if (content.trim().length === 2000) {
            const result = sendMessageSchema.safeParse({ content });
            expect(result.success).toBe(true);
          }
        }),
        { numRuns: 30 }
      );
    });

    it("rejects content at exactly 2001 trimmed characters", () => {
      fc.assert(
        fc.property(fc.constantFrom("a", "b", "z", "1", "!"), (char) => {
          const content = char.repeat(2001);
          const result = sendMessageSchema.safeParse({ content });
          expect(result.success).toBe(false);
        }),
        { numRuns: 30 }
      );
    });

    it("bijectivity: schema accepts iff trimmed content is non-empty and ≤2000 chars", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 2200 }), (content) => {
          const trimmed = content.trim();
          const shouldAccept = trimmed.length > 0 && trimmed.length <= 2000;
          const result = sendMessageSchema.safeParse({ content });
          expect(result.success).toBe(shouldAccept);
        }),
        { numRuns: 500 }
      );
    });

    it("provides descriptive error messages for invalid inputs", () => {
      fc.assert(
        fc.property(
          fc.oneof(emptyContentGenerator, whitespaceOnlyGenerator, tooLongContentGenerator),
          (content) => {
            const result = sendMessageSchema.safeParse({ content });
            expect(result.success).toBe(false);
            if (!result.success) {
              for (const issue of result.error.issues) {
                expect(typeof issue.message).toBe("string");
                expect(issue.message.length).toBeGreaterThan(0);
              }
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
