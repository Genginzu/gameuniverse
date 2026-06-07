"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { EmptyState } from "@/components/shared/EmptyState";

export function EsportFantasyContent() {
  const t = useTranslations("esport.fantasy");

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Info cards */}
      <div className="xs:grid-cols-2 mb-6 grid gap-4 lg:grid-cols-3">
        {(["draft", "score", "compete"] as const).map((key) => (
          <div
            key={key}
            className="border-editorial-line bg-editorial-2 rounded-2xl border p-4 text-center sm:p-5"
          >
            <Icon
              icon={
                key === "draft"
                  ? "mdi:account-plus"
                  : key === "score"
                    ? "mdi:chart-line"
                    : "mdi:trophy"
              }
              className="text-editorial-accent mx-auto mb-2 h-8 w-8"
            />
            <h3 className="text-sm font-bold text-white">{t(`steps.${key}.title`)}</h3>
            <p className="text-editorial-muted mt-1 text-xs">{t(`steps.${key}.description`)}</p>
          </div>
        ))}
      </div>

      <EmptyState
        icon="mdi:account-group-outline"
        title={t("noLeagues")}
        description={t("noLeaguesDescription")}
      />
    </div>
  );
}
