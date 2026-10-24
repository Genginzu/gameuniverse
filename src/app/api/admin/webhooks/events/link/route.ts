import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { defineRoute, validationError } from "@/lib/api/route";
import { untypedTable } from "@/lib/utils/untypedTable";

const linkBodySchema = z.object({
  igdbId: z.number().optional(),
  gameId: z.string().optional(),
});

/**
 * POST /api/admin/webhooks/events/link
 * Links all webhook events for a given igdb_id to a local game_id.
 * Used after manually importing a game from the webhook events list.
 */
export const POST = defineRoute({ auth: "admin", body: linkBodySchema }, async ({ body }) => {
  const { igdbId, gameId } = body;

  if (!igdbId || !gameId) {
    throw validationError(undefined, "igdbId and gameId required");
  }

  const supabase = getSupabaseAdmin();

  await untypedTable(supabase, "igdb_webhook_events")
    .update({ game_id: gameId })
    .eq("igdb_id", igdbId)
    .is("game_id", null);

  return NextResponse.json({ success: true });
});
