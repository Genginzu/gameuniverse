import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { CoinService } from "@/lib/services/coinService";
import type { CoinTransactionType, CoinActivityType } from "@/types/coins";

export async function GET(request: NextRequest) {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const type = searchParams.get("type") as CoinTransactionType | undefined;
  const activityType = searchParams.get("activityType") as CoinActivityType | undefined;

  try {
    const result = await CoinService.getTransactionHistory(
      user.id,
      page,
      limit,
      type || undefined,
      activityType || undefined
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
