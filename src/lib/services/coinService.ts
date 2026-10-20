import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { untypedTable } from "@/lib/utils/untypedTable";
import { logger } from "@/lib/logger";
import type {
  PlayerWallet,
  CoinTransaction,
  CoinTransactionType,
  CoinActivityType,
  CoinRewardConfig,
  RewardResult,
} from "@/types/coins";

const SIGNUP_BONUS = 500;

/**
 * Service for managing GU Coins: wallets, transactions, and activity rewards.
 * All methods use the service-role Supabase client (supabase-admin.ts) because
 * coin_transactions / player_wallets are server-only writes (issue #372). It is
 * always invoked from trusted server code with an explicit playerId.
 */
export class CoinService {
  static async getWallet(playerId: string): Promise<PlayerWallet> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await untypedTable(supabase, "player_wallets")
      .select("player_id, balance, total_earned, total_spent")
      .eq("player_id", playerId)
      .single();

    if (error?.code === "PGRST116") {
      // Wallet doesn't exist yet — create with signup bonus
      return this.initializeWallet(playerId);
    }
    if (error || !data) {
      logger.error("Failed to fetch wallet", { playerId, error });
      throw new Error("Failed to fetch wallet");
    }

    return mapWallet(data);
  }

  /** Signup bonus is granted once, under a per-player lock (migration 20261019000004). */
  private static async initializeWallet(playerId: string): Promise<PlayerWallet> {
    const supabase = getSupabaseAdmin();
    const { error: ensureError } = await supabase.rpc("ensure_player_wallet", {
      p_player_id: playerId,
      p_signup_bonus: SIGNUP_BONUS,
    });
    if (ensureError) {
      logger.error("Failed to initialize wallet", { playerId, error: ensureError });
      throw new Error("Failed to initialize wallet");
    }

    const { data } = await untypedTable(supabase, "player_wallets")
      .select("player_id, balance, total_earned, total_spent")
      .eq("player_id", playerId)
      .single();

    return data
      ? mapWallet(data)
      : { playerId, balance: SIGNUP_BONUS, totalEarned: SIGNUP_BONUS, totalSpent: 0 };
  }

  static async creditCoins(
    playerId: string,
    amount: number,
    type: CoinTransactionType,
    activityType?: CoinActivityType,
    referenceId?: string,
    description?: string
  ): Promise<CoinTransaction> {
    if (amount <= 0) throw new Error("Credit amount must be positive");
    return this.insertTransaction(playerId, amount, type, activityType, referenceId, description);
  }

  static async debitCoins(
    playerId: string,
    amount: number,
    type: CoinTransactionType,
    referenceId?: string,
    description?: string
  ): Promise<CoinTransaction> {
    if (amount <= 0) throw new Error("Debit amount must be positive");

    const wallet = await this.getWallet(playerId);
    if (wallet.balance < amount) {
      throw new Error("Insufficient balance");
    }

    return this.insertTransaction(playerId, -amount, type, undefined, referenceId, description);
  }

  /**
   * Credits an activity reward. Enabled / duplicate reference / cooldown /
   * daily cap are checked and the reward inserted atomically in
   * award_activity_reward (migration 20261019000004), so parallel requests
   * cannot exceed the caps and a given reference pays only once.
   */
  static async rewardActivity(
    playerId: string,
    activityType: CoinActivityType,
    referenceId?: string
  ): Promise<RewardResult> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("award_activity_reward", {
      p_player_id: playerId,
      p_activity_type: activityType,
      p_reference_id: referenceId ?? null,
    });

    if (error) {
      logger.error("Failed to award activity reward", { playerId, activityType, error });
      throw new Error("Failed to award activity reward");
    }

    const result = (data ?? {}) as Partial<RewardResult>;
    return {
      rewarded: result.rewarded === true,
      amount: Number(result.amount) || 0,
      reason: result.reason,
    };
  }

  static async getTransactionHistory(
    playerId: string,
    page: number = 1,
    limit: number = 20,
    type?: CoinTransactionType,
    activityType?: CoinActivityType
  ): Promise<{ transactions: CoinTransaction[]; total: number }> {
    const supabase = getSupabaseAdmin();
    const offset = (page - 1) * limit;

    let query = untypedTable(supabase, "coin_transactions")
      .select("*", { count: "exact" })
      .eq("player_id", playerId);

    if (type) query = query.eq("type", type);
    if (activityType) query = query.eq("activity_type", activityType);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Failed to fetch transactions", { playerId, error });
      throw new Error("Failed to fetch transactions");
    }

    return {
      transactions: (data ?? []).map(mapTransaction),
      total: count ?? 0,
    };
  }

  static async getPeriodStats(
    playerId: string,
    periodDays: number = 7
  ): Promise<{ earned: number; spent: number; periodDays: number }> {
    const supabase = getSupabaseAdmin();
    const cutoff = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await untypedTable(supabase, "coin_transactions")
      .select("amount")
      .eq("player_id", playerId)
      .gte("created_at", cutoff);

    if (error) {
      logger.error("Failed to fetch period stats", { playerId, error });
      throw new Error("Failed to fetch period stats");
    }

    let earned = 0;
    let spent = 0;
    for (const row of data ?? []) {
      const amount = (row as { amount: number }).amount;
      if (amount > 0) earned += amount;
      else spent += -amount;
    }

    return { earned, spent, periodDays };
  }

  static async getRewardConfig(): Promise<CoinRewardConfig[]> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await untypedTable(supabase, "coin_reward_config")
      .select("*")
      .order("activity_type");

    if (error) {
      logger.error("Failed to fetch reward config", { error });
      throw new Error("Failed to fetch reward config");
    }

    return (data ?? []).map(mapConfig);
  }

  static async updateRewardConfig(
    activityType: CoinActivityType,
    updates: Partial<Pick<CoinRewardConfig, "amount" | "cooldownSeconds" | "dailyCap" | "enabled">>
  ): Promise<CoinRewardConfig> {
    const supabase = getSupabaseAdmin();
    const dbUpdates: Record<string, unknown> = {};
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.cooldownSeconds !== undefined) dbUpdates.cooldown_seconds = updates.cooldownSeconds;
    if (updates.dailyCap !== undefined) dbUpdates.daily_cap = updates.dailyCap;
    if (updates.enabled !== undefined) dbUpdates.enabled = updates.enabled;

    const { data, error } = await untypedTable(supabase, "coin_reward_config")
      .update(dbUpdates)
      .eq("activity_type", activityType)
      .select("*")
      .single();

    if (error || !data) {
      logger.error("Failed to update reward config", { activityType, error });
      throw new Error("Failed to update reward config");
    }

    return mapConfig(data);
  }

  static async grantCoins(
    adminId: string,
    playerId: string,
    amount: number,
    description: string
  ): Promise<CoinTransaction> {
    if (amount === 0) throw new Error("Amount cannot be zero");
    const desc = `[Admin ${adminId}] ${description}`;

    if (amount > 0) {
      return this.creditCoins(playerId, amount, "admin_grant", undefined, undefined, desc);
    }

    // Negative = debit
    return this.insertTransaction(playerId, amount, "admin_grant", undefined, undefined, desc);
  }

  private static async insertTransaction(
    playerId: string,
    amount: number,
    type: CoinTransactionType,
    activityType?: CoinActivityType,
    referenceId?: string,
    description?: string
  ): Promise<CoinTransaction> {
    const supabase = getSupabaseAdmin();

    // Get current balance to compute balance_after
    const { data: wallet } = await untypedTable(supabase, "player_wallets")
      .select("balance")
      .eq("player_id", playerId)
      .single();

    const currentBalance = wallet?.balance ?? 0;
    const balanceAfter = currentBalance + amount;

    const { data, error } = await untypedTable(supabase, "coin_transactions")
      .insert({
        player_id: playerId,
        amount,
        type,
        activity_type: activityType ?? null,
        reference_id: referenceId ?? null,
        description: description ?? null,
        balance_after: balanceAfter,
      })
      .select("*")
      .single();

    if (error || !data) {
      logger.error("Failed to insert transaction", { playerId, amount, type, error });
      throw new Error("Failed to insert transaction");
    }

    return mapTransaction(data);
  }
}

// ============================================================================
// Mappers
// ============================================================================

function mapWallet(row: Record<string, unknown>): PlayerWallet {
  return {
    playerId: row.player_id as string,
    balance: row.balance as number,
    totalEarned: row.total_earned as number,
    totalSpent: row.total_spent as number,
  };
}

function mapTransaction(row: Record<string, unknown>): CoinTransaction {
  return {
    id: row.id as string,
    playerId: row.player_id as string,
    amount: row.amount as number,
    type: row.type as CoinTransaction["type"],
    activityType: (row.activity_type as CoinTransaction["activityType"]) ?? null,
    referenceId: (row.reference_id as string) ?? null,
    description: (row.description as string) ?? null,
    balanceAfter: row.balance_after as number,
    createdAt: row.created_at as string,
  };
}

function mapConfig(row: Record<string, unknown>): CoinRewardConfig {
  return {
    activityType: row.activity_type as CoinActivityType,
    amount: row.amount as number,
    cooldownSeconds: (row.cooldown_seconds as number) ?? null,
    dailyCap: (row.daily_cap as number) ?? null,
    enabled: row.enabled as boolean,
  };
}
