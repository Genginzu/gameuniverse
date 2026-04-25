import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { CoinService } from "@/lib/services/coinService";
import type { CoinActivityType } from "@/types/coins";

async function requireAdmin() {
  const supabase = await createRouteHandlerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.rpc("is_admin", { user_id: user.id });
  return data ? user : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const config = await CoinService.getRewardConfig();
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const { activityType, ...updates } = body;

    if (!activityType) {
      return NextResponse.json({ error: "activityType is required" }, { status: 400 });
    }

    const config = await CoinService.updateRewardConfig(activityType as CoinActivityType, updates);
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
