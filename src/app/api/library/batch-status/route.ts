import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { defineRoute, validationError } from "@/lib/api/route";
import { toLibraryStatus } from "@/lib/validations/library";
import type { LibraryStatus } from "@/types/library";

// The array check stays in the handler so the dedicated 400 message is unchanged.
const batchStatusSchema = z.object({ gameIds: z.any().optional() });

// POST /api/library/batch-status - Check library status for multiple games at once
export const POST = defineRoute(
  { auth: "required", body: batchStatusSchema },
  async ({ user, body }) => {
    const supabase = await createRouteHandlerClient();
    const { gameIds } = body;

    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      throw validationError(undefined, "gameIds array is required");
    }

    // Limiter à 100 IDs par requête pour éviter les abus
    const limitedIds = gameIds.slice(0, 100);

    const { data, error } = await supabase
      .from("user_library")
      .select("game_id, status")
      .eq("user_id", user.id)
      .in("game_id", limitedIds);

    if (error) {
      if (error.code === "PGRST205") {
        logger.warn("user_library table not found - migration not applied yet");
        return NextResponse.json({ statuses: {} });
      }
      logger.error("Error batch checking library status", { error });
      return NextResponse.json({ error: "Failed to check library status" }, { status: 500 });
    }

    // gameId → inLibrary, plus the library status of owned games.
    const inLibrarySet = new Set(data?.map((row) => row.game_id) ?? []);
    const statuses: Record<string, boolean> = {};
    for (const id of limitedIds) {
      statuses[id] = inLibrarySet.has(id);
    }
    const libraryStatuses: Record<string, LibraryStatus> = {};
    for (const row of data ?? []) {
      const status = toLibraryStatus(row.status);
      if (status) libraryStatuses[row.game_id] = status;
    }

    return NextResponse.json({ statuses, libraryStatuses });
  }
);
