"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import type { ReviewEventData } from "@/types/activity";

interface ActivityItemReviewProps {
  data: ReviewEventData;
  locale: string;
}

export function ActivityItemReview({ data, locale }: ActivityItemReviewProps) {
  const t = useTranslations("players.activity");

  return (
    <div>
      <p className="text-sm text-gray-800 dark:text-slate-200">
        {t.rich("reviewDescription", {
          game: () => (
            <Link
              href={`/${locale}/games/${data.gameSlug}`}
              className="font-medium text-cyan-600 hover:underline dark:text-cyan-400"
            >
              {data.gameName}
            </Link>
          ),
        })}
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        <Star className="h-3.5 w-3.5 text-yellow-500 dark:text-yellow-400" fill="currentColor" />
        <span className="text-sm font-medium text-yellow-500 dark:text-yellow-400">
          {data.rating}/20
        </span>
      </div>
      {data.contentExcerpt && (
        <p className="mt-1.5 line-clamp-2 text-sm italic text-gray-500 dark:text-slate-400">
          &ldquo;{data.contentExcerpt.replace(/<[^>]+>/g, "")}&rdquo;
        </p>
      )}
    </div>
  );
}
