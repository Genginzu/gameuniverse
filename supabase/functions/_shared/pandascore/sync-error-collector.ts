import { logger } from "../logger.ts";

export const MAX_ERROR_DETAILS = 50;

export type SyncErrorPhase = "fetch" | "upsert" | "delete" | "side_effect";

export interface SyncErrorDetail {
  type: string;
  id: number | null;
  phase: SyncErrorPhase;
  error: string;
}

export class SyncErrorCollector {
  private entries: SyncErrorDetail[] = [];
  private dropped = 0;

  add(detail: SyncErrorDetail): void {
    if (this.entries.length < MAX_ERROR_DETAILS) {
      this.entries.push(detail);
    } else {
      this.dropped++;
    }
    logger.warn("Sync error", { ...detail });
  }

  toJSON(): SyncErrorDetail[] {
    if (this.dropped === 0) return this.entries;
    return [
      ...this.entries,
      {
        type: "summary",
        id: null,
        phase: "fetch",
        error: `${this.dropped} additional errors omitted (cap: ${MAX_ERROR_DETAILS})`,
      },
    ];
  }

  get count(): number {
    return this.entries.length + this.dropped;
  }
}
