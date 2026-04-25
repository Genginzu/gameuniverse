import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { CoinService } from "@/lib/services/coinService";

async function requireAdmin() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.rpc("is_admin", { user_id: user.id });
  return data ? user : null;
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { playerId, amount, description } = await request.json();

    if (!playerId || !amount || !description) {
      return NextResponse.json(
        { error: "playerId, amount, and description are required" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount === 0) {
      return NextResponse.json({ error: "amount must be a non-zero number" }, { status: 400 });
    }

    const transaction = await CoinService.grantCoins(admin.id, playerId, amount, description);
    return NextResponse.json({ transaction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to grant coins";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
