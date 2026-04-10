import { NextRequest } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { IGDBService } from "@/lib/services/igdbService";
import { fetchMetacriticScore } from "@/lib/services/metacriticService";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/bulk-import/sync-metascore
 * Dedicated metascore sync: tries IGDB aggregated_rating first,
 * then falls back to Metacritic scraping.
 * Streams progress via SSE. Sequential (rate-limited for Metacritic).
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

      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      for (const game of games) {
        send({ type: "syncing", gameId: game.id, igdbId: game.igdbId });

        try {
          const score = await resolveMetascore(game.igdbId, game.slug);

          if (score !== null) {
            await updateMetascore(game.id, score);
            successCount++;
            send({
              type: "success",
              gameId: game.id,
              igdbId: game.igdbId,
              score,
            });
          } else {
            // No score found anywhere — set sentinel
            await updateMetascore(game.id, -1);
            failCount++;
            send({
              type: "error",
              gameId: game.id,
              igdbId: game.igdbId,
              error: "No score on IGDB or Metacritic",
            });
          }
        } catch (error) {
          failCount++;
          const message = error instanceof Error ? error.message : "Unknown error";
          send({ type: "error", gameId: game.id, igdbId: game.igdbId, error: message });
          logger.error("Metascore sync failed", { gameId: game.id, error });
        }
      }

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

/**
 * Try IGDB first, then Metacritic.
 */
async function resolveMetascore(igdbId: number, slug: string): Promise<number | null> {
  // 1. Try IGDB aggregated_rating
  try {
    const igdbGame = await IGDBService.getGameDetails(igdbId);
    if (igdbGame?.aggregated_rating) {
      return Math.round(igdbGame.aggregated_rating);
    }
  } catch (error) {
    logger.warn("IGDB fetch failed for metascore", { igdbId, error });
  }

  // 2. Fallback to Metacritic scraping
  const metacriticScore = await fetchMetacriticScore(slug);
  if (metacriticScore !== null) {
    logger.info("Metascore found via Metacritic", { slug, score: metacriticScore });
    return metacriticScore;
  }

  return null;
}

async function updateMetascore(gameId: string, score: number) {
  const supabase = await createRouteHandlerClient();
  await supabase.from("games").update({ metascore: score }).eq("id", gameId);
}
