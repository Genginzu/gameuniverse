import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { reviewSchema, stripHtmlTags } from "../../../../src/lib/validations/review";

// --- Shared generators ---

/** Valid rating: integer between 0 and 20 */
const validRatingGen = fc.integer({ min: 0, max: 20 });

/** Valid point: non-empty alphanumeric string, max 200 chars */
const validPointGen = fc.stringMatching(/^[a-zA-Z0-9 .,!?-]{1,200}$/);

/** Valid points array: 0-10 valid points */
const validPointsArrayGen = fc.array(validPointGen, { minLength: 0, maxLength: 10 });

/**
 * Feature: game-reviews, Property 1: Validation du rating — valeurs invalides rejetées
 *
 * For any numeric value that is NOT an integer between 0 and 20 (inclusive),
 * the reviewSchema validation must fail.
 *
 * **Validates: Requirements 2.2, 2.3**
 */
describe("Property 1: Validation du rating — valeurs invalides rejetées", () => {
  it("rejects non-integer ratings (floats)", () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 20, noInteger: true, noNaN: true }), (rating) => {
        const result = reviewSchema.safeParse({
          rating,
          content: "<p>Valid content</p>",
          positivePoints: [],
          negativePoints: [],
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 30 }
    );
  });

  it("rejects ratings below 0", () => {
    fc.assert(
      fc.property(fc.integer({ min: -1000, max: -1 }), (rating) => {
        const result = reviewSchema.safeParse({
          rating,
          content: "<p>Valid content</p>",
          positivePoints: [],
          negativePoints: [],
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 30 }
    );
  });

  it("rejects ratings above 20", () => {
    fc.assert(
      fc.property(fc.integer({ min: 21, max: 1000 }), (rating) => {
        const result = reviewSchema.safeParse({
          rating,
          content: "<p>Valid content</p>",
          positivePoints: [],
          negativePoints: [],
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 30 }
    );
  });

  it("accepts valid integer ratings between 0 and 20", () => {
    fc.assert(
      fc.property(validRatingGen, (rating) => {
        const result = reviewSchema.safeParse({
          rating,
          content: "<p>Valid content</p>",
          positivePoints: [],
          negativePoints: [],
        });
        expect(result.success).toBe(true);
      }),
      { numRuns: 30 }
    );
  });
});

/**
 * Feature: game-reviews, Property 2: Contenu HTML vide rejeté
 *
 * For any HTML string whose plain text (after stripHtmlTags) is empty or
 * whitespace-only, the content field validation must fail.
 *
 * **Validates: Requirements 3.3**
 */
describe("Property 2: Contenu HTML vide rejeté", () => {
  it("rejects HTML content that is empty after stripping tags", () => {
    const emptyHtmlGen = fc.oneof(
      fc.constant(""),
      fc.constant("<p></p>"),
      fc.constant("<p>   </p>"),
      fc.constant("<div><span></span></div>"),
      fc.constantFrom(" ", "\t", "\n", "  ", " \t\n ").map((ws) => `<p>${ws}</p>`)
    );

    fc.assert(
      fc.property(emptyHtmlGen, (html) => {
        const result = reviewSchema.safeParse({
          rating: 10,
          content: html,
          positivePoints: [],
          negativePoints: [],
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 30 }
    );
  });
});

/**
 * Feature: game-reviews, Property 3: Contenu HTML trop long rejeté
 *
 * For any HTML string whose plain text (after stripHtmlTags) exceeds 5000
 * characters, the content field validation must fail.
 *
 * **Validates: Requirements 3.4**
 */
describe("Property 3: Contenu HTML trop long rejeté", () => {
  it("rejects HTML content exceeding 5000 plain text characters", () => {
    const longTextGen = fc
      .stringMatching(/^[a-z]{50,100}$/)
      .map((s) => s.repeat(101).slice(0, 5001 + Math.floor(Math.random() * 500)));

    fc.assert(
      fc.property(longTextGen, (text) => {
        const html = `<p>${text}</p>`;
        const result = reviewSchema.safeParse({
          rating: 10,
          content: html,
          positivePoints: [],
          negativePoints: [],
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 30 }
    );
  });
});

/**
 * Feature: game-reviews, Property 4: Points positifs/négatifs invalides rejetés
 *
 * For any string that is empty, whitespace-only, or exceeds 200 characters,
 * validation of an element in positivePoints or negativePoints must fail.
 *
 * **Validates: Requirements 4.3, 4.4**
 */
describe("Property 4: Points positifs/négatifs invalides rejetés", () => {
  it("rejects empty points", () => {
    const result = reviewSchema.safeParse({
      rating: 10,
      content: "<p>Valid content</p>",
      positivePoints: [""],
      negativePoints: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects points exceeding 200 characters", () => {
    const longPointGen = fc
      .stringMatching(/^[a-z]{10,20}$/)
      .map((s) => s.repeat(21).slice(0, 201 + Math.floor(Math.random() * 100)));

    fc.assert(
      fc.property(longPointGen, (longPoint) => {
        const result = reviewSchema.safeParse({
          rating: 10,
          content: "<p>Valid content</p>",
          positivePoints: [longPoint],
          negativePoints: [],
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 30 }
    );
  });

  it("rejects invalid negative points the same way", () => {
    const longPointGen = fc
      .stringMatching(/^[a-z]{10,20}$/)
      .map((s) => s.repeat(21).slice(0, 201 + Math.floor(Math.random() * 100)));

    fc.assert(
      fc.property(longPointGen, (longPoint) => {
        const result = reviewSchema.safeParse({
          rating: 10,
          content: "<p>Valid content</p>",
          positivePoints: [],
          negativePoints: [longPoint],
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 30 }
    );
  });
});

/**
 * Feature: game-reviews, Property 5: Limite du nombre de points respectée
 *
 * For any array of points with more than 10 elements, validation must fail.
 * For any array of 0-10 valid elements, validation must succeed.
 *
 * **Validates: Requirements 4.5**
 */
describe("Property 5: Limite du nombre de points respectée", () => {
  it("rejects more than 10 positive points", () => {
    fc.assert(
      fc.property(fc.array(validPointGen, { minLength: 11, maxLength: 20 }), (points) => {
        const result = reviewSchema.safeParse({
          rating: 10,
          content: "<p>Valid content</p>",
          positivePoints: points,
          negativePoints: [],
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 30 }
    );
  });

  it("rejects more than 10 negative points", () => {
    fc.assert(
      fc.property(fc.array(validPointGen, { minLength: 11, maxLength: 20 }), (points) => {
        const result = reviewSchema.safeParse({
          rating: 10,
          content: "<p>Valid content</p>",
          positivePoints: [],
          negativePoints: points,
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 30 }
    );
  });

  it("accepts 0 to 10 valid points", () => {
    fc.assert(
      fc.property(validPointsArrayGen, validPointsArrayGen, (pos, neg) => {
        const result = reviewSchema.safeParse({
          rating: 10,
          content: "<p>Valid content</p>",
          positivePoints: pos,
          negativePoints: neg,
        });
        expect(result.success).toBe(true);
      }),
      { numRuns: 30 }
    );
  });
});

/**
 * Feature: game-reviews, Property 9: Round-trip stripHtmlTags
 *
 * For any plain text without HTML tags, wrapping it in <p> tags and calling
 * stripHtmlTags must return the original text (trimmed).
 *
 * **Validates: Requirements 3.3, 3.4**
 */
describe("Property 9: Round-trip stripHtmlTags", () => {
  it("round-trips plain text through HTML wrapping and stripping", () => {
    const plainTextGen = fc
      .stringMatching(/^[a-zA-Z0-9 .,!?-]{1,500}$/)
      .filter((s) => s.trim().length > 0);

    fc.assert(
      fc.property(plainTextGen, (text) => {
        const html = `<p>${text}</p>`;
        const result = stripHtmlTags(html);
        expect(result).toBe(text.trim());
      }),
      { numRuns: 30 }
    );
  });
});
