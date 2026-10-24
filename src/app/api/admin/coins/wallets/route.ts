import { NextResponse } from "next/server";
import { defineRoute } from "@/lib/api/route";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { untypedTable } from "@/lib/utils/untypedTable";

export const GET = defineRoute({ auth: "admin" }, async ({ request }) => {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const offset = (page - 1) * limit;

  const supabase = await createRouteHandlerClient();

  let query = untypedTable(supabase, "player_wallets")
    .select("player_id, balance, total_earned, total_spent, profiles!inner(username, avatar_url)", {
      count: "exact",
    });

  if (search) {
    query = query.ilike("profiles.username", `%${search}%`);
  }

  const { data, count, error } = await query
    .order("balance", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch wallets" }, { status: 500 });
  }

  const wallets = ((data ?? []) as Record<string, unknown>[]).map((row: Record<string, unknown>) => {
    const profile = row.profiles as Record<string, unknown> | null;
    return {
      playerId: row.player_id,
      balance: row.balance,
      totalEarned: row.total_earned,
      totalSpent: row.total_spent,
      username: profile?.username ?? null,
      avatarUrl: profile?.avatar_url ?? null,
    };
  });

  return NextResponse.json({ wallets, total: count ?? 0 });
});
