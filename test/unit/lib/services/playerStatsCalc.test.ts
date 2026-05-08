import { describe, it, expect } from "vitest";
import {
  attributableTo,
  computeActivity,
  computeCurrentStreak,
  computeGameBreakdown,
  computeOpponents,
  countTitles,
  teamThatPlayed,
} from "@/lib/services/esport/playerStatsCalc";

describe("attributableTo", () => {
  const periods = [
    { team_id: "A", started_at: "2024-01-01T00:00:00Z", ended_at: "2024-06-01T00:00:00Z" },
    { team_id: "B", started_at: "2024-06-01T00:00:00Z", ended_at: null },
  ];

  it("includes a match inside the closed period", () => {
    const t = new Date("2024-03-01T00:00:00Z").getTime();
    expect(attributableTo(periods, "A", t)).toBe(true);
  });

  it("excludes a match before the period started", () => {
    const t = new Date("2023-01-01T00:00:00Z").getTime();
    expect(attributableTo(periods, "A", t)).toBe(false);
  });

  it("includes a match in the open-ended (current) period", () => {
    const t = new Date("2030-01-01T00:00:00Z").getTime();
    expect(attributableTo(periods, "B", t)).toBe(true);
  });

  it("falls back to attributing matches with unknown date", () => {
    expect(attributableTo(periods, "A", null)).toBe(true);
  });
});

describe("teamThatPlayed", () => {
  const teamIds = new Set(["A", "B"]);

  it("returns the player's team when on opponent1 side", () => {
    expect(
      teamThatPlayed(
        { status: "finished", begin_at: null, game: null, opponent1_id: "A", opponent2_id: "X", winner_id: null },
        teamIds
      )
    ).toBe("A");
  });

  it("returns the player's team when on opponent2 side", () => {
    expect(
      teamThatPlayed(
        { status: "finished", begin_at: null, game: null, opponent1_id: "X", opponent2_id: "B", winner_id: null },
        teamIds
      )
    ).toBe("B");
  });

  it("returns null when neither side is the player's team", () => {
    expect(
      teamThatPlayed(
        { status: "finished", begin_at: null, game: null, opponent1_id: "X", opponent2_id: "Y", winner_id: null },
        teamIds
      )
    ).toBeNull();
  });
});

describe("countTitles", () => {
  const periods = [
    { team_id: "A", started_at: "2024-01-01T00:00:00Z", ended_at: "2024-12-31T00:00:00Z" },
  ];

  it("counts wins inside the period", () => {
    const tournaments = [
      { begin_at: "2024-03-01T00:00:00Z", end_at: "2024-04-01T00:00:00Z", winner_id: "A" },
    ];
    expect(countTitles(tournaments, periods)).toBe(1);
  });

  it("ignores tournaments outside the period", () => {
    const tournaments = [
      { begin_at: "2023-01-01T00:00:00Z", end_at: "2023-02-01T00:00:00Z", winner_id: "A" },
    ];
    expect(countTitles(tournaments, periods)).toBe(0);
  });

  it("ignores tournaments with no winner", () => {
    const tournaments = [
      { begin_at: "2024-03-01T00:00:00Z", end_at: "2024-04-01T00:00:00Z", winner_id: null },
    ];
    expect(countTitles(tournaments, periods)).toBe(0);
  });

  it("falls back to begin_at when end_at is missing", () => {
    const tournaments = [
      { begin_at: "2024-05-01T00:00:00Z", end_at: null, winner_id: "A" },
    ];
    expect(countTitles(tournaments, periods)).toBe(1);
  });
});

describe("computeCurrentStreak", () => {
  it("returns null type for an empty list", () => {
    expect(computeCurrentStreak([])).toEqual({ type: null, length: 0 });
  });

  it("returns the head outcome and counts until it flips", () => {
    expect(computeCurrentStreak(["win", "win", "win", "loss", "win"])).toEqual({
      type: "win",
      length: 3,
    });
  });

  it("returns a 1-length streak when the head differs from the next", () => {
    expect(computeCurrentStreak(["loss", "win", "win"])).toEqual({
      type: "loss",
      length: 1,
    });
  });
});

describe("computeActivity", () => {
  const NOW = new Date("2026-05-08T00:00:00Z").getTime();

  it("counts matches in the last 30 days only", () => {
    const matches = [
      { outcome: "win" as const, matchTimeMs: NOW - 5 * 24 * 60 * 60 * 1000 },
      { outcome: "loss" as const, matchTimeMs: NOW - 25 * 24 * 60 * 60 * 1000 },
      { outcome: "win" as const, matchTimeMs: NOW - 60 * 24 * 60 * 60 * 1000 }, // out
    ];
    const w = computeActivity(matches, NOW);
    expect(w).toEqual({ days: 30, matches: 2, wins: 1, losses: 1 });
  });

  it("ignores draws in win/loss counters but still counts matches", () => {
    const matches = [
      { outcome: "draw" as const, matchTimeMs: NOW - 10 * 24 * 60 * 60 * 1000 },
    ];
    expect(computeActivity(matches, NOW)).toEqual({ days: 30, matches: 1, wins: 0, losses: 0 });
  });
});

describe("computeOpponents", () => {
  it("ignores opponents with fewer than 3 matches", () => {
    const records = [
      { opponentName: "X", outcome: "win" as const },
      { opponentName: "X", outcome: "win" as const },
    ];
    const r = computeOpponents(records);
    expect(r.best).toBeNull();
    expect(r.worst).toBeNull();
    expect(r.all).toEqual([]);
  });

  it("identifies best and worst opponents above the threshold", () => {
    const records = [
      // vs A: 3W
      { opponentName: "A", outcome: "win" as const },
      { opponentName: "A", outcome: "win" as const },
      { opponentName: "A", outcome: "win" as const },
      // vs B: 1W 2L
      { opponentName: "B", outcome: "win" as const },
      { opponentName: "B", outcome: "loss" as const },
      { opponentName: "B", outcome: "loss" as const },
    ];
    const r = computeOpponents(records);
    expect(r.best?.name).toBe("A");
    expect(r.best?.winRate).toBe(1);
    expect(r.worst?.name).toBe("B");
    expect(r.worst?.winRate).toBeCloseTo(1 / 3);
  });
});

describe("computeGameBreakdown", () => {
  it("aggregates per game and sorts by match count desc", () => {
    const records = [
      { game: "LoL", outcome: "win" as const },
      { game: "LoL", outcome: "win" as const },
      { game: "LoL", outcome: "loss" as const },
      { game: "CS", outcome: "win" as const },
    ];
    const result = computeGameBreakdown(records);
    expect(result).toEqual([
      { game: "LoL", matches: 3, wins: 2, losses: 1, winRate: 2 / 3 },
      { game: "CS", matches: 1, wins: 1, losses: 0, winRate: 1 },
    ]);
  });

  it("skips records without a game label", () => {
    const records = [{ game: null, outcome: "win" as const }];
    expect(computeGameBreakdown(records)).toEqual([]);
  });
});
