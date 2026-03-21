"use client";

import { Icon } from "@iconify/react";
import { useReviewTranslations } from "@/hooks/useTranslations";
import type { ReviewWithVotes } from "@/types/review";
import { ReviewCard } from "./ReviewCard";

interface ReviewListProps {
  reviews: ReviewWithVotes[];
  loading?: boolean;
}

function ReviewListEmpty() {
  const t = useReviewTranslations();

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-12 text-center">
      <Icon icon="lucide:message-square" className="mb-3 h-10 w-10 text-slate-600" />
      <p className="text-lg font-medium text-slate-400">{t("emptyTitle")}</p>
      <p className="mt-1 text-sm text-slate-500">{t("emptyDescription")}</p>
    </div>
  );
}

function ReviewListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-700" />
            <div className="space-y-2">
              <div className="h-4 w-24 rounded bg-slate-700" />
              <div className="h-3 w-16 rounded bg-slate-700" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-slate-700" />
            <div className="h-3 w-3/4 rounded bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReviewList({ reviews, loading = false }: ReviewListProps) {
  if (loading) return <ReviewListSkeleton />;
  if (reviews.length === 0) return <ReviewListEmpty />;

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
