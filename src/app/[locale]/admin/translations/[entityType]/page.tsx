"use client";

import { useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { routing } from "@/i18n/routing";
import { useAdminTranslations } from "@/hooks/useAdminTranslations";
import type {
  EntityType,
  TranslationMissingItem,
  BatchProgressEvent,
} from "@/types/admin-translations";
import { TranslationTable } from "@/components/admin/translations/TranslationTable";
import { TranslationBatchProgress } from "@/components/admin/translations/TranslationBatchProgress";
import { TranslationReviewModal } from "@/components/admin/translations/TranslationReviewModal";

const VALID_TYPES = new Set([
  "games",
  "characters",
  "genres",
  "companies",
  "platforms",
  "character_roles",
  "genders",
  "species",
  "content_descriptors",
  "ratings",
]);

export default function TranslationEntityTypePage() {
  const params = useParams();
  const entityType = params.entityType as string;
  const t = useTranslations("admin.translations");

  if (!VALID_TYPES.has(entityType)) return <InvalidEntity />;

  return <EntityTableView entityType={entityType as EntityType} t={t} />;
}

function InvalidEntity() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
      <Icon icon="mdi:alert-circle" className="mb-3 size-10 opacity-40" />
      <p>Invalid entity type</p>
    </div>
  );
}

/** Build a Link-compatible href object with updated search params. */
function buildHref(
  entityType: string,
  currentParams: URLSearchParams,
  overrides: Record<string, string | null>
): { pathname: string; query: Record<string, string> } {
  const sp = new URLSearchParams(currentParams.toString());
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null || value === "" || value === "1") {
      sp.delete(key);
    } else {
      sp.set(key, value);
    }
  }
  const query: Record<string, string> = {};
  sp.forEach((v, k) => {
    query[k] = v;
  });
  return { pathname: `/admin/translations/${entityType}`, query };
}

function EntityTableView({
  entityType,
  t,
}: {
  entityType: EntityType;
  t: ReturnType<typeof useTranslations>;
}) {
  const searchParams = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const search = searchParams.get("search") ?? "";

  const defaultLang =
    routing.locales.find((l) => l !== routing.defaultLocale) ?? routing.locales[0];
  const [targetLang, setTargetLang] = useState(defaultLang);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());
  const [lastError, setLastError] = useState<string | null>(null);

  // Batch state
  const [batch, setBatch] = useState({
    isRunning: false,
    processed: 0,
    total: 0,
    succeeded: 0,
    failed: 0,
  });
  const abortRef = useRef<AbortController | null>(null);

  // Review state
  const [review, setReview] = useState<{
    isOpen: boolean;
    item: TranslationMissingItem | null;
    translatedFields: Record<string, string>;
    isSaving: boolean;
    reviewTargetLang: string;
  }>({ isOpen: false, item: null, translatedFields: {}, isSaving: false, reviewTargetLang: "" });

  const swr = useAdminTranslations({ targetLang, entityType, page, search });

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const handleTranslateOne = useCallback(
    async (item: TranslationMissingItem) => {
      setTranslatingIds((p) => new Set(p).add(item.entityId));
      try {
        for (const lang of item.missingLangs)
          await swr.translateOne(item.entityId, { targetLang: lang });
      } catch (err) {
        setLastError(err instanceof Error ? err.message : "Translation failed");
      } finally {
        setTranslatingIds((p) => {
          const n = new Set(p);
          n.delete(item.entityId);
          return n;
        });
      }
    },
    [swr]
  );

  const handleTranslateAndReview = useCallback(
    async (item: TranslationMissingItem) => {
      if (!item.missingLangs.length) return;
      const lang = item.missingLangs[0];
      setTranslatingIds((p) => new Set(p).add(item.entityId));
      try {
        const result = await swr.translateOne(item.entityId, { saveToDb: false, targetLang: lang });
        setReview({
          isOpen: true,
          item,
          translatedFields: result.translatedFields,
          isSaving: false,
          reviewTargetLang: lang,
        });
      } catch (err) {
        setLastError(err instanceof Error ? err.message : "Translation failed");
      } finally {
        setTranslatingIds((p) => {
          const n = new Set(p);
          n.delete(item.entityId);
          return n;
        });
      }
    },
    [swr]
  );

  const handleSaveReview = useCallback(
    async (fields: Record<string, string>) => {
      if (!review.item || !review.reviewTargetLang) return;
      setReview((p) => ({ ...p, isSaving: true }));
      try {
        await swr.saveTranslation(review.item.entityId, fields, review.reviewTargetLang);
        setReview({
          isOpen: false,
          item: null,
          translatedFields: {},
          isSaving: false,
          reviewTargetLang: "",
        });
      } finally {
        setReview((p) => ({ ...p, isSaving: false }));
      }
    },
    [review.item, review.reviewTargetLang, swr]
  );

  const cancelBatch = useCallback(() => abortRef.current?.abort(), []);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/translations"
            className="rounded-lg p-1.5 text-gray-500 transition-all duration-300 hover:bg-white/20 dark:text-gray-400 dark:hover:bg-slate-700/40"
          >
            <Icon icon="mdi:arrow-left" className="size-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t(`entityTypes.${entityType}`)}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("table.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Icon icon="mdi:translate" className="size-4 text-gray-400" />
          <select
            value={targetLang}
            onChange={(e) => {
              setTargetLang(e.target.value);
              setSelectedIds(new Set());
            }}
            className="glass-input rounded-lg px-3 py-1.5 text-sm"
            aria-label={t("targetLanguage")}
          >
            {routing.locales.map((l) => (
              <option key={l} value={l}>
                {t(`languages.${l}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {lastError && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 backdrop-blur-sm dark:border-red-800/50 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400">{lastError}</p>
          <button
            onClick={() => setLastError(null)}
            className="ml-3 rounded-lg p-1 text-red-500 transition-all hover:bg-red-100 dark:hover:bg-red-800/30"
          >
            <Icon icon="mdi:close" className="size-4" />
          </button>
        </div>
      )}

      {(batch.isRunning || batch.processed > 0) && (
        <TranslationBatchProgress
          processed={batch.processed}
          total={batch.total}
          succeeded={batch.succeeded}
          failed={batch.failed}
          isRunning={batch.isRunning}
          onCancel={cancelBatch}
        />
      )}

      <TranslationTable
        items={swr.items}
        pagination={swr.pagination}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onSelectAll={(ids) => setSelectedIds(new Set(ids))}
        onClearSelection={() => setSelectedIds(new Set())}
        onTranslate={handleTranslateOne}
        onTranslateAndReview={handleTranslateAndReview}
        rowHref={(item) => `/admin/translations/${entityType}/${item.entityId}`}
        buildPageUrl={(p) => buildHref(entityType, searchParams, { page: String(p) })}
        buildSearchUrl={(q) => buildHref(entityType, searchParams, { search: q, page: null })}
        currentSearch={search}
        isLoading={swr.isLoadingItems}
        translatingIds={translatingIds}
      />

      {review.item && (
        <TranslationReviewModal
          isOpen={review.isOpen}
          onClose={() =>
            setReview({
              isOpen: false,
              item: null,
              translatedFields: {},
              isSaving: false,
              reviewTargetLang: "",
            })
          }
          item={review.item}
          translatedFields={review.translatedFields}
          entityType={entityType}
          targetLang={review.reviewTargetLang}
          onSave={handleSaveReview}
          isSaving={review.isSaving}
        />
      )}
    </div>
  );
}
