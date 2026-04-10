import { NextRequest } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { IGDBService } from "@/lib/services/igdbService";
import { logger } from "@/lib/logger";

const CONCURRENCY = 5;

/**
 * POST /api/admin/bulk-import/sync-metascore
 * Dedicated metascore sync: uses IGDB aggregated_rating only.
 * Streams progress via SSE with worker pool.
 *
 * Body: { games: Array<{ id: string; igdbId: number; slug: string }> }
 */
export async function POST(request: NextRequest) {
  let games: Array<{ id: string; igdbId: number; slug: string }>;

  try {
    const body = await request.json();
    games = body.games;

    if (!Array.isArray(games) || games.length === 0) {
      return new Response(JSON.stringify({ error: "games array is required" }), {
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
      let nextIndex = 0;

      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const syncGame = async (game: { id: string; igdbId: number; slug: string }) => {
        send({ type: "syncing", gameId: game.id, igdbId: game.igdbId });

        try {
          let score: number | null = null;

          // Try IGDB aggregated_rating
          const igdbGame = await IGDBService.getGameDetails(game.igdbId);
          if (igdbGame?.aggregated_rating) {
            score = Math.round(igdbGame.aggregated_rating);
          }

          if (score !== null) {
            await updateMetascore(game.id, score);
            successCount++;
            send({ type: "success", gameId: game.id, igdbId: game.igdbId, score });
          } else {
            // No score — set sentinel
            await updateMetascore(game.id, -1);
            failCount++;
            send({
              type: "error",
              gameId: game.id,
              igdbId: game.igdbId,
              error: "No aggregated_rating on IGDB",
            });
          }
        } catch (error) {
          failCount++;
          const message = error instanceof Error ? error.message : "Unknown error";
          send({ type: "error", gameId: game.id, igdbId: game.igdbId, error: message });
          logger.error("Metascore sync failed", { gameId: game.id, error });
        }
      };

      const runWorker = async () => {
        while (nextIndex < games.length) {
          const idx = nextIndex++;
          await syncGame(games[idx]);
        }
      };

      const workers = Array.from({ length: Math.min(CONCURRENCY, games.length) }, () =>
        runWorker()
      );

      await Promise.all(workers);

      send({
        type: "done",
        total: games.length,
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

async function updateMetascore(gameId: string, score: number) {
  const supabase = await createRouteHandlerClient();
  await supabase.from("games").update({ metascore: score }).eq("id", gameId);
}
