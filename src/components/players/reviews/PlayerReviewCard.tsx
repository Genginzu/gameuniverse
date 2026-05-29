"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

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
    <div className="editorial-review-card-points-group">
      <div className={cn("editorial-review-card-points-label", colorClass)}>
        <Icon icon={iconName} className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <ul className="editorial-review-card-points-list">
        {points.map((point, index) => (
          <li key={index} className="editorial-review-card-points-item">
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
    <article className="editorial-review-card">
      {/* Header: game cover + game name + rating */}
      <div className="editorial-review-card-header">
        {/* Game cover thumbnail */}
        <Link href={`/games/${review.gameSlug}`} className="shrink-0">
          <div className="editorial-review-card-cover">
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
                <Icon icon="lucide:gamepad-2" className="h-5 w-5" aria-hidden="true" />
              </div>
            )}
          </div>
        </Link>

        {/* Game name, date, rating */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <Link href={`/games/${review.gameSlug}`} className="editorial-review-card-game">
              {review.gameName}
            </Link>
            <div className="editorial-review-card-date">
              <Icon icon="lucide:calendar" className="h-3 w-3" aria-hidden="true" />
              <time dateTime={review.createdAt}>{formattedDate}</time>
            </div>
          </div>
          <span className={cn("editorial-review-card-rating", getRatingColor(review.rating))}>
            {review.rating}/20
          </span>
        </div>
      </div>

      {/* Content excerpt */}
      {review.content && (
        <p className="editorial-review-card-content">{getExcerpt(review.content)}</p>
      )}

      {/* Positive / negative points */}
      {(review.positivePoints.length > 0 || review.negativePoints.length > 0) && (
        <div className="editorial-review-card-points">
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
