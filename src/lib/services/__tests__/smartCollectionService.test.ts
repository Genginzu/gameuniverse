import { describe, it, expect } from "vitest";
import {
  generateSuggestions,
  DEFAULT_SUGGESTION_OPTIONS,
} from "../smartCollectionService";
import type { LibrarySuggestionGame } from "@/types/smartCollection";

/** Build a library game with sensible defaults. */
function game(overrides: Partial<LibrarySuggestionGame> = {}): LibrarySuggestionGame {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    slug: overrides.slug ?? "game",
    title: overrides.title ?? "Game",
    coverImage: overrides.coverImage ?? null,
    genres: overrides.genres ?? [],
    metascore: overrides.metascore ?? null,
    status: overrides.status ?? "owned",
    addedAt: overrides.addedAt ?? "2025-01-01T00:00:00.000Z",
    playTimeHours: overrides.playTimeHours ?? null,
    sourcePlatform: overrides.sourcePlatform ?? null,
  };
}

/** Build N games sharing the given overrides, with unique ids. */
function games(n: number, overrides: Partial<LibrarySuggestionGame> = {}): LibrarySuggestionGame[] {
  return Array.from({ length: n }, (_, i) => game({ ...overrides, id: `${overrides.id ?? "g"}-${i}` }));
}

describe("generateSuggestions - empty / invalid input", () => {
  it("returns an empty array for an empty library", () => {
    expect(generateSuggestions([])).toEqual([]);
  });

  it("returns an empty array for a non-array input", () => {
    // @ts-expect-error deliberately invalid
    expect(generateSuggestions(null)).toEqual([]);
  });
});

describe("generateSuggestions - genre criterion", () => {
  it("emits a genre suggestion once minGames is reached", () => {
    const lib = games(3, { genres: ["RPG"] });
    const result = generateSuggestions(lib);
    const genre = result.find((s) => s.criterion === "genre");
    expect(genre).toBeDefined();
    expect(genre?.titleKey).toBe("genre");
    expect(genre?.titleParams).toEqual({ genre: "RPG" });
    expect(genre?.gamesCount).toBe(3);
  });

  it("drops genres below the minGames threshold", () => {
    const lib = games(2, { genres: ["Puzzle"] });
    const result = generateSuggestions(lib);
    expect(result.find((s) => s.criterion === "genre")).toBeUndefined();
  });

  it("does not double count a genre repeated on the same game", () => {
    const lib = [
      game({ id: "a", genres: ["RPG", "RPG"] }),
      game({ id: "b", genres: ["RPG"] }),
      game({ id: "c", genres: ["RPG"] }),
    ];
    const genre = generateSuggestions(lib).find((s) => s.criterion === "genre");
    expect(genre?.gamesCount).toBe(3);
  });

  it("caps the number of genre suggestions", () => {
    const lib = [
      ...games(3, { id: "rpg", genres: ["RPG"] }),
      ...games(3, { id: "act", genres: ["Action"] }),
      ...games(3, { id: "adv", genres: ["Adventure"] }),
      ...games(3, { id: "str", genres: ["Strategy"] }),
      ...games(3, { id: "sim", genres: ["Simulation"] }),
    ];
    const genreCount = generateSuggestions(lib, { maxSuggestions: 50 }).filter(
      (s) => s.criterion === "genre"
    ).length;
    expect(genreCount).toBe(DEFAULT_SUGGESTION_OPTIONS.maxGenreSuggestions);
  });
});

describe("generateSuggestions - completion year criterion", () => {
  it("groups completed games by their added year", () => {
    const lib = [
      ...games(3, { id: "c25", status: "completed", addedAt: "2025-06-01T00:00:00.000Z" }),
      ...games(2, { id: "c24", status: "completed", addedAt: "2024-06-01T00:00:00.000Z" }),
    ];
    const result = generateSuggestions(lib);
    const year = result.find((s) => s.criterion === "completionYear");
    expect(year?.titleParams).toEqual({ year: 2025 });
    expect(year?.gamesCount).toBe(3);
    // 2024 has only 2 completed games -> below threshold.
    expect(result.filter((s) => s.criterion === "completionYear")).toHaveLength(1);
  });

  it("ignores non-completed games", () => {
    const lib = games(4, { status: "playing", addedAt: "2025-01-01T00:00:00.000Z" });
    expect(
      generateSuggestions(lib).find((s) => s.criterion === "completionYear")
    ).toBeUndefined();
  });
});

