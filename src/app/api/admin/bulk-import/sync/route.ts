import { NextRequest } from "next/server";
import { syncSingleField } from "@/lib/services/bulkFieldSync";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

const WORKERS = 2;
// With 2 workers each waiting 500ms per sync, combined throughput stays at ~4
// IGDB requests/s — the documented rate limit. Increase WORKERS only if
// DELAY_MS is raised proportionally.
const DELAY_MS = 500;
const PAGE_SIZE = 1000;
const NO_COVER_FALLBACK = "/assets/no-cover.png";
const NO_BACKGROUND_FALLBACK = "none";

const FIELD_FALLBACKS: Record<string, { column: string; fallback: string | number | null }> = {
  cover: { column: "cover_image_url", fallback: NO_COVER_FALLBACK },
  background: { column: "background_image_url", fallback: NO_BACKGROUND_FALLBACK },
  metascore: { column: "metascore", fallback: null },
  releaseDate: { column: "release_date", fallback: "1970-01-01" },
  playtime: { column: "playtime_normally", fallback: null },
};

const IMPORTABLE_FIELDS: Record<string, string> = {
  cover: "cover_image_url",
  background: "background_image_url",
  playtime: "playtime_normally",
  metascore: "metascore",
  releaseDate: "release_date",
  popularity: "igdb_pop_updated_at",
};

/**
 * POST /api/admin/bulk-import/sync
 * Two modes:
 * - Normal: { gameIds: [...], field } — sync provided games
 * - All:    { all: true, field }      — server fetches & syncs all missing games
 */
export async function POST(request: NextRequest) {
  let gameIds: Array<{ id: string; igdbId: number }> | null = null;
  let field: string | undefined;
  let allMode = false;

  try {
    const body = await request.json();
    field = body.field;
    allMode = body.all === true;

    if (!allMode) {
      gameIds = body.gameIds;
      if (!Array.isArray(gameIds) || gameIds.length === 0) {
        return jsonError("gameIds array is required");
      }
    }

    if (allMode && (!field || !IMPORTABLE_FIELDS[field])) {
      return jsonError("field is required for all mode");
    }
  } catch {
    return jsonError("Invalid JSON");
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

      const syncGame = async (id: string, igdbId: number) => {
        send({ type: "syncing", igdbId, gameId: id });
        try {
          const result = await syncSingleField(id, igdbId, field || "cover");
          if (fallbackConfig && result.value === null) {
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
        await new Promise((r) => setTimeout(r, DELAY_MS));
      };

      /**
       * Drain a queue with N concurrent workers. Each worker pops from the
       * same array via .shift() — safe in single-threaded JS between awaits.
       */
      const drainQueue = async (queue: Array<{ id: string; igdbId: number }>) => {
        const worker = async () => {
          for (;;) {
            const next = queue.shift();
            if (!next) return;
            await syncGame(next.id, next.igdbId);
          }
        };
        await Promise.all(Array.from({ length: WORKERS }, () => worker()));
      };

      if (allMode && field) {
        // Server-side pagination: fetch and process page by page.
        // Pages are sequential but games within a page drain in parallel.
        const column = IMPORTABLE_FIELDS[field];
        let offset = 0;

        while (true) {
          const supabase = await createRouteHandlerClient();
          let query = supabase.from("games").select("id, igdb_id").not("igdb_id", "is", null);

          if (field === "metascore") {
            query = query.is("metascore", null);
          } else {
            query = query.is(column, null);
          }

          const { data } = await query
            .order("view_count", { ascending: false })
            .range(offset, offset + PAGE_SIZE - 1);

          if (!data || data.length === 0) {
            break;
          }

          const pageQueue = data
            .filter((g): g is { id: string; igdb_id: number } => g.igdb_id !== null)
            .map((g) => ({ id: g.id, igdbId: g.igdb_id }));
          await drainQueue(pageQueue);

          offset += data.length;
          if (data.length < PAGE_SIZE) break;
        }
      } else if (gameIds) {
        // Normal mode: sync provided list with N parallel workers
        await drainQueue([...gameIds]);
      }

      send({
        type: "done",
        total: successCount + failCount,
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

function jsonError(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

async function applyFallback(gameId: string, column: string, fallback: string | number | null) {
  try {
    const supabase = await createRouteHandlerClient();
    await supabase
      .from("games")
      // @ts-expect-error — column is dynamic; the caller guarantees a valid games column
      .update({ [column]: fallback })
      .eq("id", gameId)
      .is(column, null);
  } catch (error) {
    logger.warn("Failed to apply fallback", { gameId, column, error });
  }
}
