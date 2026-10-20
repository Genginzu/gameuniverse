import type { SyncEntity } from "./cursor.ts";
import type { SyncFailureReason } from "./failure.ts";

export type SyncRunStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface PageFailure {
  reason: SyncFailureReason;
  entity: SyncEntity;
  page: number;
}

export type ChunkOutcome =
  | { action: "complete" }
  | { action: "reschedule" }
  | { action: "fail"; reason: SyncFailureReason; message: string };

export function pageFailureMessage(failure: PageFailure): string {
  const location = `${failure.entity} page ${failure.page}`;
  if (failure.reason === "rate_limited") {
    return `Rate limit PandaScore atteint sur ${location}. La synchronisation est interrompue. Réessayez dans quelques minutes ou contactez PandaScore pour augmenter votre quota.`;
  }
  return `Erreur PandaScore non récupérable sur ${location}. La synchronisation est interrompue.`;
}

export function decideChunkOutcome(input: {
  failure: PageFailure | null;
  cursorComplete: boolean;
}): ChunkOutcome {
  const { failure, cursorComplete } = input;
  if (failure && failure.reason !== "transient") {
    return { action: "fail", reason: failure.reason, message: pageFailureMessage(failure) };
  }
  if (!failure && cursorComplete) return { action: "complete" };
  return { action: "reschedule" };
}

export function runningPatch(now: Date) {
  const iso = now.toISOString();
  return { status: "running" as const, started_at: iso, last_chunk_at: iso };
}

export function pendingPatch() {
  return { status: "pending" as const };
}

export function completedPatch(now: Date) {
  return { status: "completed" as const, completed_at: now.toISOString() };
}

export function failedPatch(errorMessage: string, now: Date) {
  return {
    status: "failed" as const,
    error_message: errorMessage,
    completed_at: now.toISOString(),
  };
}
