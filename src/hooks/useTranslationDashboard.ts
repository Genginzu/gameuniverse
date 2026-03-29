"use client";

import { useState, useCallback, useRef } from "react";
import { routing } from "@/i18n/routing";
import { useAdminTranslations } from "@/hooks/useAdminTranslations";
import type {
  EntityType,
  EntityTranslationDetail,
  TranslationMissingItem,
  BatchProgressEvent,
} from "@/types/admin-translations";

// ─── State types ────────────────────────────────────────────────────
/** The 3 views of the translation dashboard */
export type TranslationView = "grid" | "table" | "detail";

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
  reviewTargetLang: string;
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
  reviewTargetLang: "",
};

// ─── Hook ───────────────────────────────────────────────────────────
export function useTranslationDashboard() {
  // Navigation view
  const [view, setView] = useState<TranslationView>("grid");

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

  // Entity detail state
  const [entityDetail, setEntityDetail] = useState<EntityTranslationDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [translatingLangs, setTranslatingLangs] = useState<Set<string>>(new Set());

  // Batch & review state
  const [batch, setBatch] = useState<BatchState>(INITIAL_BATCH);
  const [review, setReview] = useState<ReviewState>(INITIAL_REVIEW);
  const abortRef = useRef<AbortController | null>(null);

  // SWR hook
  const swr = useAdminTranslations({ targetLang, entityType, page, search });

  // Error message
  const [lastError, setLastError] = useState<string | null>(null);
  const clearError = useCallback(() => setLastError(null), []);

  // ── Navigation handlers ─────────────────────────────────────────
  const navigateToEntity = useCallback((type: EntityType) => {
    setEntityType(type);
    setPage(1);
    setSearch("");
    setSelectedIds(new Set());
    setView("table");
  }, []);

  const navigateToGrid = useCallback(() => {
    setView("grid");
    setEntityDetail(null);
  }, []);

  const navigateToDetail = useCallback(
    async (item: TranslationMissingItem) => {
      setIsLoadingDetail(true);
      setView("detail");
      try {
        const detail = await swr.fetchEntityDetail(item.entityId);
        setEntityDetail(detail);
      } catch (err) {
        setLastError(err instanceof Error ? err.message : "Failed to load detail");
        setView("table");
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [swr]
  );

  const navigateBackToTable = useCallback(() => {
    setView("table");
    setEntityDetail(null);
    setTranslatingLangs(new Set());
  }, []);

  // ── Filter handlers ─────────────────────────────────────────────
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

  // ── Translate one (all missing langs) ─────────────────────────
  const handleTranslateOne = useCallback(
    async (item: TranslationMissingItem) => {
      setTranslatingIds((prev) => new Set(prev).add(item.entityId));
      try {
        for (const lang of item.missingLangs) {
          await swr.translateOne(item.entityId, { targetLang: lang });
        }
        setLastError(null);
      } catch (err) {
        setLastError(err instanceof Error ? err.message : "Translation failed");
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

  // ── Translate single language from detail view ────────────────
  const handleTranslateLang = useCallback(
    async (lang: string) => {
      if (!entityDetail) return;
      setTranslatingLangs((prev) => new Set(prev).add(lang));
      try {
        await swr.translateOne(entityDetail.entityId, { targetLang: lang });
        // Refresh detail
        const updated = await swr.fetchEntityDetail(entityDetail.entityId);
        setEntityDetail(updated);
        setLastError(null);
      } catch (err) {
        setLastError(err instanceof Error ? err.message : "Translation failed");
      } finally {
        setTranslatingLangs((prev) => {
          const next = new Set(prev);
          next.delete(lang);
          return next;
        });
      }
    },
    [entityDetail, swr]
  );

  // ── Translate all missing languages from detail view ──────────
  const handleTranslateAllLangs = useCallback(async () => {
    if (!entityDetail) return;
    const missingLangs = entityDetail.languages
      .filter((l) => l.status !== "complete")
      .map((l) => l.language);
    if (missingLangs.length === 0) return;

    setTranslatingLangs(new Set(missingLangs));
    try {
      for (const lang of missingLangs) {
        await swr.translateOne(entityDetail.entityId, { targetLang: lang });
      }
      const updated = await swr.fetchEntityDetail(entityDetail.entityId);
      setEntityDetail(updated);
      setLastError(null);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setTranslatingLangs(new Set());
    }
  }, [entityDetail, swr]);

  // ── Translate and review ────────────────────────────────────────
  const handleTranslateAndReview = useCallback(
    async (item: TranslationMissingItem) => {
      if (item.missingLangs.length === 0) return;
      const firstLang = item.missingLangs[0];
      setTranslatingIds((prev) => new Set(prev).add(item.entityId));
      try {
        const result = await swr.translateOne(item.entityId, {
          saveToDb: false,
          targetLang: firstLang,
        });
        setReview({
          isOpen: true,
          item,
          translatedFields: result.translatedFields,
          isSaving: false,
          reviewTargetLang: firstLang,
        });
        setLastError(null);
      } catch (err) {
        setLastError(err instanceof Error ? err.message : "Translation failed");
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
      if (!review.item || !review.reviewTargetLang) return;
      setReview((prev) => ({ ...prev, isSaving: true }));
      try {
        await swr.saveTranslation(review.item.entityId, fields, review.reviewTargetLang);
        setReview(INITIAL_REVIEW);
      } finally {
        setReview((prev) => ({ ...prev, isSaving: false }));
      }
    },
    [review.item, review.reviewTargetLang, swr]
  );

  const closeReview = useCallback(() => setReview(INITIAL_REVIEW), []);

  return {
    view,
    navigateToEntity,
    navigateToGrid,
    navigateToDetail,
    navigateBackToTable,
    targetLang,
    entityType,
    page,
    search,
    setPage,
    handleTargetLangChange,
    handleSearch,
    ...swr,
    selectedIds,
    translatingIds,
    toggleSelect,
    selectAll,
    clearSelection,
    entityDetail,
    isLoadingDetail,
    translatingLangs,
    handleTranslateLang,
    handleTranslateAllLangs,
    batch,
    handleBatchTranslate,
    cancelBatch,
    review,
    handleTranslateOne,
    handleTranslateAndReview,
    handleSaveReview,
    closeReview,
    lastError,
    clearError,
  };
}
