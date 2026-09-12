import { describe, it, expect, vi } from "vitest";
import {
  igdbCoverUrl,
  igdb1080pUrl,
  unixToDate,
  normalizeDate,
  sorted,
  fetchLocalGenres,
} from "@/lib/services/webhook-diff-helpers";

describe("webhook-diff-helpers pure functions", () => {
  it("igdbCoverUrl builds correct URL", () => {
    expect(igdbCoverUrl("abc123")).toBe(
      "https://images.igdb.com/igdb/image/upload/t_cover_big/abc123.jpg"
    );
  });

  it("igdb1080pUrl builds correct URL", () => {
    expect(igdb1080pUrl("xyz")).toBe("https://images.igdb.com/igdb/image/upload/t_1080p/xyz.jpg");
  });

  it("unixToDate converts timestamp to YYYY-MM-DD", () => {
    // 2024-01-15 00:00:00 UTC = 1705276800
    expect(unixToDate(1705276800)).toBe("2024-01-15");
  });

  it("normalizeDate trims ISO string to date only", () => {
    expect(normalizeDate("2024-01-15T12:00:00Z")).toBe("2024-01-15");
    expect(normalizeDate("2024-01-15")).toBe("2024-01-15");
  });

  it("sorted returns a sorted copy", () => {
    expect(sorted(["c", "a", "b"])).toEqual(["a", "b", "c"]);
    // Original not mutated
    const orig = ["z", "a"];
    sorted(orig);
    expect(orig).toEqual(["z", "a"]);
  });
});

describe("fetchLocalGenres", () => {
  it("returns genre slugs from supabase", async () => {
    const chain: any = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() =>
      Promise.resolve({
        data: [
          { genre_id: "g1", genres: { slug: "action" } },
          { genre_id: "g2", genres: { slug: "rpg" } },
        ],
        error: null,
      })
    );
    const supabase = { from: vi.fn(() => chain) } as any;

    const result = await fetchLocalGenres(supabase, "game-1");
    expect(result).toEqual(["action", "rpg"]);
    expect(supabase.from).toHaveBeenCalledWith("game_genres");
  });

  it("returns genre_id when slug is null", async () => {
    const chain: any = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() =>
      Promise.resolve({
        data: [{ genre_id: "fallback-id", genres: null }],
        error: null,
      })
    );
    const supabase = { from: vi.fn(() => chain) } as any;

    const result = await fetchLocalGenres(supabase, "game-1");
    expect(result).toEqual(["fallback-id"]);
  });
});
