"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { PlaytimeEventData } from "@/types/activity";

interface ActivityItemPlaytimeProps {
  data: PlaytimeEventData;
  locale: string;
}

export function ActivityItemPlaytime({ data, locale: _locale }: ActivityItemPlaytimeProps) {
  const t = useTranslations("players.activity");

  const durations = [
    { label: t("playtimeHastily"), value: data.playTimeHastily },
    { label: t("playtimeNormally"), value: data.playTimeNormally },
    { label: t("playtimeCompletely"), value: data.playTimeCompletely },
  ].filter((d) => d.value !== null && d.value !== undefined);

  return (
    <div>
      <p className="text-sm text-gray-800 dark:text-slate-200">
        {t.rich("playtimeDescription", {
          game: () => (
            <Link
              href={`/games/${data.gameSlug}`}
              className="font-medium text-palette-secondary-600 hover:underline dark:text-palette-secondary-400"
            >
              {data.gameName}
            </Link>
          ),
        })}
      </p>
      {durations.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-3">
          {durations.map((d) => (
            <div key={d.label} className="text-xs text-gray-500 dark:text-slate-400">
              <span className="text-gray-400 dark:text-slate-500">{d.label}:</span>{" "}
              <span className="font-medium text-gray-700 dark:text-slate-300">{d.value}h</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
