"use client";

import { useCallback } from "react";
import useSWR from "swr";
import type {
  EntityType,
  TranslationMissingItem,
  TranslationStats,
  TranslateResult,
  BatchProgressEvent,
  BatchSummary,
  PaginationInfo,
} from "@/types/admin-translations";

// ─── Params & Return types ──────────────────────────────────────────

export interface UseAdminTranslationsParams {
  targetLang: string;
  entityType: EntityType;
  page?: number;
  search?: string;
}

export interface UseAdminTranslationsReturn {
  stats: TranslationStats[] | undefined;
  items: TranslationMissingItem[];
  pagination: PaginationInfo;
  isLoadingStats: boolean;
  isLoadingItems: boolean;
  error: Error | null;
  mutateStats: () => void;
  mutateItems: () => void;
  translateOne: (entityId: string, opts?: { saveToDb?: boolean }) => Promise<TranslateResult>;
  translateBatch: (
    entityIds: string[],
    onProgress: (event: BatchProgressEvent) => void,
    signal?: AbortSignal
  ) => Promise<BatchSummary>;
  saveTranslation: (entityId: string, fields: Record<string, string>) => Promise<void>;
}

// ─── Defaults ───────────────────────────────────────────────────────

const DEFAULT_PAGINATION: PaginationInfo = {
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  limit: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

// ─── SWR key builders ───────────────────────────────────────────────

function buildMissingKey(params: UseAdminTranslationsParams): string {
  const sp = new URLSearchParams({
    type: params.entityType,
    targetLang: params.targetLang,
    page: String(params.page ?? 1),
  });
  if (params.search?.trim()) sp.set("search", params.search.trim());
  return `/api/admin/translations/missing?${sp.toString()}`;
}

// ─── NDJSON stream parser ───────────────────────────────────────────

async function parseNdjsonStream(
  response: Response,
  onProgress: (event: BatchProgressEvent) => void,
  signal?: AbortSignal
): Promise<BatchSummary> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let succeeded = 0;
  let failed = 0;
  let total = 0;

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Keep the last (possibly incomplete) chunk in the buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const event: BatchProgressEvent = JSON.parse(trimmed);
        total++;
        if (event.status === "success") succeeded++;
        else failed++;
        onProgress(event);
      }
    }

    // Process any remaining data in the buffer
    if (buffer.trim()) {
      const event: BatchProgressEvent = JSON.parse(buffer.trim());
      total++;
      if (event.status === "success") succeeded++;
      else failed++;
      onProgress(event);
    }
  } catch (err) {
    if (signal?.aborted) {
      // Cancellation is expected — return partial summary
    } else {
      throw err;
    }
  }

  return { total, succeeded, failed };
}

// ─── Hook ───────────────────────────────────────────────────────────

export function useAdminTranslations(
  params: UseAdminTranslationsParams
): UseAdminTranslationsReturn {
  const { targetLang, entityType } = params;

  // Stats — single endpoint, no query params
  const {
    data: statsData,
    isLoading: isLoadingStats,
    error: statsError,
    mutate: rawMutateStats,
  } = useSWR<TranslationStats[]>("/api/admin/translations/stats");

  // Missing items — depends on entityType, targetLang, page, search
  const missingKey = buildMissingKey(params);
  const {
    data: missingData,
    isLoading: isLoadingItems,
    error: itemsError,
    mutate: rawMutateItems,
  } = useSWR<{ items: TranslationMissingItem[]; pagination: PaginationInfo }>(missingKey);

  const mutateStats = useCallback(() => {
    rawMutateStats();
  }, [rawMutateStats]);

  const mutateItems = useCallback(() => {
    rawMutateItems();
  }, [rawMutateItems]);

  const revalidateAll = useCallback(() => {
    mutateStats();
    mutateItems();
  }, [mutateStats, mutateItems]);

  // ── translateOne ────────────────────────────────────────────────

  const translateOne = useCallback(
    async (entityId: string, opts?: { saveToDb?: boolean }): Promise<TranslateResult> => {
      const res = await fetch("/api/admin/translations/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          targetLang,
          saveToDb: opts?.saveToDb ?? true,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Translation failed (${res.status})`);
      }

      const result: TranslateResult = await res.json();
      revalidateAll();
      return result;
    },
    [entityType, targetLang, revalidateAll]
  );

  // ── translateBatch ──────────────────────────────────────────────

  const translateBatch = useCallback(
    async (
      entityIds: string[],
      onProgress: (event: BatchProgressEvent) => void,
      signal?: AbortSignal
    ): Promise<BatchSummary> => {
      const res = await fetch("/api/admin/translations/translate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityIds, targetLang }),
        signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Batch translation failed (${res.status})`);
      }

      const summary = await parseNdjsonStream(res, onProgress, signal);
      revalidateAll();
      return summary;
    },
    [entityType, targetLang, revalidateAll]
  );

  // ── saveTranslation ─────────────────────────────────────────────

  const saveTranslation = useCallback(
    async (entityId: string, fields: Record<string, string>): Promise<void> => {
      const res = await fetch("/api/admin/translations/save", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          targetLang,
          translations: fields,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Save failed (${res.status})`);
      }

      revalidateAll();
    },
    [entityType, targetLang, revalidateAll]
  );

  return {
    stats: statsData,
    items: missingData?.items ?? [],
    pagination: missingData?.pagination ?? DEFAULT_PAGINATION,
    isLoadingStats,
    isLoadingItems,
    error: statsError ?? itemsError ?? null,
    mutateStats,
    mutateItems,
    translateOne,
    translateBatch,
    saveTranslation,
  };
}
