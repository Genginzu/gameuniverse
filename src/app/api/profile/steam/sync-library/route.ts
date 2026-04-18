import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { syncSteamLibrary } from "@/lib/services/steamLibrarySync";

export async function POST() {
  const supabase = await createRouteHandlerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: linked, error } = await supabase
      .from("player_linked_platforms")
      .select("external_id")
      .eq("player_id", user.id)
      .eq("platform", "steam")
      .maybeSingle();

    if (error) throw error;
    if (!linked?.external_id) {
      return NextResponse.json({ error: "Steam account not linked" }, { status: 400 });
    }

    const result = await syncSteamLibrary(supabase, user.id, linked.external_id);
    return NextResponse.json(result);
  } catch (err) {
    logger.error("Steam library sync failed", { userId: user.id, err });
    const message = err instanceof Error ? err.message : "Steam sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
