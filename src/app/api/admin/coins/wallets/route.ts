import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";

async function requireAdmin() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.rpc("is_admin", { user_id: user.id });
  return data ? user : null;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const offset = (page - 1) * limit;

  const supabase = await createRouteHandlerClient();

  let query = supabase
    .from("player_wallets")
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

  const wallets = (data ?? []).map((row: Record<string, unknown>) => {
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
}
