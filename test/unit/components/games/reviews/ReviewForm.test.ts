import { describe, it, expect } from "bun:test";
import { reviewSchema } from "../../../../../src/lib/validations/review";

/**
 * Unit Tests for ReviewForm Component Logic
 *
 * **Validates: Requirements 1.1, 6.1, 6.2**
 * - Form validates input via Zod schema
 * - Validation errors are surfaced without losing data
 */

// Simulate form validation logic (same schema used by ReviewForm)
function validateReviewForm(data: unknown) {
  const result = reviewSchema.safeParse(data);
  if (result.success) {
    return { valid: true as const, data: result.data };
  }
  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (!fieldErrors[path]) {
      fieldErrors[path] = issue.message;
    }
  }
  return { valid: false as const, errors: fieldErrors };
}

describe("ReviewForm validation", () => {
  const validData = {
    rating: 15,
    content: "<p>A solid game with great mechanics.</p>",
    positivePoints: ["Fun gameplay"],
    negativePoints: ["Too short"],
  };

  it("accepts valid form data", () => {
    const result = validateReviewForm(validData);
    expect(result.valid).toBe(true);
  });

  it("rejects missing rating", () => {
    const result = validateReviewForm({ ...validData, rating: undefined });
    expect(result.valid).toBe(false);
  });

  it("rejects empty HTML content", () => {
    const result = validateReviewForm({ ...validData, content: "<p>   </p>" });
    expect(result.valid).toBe(false);
  });

  it("rejects content exceeding 5000 characters", () => {
    const longContent = `<p>${"a".repeat(5001)}</p>`;
    const result = validateReviewForm({ ...validData, content: longContent });
    expect(result.valid).toBe(false);
  });

  it("rejects empty positive point", () => {
    const result = validateReviewForm({
      ...validData,
      positivePoints: [""],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects positive point exceeding 200 characters", () => {
    const result = validateReviewForm({
      ...validData,
      positivePoints: ["a".repeat(201)],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects more than 10 positive points", () => {
    const result = validateReviewForm({
      ...validData,
      positivePoints: Array.from({ length: 11 }, (_, i) => `Point ${i}`),
    });
    expect(result.valid).toBe(false);
  });

  it("accepts form with no points at all", () => {
    const result = validateReviewForm({
      ...validData,
      positivePoints: [],
      negativePoints: [],
    });
    expect(result.valid).toBe(true);
  });

  it("returns field-level errors for multiple invalid fields", () => {
    const result = validateReviewForm({
      rating: 25,
      content: "",
      positivePoints: [],
      negativePoints: [],
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors["rating"]).toBeDefined();
      expect(result.errors["content"]).toBeDefined();
    }
  });
});
