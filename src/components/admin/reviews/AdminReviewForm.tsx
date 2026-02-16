"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { reviewSchema, type ReviewInput } from "@/lib/validations/review";
import { LoadingButton } from "@/components/ui/loading-button";
import { RatingInput } from "@/components/games/reviews/RatingInput";
import { RichTextEditor } from "@/components/games/reviews/RichTextEditor";
import { ReviewPointsList } from "@/components/games/reviews/ReviewPointsList";
import type { AdminReviewDetail } from "@/types/admin-reviews";

export interface AdminReviewFormProps {
  review: AdminReviewDetail;
  onSubmit: (data: ReviewInput) => Promise<void>;
  isSubmitting: boolean;
}

export function AdminReviewForm({ review, onSubmit, isSubmitting }: AdminReviewFormProps) {
  const t = useTranslations("admin.reviews.editPage");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: review.rating,
      content: review.content,
      positivePoints: review.positivePoints,
      negativePoints: review.negativePoints,
    },
  });

  const handleFormSubmit = async (data: ReviewInput) => {
    setSubmitError(null);
    try {
      await onSubmit(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("errorGeneric");
      setSubmitError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Read-only info */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t("playerLabel")}
          </span>
          <p className="text-gray-900 dark:text-white">{review.playerName ?? "—"}</p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t("gameLabel")}
          </span>
          <p className="text-gray-900 dark:text-white">{review.gameTitle}</p>
        </div>
      </div>

      {/* Rating */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {t("ratingLabel")} <span className="text-destructive">*</span>
        </label>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => (
            <RatingInput value={field.value} onChange={field.onChange} max={20} />
          )}
        />
        {errors.rating && <p className="text-sm text-destructive">{errors.rating.message}</p>}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {t("contentLabel")} <span className="text-destructive">*</span>
        </label>
        <Controller
          control={control}
          name="content"
          render={({ field }) => <RichTextEditor content={field.value} onChange={field.onChange} />}
        />
        {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
      </div>

      {/* Points */}
      <div className="space-y-6">
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
          <Controller
            control={control}
            name="positivePoints"
            render={({ field }) => (
              <ReviewPointsList
                points={field.value}
                onChange={field.onChange}
                type="positive"
                maxPoints={10}
              />
            )}
          />
          {errors.positivePoints && (
            <p className="mt-2 text-sm text-destructive">
              {errors.positivePoints.message ?? errors.positivePoints.root?.message}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <Controller
            control={control}
            name="negativePoints"
            render={({ field }) => (
              <ReviewPointsList
                points={field.value}
                onChange={field.onChange}
                type="negative"
                maxPoints={10}
              />
            )}
          />
          {errors.negativePoints && (
            <p className="mt-2 text-sm text-destructive">
              {errors.negativePoints.message ?? errors.negativePoints.root?.message}
            </p>
          )}
        </div>
      </div>

      {submitError && (
        <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{submitError}</p>
      )}

      {/* Submit */}
      <LoadingButton type="submit" loading={isSubmitting} loadingText={t("saving")}>
        {t("save")}
      </LoadingButton>
    </form>
  );
}
