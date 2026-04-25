import { NextRequest, NextResponse } from "next/server";
import { CoinService } from "@/lib/services/coinService";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const wallet = await CoinService.getWallet(id);
    // Public view: only expose balance
    return NextResponse.json({ wallet: { playerId: wallet.playerId, balance: wallet.balance } });
  } catch {
    return NextResponse.json({ error: "Failed to fetch wallet" }, { status: 500 });
  }
}
