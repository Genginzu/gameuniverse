import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getDateRangeForPeriod } from "@/lib/services/priceHistoryService";
import type { PriceHistoryPeriod, PriceSnapshot, PriceHistoryStats } from "@/types/price-history";

const VALID_PERIODS: PriceHistoryPeriod[] = ["1m", "3m", "6m", "1y", "all"];

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    // Parse and validate query params
    const period = (searchParams.get("period") || "1y") as string;
    const store = searchParams.get("store") || undefined;
    const platform = searchParams.get("platform") || undefined;

    if (!VALID_PERIODS.includes(period as PriceHistoryPeriod)) {
      return NextResponse.json(
        { error: `Invalid period. Must be one of: ${VALID_PERIODS.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = await createRouteHandlerClient();

    // Resolve game_id from slug
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id")
      .eq("slug", slug)
      .single();

    if (gameError || !game) {
      if (gameError?.code === "PGRST116" || !game) {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
      }
      console.error("Error fetching game by slug:", gameError);
      return NextResponse.json({ error: "Failed to fetch game" }, { status: 500 });
    }

    // Calculate date range from period
    const { startDate, endDate } = getDateRangeForPeriod(period as PriceHistoryPeriod);

    // Call get_price_history RPC
    const { data: history, error: historyError } = await supabase.rpc("get_price_history", {
      game_uuid: game.id,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      store_filter: store,
      platform_filter: platform,
    });

    if (historyError) {
      console.error("Error fetching price history:", historyError);
      return NextResponse.json({ error: "Failed to fetch price history" }, { status: 500 });
    }

    // Call get_price_history_stats RPC
    const { data: statsData, error: statsError } = await supabase.rpc("get_price_history_stats", {
      game_uuid: game.id,
    });

    if (statsError) {
      console.error("Error fetching price history stats:", statsError);
      return NextResponse.json({ error: "Failed to fetch price history stats" }, { status: 500 });
    }

    const stats: PriceHistoryStats = statsData?.[0] ?? {
      min_price: 0,
      max_price: 0,
      avg_price: 0,
      currency: "EUR",
      total_snapshots: 0,
    };

    return NextResponse.json({
      history: (history as PriceSnapshot[]) ?? [],
      stats,
    });
  } catch (error) {
    console.error("Unexpected error in price history API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
