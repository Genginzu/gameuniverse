export interface PlayerWallet {
  playerId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface CoinTransaction {
  id: string;
  playerId: string;
  amount: number;
  type: CoinTransactionType;
  activityType: CoinActivityType | null;
  referenceId: string | null;
  description: string | null;
  balanceAfter: number;
  createdAt: string;
}

export type CoinTransactionType =
  | "signup_bonus"
  | "activity_reward"
  | "achievement_reward"
  | "prediction_bet"
  | "prediction_win"
  | "purchase"
  | "admin_grant";

export type CoinActivityType =
  | "review"
  | "library_add"
  | "library_status_change"
  | "playtime_log"
  | "collection_add"
  | "game_rating"
  | "character_favorite"
  | "character_vote"
  | "post_create"
  | "post_comment"
  | "discussion_message"
  | "friend_add";

export interface CoinRewardConfig {
  activityType: CoinActivityType;
  amount: number;
  cooldownSeconds: number | null;
  dailyCap: number | null;
  enabled: boolean;
}

export interface RewardResult {
  rewarded: boolean;
  amount: number;
  reason?: string;
}

export interface WalletResponse {
  wallet: PlayerWallet;
}

export interface TransactionsResponse {
  transactions: CoinTransaction[];
  total: number;
}
