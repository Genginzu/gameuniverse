"use client";

import { useTranslations } from "next-intl";
import type { CollectionEventData } from "@/types/activity";

interface ActivityItemCollectionProps {
  data: CollectionEventData;
  locale: string;
}

export function ActivityItemCollection({ data, locale: _locale }: ActivityItemCollectionProps) {
  const t = useTranslations("players.activity");

  return (
    <div>
      <p className="text-sm text-gray-800 dark:text-slate-200">
        {t("collectionDescription", { name: data.collectionName })}
      </p>
      <span className="mt-1 inline-block text-xs text-gray-500 dark:text-slate-400">
        {t("collectionGamesCount", { count: data.gamesCount })}
      </span>
    </div>
  );
}