describe("generateSuggestions - duration criterion", () => {
  it("emits a short-games suggestion for playtime under the threshold", () => {
    const lib = games(3, { playTimeHours: 5 });
    const short = generateSuggestions(lib).find(
      (s) => s.criterion === "duration" && s.titleKey === "durationShort"
    );
    expect(short?.titleParams).toEqual({ hours: DEFAULT_SUGGESTION_OPTIONS.shortDurationHours });
    expect(short?.gamesCount).toBe(3);
  });

  it("emits a long-games suggestion for playtime over the threshold", () => {
    const lib = games(3, { playTimeHours: 60 });
    const long = generateSuggestions(lib).find(
      (s) => s.criterion === "duration" && s.titleKey === "durationLong"
    );
    expect(long?.gamesCount).toBe(3);
  });

  it("ignores games with zero or null playtime", () => {
    const lib = [...games(2, { playTimeHours: 0 }), ...games(2, { playTimeHours: null })];
    expect(generateSuggestions(lib).find((s) => s.criterion === "duration")).toBeUndefined();
  });
});

describe("generateSuggestions - platform criterion", () => {
  it("groups games by source platform, excluding manual", () => {
    const lib = [
      ...games(3, { id: "steam", sourcePlatform: "steam" }),
      ...games(5, { id: "manual", sourcePlatform: "manual" }),
    ];
    const result = generateSuggestions(lib);
    const platform = result.find((s) => s.criterion === "platform");
    expect(platform?.titleParams).toEqual({ platform: "steam" });
    expect(result.filter((s) => s.criterion === "platform")).toHaveLength(1);
  });
});

describe("generateSuggestions - rating criterion", () => {
  it("emits a top-rated suggestion for high metascores", () => {
    const lib = games(3, { metascore: 90 });
    const rating = generateSuggestions(lib).find((s) => s.criterion === "rating");
    expect(rating?.gamesCount).toBe(3);
  });

  it("ignores games below the rating threshold", () => {
    const lib = games(3, { metascore: 70 });
    expect(generateSuggestions(lib).find((s) => s.criterion === "rating")).toBeUndefined();
  });
});

describe("generateSuggestions - global behavior", () => {
  it("excludes wishlist games from every criterion", () => {
    const lib = games(5, { status: "wishlist", genres: ["RPG"], metascore: 95, playTimeHours: 5 });
    expect(generateSuggestions(lib)).toEqual([]);
  });

  it("caps the total number of suggestions", () => {
    const lib = [
      ...games(3, { id: "rpg", genres: ["RPG"] }),
      ...games(3, { id: "act", genres: ["Action"] }),
      ...games(3, { id: "adv", genres: ["Adventure"] }),
      ...games(3, { id: "str", genres: ["Strategy"] }),
      ...games(3, { id: "sim", genres: ["Simulation"] }),
      ...games(3, { id: "top", metascore: 95 }),
    ];
    const result = generateSuggestions(lib, { maxSuggestions: 3 });
    expect(result).toHaveLength(3);
  });

  it("is deterministic and sorted by game count desc", () => {
    const lib = [
      ...games(5, { id: "rpg", genres: ["RPG"] }),
      ...games(3, { id: "act", genres: ["Action"] }),
    ];
    const a = generateSuggestions(lib);
    const b = generateSuggestions(lib);
    expect(a).toEqual(b);
    expect(a[0].gamesCount).toBeGreaterThanOrEqual(a[1].gamesCount);
  });

  it("builds at most 4 previews, preferring games with a cover", () => {
    const lib = [
      game({ id: "1", genres: ["RPG"], coverImage: null }),
      game({ id: "2", genres: ["RPG"], coverImage: "c2.jpg" }),
      game({ id: "3", genres: ["RPG"], coverImage: "c3.jpg" }),
      game({ id: "4", genres: ["RPG"], coverImage: "c4.jpg" }),
      game({ id: "5", genres: ["RPG"], coverImage: "c5.jpg" }),
    ];
    const genre = generateSuggestions(lib).find((s) => s.criterion === "genre");
    expect(genre?.previewGames).toHaveLength(4);
    expect(genre?.previewGames.every((p) => p.coverImage !== null)).toBe(true);
  });
});

describe("generateSuggestions - excludeGameIds", () => {
  it("excludes games already in a collection from every criterion", () => {
    const lib = [
      game({ id: "a", genres: ["RPG"] }),
      game({ id: "b", genres: ["RPG"] }),
      game({ id: "c", genres: ["RPG"] }),
    ];
    // Two of the three RPGs are already collected -> below minGames.
    const result = generateSuggestions(lib, { excludeGameIds: ["a", "b"] });
    expect(result.find((s) => s.criterion === "genre")).toBeUndefined();
  });

  it("never re-proposes an identical collection (all games excluded)", () => {
    const lib = games(4, { id: "rpg", genres: ["RPG"] });
    const excludeGameIds = lib.map((g) => g.id);
    expect(generateSuggestions(lib, { excludeGameIds })).toEqual([]);
  });

  it("still suggests when enough non-collected games remain", () => {
    const lib = games(4, { id: "rpg", genres: ["RPG"] });
    // Exclude only one -> 3 remain, still at threshold.
    const genre = generateSuggestions(lib, { excludeGameIds: [lib[0].id] }).find(
      (s) => s.criterion === "genre"
    );
    expect(genre?.gamesCount).toBe(3);
    expect(genre?.gameIds).not.toContain(lib[0].id);
  });
});
