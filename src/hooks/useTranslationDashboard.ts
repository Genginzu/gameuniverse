"use client";

import { useState, useCallback, useRef } from "react";
import { routing } from "@/i18n/routing";
import { useAdminTranslations } from "@/hooks/useAdminTranslations";
import type {
  EntityType,
  TranslationMissingItem,
  BatchProgressEvent,
} from "@/types/admin-translations";

// ─── State types ────────────────────────────────────────────────────

export interface BatchState {
  isRunning: boolean;
  processed: number;
  total: number;
  succeeded: number;
  failed: number;
}

export interface ReviewState {
  isOpen: boolean;
  item: TranslationMissingItem | null;
  translatedFields: Record<string, string>;
  isSaving: boolean;
}

const INITIAL_BATCH: BatchState = {
  isRunning: false,
  processed: 0,
  total: 0,
  succeeded: 0,
  failed: 0,
};

const INITIAL_REVIEW: ReviewState = {
  isOpen: false,
  item: null,
  translatedFields: {},
  isSaving: false,
};

// ─── Hook ───────────────────────────────────────────────────────────

export function useTranslationDashboard() {
  // Filters
  const defaultLang =
    routing.locales.find((l) => l !== routing.defaultLocale) ?? routing.locales[0];
  const [targetLang, setTargetLang] = useState(defaultLang);
  const [entityType, setEntityType] = useState<EntityType>("games");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());

  // Batch & review state
  const [batch, setBatch] = useState<BatchState>(INITIAL_BATCH);
  const [review, setReview] = useState<ReviewState>(INITIAL_REVIEW);
  const abortRef = useRef<AbortController | null>(null);

  // SWR hook
  const swr = useAdminTranslations({ targetLang, entityType, page, search });

  // Reset selection when filters change
  const handleEntityTypeChange = useCallback((type: EntityType) => {
    setEntityType(type);
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  const handleTargetLangChange = useCallback((lang: string) => {
    setTargetLang(lang as (typeof routing.locales)[number]);
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
    setPage(1);
  }, []);

  // ── Selection handlers ──────────────────────────────────────────

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // ── Translate one ───────────────────────────────────────────────

  const handleTranslateOne = useCallback(
    async (item: TranslationMissingItem) => {
      setTranslatingIds((prev) => new Set(prev).add(item.entityId));
      try {
        await swr.translateOne(item.entityId);
      } finally {
        setTranslatingIds((prev) => {
          const next = new Set(prev);
          next.delete(item.entityId);
          return next;
        });
      }
    },
    [swr]
  );

  // ── Translate and review ────────────────────────────────────────

  const handleTranslateAndReview = useCallback(
    async (item: TranslationMissingItem) => {
      setTranslatingIds((prev) => new Set(prev).add(item.entityId));
      try {
        const result = await swr.translateOne(item.entityId, { saveToDb: false });
        setReview({
          isOpen: true,
          item,
          translatedFields: result.translatedFields,
          isSaving: false,
        });
      } finally {
        setTranslatingIds((prev) => {
          const next = new Set(prev);
          next.delete(item.entityId);
          return next;
        });
      }
    },
    [swr]
  );

  // ── Batch translate ─────────────────────────────────────────────

  const handleBatchTranslate = useCallback(
    async (entityIds: string[]) => {
      const controller = new AbortController();
      abortRef.current = controller;

      setBatch({ isRunning: true, processed: 0, total: entityIds.length, succeeded: 0, failed: 0 });

      const onProgress = (event: BatchProgressEvent) => {
        setBatch((prev) => ({
          ...prev,
          processed: prev.processed + 1,
          succeeded: event.status === "success" ? prev.succeeded + 1 : prev.succeeded,
          failed: event.status === "error" ? prev.failed + 1 : prev.failed,
        }));
      };

      try {
        await swr.translateBatch(entityIds, onProgress, controller.signal);
      } finally {
        setBatch((prev) => ({ ...prev, isRunning: false }));
        abortRef.current = null;
        setSelectedIds(new Set());
      }
    },
    [swr]
  );

  const cancelBatch = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // ── Review modal ────────────────────────────────────────────────

  const handleSaveReview = useCallback(
    async (fields: Record<string, string>) => {
      if (!review.item) return;
      setReview((prev) => ({ ...prev, isSaving: true }));
      try {
        await swr.saveTranslation(review.item.entityId, fields);
        setReview(INITIAL_REVIEW);
      } finally {
        setReview((prev) => ({ ...prev, isSaving: false }));
      }
    },
    [review.item, swr]
  );

  const closeReview = useCallback(() => {
    setReview(INITIAL_REVIEW);
  }, []);

  return {
    // Filters
    targetLang,
    entityType,
    page,
    search,
    setPage,
    handleEntityTypeChange,
    handleTargetLangChange,
    handleSearch,
    // SWR data
    ...swr,
    // Selection
    selectedIds,
    translatingIds,
    toggleSelect,
    selectAll,
    clearSelection,
    // Batch
    batch,
    handleBatchTranslate,
    cancelBatch,
    // Review
    review,
    handleTranslateOne,
    handleTranslateAndReview,
    handleSaveReview,
    closeReview,
  };
}
