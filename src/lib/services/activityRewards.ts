import { AchievementEngine } from "@/lib/services/achievementEngine";
import { CoinService } from "@/lib/services/coinService";
import { logger } from "@/lib/logger";
import type { ActivityEvent } from "@/types/activityRewards";
import type { AchievementCategory } from "@/types/achievement";
import type { CoinActivityType } from "@/types/coins";

interface RewardedParty {
  playerId: string;
  achievementCategory?: AchievementCategory;
  coins?: { activityType: CoinActivityType; referenceId: string };
}

function party(
  playerId: string,
  achievementCategory: AchievementCategory | null,
  coins?: [CoinActivityType, string]
): RewardedParty {
  return {
    playerId,
    achievementCategory: achievementCategory ?? undefined,
    coins: coins && { activityType: coins[0], referenceId: coins[1] },
  };
}

function rewardedParties(event: ActivityEvent): RewardedParty[] {
  switch (event.kind) {
    case "library_game_added":
      return [party(event.userId, "library", ["library_add", event.gameId])];
    case "review_created":
      return [party(event.userId, "reviews", ["review", event.reviewId])];
    case "friendship_accepted":
      // Keyed by the friend's id (not the friendship row) so unfriending and
      // re-adding the same player never pays twice.
      return [
        party(event.accepterId, "social", ["friend_add", event.requesterId]),
        party(event.requesterId, "social", ["friend_add", event.accepterId]),
      ];
    case "collection_created":
      return [party(event.userId, "collections")];
    case "collection_item_added":
      return [party(event.userId, null, ["collection_add", event.gameId])];
    case "post_created":
      return [party(event.userId, null, ["post_create", event.postId])];
    case "post_comment_created":
      return [party(event.userId, null, ["post_comment", event.commentId])];
    case "character_comment_created":
      return [party(event.userId, null, ["character_comment", event.commentId])];
    case "character_favorited":
      return [party(event.userId, null, ["character_favorite", event.characterId])];
    case "discussion_message_sent":
      return [party(event.userId, null, ["discussion_message", event.messageId])];
    case "playtime_logged":
      return [party(event.userId, "playtime")];
  }
}

async function rewardParty(rewarded: RewardedParty): Promise<void> {
  const { playerId, achievementCategory, coins } = rewarded;
  const parts: Promise<unknown>[] = [];
  if (achievementCategory) {
    parts.push(AchievementEngine.evaluate(playerId, achievementCategory));
  }
  if (coins) {
    parts.push(CoinService.rewardActivity(playerId, coins.activityType, coins.referenceId));
  }
  const results = await Promise.allSettled(parts);
  for (const result of results) {
    if (result.status === "rejected") {
      logger.error("Activity reward failed", { playerId, error: result.reason });
    }
  }
}

/**
 * Rewards an activity event: unlocks achievements (and their XP) and pays GU
 * Coins to every rewarded party. Never throws; each part is independent, so a
 * failed achievement evaluation never prevents the coins.
 */
export async function rewardActivity(event: ActivityEvent): Promise<void> {
  await Promise.all(rewardedParties(event).map(rewardParty));
}
