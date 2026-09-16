import { describe, it, expect } from "vitest";
import { dedupeByGameId, normalizeTitle } from "@/lib/services/libraryGameResolver";

describe("dedupeByGameId", () => {
  it("collapses rows sharing the same game_id (keeps first by default)", () => {
    const rows = [
      { game_id: "a", source_id: "1" },
      { game_id: "b", source_id: "2" },
      { game_id: "a", source_id: "3" },
    ];
    const result = dedupeByGameId(rows);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.game_id).sort()).toEqual(["a", "b"]);
    // First occurrence of "a" is kept.
    expect(result.find((r) => r.game_id === "a")?.source_id).toBe("1");
  });

  it("uses the picker to choose which duplicate to keep", () => {
    const rows = [
      { game_id: "a", playtime: 10 },
      { game_id: "a", playtime: 50 },
      { game_id: "a", playtime: 20 },
    ];
    const result = dedupeByGameId(rows, (existing, candidate) =>
      candidate.playtime > existing.playtime ? candidate : existing
    );
    expect(result).toHaveLength(1);
    expect(result[0].playtime).toBe(50);
  });

  it("returns an empty array unchanged", () => {
    expect(dedupeByGameId([])).toEqual([]);
  });
});

describe("normalizeTitle", () => {
  it("strips trademark symbols, edition/platform suffixes and punctuation", () => {
    expect(normalizeTitle("Game B™")).toBe("game b");
    expect(normalizeTitle("HALO: The Master Chief Collection")).toBe(
      "halo the master chief collection"
    );
    expect(normalizeTitle("DOOM (PS4) Deluxe Edition")).toBe("doom");
  });
});
