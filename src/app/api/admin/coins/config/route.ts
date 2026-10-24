import { NextResponse } from "next/server";
import { z } from "zod";
import { defineRoute } from "@/lib/api/route";
import { CoinService } from "@/lib/services/coinService";
import type { CoinActivityType } from "@/types/coins";

type RewardConfigUpdates = Parameters<typeof CoinService.updateRewardConfig>[1];

const configUpdateSchema = z.looseObject({ activityType: z.string().min(1) });

export const GET = defineRoute({ auth: "admin" }, async () => {
  try {
    const config = await CoinService.getRewardConfig();
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 });
  }
});

export const PATCH = defineRoute({ auth: "admin", body: configUpdateSchema }, async ({ body }) => {
  try {
    const { activityType, ...updates } = body;

    const config = await CoinService.updateRewardConfig(
      activityType as CoinActivityType,
      updates as RewardConfigUpdates
    );
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
});
