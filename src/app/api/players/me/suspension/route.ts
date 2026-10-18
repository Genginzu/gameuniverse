import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getActiveSuspension } from "@/lib/services/suspensionGuard";
import type { MySuspensionResponse } from "@/types/report";

/** GET /api/players/me/suspension — Signed-in user: current suspension status. */
export async function GET() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suspension = await getActiveSuspension(user.id);
  const body: MySuspensionResponse = suspension
    ? { suspended: true, until: suspension.until }
    : { suspended: false, until: null };

  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
