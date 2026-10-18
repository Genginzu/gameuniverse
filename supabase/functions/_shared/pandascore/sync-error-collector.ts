import { logger } from "../logger.ts";

export const MAX_ERROR_DETAILS = 50;

export type SyncErrorPhase = "fetch" | "upsert" | "delete" | "side_effect";

export interface SyncErrorDetail {
  type: string;
  id: number | null;
  phase: SyncErrorPhase;
  error: string;
}

export interface SyncErrorSummary {
  type: "summary";
  id: null;
  phase: "fetch";
  error: string;
  dropped: number;
}

export type StoredSyncError = SyncErrorDetail | SyncErrorSummary;

const LEGACY_SUMMARY_PATTERN = /^(\d+) additional errors omitted/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isErrorDetail(value: unknown): value is SyncErrorDetail {
  return (
    isRecord(value) &&
    typeof value.type === "string" &&
    typeof value.error === "string" &&
    typeof value.phase === "string"
  );
}

function summaryDroppedCount(value: Record<string, unknown>): number {
  if (typeof value.dropped === "number" && value.dropped >= 0) return value.dropped;
  const match = typeof value.error === "string" ? LEGACY_SUMMARY_PATTERN.exec(value.error) : null;
  return match ? Number(match[1]) : 0;
}

export class SyncErrorCollector {
  private entries: SyncErrorDetail[] = [];
  private dropped = 0;

  static fromJSON(stored: unknown): SyncErrorCollector {
    const collector = new SyncErrorCollector();
    if (!Array.isArray(stored)) return collector;
    for (const item of stored) {
      if (!isRecord(item)) continue;
      if (item.type === "summary") {
        collector.dropped += summaryDroppedCount(item);
      } else if (isErrorDetail(item)) {
        collector.record(item);
      }
    }
    return collector;
  }

  add(detail: SyncErrorDetail): void {
    this.record(detail);
    logger.warn("Sync error", { ...detail });
  }

  toJSON(): StoredSyncError[] {
    if (this.dropped === 0) return [...this.entries];
    return [...this.entries, this.summary()];
  }

  get count(): number {
    return this.entries.length + this.dropped;
  }

  get droppedCount(): number {
    return this.dropped;
  }

  private record(detail: SyncErrorDetail): void {
    if (this.entries.length < MAX_ERROR_DETAILS) {
      this.entries.push(detail);
    } else {
      this.dropped++;
    }
  }

  private summary(): SyncErrorSummary {
    return {
      type: "summary",
      id: null,
      phase: "fetch",
      error: `${this.dropped} additional errors omitted (cap: ${MAX_ERROR_DETAILS})`,
      dropped: this.dropped,
    };
  }
}
