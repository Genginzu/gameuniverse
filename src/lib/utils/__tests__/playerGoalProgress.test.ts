import { describe, it, expect } from "vitest";
import { computeGoalProgress, isGoalExpired } from "@/lib/utils/playerGoalProgress";

const emptySources = { sessions: [], completedGames: [], reviews: [], collections: [] };

describe("computeGoalProgress", () => {
  it("sums session hours played inside the goal window", () => {
    const goal = { goalType: "play_time_hours" as const, createdAt: "2026-10-01T15:00:00Z", deadline: null };
    const progress = computeGoalProgress(goal, {
      ...emptySources,
      sessions: [
        { startedAt: "2026-10-01T09:00:00Z", durationMinutes: 90 },
        { startedAt: "2026-10-30T20:00:00Z", durationMinutes: 900 },
        { startedAt: "2026-09-30T20:00:00Z", durationMinutes: 600 },
      ],
    });
    expect(progress).toBe(16.5);
  });

  it("ignores activity after the deadline day", () => {
    const goal = { goalType: "reviews_to_write" as const, createdAt: "2026-04-01T00:00:00Z", deadline: "2026-04-19" };
    const progress = computeGoalProgress(goal, {
      ...emptySources,
      reviews: [{ createdAt: "2026-04-19T23:00:00Z" }, { createdAt: "2026-04-20T00:00:01Z" }],
    });
    expect(progress).toBe(1);
  });
});

describe("isGoalExpired", () => {
  const base = { createdAt: "2026-04-01T00:00:00Z", deadline: "2026-04-19", targetValue: 15 };

  it("flags an unreached goal past its deadline", () => {
    expect(isGoalExpired({ ...base, currentValue: 3 }, new Date("2026-10-31T00:00:00Z"))).toBe(true);
  });

  it("keeps a goal active on its deadline day", () => {
    expect(isGoalExpired({ ...base, currentValue: 3 }, new Date("2026-04-19T22:00:00Z"))).toBe(false);
  });

  it("never flags a completed goal", () => {
    expect(isGoalExpired({ ...base, currentValue: 15 }, new Date("2026-10-31T00:00:00Z"))).toBe(false);
  });
});
