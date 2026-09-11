import { describe, it, expect } from "vitest";
import {
  computeFavoriteGenre,
  computeMostActiveMonth,
  formatPlayTime,
  type LibraryEntryWithGenres,
  type LibraryEntryWithDate,
} from "@/lib/services/playerStatsService";

describe("computeFavoriteGenre", () => {
  it("should return null for empty library", () => {
    expect(computeFavoriteGenre([])).toBeNull();
  });

  it("should return null when all entries have 0 play time", () => {
    const entries: LibraryEntryWithGenres[] = [
      { playTimeHours: 0, genres: ["RPG"] },
      { playTimeHours: 0, genres: ["Action"] },
    ];
    expect(computeFavoriteGenre(entries)).toBeNull();
  });

  it("should return null when entries have no genres", () => {
    const entries: LibraryEntryWithGenres[] = [{ playTimeHours: 10, genres: [] }];
    expect(computeFavoriteGenre(entries)).toBeNull();
  });

  it("should return the single genre for a single-genre game", () => {
    const entries: LibraryEntryWithGenres[] = [{ playTimeHours: 50, genres: ["RPG"] }];
    const result = computeFavoriteGenre(entries);
    expect(result).toEqual({ name: "RPG", playTime: 50 });
  });

  it("should split play time equally across multiple genres", () => {
    // 60h game with 3 genres → 20h per genre
    const entries: LibraryEntryWithGenres[] = [
      { playTimeHours: 60, genres: ["Action", "RPG", "Adventure"] },
    ];
    const result = computeFavoriteGenre(entries);
    // All genres get 20h, alphabetically first wins
    expect(result).toEqual({ name: "Action", playTime: 20 });
  });

  it("should accumulate weighted time across multiple games", () => {
    const entries: LibraryEntryWithGenres[] = [
      { playTimeHours: 100, genres: ["RPG"] }, // RPG: 100
      { playTimeHours: 60, genres: ["RPG", "Action"] }, // RPG: 30, Action: 30
    ];
    // RPG total: 130, Action total: 30
    const result = computeFavoriteGenre(entries);
    expect(result).toEqual({ name: "RPG", playTime: 130 });
  });

  it("should select alphabetically first genre on tie", () => {
    const entries: LibraryEntryWithGenres[] = [
      { playTimeHours: 50, genres: ["Zzz"] },
      { playTimeHours: 50, genres: ["Aaa"] },
    ];
    const result = computeFavoriteGenre(entries);
    expect(result?.name).toBe("Aaa");
    expect(result?.playTime).toBe(50);
  });

  it("should ignore entries with negative play time", () => {
    const entries: LibraryEntryWithGenres[] = [
      { playTimeHours: -10, genres: ["RPG"] },
      { playTimeHours: 20, genres: ["Action"] },
    ];
    const result = computeFavoriteGenre(entries);
    expect(result).toEqual({ name: "Action", playTime: 20 });
  });

  it("should round playTime to 1 decimal", () => {
    // 10h / 3 genres = 3.333...
    const entries: LibraryEntryWithGenres[] = [{ playTimeHours: 10, genres: ["A", "B", "C"] }];
    const result = computeFavoriteGenre(entries);
    expect(result?.playTime).toBe(3.3);
  });
});

describe("formatPlayTime", () => {
  it("should format with French locale separators", () => {
    const result = formatPlayTime(1234.5, "fr");
    // French uses non-breaking space as thousands separator and comma for decimal
    expect(result).toContain("1");
    expect(result).toContain("234");
    expect(result).toContain("5");
  });

  it("should format with English locale separators", () => {
    const result = formatPlayTime(1234.5, "en");
    expect(result).toBe("1,234.5");
  });

  it("should show 1 decimal for whole numbers", () => {
    const result = formatPlayTime(100, "en");
    expect(result).toBe("100.0");
  });

  it("should handle zero", () => {
    const result = formatPlayTime(0, "en");
    expect(result).toBe("0.0");
  });

  it("should round to 1 decimal", () => {
    const result = formatPlayTime(1.999, "en");
    expect(result).toBe("2.0");
  });
});

describe("computeMostActiveMonth", () => {
  it("should return null for empty entries", () => {
    expect(computeMostActiveMonth([])).toBeNull();
  });

  it("should return the single month when only one entry", () => {
    const entries: LibraryEntryWithDate[] = [{ addedAt: "2024-03-15T10:00:00Z" }];
    expect(computeMostActiveMonth(entries)).toEqual({ month: 3, gamesAdded: 1 });
  });

  it("should return the month with the most entries", () => {
    const entries: LibraryEntryWithDate[] = [
      { addedAt: "2024-01-10T00:00:00Z" },
      { addedAt: "2024-03-05T00:00:00Z" },
      { addedAt: "2024-03-20T00:00:00Z" },
      { addedAt: "2024-03-25T00:00:00Z" },
      { addedAt: "2024-07-01T00:00:00Z" },
    ];
    expect(computeMostActiveMonth(entries)).toEqual({ month: 3, gamesAdded: 3 });
  });

  it("should return the earliest month on tie", () => {
    const entries: LibraryEntryWithDate[] = [
      { addedAt: "2024-06-01T00:00:00Z" },
      { addedAt: "2024-06-15T00:00:00Z" },
      { addedAt: "2024-02-10T00:00:00Z" },
      { addedAt: "2024-02-20T00:00:00Z" },
    ];
    // Both months have 2 entries, February (2) is earlier than June (6)
    expect(computeMostActiveMonth(entries)).toEqual({ month: 2, gamesAdded: 2 });
  });

  it("should handle entries spread across all 12 months", () => {
    const entries: LibraryEntryWithDate[] = Array.from({ length: 12 }, (_, i) => ({
      addedAt: `2024-${String(i + 1).padStart(2, "0")}-15T00:00:00Z`,
    }));
    // All months have 1 entry, earliest (January) wins
    expect(computeMostActiveMonth(entries)).toEqual({ month: 1, gamesAdded: 1 });
  });

  it("should handle December entries correctly", () => {
    const entries: LibraryEntryWithDate[] = [
      { addedAt: "2024-12-01T00:00:00Z" },
      { addedAt: "2024-12-25T00:00:00Z" },
    ];
    expect(computeMostActiveMonth(entries)).toEqual({ month: 12, gamesAdded: 2 });
  });
});
