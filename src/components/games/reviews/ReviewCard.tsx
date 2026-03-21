"use client";

import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { getRatingColor } from "@/lib/utils/ratingColor";
import { useReviewTranslations, useDateFormatter } from "@/hooks/useTranslations";
import { ReviewVoteButtons } from "./ReviewVoteButtons";
import type { ReviewWithVotes } from "@/types/review";
import Image from "next/image";

interface ReviewCardProps {
  review: ReviewWithVotes;
}

function ReviewAvatar({ name, avatar }: { name: string | null; avatar: string | null }) {
  const t = useReviewTranslations();

  if (avatar) {
    return (
      <Image
        src={avatar}
        alt={name ?? t("anonymousPlayer")}
        width={40}
        height={40}
        className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-600"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 ring-2 ring-slate-600">
      <Icon icon="lucide:user" className="h-5 w-5 text-slate-400" />
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
  const iconName = isPositive ? "lucide:thumbs-up" : "lucide:thumbs-down";
  const colorClass = isPositive ? "text-green-400" : "text-red-400";

  return (
    <div className="space-y-1.5">
      <div className={cn("flex items-center gap-1.5 text-sm font-medium", colorClass)}>
        <Icon icon={iconName} className="h-3.5 w-3.5" />
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
    <article className="rounded-xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/20 backdrop-blur-xl">
      {/* Header: avatar, name, date, rating + votes */}
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
        <div className="flex items-center gap-3">
          <ReviewVoteButtons
            reviewId={review.id}
            reviewUserId={review.userId}
            initialCounts={review.voteCounts}
            initialUserVote={review.userVote}
          />
          <span className={cn("text-2xl font-bold", getRatingColor(review.rating))}>
            {review.rating}/20
          </span>
        </div>
      </div>

      {/* Rich text content */}
      <div
        className="prose prose-invert prose-sm mb-4 max-w-none text-slate-300"
        dangerouslySetInnerHTML={{ __html: review.content }}
      />

      {/* Points +/- */}
      {(review.positivePoints.length > 0 || review.negativePoints.length > 0) && (
        <div className="grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-2">
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
