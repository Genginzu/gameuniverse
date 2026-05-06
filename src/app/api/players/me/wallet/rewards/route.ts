import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { CoinService } from "@/lib/services/coinService";

export async function GET() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = await CoinService.getRewardConfig();
    const activeRewards = config
      .filter((r) => r.enabled)
      .map(({ activityType, amount }) => ({ activityType, amount }));
    return NextResponse.json({ rewards: activeRewards });
  } catch {
    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 });
  }
}
