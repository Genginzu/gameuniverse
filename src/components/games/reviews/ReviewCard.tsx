"use client";

import { ThumbsUp, ThumbsDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReviewTranslations, useDateFormatter } from "@/hooks/useTranslations";
import type { Review } from "@/types/review";

interface ReviewCardProps {
  review: Review;
}

function getRatingColor(rating: number): string {
  const ratio = rating / 20;
  if (ratio >= 0.75) return "text-green-400";
  if (ratio >= 0.5) return "text-yellow-400";
  if (ratio >= 0.25) return "text-orange-400";
  return "text-red-400";
}

function ReviewAvatar({ name, avatar }: { name: string | null; avatar: string | null }) {
  const t = useReviewTranslations();

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name ?? t("anonymousPlayer")}
        className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-600"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 ring-2 ring-slate-600">
      <User className="h-5 w-5 text-slate-400" />
    </div>
  );
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
  const Icon = isPositive ? ThumbsUp : ThumbsDown;
  const colorClass = isPositive ? "text-green-400" : "text-red-400";

  return (
    <div className="space-y-1.5">
      <div className={cn("flex items-center gap-1.5 text-sm font-medium", colorClass)}>
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <ul className="space-y-1">
        {points.map((point, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
            <span className={cn("mt-0.5 shrink-0", colorClass)}>{isPositive ? "+" : "−"}</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReviewCard({ review }: ReviewCardProps) {
  const t = useReviewTranslations();
  const { formatDate } = useDateFormatter();

  return (
    <article className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
      {/* Header: avatar, name, date, rating */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <ReviewAvatar name={review.playerName} avatar={review.playerAvatar} />
          <div>
            <p className="font-medium text-slate-200">
              {review.playerName ?? t("anonymousPlayer")}
            </p>
            <p className="text-xs text-slate-500">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-lg bg-slate-900 px-2.5 py-1 text-sm font-semibold",
            getRatingColor(review.rating)
          )}
        >
          {review.rating}/20
        </span>
      </div>

      {/* Rich text content */}
      <div
        className="prose prose-invert prose-sm mb-4 max-w-none text-slate-300"
        dangerouslySetInnerHTML={{ __html: review.content }}
      />

      {/* Points +/- */}
      {(review.positivePoints.length > 0 || review.negativePoints.length > 0) && (
        <div className="grid gap-4 border-t border-slate-700/50 pt-4 sm:grid-cols-2">
          <ReviewPoints
            points={review.positivePoints}
            type="positive"
            label={t("positivePoints")}
          />
          <ReviewPoints
            points={review.negativePoints}
            type="negative"
            label={t("negativePoints")}
          />
        </div>
      )}
    </article>
  );
}
