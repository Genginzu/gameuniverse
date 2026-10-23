import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * GU Coin ledger against the local Supabase database (migration
 * 20261023000001). Concurrency and atomicity only exist in Postgres, so these
 * tests cannot run on mocks.
 *
 * Skipped unless SUPABASE_LOCAL_URL and SUPABASE_LOCAL_SERVICE_ROLE_KEY are
 * set (values from `bunx supabase status`). The URL must be local: these tests
 * create and delete users.
 */
const url = process.env.SUPABASE_LOCAL_URL ?? "";
const serviceKey = process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY ?? "";
const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url);

interface PostResult {
  posted: boolean;
  reason?: string;
  transaction?: { balance_after: number };
}

let db: SupabaseClient;
const createdUsers: string[] = [];

async function newPlayer(): Promise<string> {
  const email = `ledger-${crypto.randomUUID()}@example.test`;
  const { data, error } = await db.auth.admin.createUser({ email, email_confirm: true });
  if (error || !data.user) throw error ?? new Error("createUser failed");
  createdUsers.push(data.user.id);
  return data.user.id;
}

async function post(playerId: string, amount: number, ledgerKey: string): Promise<PostResult> {
  const { data, error } = await db.rpc("post_coin_entry", {
    p_player_id: playerId,
    p_amount: amount,
    p_type: "admin_grant",
    p_ledger_key: ledgerKey,
  });
  if (error) throw error;
  return data as PostResult;
}

async function balanceOf(playerId: string): Promise<number> {
  const { data } = await db.from("player_wallets").select("balance").eq("player_id", playerId).single();
  return (data?.balance as number) ?? 0;
}

async function ledgerOf(playerId: string) {
  const { data } = await db
    .from("coin_transactions")
    .select("amount, type, balance_after, created_at")
    .eq("player_id", playerId)
    .order("balance_after", { ascending: true });
  return (data ?? []) as { amount: number; type: string; balance_after: number }[];
}

describe.skipIf(!url || !serviceKey || !isLocal)("GU Coin ledger (local database)", () => {
  beforeAll(() => {
    db = createClient(url, serviceKey, { auth: { persistSession: false } });
  });

  afterAll(async () => {
    await Promise.all(createdUsers.map((id) => db.auth.admin.deleteUser(id)));
  });

  it("keeps balance_after consistent under parallel credits", async () => {
    const player = await newPlayer();
    await db.rpc("ensure_player_wallet", { p_player_id: player });

    const results = await Promise.all(
      Array.from({ length: 10 }, () => post(player, 10, `admin_grant:${crypto.randomUUID()}`))
    );

    expect(results.every((r) => r.posted)).toBe(true);
    expect(await balanceOf(player)).toBe(600);
    const ledger = await ledgerOf(player);
    expect(ledger.map((entry) => entry.balance_after)).toEqual([
      500, 510, 520, 530, 540, 550, 560, 570, 580, 590, 600,
    ]);
  });

  it("never lets parallel debits take the balance below zero", async () => {
    const player = await newPlayer();
    await db.rpc("ensure_player_wallet", { p_player_id: player });

    const results = await Promise.all(
      Array.from({ length: 10 }, () => post(player, -100, `admin_grant:${crypto.randomUUID()}`))
    );

    expect(results.filter((r) => r.posted)).toHaveLength(5);
    expect(results.filter((r) => r.reason === "insufficient_balance")).toHaveLength(5);
    expect(await balanceOf(player)).toBe(0);
    expect(Math.min(...(await ledgerOf(player)).map((entry) => entry.balance_after))).toBe(0);
  });

  it("ignores a second post with the same ledger key", async () => {
    const player = await newPlayer();
    const key = `admin_grant:${crypto.randomUUID()}`;

    const [first, second] = await Promise.all([post(player, 50, key), post(player, 50, key)]);

    expect([first.posted, second.posted].sort()).toEqual([false, true]);
    expect([first.reason, second.reason]).toContain("duplicate");
    expect(await balanceOf(player)).toBe(550);
  });

  it("opens the wallet with the signup bonus before the first entry", async () => {
    const player = await newPlayer();

    const result = await post(player, -200, `admin_grant:${crypto.randomUUID()}`);

    expect(result.posted).toBe(true);
    expect(result.transaction?.balance_after).toBe(300);
    expect((await ledgerOf(player)).map((entry) => entry.type)).toEqual([
      "admin_grant",
      "signup_bonus",
    ]);
  });

  it("settles a won prediction for a player without wallet and pays it once", async () => {
    const player = await newPlayer();
    const matchId = 900_000_000 + Math.floor(Math.random() * 99_999_999);
    const { error } = await db.from("esport_predictions").insert({
      player_id: player,
      match_id: matchId,
      match_name: "A vs B",
      game: "lol",
      predicted_winner_id: 7,
      predicted_winner_name: "Team A",
      amount: 100,
    });
    if (error) throw error;

    const settlements = await Promise.all([
      db.rpc("settle_esport_match", { p_match_id: matchId, p_winner_id: 7 }),
      db.rpc("settle_esport_match", { p_match_id: matchId, p_winner_id: 7 }),
    ]);

    expect(settlements.map((s) => s.error)).toEqual([null, null]);
    expect(settlements.map((s) => s.data as number).sort()).toEqual([0, 1]);
    expect(await balanceOf(player)).toBe(700);
    const { data: prediction } = await db
      .from("esport_predictions")
      .select("status, payout")
      .eq("match_id", matchId)
      .single();
    expect(prediction).toEqual({ status: "won", payout: 200 });
  });

  it("stakes a prediction and refuses one the wallet cannot cover", async () => {
    const player = await newPlayer();
    const place = (amount: number) =>
      db.rpc("place_esport_prediction", {
        p_player_id: player,
        p_match_id: 1,
        p_match_name: "A vs B",
        p_game: "lol",
        p_predicted_winner_id: 7,
        p_predicted_winner_name: "Team A",
        p_amount: amount,
      });

    expect((await place(400)).error).toBeNull();
    expect((await place(200)).error?.message).toBe("Insufficient balance");
    expect(await balanceOf(player)).toBe(100);
  });
});
