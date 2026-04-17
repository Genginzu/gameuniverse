import { NextRequest } from "next/server";
import { syncCharacterField } from "@/lib/services/bulkCharacterFieldSync";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

const DELAY_MS = 100;
const PAGE_SIZE = 1000;
const NO_IMAGE_FALLBACK = "/assets/no-cover.png";

const FIELD_FALLBACKS: Record<string, { column: string; fallback: string }> = {
  image: { column: "main_image", fallback: NO_IMAGE_FALLBACK },
  background: { column: "background_image", fallback: NO_IMAGE_FALLBACK },
};

const IMPORTABLE_FIELDS: Record<string, string> = {
  image: "main_image",
  background: "background_image",
};

/**
 * POST /api/admin/bulk-import-characters/sync
 * Two modes:
 * - Normal: { gameIds: [...], field } — sync provided characters
 * - All:    { all: true, field }      — server fetches & syncs all
 */
export async function POST(request: NextRequest) {
  let charIds: Array<{ id: string; igdbId: number }> | null = null;
  let field: string | undefined;
  let allMode = false;

  try {
    const body = await request.json();
    field = body.field;
    allMode = body.all === true;

    if (!allMode) {
      charIds = body.gameIds;
      if (!Array.isArray(charIds) || charIds.length === 0) {
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

      const syncChar = async (id: string, igdbId: number) => {
        send({ type: "syncing", igdbId, gameId: id });
        try {
          const result = await syncCharacterField(id, igdbId, field || "image");
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
          logger.error("Character bulk sync failed", { id, igdbId, error });
        }
        await new Promise((r) => setTimeout(r, DELAY_MS));
      };

      if (allMode && field) {
        const column = IMPORTABLE_FIELDS[field];
        let offset = 0;

        while (true) {
          const supabase = await createRouteHandlerClient();
          const { data } = await supabase
            .from("characters")
            .select("id, igdb_id")
            .not("igdb_id", "is", null)
            .is(column, null)
            .order("view_count", { ascending: false })
            .range(offset, offset + PAGE_SIZE - 1);

          if (!data || data.length === 0) break;

          for (const char of data) {
            if (char.igdb_id === null) continue;
            await syncChar(char.id, char.igdb_id);
          }

          offset += data.length;
          if (data.length < PAGE_SIZE) break;
        }
      } else if (charIds) {
        for (const { id, igdbId } of charIds) {
          await syncChar(id, igdbId);
        }
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

async function applyFallback(charId: string, column: string, fallback: string) {
  try {
    const supabase = await createRouteHandlerClient();
    await supabase
      .from("characters")
      // @ts-expect-error — column is dynamic; the caller guarantees a valid characters column
      .update({ [column]: fallback })
      .eq("id", charId)
      .is(column, null);
  } catch (error) {
    logger.warn("Failed to apply character fallback", { charId, column, error });
  }
}
