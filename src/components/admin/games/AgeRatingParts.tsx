"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { Rating, ContentDescriptor } from "@/types/admin-games";
import { Icon } from "@iconify/react";

export interface AgeRatingFormEntry {
  rating_id: string;
  is_primary: boolean;
  content_descriptors: string[];
}

export function AgeRatingCard({
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
    <div className="border-primary/20 bg-primary/5 dark:bg-primary/10 rounded-xl border">
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
            <Icon icon="fa:times" className="h-3 w-3" />
          </button>
        </div>
      </div>
      {descriptors.length > 0 && (
        <div className="border-primary/10 border-t px-4 py-3">
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
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${selected ? "border-primary bg-primary/10 text-primary dark:bg-primary/20" : "border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400"}`}
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

export function AgeRatingPicker({
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
          <Icon icon="fa:times" className="h-3 w-3" />
        </button>
      </div>
      {availableRatings.length === 0 ? (
        <p className="text-sm text-gray-400">
          {t("allAgeRatingsAdded") ?? "Toutes les classifications sont déjà ajoutées"}
        </p>
      ) : (
        <select
          className="focus:border-primary focus:ring-primary w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
