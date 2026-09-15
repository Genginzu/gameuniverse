import { describe, it, expect } from "vitest";
import {
  computeSuggestionScore,
  rankSuggestions,
  suggestNext,
} from "@/lib/services/backlog/suggestNext";
import type { BacklogGame } from "@/types/backlog";

function makeGame(overrides: Partial<BacklogGame> = {}): BacklogGame {
  return {
    id: "g1",
    slug: "game-1",
    title: "Game 1",
    genres: [],
    developer: "Dev",
    status: "backlog",
    addedAt: "2024-01-01",
    priority: 0,
    backlogPosition: null,
    playTimeHours: 0,
    estimatedHours: 20,
    remainingHours: null,
    ...overrides,
  };
}

describe("computeSuggestionScore", () => {
  it("returns a value in [0, 1]", () => {
    const score = computeSuggestionScore(makeGame());
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("scores higher priority games above lower priority ones (all else equal)", () => {
    const high = computeSuggestionScore(makeGame({ priority: 3 }));
    const low = computeSuggestionScore(makeGame({ priority: 0 }));
    expect(high).toBeGreaterThan(low);
  });

  it("rewards games that fit the available time", () => {
    const context = { availableHours: 10 };
    const fits = computeSuggestionScore(makeGame({ estimatedHours: 8 }), context);
    const overshoots = computeSuggestionScore(makeGame({ estimatedHours: 40 }), context);
    expect(fits).toBeGreaterThan(overshoots);
  });

  it("rewards genre matches", () => {
    const context = { preferredGenreIds: ["rpg"] };
    const match = computeSuggestionScore(
      makeGame({ genres: [{ id: "rpg", name: "RPG" }] }),
      context
    );
    const noMatch = computeSuggestionScore(
      makeGame({ genres: [{ id: "fps", name: "FPS" }] }),
      context
    );
    expect(match).toBeGreaterThan(noMatch);
  });

  it("quick mood favours short games", () => {
    const context = { mood: "quick" as const };
    const short = computeSuggestionScore(makeGame({ estimatedHours: 5 }), context);
    const long = computeSuggestionScore(makeGame({ estimatedHours: 60 }), context);
    expect(short).toBeGreaterThan(long);
  });

  it("long mood favours long games", () => {
    const context = { mood: "long" as const };
    const short = computeSuggestionScore(makeGame({ estimatedHours: 5 }), context);
    const long = computeSuggestionScore(makeGame({ estimatedHours: 60 }), context);
    expect(long).toBeGreaterThan(short);
  });
});

describe("rankSuggestions", () => {
  it("returns an empty array for an empty backlog", () => {
    expect(rankSuggestions([])).toEqual([]);
  });

  it("respects the limit", () => {
    const games = [
      makeGame({ id: "a", title: "A" }),
      makeGame({ id: "b", title: "B" }),
      makeGame({ id: "c", title: "C" }),
    ];
    expect(rankSuggestions(games, {}, 2)).toHaveLength(2);
  });

  it("orders by descending score", () => {
    const games = [
      makeGame({ id: "low", priority: 0 }),
      makeGame({ id: "high", priority: 3 }),
      makeGame({ id: "mid", priority: 1 }),
    ];
    const ranked = rankSuggestions(games, {});
    expect(ranked.map((r) => r.game.id)).toEqual(["high", "mid", "low"]);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
  });

  it("includes human-readable reasons", () => {
    const game = makeGame({ priority: 3, estimatedHours: 6, status: "playing" });
    const [suggestion] = rankSuggestions([game], { availableHours: 10 });
    expect(suggestion.reasons).toContain("high-priority");
    expect(suggestion.reasons).toContain("fits-available-time");
    expect(suggestion.reasons).toContain("quick-to-finish");
    expect(suggestion.reasons).toContain("already-started");
  });

  it("breaks ties by priority then shorter estimate", () => {
    const games = [
      makeGame({ id: "longer", priority: 2, estimatedHours: 30 }),
      makeGame({ id: "shorter", priority: 2, estimatedHours: 10 }),
    ];
    const ranked = rankSuggestions(games, {});
    // Equal scores/priority → shorter estimate should come first.
    expect(ranked[0].game.id).toBe("shorter");
  });
});

describe("suggestNext", () => {
  it("returns null for an empty backlog", () => {
    expect(suggestNext([])).toBeNull();
  });

  it("returns the top-ranked game", () => {
    const games = [makeGame({ id: "low", priority: 0 }), makeGame({ id: "high", priority: 3 })];
    expect(suggestNext(games)?.game.id).toBe("high");
  });
});
