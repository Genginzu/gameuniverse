"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { getRatingColor } from "@/lib/utils/ratingColor";
import type { PlayerReviewItem } from "@/types/playerReview";

interface PlayerReviewCardProps {
  review: PlayerReviewItem;
  locale: string;
}

const EXCERPT_MAX_LENGTH = 200;

/** Strip HTML tags and truncate to a max length with ellipsis. */
function getExcerpt(html: string, maxLength: number = EXCERPT_MAX_LENGTH): string {
  const text = html.replace(/<[^>]*>/g, "");
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

function ReviewPoints({
  points,
  type,
  label,
}: {
  points: string[];
  type: "positive" | "negative";
  label: string;
}) {
  if (points.length === 0) return null;

  const isPositive = type === "positive";
  const iconName = isPositive ? "lucide:thumbs-up" : "lucide:thumbs-down";
  const colorClass = isPositive
    ? "text-green-500 dark:text-green-400"
    : "text-red-500 dark:text-red-400";

  return (
    <div className="space-y-1.5">
      <div className={cn("flex items-center gap-1.5 text-sm font-medium", colorClass)}>
        <Icon icon={iconName} className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <ul className="space-y-1">
        {points.map((point, index) => (
          <li
            key={index}
            className="flex items-start gap-2 text-sm text-gray-600 dark:text-slate-300"
          >
            <span className={cn("mt-0.5 shrink-0", colorClass)}>{isPositive ? "+" : "−"}</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PlayerReviewCard({ review, locale }: PlayerReviewCardProps) {
  const t = useTranslations("players.reviews");

  const formattedDate = new Date(review.createdAt).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="rounded-xl border border-gray-200/80 bg-white/50 p-5 shadow-md backdrop-blur-xl transition-all duration-300 hover:shadow-lg dark:border-slate-600/60 dark:bg-slate-800/50 dark:shadow-black/20">
      {/* Header: game cover + game name + rating */}
      <div className="mb-4 flex gap-4">
        {/* Game cover thumbnail */}
        <Link href={`/${locale}/games/${review.gameSlug}`} className="shrink-0">
          <div className="relative h-20 w-14 overflow-hidden rounded-lg bg-white/10 dark:bg-slate-700/50">
            {review.gameCoverUrl ? (
              <Image
                src={review.gameCoverUrl}
                alt={review.gameName}
                fill
                className="object-cover"
                sizes="56px"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Icon icon="lucide:gamepad-2" className="h-5 w-5 text-slate-400" />
              </div>
            )}
          </div>
        </Link>

        {/* Game name, date, rating */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <Link
              href={`/${locale}/games/${review.gameSlug}`}
              className="hover:text-neon-violet dark:hover:text-neon-cyan text-sm font-semibold text-gray-900 transition-colors dark:text-white"
            >
              {review.gameName}
            </Link>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
              <Icon icon="lucide:calendar" className="h-3 w-3" />
              <time dateTime={review.createdAt}>{formattedDate}</time>
            </div>
          </div>
          <span className={cn("text-xl font-bold", getRatingColor(review.rating))}>
            {review.rating}/20
          </span>
        </div>
      </div>

      {/* Content excerpt */}
      {review.content && (
        <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-slate-300">
          {getExcerpt(review.content)}
        </p>
      )}

      {/* Positive / negative points */}
      {(review.positivePoints.length > 0 || review.negativePoints.length > 0) && (
        <div className="grid gap-4 border-t border-white/20 pt-4 sm:grid-cols-2 dark:border-slate-700/50">
          <ReviewPoints
            points={review.positivePoints}
            type="positive"
            label={t("card.positivePoints")}
          />
          <ReviewPoints
            points={review.negativePoints}
            type="negative"
            label={t("card.negativePoints")}
          />
        </div>
      )}
    </article>
  );
}
