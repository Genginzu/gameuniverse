import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRpc, mockEvaluate } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockEvaluate: vi.fn(),
}));

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({ rpc: mockRpc }),
}));

vi.mock("@/lib/services/achievementEngine", () => ({
  AchievementEngine: { evaluate: mockEvaluate },
}));

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { rewardActivity } from "@/lib/services/activityRewards";
import type { ActivityEvent } from "@/types/activityRewards";
import type { AchievementCategory } from "@/types/achievement";
import type { CoinActivityType } from "@/types/coins";

beforeEach(() => {
  vi.clearAllMocks();
  mockRpc.mockResolvedValue({ data: { rewarded: true, amount: 10 }, error: null });
  mockEvaluate.mockResolvedValue({ newlyUnlocked: [], totalXpAwarded: 0, newLevel: null });
});

function coinCalls() {
  return mockRpc.mock.calls
    .filter(([fn]) => fn === "award_activity_reward")
    .map(([, args]) => args);
}

describe("rewardActivity", () => {
  const P = "u1";
  const singlePartyEvents: Array<{
    event: ActivityEvent;
    category: AchievementCategory | null;
    coins: [CoinActivityType, string] | null;
  }> = [
    {
      event: { kind: "library_game_added", userId: P, gameId: "g1" },
      category: "library",
      coins: ["library_add", "g1"],
    },
    {
      event: { kind: "review_created", userId: P, reviewId: "rev1" },
      category: "reviews",
      coins: ["review", "rev1"],
    },
    { event: { kind: "collection_created", userId: P }, category: "collections", coins: null },
    {
      event: { kind: "collection_item_added", userId: P, gameId: "g1" },
      category: null,
      coins: ["collection_add", "g1"],
    },
    {
      event: { kind: "post_created", userId: P, postId: "p1" },
      category: null,
      coins: ["post_create", "p1"],
    },
    {
      event: { kind: "post_comment_created", userId: P, commentId: "c1" },
      category: null,
      coins: ["post_comment", "c1"],
    },
    {
      event: { kind: "character_comment_created", userId: P, commentId: "c2" },
      category: null,
      coins: ["character_comment", "c2"],
    },
    {
      event: { kind: "character_favorited", userId: P, characterId: "ch1" },
      category: null,
      coins: ["character_favorite", "ch1"],
    },
    {
      event: { kind: "discussion_message_sent", userId: P, messageId: "m1" },
      category: null,
      coins: ["discussion_message", "m1"],
    },
    { event: { kind: "playtime_logged", userId: P }, category: "playtime", coins: null },
  ];

  it.each(singlePartyEvents)("rewards $event.kind", async ({ event, category, coins }) => {
    await rewardActivity(event);

    expect(mockEvaluate.mock.calls).toEqual(category ? [[P, category]] : []);
    expect(coinCalls()).toEqual(
      coins ? [{ p_player_id: P, p_activity_type: coins[0], p_reference_id: coins[1] }] : []
    );
  });

  it("rewards both the accepter and the requester of an accepted friendship", async () => {
    await rewardActivity({ kind: "friendship_accepted", accepterId: "a", requesterId: "r" });

    expect(mockEvaluate.mock.calls).toEqual(
      expect.arrayContaining([
        ["a", "social"],
        ["r", "social"],
      ])
    );
    expect(mockEvaluate).toHaveBeenCalledTimes(2);
    expect(coinCalls()).toEqual(
      expect.arrayContaining([
        { p_player_id: "a", p_activity_type: "friend_add", p_reference_id: "r" },
        { p_player_id: "r", p_activity_type: "friend_add", p_reference_id: "a" },
      ])
    );
    expect(coinCalls()).toHaveLength(2);
  });

  it("still pays the coins when the achievement evaluation fails", async () => {
    mockEvaluate.mockRejectedValue(new Error("engine down"));

    await expect(
      rewardActivity({ kind: "review_created", userId: "u1", reviewId: "rev1" })
    ).resolves.toBeUndefined();

    expect(coinCalls()).toEqual([
      { p_player_id: "u1", p_activity_type: "review", p_reference_id: "rev1" },
    ]);
  });

  it("still evaluates achievements and never throws when the coin reward fails", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "boom" } });

    await expect(
      rewardActivity({ kind: "review_created", userId: "u1", reviewId: "rev1" })
    ).resolves.toBeUndefined();

    expect(mockEvaluate.mock.calls).toEqual([["u1", "reviews"]]);
  });
});
