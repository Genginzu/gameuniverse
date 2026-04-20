"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { SessionEventData } from "@/types/activity";

interface ActivityItemSessionProps {
  data: SessionEventData;
  locale: string;
}

function formatDuration(t: ReturnType<typeof useTranslations>, totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return t("durationHm", { h: hours, m: minutes });
  if (hours > 0) return t("durationH", { h: hours });
  return t("durationM", { m: minutes });
}

export function ActivityItemSession({ data, locale: _locale }: ActivityItemSessionProps) {
  const t = useTranslations("players.activity");
  const duration = formatDuration(t, data.durationMinutes);

  return (
    <div>
      <p className="text-sm text-gray-800 dark:text-slate-200">
        {t.rich("sessionDescription", {
          game: () => (
            <Link
              href={`/games/${data.gameSlug}`}
              className="font-medium text-cyan-600 hover:underline dark:text-cyan-400"
            >
              {data.gameName}
            </Link>
          ),
          duration: () => (
            <span className="font-medium text-gray-700 dark:text-slate-300">{duration}</span>
          ),
        })}
      </p>
    </div>
  );
}
