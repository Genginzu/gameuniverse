import { describe, it, expect } from "vitest";
import { computeTimeSummary } from "@/lib/services/backlog/timeSummary";
import type { BacklogGame } from "@/types/backlog";

function makeGame(overrides: Partial<BacklogGame> = {}): BacklogGame {
  return {
    id: "g1",
    slug: "game-1",
    title: "Game 1",
    genres: [],
    platforms: [],
    developer: "Dev",
    status: "backlog",
    addedAt: "2024-01-01",
    priority: 0,
    backlogPosition: null,
    playTimeHours: 0,
    estimatedHours: 10,
    remainingHours: 10,
    ...overrides,
  };
}

describe("computeTimeSummary", () => {
  it("returns zeros for an empty backlog", () => {
    expect(computeTimeSummary([])).toEqual({
      gameCount: 0,
      totalEstimatedHours: 0,
      gamesWithoutEstimate: 0,
    });
  });

  it("sums remaining hours", () => {
    const summary = computeTimeSummary([
      makeGame({ remainingHours: 10 }),
      makeGame({ id: "g2", remainingHours: 20.5 }),
    ]);
    expect(summary.gameCount).toBe(2);
    expect(summary.totalEstimatedHours).toBe(30.5);
    expect(summary.gamesWithoutEstimate).toBe(0);
  });

  it("counts games without an estimate separately, but keeps fully-played (0h) games", () => {
    const summary = computeTimeSummary([
      makeGame({ remainingHours: 10 }),
      makeGame({ id: "g2", remainingHours: null }),
      makeGame({ id: "g3", remainingHours: 0 }),
    ]);
    expect(summary.gameCount).toBe(3);
    // 10 + 0 (fully played still has an estimate) = 10
    expect(summary.totalEstimatedHours).toBe(10);
    // Only the null-estimate game is uncounted.
    expect(summary.gamesWithoutEstimate).toBe(1);
  });
});
