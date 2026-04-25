import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/services/igdbService", () => ({
  IGDBService: { buildImageUrl: vi.fn() },
}));
vi.mock("../../../scripts/igdb-import/games/video-transform", () => ({
  transformIgdbVideos: vi.fn(() => []),
}));

import { syncAgeRatings } from "@/lib/services/igdb-sync-fields-extended";
import type { IGDBGame } from "@/types/igdb";

function makeSupa() {
  const calls: { table: string; method: string; args: any[] }[] = [];
  const chain: any = {};
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve({ data: { id: "rating-1" }, error: null }));
  const supa = {
    from: vi.fn((t: string) => {
      calls.push({ table: t, method: "from", args: [t] });
      return chain;
    }),
    _calls: calls,
    _chain: chain,
  };
  return supa as any;
}

const baseGame: Partial<IGDBGame> = { id: 1, name: "Test", slug: "test" };

describe("syncAgeRatings", () => {
  it("deletes existing ratings then inserts new ones", async () => {
    const supa = makeSupa();
    const game = {
      ...baseGame,
      age_ratings: [{ id: 1, organization: 1, rating_category: 1, rating: 6 }],
    } as IGDBGame;

    await syncAgeRatings(supa, "game-1", game);

    const tables = supa._calls.map((c: any) => c.args[0]);
    expect(tables).toContain("game_ratings");
    expect(tables).toContain("rating_systems");
    expect(supa._chain.delete).toHaveBeenCalled();
    expect(supa._chain.insert).toHaveBeenCalled();
  });

  it("handles empty age_ratings", async () => {
    const supa = makeSupa();
    const game = { ...baseGame, age_ratings: [] } as IGDBGame;

    await syncAgeRatings(supa, "game-1", game);

    // Only the delete call on game_ratings, no insert on ratings
    expect(supa._chain.delete).toHaveBeenCalled();
    // rating_systems should not be queried
    const rsTables = supa._calls.filter((c: any) => c.args[0] === "rating_systems");
    expect(rsTables).toHaveLength(0);
  });

  it("skips ratings with missing organization", async () => {
    const supa = makeSupa();
    const game = {
      ...baseGame,
      age_ratings: [{ id: 1, rating_category: 1, rating: 6 } as any],
    } as IGDBGame;

    await syncAgeRatings(supa, "game-1", game);
    const rsTables = supa._calls.filter((c: any) => c.args[0] === "rating_systems");
    expect(rsTables).toHaveLength(0);
  });
});
