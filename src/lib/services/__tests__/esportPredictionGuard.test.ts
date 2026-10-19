import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/pandascore/client", () => ({ getMatchById: vi.fn() }));

import { assertBettable, PredictionRejectedError } from "@/lib/services/esportPredictionGuard";
import type { PandaScoreMatch } from "@/lib/pandascore/types";

const NOW = Date.parse("2026-10-19T12:00:00Z");

function match(overrides: Partial<PandaScoreMatch> = {}): PandaScoreMatch {
  return {
    id: 42,
    name: "Team A vs Team B",
    status: "not_started",
    begin_at: "2026-10-19T18:00:00Z",
    videogame: { id: 1, name: "League of Legends", slug: "league-of-legends" },
    opponents: [
      { type: "Team", opponent: { id: 7, name: "Team A" } },
      { type: "Team", opponent: { id: 9, name: "Team B" } },
    ],
    ...overrides,
  } as PandaScoreMatch;
}

describe("assertBettable", () => {
  it("returns the match facts from PandaScore, not from the client", () => {
    expect(assertBettable(match(), 7, NOW)).toEqual({
      matchId: 42,
      matchName: "Team A vs Team B",
      game: "League of Legends",
      winnerId: 7,
      winnerName: "Team A",
    });
  });

  it.each(["finished", "running", "canceled", "postponed"] as const)(
    "rejects a %s match",
    (status) => {
      expect(() => assertBettable(match({ status }), 7, NOW)).toThrow(PredictionRejectedError);
    }
  );

  it("rejects a match whose start time has passed even if not marked running yet", () => {
    expect(() => assertBettable(match({ begin_at: "2026-10-19T11:59:00Z" }), 7, NOW)).toThrow(
      PredictionRejectedError
    );
  });

  it("rejects a winner that does not play the match", () => {
    expect(() => assertBettable(match(), 1234, NOW)).toThrow(PredictionRejectedError);
  });

  it("rejects a match without two confirmed opponents", () => {
    expect(() =>
      assertBettable(match({ opponents: [{ type: "Team", opponent: { id: 7, name: "Team A" } }] as PandaScoreMatch["opponents"] }), 7, NOW)
    ).toThrow(PredictionRejectedError);
  });
});
