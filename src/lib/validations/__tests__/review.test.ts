import { describe, it, expect } from "vitest";
import { reviewSchema } from "../review";

const VALID = {
  rating: 15,
  content: "<p>Great game</p>",
  positivePoints: ["Good story"],
  negativePoints: ["Too short"],
};

describe("reviewSchema", () => {
  it("accepts valid review data", () => {
    expect(reviewSchema.safeParse(VALID).success).toBe(true);
  });

  it("accepts empty point lists", () => {
    expect(
      reviewSchema.safeParse({ ...VALID, positivePoints: [], negativePoints: [] }).success
    ).toBe(true);
  });

  it.each([
    ["missing rating", { rating: undefined }],
    ["rating above 20", { rating: 21 }],
    ["rating below 0", { rating: -1 }],
    ["content empty after HTML stripping", { content: "<p>   </p>" }],
    ["content longer than 5000 characters", { content: `<p>${"a".repeat(5001)}</p>` }],
    ["point longer than 200 characters", { positivePoints: ["a".repeat(201)] }],
    ["empty point string", { positivePoints: [""] }],
    [
      "more than 10 positive points",
      { positivePoints: Array.from({ length: 11 }, (_, i) => `P${i}`) },
    ],
  ])("rejects %s", (_label, override) => {
    expect(reviewSchema.safeParse({ ...VALID, ...override }).success).toBe(false);
  });

  it("reports an issue per invalid field", () => {
    const result = reviewSchema.safeParse({ ...VALID, rating: 25, content: "" });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((issue) => issue.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["rating", "content"]));
  });
});
