import { describe, it, expect } from "vitest";
import {
  buildReviewsUrl,
  computeReviewsPagination,
  computeRatingDistribution,
  sortReviews,
  transformReviewRecord,
} from "@/lib/utils/playerReviewUtils";

const review = (id: string, rating: number, date: string) => ({
  id,
  gameId: "g1",
  gameSlug: "game",
  gameName: "Game",
  gameCoverUrl: null,
  rating,
  content: "",
  positivePoints: [],
  negativePoints: [],
  createdAt: date,
  updatedAt: date,
});

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

describe("computeReviewsPagination", () => {
  it("10 items, page 1, size 5 -> totalPages 2, hasNextPage true", () => {
    expect(computeReviewsPagination(10, 1, 5)).toEqual({ totalPages: 2, hasNextPage: true });
  });

  it("10 items, page 2, size 5 -> totalPages 2, hasNextPage false", () => {
    expect(computeReviewsPagination(10, 2, 5)).toEqual({ totalPages: 2, hasNextPage: false });
  });

  it("0 items -> totalPages 0, hasNextPage false", () => {
    expect(computeReviewsPagination(0, 1, 5)).toEqual({ totalPages: 0, hasNextPage: false });
  });

  it("pageSize 0 -> totalPages 0", () => {
    expect(computeReviewsPagination(10, 1, 0)).toEqual({ totalPages: 0, hasNextPage: false });
  });
});

describe("computeRatingDistribution", () => {
  it("empty array -> all zeros", () => {
    expect(computeRatingDistribution([])).toEqual([
      { range: "0-5", count: 0, percentage: 0 },
      { range: "6-10", count: 0, percentage: 0 },
      { range: "11-15", count: 0, percentage: 0 },
      { range: "16-20", count: 0, percentage: 0 },
    ]);
  });

  it("[3, 8, 12, 18] -> correct counts and percentages", () => {
    expect(computeRatingDistribution([3, 8, 12, 18])).toEqual([
      { range: "0-5", count: 1, percentage: 25 },
      { range: "6-10", count: 1, percentage: 25 },
      { range: "11-15", count: 1, percentage: 25 },
      { range: "16-20", count: 1, percentage: 25 },
    ]);
  });

  it("all same range", () => {
    expect(computeRatingDistribution([1, 2, 3])).toEqual([
      { range: "0-5", count: 3, percentage: 100 },
      { range: "6-10", count: 0, percentage: 0 },
      { range: "11-15", count: 0, percentage: 0 },
      { range: "16-20", count: 0, percentage: 0 },
    ]);
  });
});

describe("sortReviews", () => {
  const r1 = review("a", 10, "2024-01-01");
  const r2 = review("b", 15, "2024-06-01");
  const r3 = review("c", 10, "2024-03-01");
  const reviews = [r1, r2, r3];

  it("date_desc sorts newest first", () => {
    const sorted = sortReviews(reviews, "date_desc");
    expect(sorted.map((r) => r.id)).toEqual(["b", "c", "a"]);
  });

  it("date_asc sorts oldest first", () => {
    const sorted = sortReviews(reviews, "date_asc");
    expect(sorted.map((r) => r.id)).toEqual(["a", "c", "b"]);
  });

  it("rating_desc sorts highest first, tie-breaks by date desc", () => {
    const sorted = sortReviews(reviews, "rating_desc");
    expect(sorted.map((r) => r.id)).toEqual(["b", "c", "a"]);
  });

  it("rating_asc sorts lowest first", () => {
    const sorted = sortReviews(reviews, "rating_asc");
    expect(sorted.map((r) => r.id)).toEqual(["c", "a", "b"]);
  });

  it("does not mutate original array", () => {
    const original = [...reviews];
    sortReviews(reviews, "date_desc");
    expect(reviews).toEqual(original);
  });
});

describe("transformReviewRecord", () => {
  it("maps snake_case fields to camelCase", () => {
    const result = transformReviewRecord({
      id: "1",
      game_id: "g1",
      game_slug: "slug",
      game_name: "Name",
      game_cover_url: "http://img.png",
      rating: 15,
      content: "Great",
      positive_points: ["a"],
      negative_points: ["b"],
      created_at: "2024-01-01",
      updated_at: "2024-01-02",
    });
    expect(result).toEqual({
      id: "1",
      gameId: "g1",
      gameSlug: "slug",
      gameName: "Name",
      gameCoverUrl: "http://img.png",
      rating: 15,
      content: "Great",
      positivePoints: ["a"],
      negativePoints: ["b"],
      createdAt: "2024-01-01",
      updatedAt: "2024-01-02",
    });
  });

  it("defaults null arrays to []", () => {
    const result = transformReviewRecord({
      id: "1",
      game_id: "g1",
      game_slug: "slug",
      game_name: "Name",
      game_cover_url: null,
      rating: 10,
      content: "",
      positive_points: null as unknown as string[],
      negative_points: null as unknown as string[],
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    });
    expect(result.positivePoints).toEqual([]);
    expect(result.negativePoints).toEqual([]);
  });
});
