/**
 * Incremental-run decision for PandaScore incident fetches.
 *
 * A failed /additions, /changes or /deletions fetch returns a partial delta.
 * Advancing the `since` cursor after that would drop every incident past the
 * failure, so the run must fail and keep the cursor where it was.
 */

import type { SyncFailureReason } from "./failure.ts";

export interface IncidentFetchResult {
  label: string;
  failure: SyncFailureReason | null;
}

export interface IncidentFetchFailure {
  label: string;
  reason: SyncFailureReason;
}

/** Reported reason when several fetches fail: the most actionable one wins. */
const REASON_PRIORITY: Record<SyncFailureReason, number> = {
  rate_limited: 0,
  fatal: 1,
  transient: 2,
};

export function findIncidentFailure(
  results: readonly IncidentFetchResult[],
): IncidentFetchFailure | null {
  let worst: IncidentFetchFailure | null = null;
  for (const { label, failure } of results) {
    if (!failure) continue;
    if (!worst || REASON_PRIORITY[failure] < REASON_PRIORITY[worst.reason]) {
      worst = { label, reason: failure };
    }
  }
  return worst;
}

export function incidentFailureMessage(failure: IncidentFetchFailure): string {
  const location = `/${failure.label}`;
  const cursorNote = "Le curseur since n'a pas été avancé : le prochain run reprendra le même delta.";
  if (failure.reason === "rate_limited") {
    return `[rate_limited] Rate limit PandaScore atteint sur ${location}. ${cursorNote}`;
  }
  return `[${failure.reason}] Échec du fetch PandaScore ${location}. ${cursorNote}`;
}

/** HTTP status returned by the Edge Function for a failed incremental run. */
export function incrementalFailureStatus(reason: SyncFailureReason | null): number {
  return reason === "rate_limited" ? 429 : 500;
}

export class IncidentFetchError extends Error {
  readonly reason: SyncFailureReason;
  readonly label: string;

  constructor(failure: IncidentFetchFailure) {
    super(incidentFailureMessage(failure));
    this.name = "IncidentFetchError";
    this.reason = failure.reason;
    this.label = failure.label;
  }
}
