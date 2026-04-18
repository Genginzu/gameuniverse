import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { syncXboxLibrary } from "@/lib/services/xboxLibrarySync";

export async function POST() {
  const supabase = await createRouteHandlerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await syncXboxLibrary(supabase, user.id);
    return NextResponse.json(result);
  } catch (err) {
    logger.error("Xbox library sync failed", { userId: user.id, err });
    const message = err instanceof Error ? err.message : "Xbox sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
