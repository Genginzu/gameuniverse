"use client";

import { type UseFormReturn } from "react-hook-form";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import type { Rating, ContentDescriptor } from "@/types/admin-games";
import { buildGameColors } from "@/lib/utils/game-utils";
import { AgeRatingPreviewCard, type ResolvedRating } from "./AgeRatingPreviewCard";

interface PreviewColors {
  backgroundColor: string;
  accent: string;
}

function usePreviewColors(form: UseFormReturn<AdminGameFormData>): PreviewColors {
  const bgColorRaw = form.watch("background_color");
  const accentColorRaw = form.watch("accent_color");
  return buildGameColors({
    backgroundColor: bgColorRaw || undefined,
    accentColor: accentColorRaw || undefined,
  });
}

function resolveOneRating(
  wr: { rating_id: string; is_primary: boolean; content_descriptors: string[] },
  ratings: Rating[],
  contentDescriptors: ContentDescriptor[]
): ResolvedRating | null {
  const rating = ratings.find((r) => r.id === wr.rating_id);
  if (!rating) return null;
  const descriptors = wr.content_descriptors
    .map((cdId) => contentDescriptors.find((cd) => cd.id === cdId))
    .filter(Boolean) as ContentDescriptor[];
  return { ...rating, isPrimary: wr.is_primary, descriptors };
}

export function SingleAgeRatingPreview({
  form,
  ratingId,
  ratings,
  contentDescriptors,
}: {
  form: UseFormReturn<AdminGameFormData>;
  ratingId: string;
  ratings: Rating[];
  contentDescriptors: ContentDescriptor[];
}) {
  const watchedRatings = form.watch("age_ratings");
  const colors = usePreviewColors(form);
  const formRating = watchedRatings.find((r) => r.rating_id === ratingId);
  if (!formRating) return null;
  const resolved = resolveOneRating(formRating, ratings, contentDescriptors);
  if (!resolved) return null;

  return (
    <div
      className="rounded-xl border border-gray-200/60 p-3 dark:border-gray-700/40"
      style={{ backgroundColor: colors.backgroundColor }}
      data-testid={`age-rating-preview-${ratingId}`}
    >
      <AgeRatingPreviewCard rating={resolved} colors={colors} />
    </div>
  );
}
