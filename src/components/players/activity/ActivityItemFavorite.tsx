"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { FavoriteEventData } from "@/types/activity";

interface ActivityItemFavoriteProps {
  data: FavoriteEventData;
  locale: string;
}

export function ActivityItemFavorite({ data, locale: _locale }: ActivityItemFavoriteProps) {
  const t = useTranslations("players.activity");

  return (
    <div>
      <p className="text-sm text-gray-800 dark:text-slate-200">
        {t.rich("favoriteDescription", {
          character: () => (
            <Link
              href={`/characters/${data.characterSlug}`}
              className="text-palette-secondary-600 dark:text-palette-secondary-400 font-medium hover:underline"
            >
              {data.characterName}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}
