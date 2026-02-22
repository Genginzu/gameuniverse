"use client";

import { Star, LogIn, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRatingColor } from "@/lib/utils/ratingColor";
import { useAuth } from "@/hooks/useAuth";
import { useReviews } from "@/hooks/useReviews";
import { useReviewTranslations } from "@/hooks/useTranslations";
import { ReviewFormDialog } from "./ReviewFormDialog";
import { ReviewList } from "./ReviewList";
import type { ReviewFormData } from "@/types/review";

interface GameReviewsTabProps {
  gameId: string;
  gameTitle: string;
  accentColor?: string;
}

function AverageRating({
  rating,
  label,
  reviewCount,
}: {
  rating: number | null;
  label: string;
  reviewCount: number;
}) {
  if (rating === null) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-4 shadow-lg shadow-black/20 backdrop-blur-xl">
      <Star className="h-6 w-6 text-yellow-400" />
      <div>
        <span className={cn("text-2xl font-bold", getRatingColor(rating))}>
          {rating.toFixed(1)}
        </span>
        <span className="ml-1 text-sm text-slate-400">/20</span>
      </div>
      <span className="text-sm text-slate-400">— {label}</span>
      <span className="flex items-center gap-1 text-sm text-slate-300">
        <Users className="h-3.5 w-3.5" />
        {reviewCount}
      </span>
    </div>
  );
}

function LoginPrompt({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
      <LogIn className="mx-auto mb-3 h-8 w-8 text-slate-500" />
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

export function GameReviewsTab({
  gameId,
  gameTitle: _gameTitle,
  accentColor,
}: GameReviewsTabProps) {
  const t = useReviewTranslations();
  const { user, loading: authLoading } = useAuth();
  const {
    reviews,
    averageRating,
    totalCount,
    userHasReviewed,
    userReview,
    loading,
    error,
    submitting,
    fetchReviews,
    submitReview,
    updateReview,
  } = useReviews(gameId);

  const handleSubmit = async (data: ReviewFormData): Promise<boolean> => {
    return submitReview(data);
  };

  const handleUpdate = async (data: ReviewFormData): Promise<boolean> => {
    return updateReview(data);
  };

  const isAuthenticated = !authLoading && user !== null;
  const showWriteButton = isAuthenticated && !userHasReviewed;
  const showEditButton = isAuthenticated && userHasReviewed && userReview !== null;

  return (
    <div className="space-y-6">
      <AverageRating rating={averageRating} label={t("averageRating")} reviewCount={totalCount} />

      {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}

      {!authLoading && (
        <>
          {!isAuthenticated && <LoginPrompt message={t("loginPrompt")} />}
          {showWriteButton && (
            <ReviewFormDialog
              gameId={gameId}
              onSubmitSuccess={fetchReviews}
              onSubmit={handleSubmit}
              submitting={submitting}
              accentColor={accentColor}
            />
          )}
          {showEditButton && (
            <ReviewFormDialog
              gameId={gameId}
              onSubmitSuccess={fetchReviews}
              onSubmit={handleUpdate}
              submitting={submitting}
              accentColor={accentColor}
              existingReview={userReview}
            />
          )}
        </>
      )}

      <ReviewList reviews={reviews} loading={loading} />
    </div>
  );
}
