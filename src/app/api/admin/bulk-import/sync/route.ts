import { NextRequest } from "next/server";
import { GameImportService } from "@/lib/services/gameImportService";
import { logger } from "@/lib/logger";

const CONCURRENCY = 5;

/**
 * POST /api/admin/bulk-import/sync
 * Streams sync progress via SSE with parallel processing (5 concurrent).
 * Body: { gameIds: Array<{ id: string; igdbId: number; title?: string }> }
 */
export async function POST(request: NextRequest) {
  let gameIds: Array<{ id: string; igdbId: number; title?: string }>;

  try {
    const body = await request.json();
    gameIds = body.gameIds;

    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      return new Response(JSON.stringify({ error: "gameIds array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (gameIds.length > 400) {
      return new Response(JSON.stringify({ error: "Maximum 400 games per batch" }), {
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

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let successCount = 0;
      let failCount = 0;

      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Process games in chunks of CONCURRENCY
      for (let i = 0; i < gameIds.length; i += CONCURRENCY) {
        const chunk = gameIds.slice(i, i + CONCURRENCY);

        const promises = chunk.map(async ({ id, igdbId }) => {
          send({ type: "syncing", igdbId, gameId: id });

          try {
            const result = await GameImportService.syncWithIGDB(id, igdbId);
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
        });

        await Promise.all(promises);
      }

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
