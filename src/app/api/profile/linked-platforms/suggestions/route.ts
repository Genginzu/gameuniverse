import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import {
  buildSuggestionsFromDiscord,
  type DiscordConnection,
} from "@/lib/services/discordConnections";
import type { GamingPlatform } from "@/types/linked-platforms";

export async function GET() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data, error } = await supabase
      .from("player_linked_platforms")
      .select("platform, platform_metadata")
      .eq("player_id", user.id);

    if (error) throw error;

    const linked = new Set<GamingPlatform>(
      (data ?? []).map((row) => row.platform as GamingPlatform)
    );
    const discordRow = (data ?? []).find((row) => row.platform === "discord");
    const metadata = discordRow?.platform_metadata as
      | { connections?: DiscordConnection[] }
      | null
      | undefined;
    const connections = metadata?.connections ?? [];

    const suggestions = buildSuggestionsFromDiscord(connections, linked);
    return NextResponse.json({ suggestions });
  } catch (err) {
    logger.error("Failed to compute platform suggestions", { userId: user.id, err });
    return NextResponse.json({ error: "Failed to compute suggestions" }, { status: 500 });
  }
}
