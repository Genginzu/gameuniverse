/**
 * Types for webhook event diff comparison between IGDB payload and local DB.
 */

/** Status of a single field comparison */
export type DiffFieldStatus =
  | "unchanged" // Same value in IGDB and local
  | "changed" // Different value, no admin override — safe to auto-apply
  | "conflict"; // Different value AND admin has overridden this field

/** A single field diff entry */
export interface DiffField {
  field: string;
  label: string;
  igdbValue: unknown;
  localValue: unknown;
  status: DiffFieldStatus;
  /** True if this field has an admin override in game_field_overrides */
  hasOverride: boolean;
}

/** Full diff result for a webhook event */
export interface WebhookDiffResult {
  eventId: string;
  gameId: string;
  gameName: string;
  igdbId: number;
  fields: DiffField[];
  /** Number of fields that differ */
  changedCount: number;
  /** Number of fields with admin overrides that conflict */
  conflictCount: number;
}

/** Request body for applying webhook changes */
export interface ApplyDiffRequest {
  /** Field names to force-apply (overriding admin edits) */
  forceFields?: string[];
}

/** Result of applying webhook changes */
export interface ApplyDiffResult {
  success: boolean;
  appliedFields: string[];
  skippedFields: string[];
  error?: string;
}
