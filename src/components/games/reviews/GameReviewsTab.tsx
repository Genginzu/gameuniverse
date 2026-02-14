"use client";

import { Star, LogIn } from "lucide-react";
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

function AverageRating({ rating, label }: { rating: number | null; label: string }) {
  if (rating === null) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-800/30 px-5 py-4">
      <Star className="h-6 w-6 text-yellow-400" />
      <div>
        <span className="text-2xl font-bold text-white">{rating.toFixed(1)}</span>
        <span className="ml-1 text-sm text-slate-400">/20</span>
      </div>
      <span className="text-sm text-slate-400">— {label}</span>
    </div>
  );
}

function LoginPrompt({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
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
    userHasReviewed,
    loading,
    error,
    submitting,
    fetchReviews,
    submitReview,
  } = useReviews(gameId);

  const handleSubmit = async (data: ReviewFormData): Promise<boolean> => {
    return submitReview(data);
  };

  const isAuthenticated = !authLoading && user !== null;
  const showForm = isAuthenticated && !userHasReviewed;

  return (
    <div className="space-y-6">
      <AverageRating rating={averageRating} label={t("averageRating")} />

      {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}

      {!authLoading && (
        <>
          {!isAuthenticated && <LoginPrompt message={t("loginPrompt")} />}
          {showForm && (
            <ReviewFormDialog
              gameId={gameId}
              onSubmitSuccess={fetchReviews}
              onSubmit={handleSubmit}
              submitting={submitting}
              accentColor={accentColor}
            />
          )}
        </>
      )}

      <ReviewList reviews={reviews} loading={loading} />
    </div>
  );
}
