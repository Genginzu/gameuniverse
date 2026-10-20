import { createRouteHandlerClient } from "@/lib/supabase-server";
import { extractColorsFromCover } from "@/lib/utils/color-extraction";
import { untypedTable } from "@/lib/utils/untypedTable";
import { logger } from "@/lib/logger";
import {
  BULK_FIELD_TO_OVERRIDE,
  BULK_IMPORTABLE_COLUMNS,
  isBulkFieldAlias,
} from "./igdb-fields/registry";
import { syncTrackedFields } from "./igdb-fields/override-aware-sync";
import type { SyncSupabaseClient } from "./igdb-sync";

type RouteSupabaseClient = Awaited<ReturnType<typeof createRouteHandlerClient>>;

interface BulkSyncResult {
  success: boolean;
  value?: unknown;
  error?: string;
}

async function readSyncedValue(
  supabase: RouteSupabaseClient,
  gameId: string,
  column: string
): Promise<unknown> {
  const { data } = await untypedTable(supabase, "games").select(column).eq("id", gameId).single();
  return (data as Record<string, unknown> | null)?.[column] ?? null;
}

async function applyCoverColors(
  supabase: RouteSupabaseClient,
  gameId: string,
  coverUrl: string
): Promise<void> {
  try {
    const colors = await extractColorsFromCover(coverUrl);
    if (!colors) return;
    await supabase
      .from("games")
      .update({
        background_color: colors.background_color,
        accent_color: colors.accent_color,
        label_color: colors.label_color,
        text_color: colors.text_color,
      })
      .eq("id", gameId);
  } catch (error) {
    logger.warn("bulkFieldSync color extraction failed", { gameId, error });
  }
}

export async function syncSingleField(
  gameId: string,
  igdbId: number,
  field: string
): Promise<BulkSyncResult> {
  if (!isBulkFieldAlias(field)) return { success: false, error: `Unknown field: ${field}` };

  try {
    const supabase = await createRouteHandlerClient();
    const outcome = await syncTrackedFields(supabase as unknown as SyncSupabaseClient, {
      gameId,
      igdbId,
      fields: [BULK_FIELD_TO_OVERRIDE[field]],
      respectOverrides: true,
    });

    if (outcome.skippedFields.length > 0) {
      return { success: true, value: null, error: "skipped:override" };
    }
    if (outcome.status === "igdb_game_not_found") return { success: true, value: null };

    const value = await readSyncedValue(supabase, gameId, BULK_IMPORTABLE_COLUMNS[field]);
    if (field === "cover" && typeof value === "string") {
      await applyCoverColors(supabase, gameId, value);
    }
    return { success: true, value };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("bulkFieldSync failed", { gameId, igdbId, field, error });
    return { success: false, error: message };
  }
}
