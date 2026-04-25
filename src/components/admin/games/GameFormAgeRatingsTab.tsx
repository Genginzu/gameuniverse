"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { GameFormTabProps, Rating, ContentDescriptor } from "@/types/admin-games";
import { SingleAgeRatingPreview } from "./GameAgeRatingsPreview";
import { IgdbFieldIndicator } from "./IgdbFieldIndicator";
import { AgeRatingCard, AgeRatingPicker } from "./AgeRatingParts";
import { Icon } from "@iconify/react";

interface AgeRatingsTabProps extends GameFormTabProps {
  ratings: Rating[];
  contentDescriptors: ContentDescriptor[];
}

export function GameFormAgeRatingsTab({
  form,
  ratings,
  contentDescriptors,
  t,
  isIgdbField,
}: AgeRatingsTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const watchedRatings = form.watch("age_ratings");

  const assignedIds = watchedRatings.map((r) => r.rating_id);
  const assignedRatings = assignedIds
    .map((id) => ratings.find((r) => r.id === id))
    .filter(Boolean) as Rating[];
  const availableRatings = ratings.filter((r) => !assignedIds.includes(r.id));

  const addRating = (ratingId: string) => {
    const current = form.getValues("age_ratings");
    form.setValue(
      "age_ratings",
      [
        ...current,
        { rating_id: ratingId, is_primary: current.length === 0, content_descriptors: [] },
      ],
      { shouldValidate: true }
    );
    setShowPicker(false);
  };

  const removeRating = (ratingId: string) => {
    const current = form.getValues("age_ratings");
    const updated = current.filter((r) => r.rating_id !== ratingId);
    if (updated.length > 0 && !updated.some((r) => r.is_primary)) updated[0].is_primary = true;
    form.setValue("age_ratings", updated, { shouldValidate: true });
  };

  const setPrimary = (ratingId: string) => {
    const current = form.getValues("age_ratings");
    form.setValue(
      "age_ratings",
      current.map((r) => ({ ...r, is_primary: r.rating_id === ratingId })),
      { shouldValidate: true }
    );
  };

  const toggleDescriptor = (ratingId: string, descriptorId: string) => {
    const current = form.getValues("age_ratings");
    form.setValue(
      "age_ratings",
      current.map((r) => {
        if (r.rating_id !== ratingId) return r;
        const has = r.content_descriptors.includes(descriptorId);
        return {
          ...r,
          content_descriptors: has
            ? r.content_descriptors.filter((d) => d !== descriptorId)
            : [...r.content_descriptors, descriptorId],
        };
      }),
      { shouldValidate: true }
    );
  };

  const getDescriptorsForRating = (rating: Rating) => {
    if (!rating.system) return [];
    return contentDescriptors.filter((cd) => cd.rating_system_id === rating.system!.id);
  };

  return (
    <div className="space-y-4">
      {isIgdbField && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <IgdbFieldIndicator fieldName="age_ratings" isIgdbField={isIgdbField("age_ratings")} />
        </div>
      )}
      {assignedRatings.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
          {t("noAgeRatings") ?? "Aucune classification d'âge"}
        </p>
      ) : (
        <div className="space-y-4">
          {assignedRatings.map((rating) => (
            <div key={rating.id} className="grid gap-4 lg:grid-cols-2">
              <AgeRatingCard
                rating={rating}
                formRating={watchedRatings.find((r) => r.rating_id === rating.id)!}
                descriptors={getDescriptorsForRating(rating)}
                onRemove={removeRating}
                onSetPrimary={setPrimary}
                onToggleDescriptor={toggleDescriptor}
                t={t}
              />
              <div className="lg:self-start">
                <SingleAgeRatingPreview
                  form={form}
                  ratingId={rating.id}
                  ratings={ratings}
                  contentDescriptors={contentDescriptors}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {showPicker ? (
        <AgeRatingPicker
          availableRatings={availableRatings}
          onSelect={addRating}
          onClose={() => setShowPicker(false)}
          t={t}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPicker(true)}
          className="gap-1.5"
          disabled={availableRatings.length === 0}
        >
          <Icon icon="fa:plus" className="h-3 w-3" />
          {t("addAgeRating") ?? "Ajouter une classification"}
        </Button>
      )}
    </div>
  );
}
