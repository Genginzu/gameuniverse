"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

import type { GameFormTabProps, Rating, ContentDescriptor } from "@/types/admin-games";
import { SingleAgeRatingPreview } from "./GameAgeRatingsPreview";
import { IgdbFieldIndicator } from "./IgdbFieldIndicator";
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
    if (updated.length > 0 && !updated.some((r) => r.is_primary)) {
      updated[0].is_primary = true;
    }
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
              {/* Left: config card */}
              <AgeRatingCard
                rating={rating}
                formRating={watchedRatings.find((r) => r.rating_id === rating.id)!}
                descriptors={getDescriptorsForRating(rating)}
                onRemove={removeRating}
                onSetPrimary={setPrimary}
                onToggleDescriptor={toggleDescriptor}
                t={t}
              />
              {/* Right: live preview for this rating */}
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
          <Icon icon="fa:plus" className="h-3 w-3"  />
          {t("addAgeRating") ?? "Ajouter une classification"}
        </Button>
      )}
    </div>
  );
}

interface AgeRatingFormEntry {
  rating_id: string;
  is_primary: boolean;
  content_descriptors: string[];
}

function AgeRatingCard({
  rating,
  formRating,
  descriptors,
  onRemove,
  onSetPrimary,
  onToggleDescriptor,
  t,
}: {
  rating: Rating;
  formRating: AgeRatingFormEntry;
  descriptors: ContentDescriptor[];
  onRemove: (id: string) => void;
  onSetPrimary: (id: string) => void;
  onToggleDescriptor: (ratingId: string, descriptorId: string) => void;
  t: (key: string) => string;
}) {
  const selectedDescriptors = formRating.content_descriptors;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {rating.color_hex && (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ backgroundColor: rating.color_hex }}
            >
              {rating.minimum_age !== null ? `${rating.minimum_age}+` : ""}
            </div>
          )}
          <div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {rating.display_name}
            </span>
            {rating.system && <p className="text-xs text-gray-400">{rating.system.name}</p>}
            {rating.minimum_age !== null && (
              <p className="text-xs text-gray-500">
                {t("minimumAge") ?? "Âge minimum"} : {rating.minimum_age}+
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
            <Checkbox
              checked={formRating.is_primary}
              onCheckedChange={() => onSetPrimary(rating.id)}
              aria-label={`${rating.display_name} - ${t("primary") ?? "Principal"}`}
            />
            {t("primary") ?? "Principal"}
          </label>
          <button
            type="button"
            onClick={() => onRemove(rating.id)}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
            aria-label={`Remove ${rating.display_name}`}
          >
            <Icon icon="fa:times" className="h-3 w-3"  />
          </button>
        </div>
      </div>

      {descriptors.length > 0 && (
        <div className="border-t border-primary/10 px-4 py-3">
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            ⚠ {t("contentDescriptors") ?? "Avertissements de contenu"}
          </p>
          <div className="flex flex-wrap gap-2">
            {descriptors.map((cd) => {
              const selected = selectedDescriptors.includes(cd.id);
              return (
                <button
                  key={cd.id}
                  type="button"
                  onClick={() => onToggleDescriptor(rating.id, cd.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                    selected
                      ? "border-primary bg-primary/10 text-primary dark:bg-primary/20"
                      : "border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400"
                  }`}
                  aria-pressed={selected}
                >
                  {cd.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AgeRatingPicker({
  availableRatings,
  onSelect,
  onClose,
  t,
}: {
  availableRatings: Rating[];
  onSelect: (ratingId: string) => void;
  onClose: () => void;
  t: (key: string) => string;
}) {
  // Group by system
  const grouped = availableRatings.reduce(
    (acc, r) => {
      const systemName = r.system?.name || "Other";
      if (!acc[systemName]) acc[systemName] = [];
      acc[systemName].push(r);
      return acc;
    },
    {} as Record<string, Rating[]>
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700/30 dark:bg-gray-900/20">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("addAgeRating") ?? "Ajouter une classification"}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Icon icon="fa:times" className="h-3 w-3"  />
        </button>
      </div>
      {availableRatings.length === 0 ? (
        <p className="text-sm text-gray-400">
          {t("allAgeRatingsAdded") ?? "Toutes les classifications sont déjà ajoutées"}
        </p>
      ) : (
        <select
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) onSelect(e.target.value);
          }}
        >
          <option value="" disabled>
            {t("selectAgeRating") ?? "Sélectionner une classification..."}
          </option>
          {Object.entries(grouped).map(([systemName, systemRatings]) => (
            <optgroup key={systemName} label={systemName}>
              {systemRatings.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.display_name}
                  {r.minimum_age !== null ? ` (${r.minimum_age}+)` : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      )}
    </div>
  );
}
