"use client";

import { useMemo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import useSWR from "swr";
import type { TranslationStats } from "@/types/admin-translations";
import { TranslationEntityGrid } from "@/components/admin/translations/TranslationEntityGrid";
import { TranslationProgressBar } from "@/components/admin/translations/TranslationProgressBar";

export default function AdminTranslationsPage() {
  const t = useTranslations("admin.translations");
  const [isSyncing, setIsSyncing] = useState(false);

  const { data, isLoading, mutate } = useSWR<{ stats: TranslationStats[] }>(
    "/api/admin/translations/stats",
    { revalidateOnMount: true, dedupingInterval: 0 }
  );
  const stats = data?.stats ?? [];

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await fetch("/api/admin/translations/refresh-stats", { method: "POST" });
      await mutate();
    } finally {
      setIsSyncing(false);
    }
  }, [mutate]);

  // Cross-language stats (_all): an entity is "translated" when complete in every language
  const crossLangStats = useMemo(() => stats.filter((s) => s.language === "_all"), [stats]);

  const globalProgress = useMemo(() => {
    const total = crossLangStats.reduce((sum, s) => sum + s.total, 0);
    const translated = crossLangStats.reduce((sum, s) => sum + s.complete, 0);
    return { translated, total };
  }, [crossLangStats]);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("description")}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="border-palette-secondary-500/30 text-palette-secondary-600 hover:bg-palette-secondary-50 dark:text-palette-secondary-400 dark:hover:bg-palette-secondary-900/20 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-300 disabled:opacity-50"
          >
            {isSyncing ? (
              <Icon icon="mdi:loading" className="size-4 animate-spin" />
            ) : (
              <Icon icon="mdi:refresh" className="size-4" />
            )}
            {t("buttons.syncStats")}
          </button>
        </div>
      </div>

      <TranslationProgressBar translated={globalProgress.translated} total={globalProgress.total} />

      <TranslationEntityGrid stats={crossLangStats} isLoading={isLoading} />
    </div>
  );
}
