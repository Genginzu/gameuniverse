"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { FavoriteEventData } from "@/types/activity";

interface ActivityItemFavoriteProps {
  data: FavoriteEventData;
  locale: string;
}

export function ActivityItemFavorite({ data, locale }: ActivityItemFavoriteProps) {
  const t = useTranslations("players.activity");

  return (
    <div>
      <p className="text-sm text-gray-800 dark:text-slate-200">
        {t.rich("favoriteDescription", {
          character: () => (
            <Link
              href={`/${locale}/characters/${data.characterSlug}`}
              className="font-medium text-cyan-600 hover:underline dark:text-cyan-400"
            >
              {data.characterName}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}
