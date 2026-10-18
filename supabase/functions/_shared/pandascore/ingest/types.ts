import type { SyncErrorCollector } from "../sync-error-collector.ts";

export interface DbError {
  message: string;
}

export interface DbResult {
  data?: unknown;
  error: DbError | null;
}

export interface EsportTable {
  upsert(
    rows: Record<string, unknown>[],
    options: { onConflict: string },
  ): PromiseLike<DbResult>;
  select(columns: string): {
    in(column: string, values: number[]): PromiseLike<DbResult>;
  };
}

export interface EsportDb {
  from(table: string): EsportTable;
}

export interface PlayerTeamHistoryInput {
  playerLocalId: string;
  newTeamLocalId: string | null;
}

export interface IngestSideEffects {
  reconcilePlayerTeamHistory(inputs: PlayerTeamHistoryInput[]): Promise<void>;
  resolvePredictionsForMatch(
    matchPandaId: number,
    winnerPandaId: number,
  ): Promise<void>;
}

export interface IngestDeps {
  db: EsportDb;
  errors: SyncErrorCollector;
  sideEffects: IngestSideEffects;
}

export interface IngestResult {
  synced: number;
  errors: number;
}
