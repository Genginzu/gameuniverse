import { describe, it, expect } from "vitest";
import {
  computeAverageRating,
  computeCollectionCompletion,
  computeCollectionPlaytime,
  computeCollectionAdvancedStats,
  emptyCollectionAdvancedStats,
  type CollectionGameData,
  type OwnerLibraryEntry,
} from "../collectionAdvancedStats";

describe("computeAverageRating", () => {
  it("returns null when no rating is present", () => {
    expect(computeAverageRating([])).toBeNull();
    expect(computeAverageRating([null, null])).toBeNull();
  });

  it("ignores null/NaN ratings and averages the rest, rounded to 1 decimal", () => {
    expect(computeAverageRating([80, 90, null])).toBe(85);
    expect(computeAverageRating([70, 75, 78])).toBe(74.3);
    expect(computeAverageRating([NaN, 60])).toBe(60);
  });
});

describe("computeCollectionCompletion", () => {
  it("counts completed entries and computes an integer percentage", () => {
    const library: OwnerLibraryEntry[] = [
      { status: "completed", playTimeHours: 1 },
      { status: "completed", playTimeHours: 2 },
      { status: "playing", playTimeHours: 3 },
    ];
    expect(computeCollectionCompletion(library, 4)).toEqual({
      completedGames: 2,
      completionRate: 50,
    });
  });

  it("returns 0 rate when the collection has no games", () => {
    expect(computeCollectionCompletion([], 0)).toEqual({ completedGames: 0, completionRate: 0 });
  });

  it("rounds the percentage", () => {
    const library: OwnerLibraryEntry[] = [{ status: "completed", playTimeHours: 0 }];
    // 1 / 3 -> 33.33% -> 33
    expect(computeCollectionCompletion(library, 3).completionRate).toBe(33);
  });
});

describe("computeCollectionPlaytime", () => {
  it("sums playtime rounded to 1 decimal", () => {
    const library: OwnerLibraryEntry[] = [
      { status: "completed", playTimeHours: 10.25 },
      { status: "playing", playTimeHours: 5.1 },
    ];
    expect(computeCollectionPlaytime(library)).toBe(15.4);
  });

  it("returns 0 for an empty library", () => {
    expect(computeCollectionPlaytime([])).toBe(0);
  });
});

describe("computeCollectionAdvancedStats", () => {
  const games: CollectionGameData[] = [
    { metascore: 90, genres: ["RPG", "Action"], platforms: ["PC"] },
    { metascore: 80, genres: ["RPG"], platforms: ["PC", "PS5"] },
    { metascore: null, genres: ["Indie"], platforms: ["Switch"] },
  ];
  const library: OwnerLibraryEntry[] = [
    { status: "completed", playTimeHours: 12 },
    { status: "playing", playTimeHours: 8 },
  ];

  it("assembles all metrics", () => {
    const stats = computeCollectionAdvancedStats(games, library);

    expect(stats.totalGames).toBe(3);
    expect(stats.averageRating).toBe(85);
    expect(stats.completedGames).toBe(1);
    expect(stats.completionRate).toBe(33);
    expect(stats.totalPlaytimeHours).toBe(20);
  });

  it("computes genre distribution with percentages", () => {
    const stats = computeCollectionAdvancedStats(games, library);
    const rpg = stats.genreDistribution.find((g) => g.genre === "RPG");
    expect(rpg?.count).toBe(2);
    // 4 total genre assignments -> RPG = 2/4 = 50%
    expect(rpg?.percentage).toBe(50);
  });

  it("computes platform distribution with percentages", () => {
    const stats = computeCollectionAdvancedStats(games, library);
    const pc = stats.platformDistribution.find((p) => p.platform === "PC");
    expect(pc?.count).toBe(2);
  });
});

describe("emptyCollectionAdvancedStats", () => {
  it("returns a zeroed stats object", () => {
    expect(emptyCollectionAdvancedStats()).toEqual({
      totalGames: 0,
      genreDistribution: [],
      platformDistribution: [],
      averageRating: null,
      completedGames: 0,
      completionRate: 0,
      totalPlaytimeHours: 0,
    });
  });
});
