import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { CoinService } from "@/lib/services/coinService";

export async function GET(request: NextRequest) {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const periodDays = Math.min(
    Math.max(parseInt(searchParams.get("days") || "7", 10) || 7, 1),
    365
  );

  try {
    const stats = await CoinService.getPeriodStats(user.id, periodDays);
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({ error: "Failed to fetch wallet stats" }, { status: 500 });
  }
}
