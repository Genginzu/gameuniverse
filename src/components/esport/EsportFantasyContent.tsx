"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageBanner } from "@/components/shared/PageBanner";

export function EsportFantasyContent() {
  const t = useTranslations("esport.fantasy");

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <PageBanner />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Info cards */}
        <div className="xs:grid-cols-2 mb-6 grid gap-4 lg:grid-cols-3">
          {(["draft", "score", "compete"] as const).map((key) => (
            <div key={key} className="glass-card rounded-2xl p-4 text-center sm:p-5">
              <Icon
                icon={
                  key === "draft"
                    ? "mdi:account-plus"
                    : key === "score"
                      ? "mdi:chart-line"
                      : "mdi:trophy"
                }
                className="text-palette-primary-500 mx-auto mb-2 h-8 w-8"
              />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {t(`steps.${key}.title`)}
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t(`steps.${key}.description`)}
              </p>
            </div>
          ))}
        </div>

        <EmptyState
          icon="mdi:account-group-outline"
          title={t("noLeagues")}
          description={t("noLeaguesDescription")}
        />
      </div>
    </div>
  );
}
