import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { untypedTable } from "@/lib/utils/untypedTable";
import { logger } from "@/lib/logger";
import { defineRoute } from "@/lib/api/route";

const reorderSchema = z.object({
  // Ordered list of game ids; index becomes the new backlog_position.
  orderedGameIds: z.array(z.uuid()).min(1).max(1000),
});

// PATCH /api/library/backlog/reorder - Persist drag-and-drop ordering.
export const PATCH = defineRoute(
  { auth: "required", body: reorderSchema },
  async ({ user, body }) => {
    const supabase = await createRouteHandlerClient();
    const { orderedGameIds } = body;

    // Prefer the transactional RPC; fall back to per-row updates if it is
    // unavailable (e.g. migration not applied on the target environment).
    // The RPC is not yet in the generated Database types, so call it untyped.
    const rpc = supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ error: { code?: string } | null }>;
    const { error: rpcError } = await rpc("reorder_backlog", {
      user_uuid: user.id,
      ordered_game_ids: orderedGameIds,
    });

    if (rpcError) {
      if (rpcError.code === "PGRST202" || rpcError.code === "42883") {
        logger.warn("reorder_backlog RPC not found - falling back to per-row updates");

        const updates = orderedGameIds.map((gameId, index) =>
          untypedTable(supabase, "user_library")
            .update({ backlog_position: index })
            .eq("user_id", user.id)
            .eq("game_id", gameId)
        );

        const results = await Promise.all(updates);
        const failed = results.find((r) => r.error);
        if (failed?.error) {
          logger.error("Error reordering backlog (fallback)", { error: failed.error });
          return NextResponse.json({ error: "Failed to reorder backlog" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      logger.error("Error reordering backlog", { error: rpcError });
      return NextResponse.json({ error: "Failed to reorder backlog" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }
);
