"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { SyncProgressBar, SyncProgressEntity } from "@/lib/pandascore/sync-progress";

type Translator = ReturnType<typeof useTranslations>;

const ENTITY_ICONS: Record<SyncProgressEntity["key"], string> = {
  teams: "mdi:account-group",
  tournaments: "mdi:trophy",
  players: "mdi:account",
  matches: "mdi:sword-cross",
};

interface SyncJobEntityRowProps {
  entity: SyncProgressEntity;
  t: Translator;
}

export function SyncJobEntityRow({ entity, t }: SyncJobEntityRowProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white/40 p-3 backdrop-blur-xl dark:border-gray-700 dark:bg-slate-800/40">
      <div className="mb-2 flex items-center gap-2">
        <Icon icon={ENTITY_ICONS[entity.key]} className="text-palette-primary-500 size-5" />
        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
          {t(`entities.${entity.key}`)}
        </span>
        {entity.done ? (
          <Icon icon="mdi:check-circle" className="size-5 text-green-500 dark:text-green-400" />
        ) : entity.isCurrent ? (
          <Icon icon="mdi:loading" className="text-palette-secondary-500 size-4 animate-spin" />
        ) : null}
      </div>
      <div className={entity.bars.length > 1 ? "grid grid-cols-1 gap-2 sm:grid-cols-2" : ""}>
        {entity.bars.map((bar) => (
          <SyncJobProgressBar key={bar.key} bar={bar} t={t} />
        ))}
      </div>
    </div>
  );
}

function SyncJobProgressBar({ bar, t }: { bar: SyncProgressBar; t: Translator }) {
  const progressLabel = bar.done
    ? t("done")
    : t("pageProgress", { page: bar.page, estimate: bar.estimate });

  return (
    <div>
      {bar.variant ? (
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            {t(`variants.${bar.variant}`)}
            {bar.isCurrent && !bar.done && (
              <Icon icon="mdi:loading" className="text-palette-secondary-500 size-3 animate-spin" />
            )}
          </span>
          <span className="text-gray-500 tabular-nums dark:text-gray-400">{progressLabel}</span>
        </div>
      ) : (
        <div className="mb-1 flex justify-end text-xs">
          <span className="text-gray-500 tabular-nums dark:text-gray-400">{progressLabel}</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            bar.done ? "bg-green-500" : "from-cta-from to-cta-to bg-linear-to-r"
          }`}
          style={{ width: `${bar.percent}%` }}
        />
      </div>
    </div>
  );
}
