import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { untypedTable } from "../untyped-table.ts";
import type { IngestDeps } from "./ingest/index.ts";
import type { SyncErrorCollector } from "./sync-error-collector.ts";
import {
  reconcilePlayerTeamHistory,
  resolvePredictionsForMatch,
} from "./vercel-callbacks.ts";

export function createIngestDeps(
  supabase: SupabaseClient,
  errors: SyncErrorCollector,
): IngestDeps {
  return {
    db: { from: (table) => untypedTable(supabase, table) },
    errors,
    sideEffects: { reconcilePlayerTeamHistory, resolvePredictionsForMatch },
  };
}
