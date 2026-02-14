"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { reviewSchema, type ReviewInput } from "@/lib/validations/review";
import { useReviewTranslations } from "@/hooks/useTranslations";
import { LoadingButton } from "@/components/ui/loading-button";
import { RatingInput } from "./RatingInput";
import { RichTextEditor } from "./RichTextEditor";
import { ReviewPointsList } from "./ReviewPointsList";

interface ReviewFormProps {
  gameId: string;
  onSubmitSuccess: () => void;
  onSubmit: (data: ReviewInput) => Promise<boolean>;
  submitting?: boolean;
}

export function ReviewForm({ onSubmitSuccess, onSubmit, submitting = false }: ReviewFormProps) {
  const t = useReviewTranslations();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 10,
      content: "",
      positivePoints: [],
      negativePoints: [],
    },
  });

  const handleFormSubmit = async (data: ReviewInput) => {
    setSubmitError(null);
    try {
      const success = await onSubmit(data);
      if (success) {
        reset();
        onSubmitSuccess();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("form.submitError");
      setSubmitError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Rating */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200">{t("form.ratingLabel")}</label>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => (
            <RatingInput value={field.value} onChange={field.onChange} max={20} />
          )}
        />
        {errors.rating && <p className="text-sm text-destructive">{errors.rating.message}</p>}
      </div>

      {/* Rich text content */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200">{t("form.contentLabel")}</label>
        <Controller
          control={control}
          name="content"
          render={({ field }) => (
            <RichTextEditor
              content={field.value}
              onChange={field.onChange}
              placeholder={t("form.contentPlaceholder")}
            />
          )}
        />
        {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
      </div>

      {/* Positive points */}
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
        <p className="text-sm text-destructive">
          {errors.positivePoints.message ?? errors.positivePoints.root?.message}
        </p>
      )}

      {/* Negative points */}
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
        <p className="text-sm text-destructive">
          {errors.negativePoints.message ?? errors.negativePoints.root?.message}
        </p>
      )}

      {/* Submit error */}
      {submitError && (
        <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{submitError}</p>
      )}

      {/* Submit button */}
      <LoadingButton type="submit" loading={submitting} loadingText={t("form.submitting")}>
        <Send className="mr-2 h-4 w-4" />
        {t("form.submitButton")}
      </LoadingButton>
    </form>
  );
}
