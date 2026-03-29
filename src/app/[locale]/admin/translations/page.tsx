"use client";

import { useMemo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import useSWR from "swr";
import { routing } from "@/i18n/routing";
import type { TranslationStats } from "@/types/admin-translations";
import { TranslationEntityGrid } from "@/components/admin/translations/TranslationEntityGrid";
import { TranslationProgressBar } from "@/components/admin/translations/TranslationProgressBar";

export default function AdminTranslationsPage() {
  const t = useTranslations("admin.translations");
  const defaultLang =
    routing.locales.find((l) => l !== routing.defaultLocale) ?? routing.locales[0];
  const [targetLang, setTargetLang] = useState(defaultLang);
  const [isSyncing, setIsSyncing] = useState(false);

  const { data, isLoading, mutate } = useSWR<{ stats: TranslationStats[] }>(
    "/api/admin/translations/stats"
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

  const globalProgress = useMemo(() => {
    const filtered = stats.filter((s) => s.language === targetLang);
    const total = filtered.reduce((sum, s) => sum + s.total, 0);
    const translated = filtered.reduce((sum, s) => sum + s.complete, 0);
    return { translated, total };
  }, [stats, targetLang]);

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
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 px-3 py-1.5 text-xs font-medium text-cyan-600 transition-all duration-300 hover:bg-cyan-50 disabled:opacity-50 dark:text-cyan-400 dark:hover:bg-cyan-900/20"
          >
            {isSyncing ? (
              <Icon icon="mdi:loading" className="size-4 animate-spin" />
            ) : (
              <Icon icon="mdi:refresh" className="size-4" />
            )}
            {t("buttons.syncStats")}
          </button>
          <div className="flex items-center gap-2">
            <Icon icon="mdi:translate" className="size-4 text-gray-400" />
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
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
      </div>

      <TranslationProgressBar translated={globalProgress.translated} total={globalProgress.total} />

      <TranslationEntityGrid stats={stats} targetLang={targetLang} isLoading={isLoading} />
    </div>
  );
}
