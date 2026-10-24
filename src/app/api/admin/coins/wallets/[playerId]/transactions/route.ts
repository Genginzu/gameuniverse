import { NextResponse } from "next/server";
import { defineRoute } from "@/lib/api/route";
import { CoinService } from "@/lib/services/coinService";
import type { CoinTransactionType, CoinActivityType } from "@/types/coins";

export const GET = defineRoute({ auth: "admin" }, async ({ request, params }) => {
  const { playerId } = params;
  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const type = searchParams.get("type") as CoinTransactionType | undefined;
  const activityType = searchParams.get("activityType") as CoinActivityType | undefined;

  try {
    const result = await CoinService.getTransactionHistory(
      playerId,
      page,
      limit,
      type || undefined,
      activityType || undefined
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
});
