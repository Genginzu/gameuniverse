"use client";

import { useCallback, useRef, useState } from "react";
import type { BatchProgressEvent, BatchSummary, TranslationMissingItem } from "@/types/admin-translations";
import { planTranslationBatches } from "@/lib/utils/translationBatchPlan";

type TranslateBatch = (
  entityIds: string[],
  onProgress: (event: BatchProgressEvent) => void,
  signal?: AbortSignal,
  targetLang?: string
) => Promise<BatchSummary>;

export interface SelectionRunState {
  isRunning: boolean;
  processed: number;
  total: number;
  succeeded: number;
  failed: number;
  /** Entities with translations still queued or in flight */
  pendingIds: Set<string>;
  lastError: string | null;
}

const IDLE: SelectionRunState = {
  isRunning: false,
  processed: 0,
  total: 0,
  succeeded: 0,
  failed: 0,
  pendingIds: new Set(),
  lastError: null,
};

/** Counts the (entity, language) translations queued for each entity. */
function countTasks(items: TranslationMissingItem[]) {
  const remaining = new Map<string, number>();
  for (const item of items) remaining.set(item.entityId, item.missingLangs.length);
  return remaining;
}

/**
 * Translates a selection one entity at a time through small translate-batch
 * requests, with progress, cancellation and a final summary.
 */
export function useTranslationSelectionRunner(translateBatch: TranslateBatch) {
  const [state, setState] = useState<SelectionRunState>(IDLE);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (items: TranslationMissingItem[]) => {
      const requests = planTranslationBatches(items);
      if (requests.length === 0 || abortRef.current) return;

      const remaining = countTasks(items);
      const controller = new AbortController();
      abortRef.current = controller;
      setState({
        ...IDLE,
        isRunning: true,
        total: requests.reduce((sum, r) => sum + r.entityIds.length, 0),
        pendingIds: new Set(remaining.keys()),
      });

      const onProgress = (event: BatchProgressEvent) => {
        const left = (remaining.get(event.entityId) ?? 1) - 1;
        remaining.set(event.entityId, left);
        setState((s) => {
          const pendingIds = new Set(s.pendingIds);
          if (left <= 0) pendingIds.delete(event.entityId);
          const ok = event.status === "success";
          return {
            ...s,
            processed: s.processed + 1,
            succeeded: s.succeeded + (ok ? 1 : 0),
            failed: s.failed + (ok ? 0 : 1),
            pendingIds,
          };
        });
      };

      try {
        for (const request of requests) {
          if (controller.signal.aborted) break;
          await translateBatch(request.entityIds, onProgress, controller.signal, request.targetLang);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          const message = err instanceof Error ? err.message : "Translation failed";
          setState((s) => ({ ...s, lastError: message }));
        }
      } finally {
        abortRef.current = null;
        setState((s) => ({ ...s, isRunning: false, pendingIds: new Set() }));
      }
    },
    [translateBatch]
  );

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  return { ...state, run, cancel };
}
