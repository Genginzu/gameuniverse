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
  AdminGrant,
  LedgerPostResult,
  LedgerRefusal,
} from "@/types/coins";

/**
 * Service for managing GU Coins: wallets, ledger entries, and activity rewards.
 * All methods use the service-role Supabase client (supabase-admin.ts) because
 * coin_transactions / player_wallets are server-only writes (issue #372). It is
 * always invoked from trusted server code with an explicit playerId.
 *
 * Every ledger write goes through the post_coin_entry DB function (migration
 * 20261023000001): wallet opening, ledger key de-duplication, overdraft refusal
 * and balance_after are decided there, under one per-player lock.
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

  /** The signup bonus is granted once, under the per-player ledger lock. */
  private static async initializeWallet(playerId: string): Promise<PlayerWallet> {
    const supabase = getSupabaseAdmin();
    const { error: ensureError } = await supabase.rpc("ensure_player_wallet", {
      p_player_id: playerId,
    });
    if (ensureError) {
      logger.error("Failed to initialize wallet", { playerId, error: ensureError });
      throw new Error("Failed to initialize wallet");
    }

    const { data, error } = await untypedTable(supabase, "player_wallets")
      .select("player_id, balance, total_earned, total_spent")
      .eq("player_id", playerId)
      .single();

    if (error || !data) {
      logger.error("Failed to read the opened wallet", { playerId, error });
      throw new Error("Failed to initialize wallet");
    }
    return mapWallet(data);
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

  /**
   * Posts an admin grant (positive or negative). The nonce identifies the
   * attempt: replaying it (double click, retry) is a no-op, and a negative
   * grant never overdraws the wallet.
   */
  static async grant(grant: AdminGrant): Promise<LedgerPostResult> {
    if (grant.amount === 0) throw new Error("Amount cannot be zero");

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("post_coin_entry", {
      p_player_id: grant.playerId,
      p_amount: grant.amount,
      p_type: "admin_grant",
      p_ledger_key: `admin_grant:${grant.nonce}`,
      p_description: `[Admin ${grant.adminId}] ${grant.description}`,
    });

    if (error || !data) {
      logger.error("Failed to post admin grant", { playerId: grant.playerId, error });
      throw new Error("Failed to post ledger entry");
    }

    const result = data as { posted: boolean; reason?: string; transaction?: Record<string, unknown> };
    if (result.posted && result.transaction) {
      return { posted: true, transaction: mapTransaction(result.transaction) };
    }
    return { posted: false, reason: result.reason as LedgerRefusal };
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
