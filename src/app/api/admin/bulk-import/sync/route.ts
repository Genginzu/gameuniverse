import { NextRequest } from "next/server";
import { GameImportService } from "@/lib/services/gameImportService";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

const CONCURRENCY = 1;
const DELAY_MS = 300;
const NO_COVER_FALLBACK = "/assets/no-cover.png";
const NO_BACKGROUND_FALLBACK = "/assets/no-cover.png";

/** Columns that get a fallback value when IGDB returns nothing */
const FIELD_FALLBACKS: Record<string, { column: string; fallback: string | number }> = {
  cover: { column: "cover_image_url", fallback: NO_COVER_FALLBACK },
  background: { column: "background_image_url", fallback: NO_BACKGROUND_FALLBACK },
  metascore: { column: "metascore", fallback: -1 },
};

/**
 * POST /api/admin/bulk-import/sync
 * Streams sync progress via SSE with a worker pool (5 concurrent slots).
 * Body: { gameIds: Array<{ id: string; igdbId: number }>, field?: string }
 *
 * When `field` is provided and has a fallback (cover, background), games
 * that still have NULL after sync get the fallback value so they don't
 * reappear in the "missing" list.
 */
export async function POST(request: NextRequest) {
  let gameIds: Array<{ id: string; igdbId: number }>;
  let field: string | undefined;

  try {
    const body = await request.json();
    gameIds = body.gameIds;
    field = body.field;

    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      return new Response(JSON.stringify({ error: "gameIds array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const fallbackConfig = field ? FIELD_FALLBACKS[field] : undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let successCount = 0;
      let failCount = 0;

      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      let nextIndex = 0;

      const syncGame = async (id: string, igdbId: number) => {
        send({ type: "syncing", igdbId, gameId: id });
        try {
          const result = await GameImportService.syncWithIGDB(id, igdbId);

          // Apply fallback if the field is still NULL after sync
          if (fallbackConfig) {
            await applyFallback(id, fallbackConfig.column, fallbackConfig.fallback);
          }

          if (result.success) {
            successCount++;
            send({ type: "success", igdbId, gameId: id });
          } else {
            failCount++;
            send({ type: "error", igdbId, gameId: id, error: result.error });
          }
        } catch (error) {
          failCount++;
          const message = error instanceof Error ? error.message : "Unknown error";
          send({ type: "error", igdbId, gameId: id, error: message });
          logger.error("Bulk sync failed for game", { igdbId, error });
        }
      };

      const runWorker = async (): Promise<void> => {
        while (nextIndex < gameIds.length) {
          const idx = nextIndex++;
          const { id, igdbId } = gameIds[idx];
          await syncGame(id, igdbId);
          await new Promise((r) => setTimeout(r, DELAY_MS));
        }
      };

      const workers = Array.from({ length: Math.min(CONCURRENCY, gameIds.length) }, () =>
        runWorker()
      );

      await Promise.all(workers);

      send({
        type: "done",
        total: gameIds.length,
        success: successCount,
        failed: failCount,
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/**
 * Sets a fallback value on a game column only if it's still NULL.
 */
async function applyFallback(gameId: string, column: string, fallback: string | number) {
  try {
    const supabase = await createRouteHandlerClient();
    await supabase
      .from("games")
      .update({ [column]: fallback })
      .eq("id", gameId)
      .is(column, null);
  } catch (error) {
    logger.warn("Failed to apply fallback", { gameId, column, error });
  }
}
