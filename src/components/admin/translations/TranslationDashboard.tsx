"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { routing } from "@/i18n/routing";
import { useTranslationDashboard } from "@/hooks/useTranslationDashboard";
import { TranslationEntityGrid } from "./TranslationEntityGrid";
import { TranslationProgressBar } from "./TranslationProgressBar";
import { TranslationTable } from "./TranslationTable";
import { TranslationBatchProgress } from "./TranslationBatchProgress";
import { TranslationReviewModal } from "./TranslationReviewModal";
import { TranslationEntityDetail } from "./TranslationEntityDetail";

export function TranslationDashboard() {
  const t = useTranslations("admin.translations");
  const d = useTranslationDashboard();

  // Compute global progress from stats for the selected language
  const globalProgress = useMemo(() => {
    if (!d.stats) return { translated: 0, total: 0 };
    const filtered = d.stats.filter((s) => s.language === d.targetLang);
    const total = filtered.reduce((sum, s) => sum + s.total, 0);
    const translated = filtered.reduce((sum, s) => sum + s.complete, 0);
    return { translated, total };
  }, [d.stats, d.targetLang]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader
        targetLang={d.targetLang}
        onTargetLangChange={d.handleTargetLangChange}
        view={d.view}
        entityType={d.entityType}
        onBack={d.view === "table" ? d.navigateToGrid : undefined}
        t={t}
      />

      {/* Global progress bar — visible on grid view */}
      {d.view === "grid" && (
        <TranslationProgressBar
          translated={globalProgress.translated}
          total={globalProgress.total}
        />
      )}

      {/* Error banner */}
      {d.lastError && <ErrorBanner error={d.lastError} onClose={d.clearError} />}

      {/* View: Entity Grid */}
      {d.view === "grid" && (
        <TranslationEntityGrid
          stats={d.stats ?? []}
          targetLang={d.targetLang}
          isLoading={d.isLoadingStats}
          onEntityClick={d.navigateToEntity}
        />
      )}

      {/* View: Table */}
      {d.view === "table" && (
        <>
          {(d.batch.isRunning || d.batch.processed > 0) && (
            <TranslationBatchProgress
              processed={d.batch.processed}
              total={d.batch.total}
              succeeded={d.batch.succeeded}
              failed={d.batch.failed}
              isRunning={d.batch.isRunning}
              onCancel={d.cancelBatch}
            />
          )}
          <TranslationTable
            items={d.items}
            pagination={d.pagination}
            selectedIds={d.selectedIds}
            onToggleSelect={d.toggleSelect}
            onSelectAll={d.selectAll}
            onClearSelection={d.clearSelection}
            onTranslate={d.handleTranslateOne}
            onTranslateAndReview={d.handleTranslateAndReview}
            onRowClick={d.navigateToDetail}
            onPageChange={d.setPage}
            onSearch={d.handleSearch}
            isLoading={d.isLoadingItems}
            translatingIds={d.translatingIds}
          />
        </>
      )}

      {/* View: Entity Detail */}
      {d.view === "detail" && d.entityDetail && (
        <TranslationEntityDetail
          detail={d.entityDetail}
          entityType={d.entityType}
          isLoading={d.isLoadingDetail}
          translatingLangs={d.translatingLangs}
          onBack={d.navigateBackToTable}
          onTranslateLang={d.handleTranslateLang}
          onTranslateAll={d.handleTranslateAllLangs}
        />
      )}

      {/* Loading state for detail view */}
      {d.view === "detail" && d.isLoadingDetail && !d.entityDetail && (
        <div className="glass-card animate-pulse rounded-2xl p-6">
          <div className="mb-4 h-6 w-48 rounded bg-gray-200 dark:bg-slate-700" />
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-200 dark:bg-slate-700" />
            ))}
          </div>
        </div>
      )}

      {/* Review modal */}
      {d.review.item && (
        <TranslationReviewModal
          isOpen={d.review.isOpen}
          onClose={d.closeReview}
          item={d.review.item}
          translatedFields={d.review.translatedFields}
          entityType={d.entityType}
          targetLang={d.review.reviewTargetLang}
          onSave={d.handleSaveReview}
          isSaving={d.review.isSaving}
        />
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function DashboardHeader({
  targetLang,
  onTargetLangChange,
  view,
  entityType,
  onBack,
  t,
}: {
  targetLang: string;
  onTargetLangChange: (lang: string) => void;
  view: string;
  entityType: string;
  onBack?: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="rounded-lg p-1.5 text-gray-500 transition-all duration-300 hover:bg-white/20 dark:text-gray-400 dark:hover:bg-slate-700/40"
          >
            <Icon icon="mdi:arrow-left" className="size-5" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {view === "grid" ? t("title") : t(`entityTypes.${entityType}`)}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {view === "grid" ? t("description") : t("table.subtitle")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Icon icon="mdi:translate" className="size-4 text-gray-400" />
        <select
          value={targetLang}
          onChange={(e) => onTargetLangChange(e.target.value)}
          className="glass-input rounded-lg px-3 py-1.5 text-sm"
          aria-label={t("targetLanguage")}
        >
          {routing.locales.map((locale) => (
            <option key={locale} value={locale}>
              {t(`languages.${locale}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ErrorBanner({ error, onClose }: { error: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 backdrop-blur-sm dark:border-red-800/50 dark:bg-red-900/20">
      <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      <button
        onClick={onClose}
        className="ml-3 rounded-lg p-1 text-red-500 transition-all hover:bg-red-100 dark:hover:bg-red-800/30"
      >
        <Icon icon="mdi:close" className="size-4" />
      </button>
    </div>
  );
}
