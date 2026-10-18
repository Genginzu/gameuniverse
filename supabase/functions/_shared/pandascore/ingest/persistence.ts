import { logger } from "../../logger.ts";
import type { SyncErrorCollector } from "../sync-error-collector.ts";
import type { EsportDb, IngestResult } from "./types.ts";

export const BULK_UPSERT_SIZE = 100;
const ID_LOOKUP_SIZE = 500;

export function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function bulkUpsert(
  db: EsportDb,
  table: string,
  rows: Record<string, unknown>[],
  options: { errorCollector?: SyncErrorCollector; errorType?: string } = {},
): Promise<IngestResult> {
  let synced = 0;
  let errors = 0;

  for (const batch of chunk(rows, BULK_UPSERT_SIZE)) {
    const { error } = await db.from(table).upsert(batch, {
      onConflict: "pandascore_id",
    });
    if (!error) {
      synced += batch.length;
      continue;
    }
    logger.warn("bulkUpsert error", {
      table,
      batchSize: batch.length,
      error: error.message,
    });
    errors += batch.length;
    for (const row of batch) {
      options.errorCollector?.add({
        type: options.errorType ?? table,
        id: typeof row.pandascore_id === "number" ? row.pandascore_id : null,
        phase: "upsert",
        error: error.message,
      });
    }
  }

  return { synced, errors };
}

export async function preloadIdMap(
  db: EsportDb,
  table: string,
  pandaIds: number[],
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  const uniqueIds = Array.from(new Set(pandaIds));

  for (const batch of chunk(uniqueIds, ID_LOOKUP_SIZE)) {
    const { data, error } = await db
      .from(table)
      .select("id, pandascore_id")
      .in("pandascore_id", batch);

    if (error) {
      logger.warn("preloadIdMap error", { table, error: error.message });
      continue;
    }

    for (const row of (data ?? []) as { id: string; pandascore_id: number }[]) {
      map.set(row.pandascore_id, row.id);
    }
  }

  return map;
}
