import { describe, it, expect } from "vitest";
import { buildReviewsUrl } from "@/lib/utils/playerReviewUtils";

describe("buildReviewsUrl", () => {
  it("returns basic URL with no params", () => {
    expect(buildReviewsUrl("123", {})).toBe("/api/players/123/reviews");
  });

  it("appends page param", () => {
    expect(buildReviewsUrl("123", { page: 2 })).toBe("/api/players/123/reviews?page=2");
  });

  it("appends sort param", () => {
    expect(buildReviewsUrl("123", { sort: "date_desc" })).toBe(
      "/api/players/123/reviews?sort=date_desc"
    );
  });

  it("appends all params", () => {
    const url = buildReviewsUrl("123", { page: 2, sort: "date_desc", locale: "fr" });
    expect(url).toBe("/api/players/123/reviews?page=2&sort=date_desc&locale=fr");
  });
});
