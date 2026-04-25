import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { CoinService } from "@/lib/services/coinService";
import type { CoinTransactionType, CoinActivityType } from "@/types/coins";

async function requireAdmin() {
  const supabase = await createRouteHandlerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.rpc("is_admin", { user_id: user.id });
  return data ? user : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { playerId } = await params;
  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const type = searchParams.get("type") as CoinTransactionType | undefined;
  const activityType = searchParams.get("activityType") as CoinActivityType | undefined;

  try {
    const result = await CoinService.getTransactionHistory(playerId, page, limit, type || undefined, activityType || undefined);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
