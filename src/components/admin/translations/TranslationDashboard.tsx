"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { routing } from "@/i18n/routing";
import type { EntityType } from "@/types/admin-translations";
import { useTranslationDashboard } from "@/hooks/useTranslationDashboard";
import { TranslationStatsCards } from "./TranslationStatsCards";
import { TranslationProgressBar } from "./TranslationProgressBar";
import { TranslationTable } from "./TranslationTable";
import { TranslationBatchProgress } from "./TranslationBatchProgress";
import { TranslationReviewModal } from "./TranslationReviewModal";

const ENTITY_TYPES: EntityType[] = [
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
];

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
      {/* Header with filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("description")}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Language selector */}
          <div className="flex items-center gap-2">
            <Icon icon="mdi:translate" className="size-4 text-gray-400" />
            <select
              value={d.targetLang}
              onChange={(e) => d.handleTargetLangChange(e.target.value)}
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

          {/* Entity type filter */}
          <div className="flex items-center gap-2">
            <Icon icon="mdi:filter-variant" className="size-4 text-gray-400" />
            <select
              value={d.entityType}
              onChange={(e) => d.handleEntityTypeChange(e.target.value as EntityType)}
              className="glass-input rounded-lg px-3 py-1.5 text-sm"
              aria-label={t("entityType")}
            >
              {ENTITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`entityTypes.${type}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Global progress bar */}
      <TranslationProgressBar translated={globalProgress.translated} total={globalProgress.total} />

      {/* Stats cards */}
      <TranslationStatsCards
        stats={d.stats ?? []}
        targetLang={d.targetLang}
        isLoading={d.isLoadingStats}
      />

      {/* Batch progress (visible when batch has been triggered) */}
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

      {/* Translation table */}
      <TranslationTable
        items={d.items}
        pagination={d.pagination}
        entityType={d.entityType}
        targetLang={d.targetLang}
        selectedIds={d.selectedIds}
        onToggleSelect={d.toggleSelect}
        onSelectAll={d.selectAll}
        onClearSelection={d.clearSelection}
        onTranslate={d.handleTranslateOne}
        onTranslateAndReview={d.handleTranslateAndReview}
        onPageChange={d.setPage}
        onSearch={d.handleSearch}
        isLoading={d.isLoadingItems}
        translatingIds={d.translatingIds}
      />

      {/* Review modal */}
      {d.review.item && (
        <TranslationReviewModal
          isOpen={d.review.isOpen}
          onClose={d.closeReview}
          item={d.review.item}
          translatedFields={d.review.translatedFields}
          entityType={d.entityType}
          targetLang={d.targetLang}
          onSave={d.handleSaveReview}
          isSaving={d.review.isSaving}
        />
      )}
    </div>
  );
}
