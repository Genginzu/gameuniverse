"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Genre } from "@/types/genre";
import { PlatformFilterOption } from "@/types/platform";
import { PlatformFilter } from "./PlatformFilter";

interface GameFiltersProps {
  genres: Genre[];
  platforms: PlatformFilterOption[];
  selectedGenres: string[];
  selectedPublishers: string[];
  selectedPlatforms: string[];
  onGenreChange: (genres: string[]) => void;
  onPublisherChange: (publishers: string[]) => void;
  onPlatformsChange: (platforms: string[]) => void;
  onClearFilters: () => void;
  showAllGenres: boolean;
}

export function GameFilters({
  genres,
  platforms,
  selectedGenres,
  selectedPublishers: _selectedPublishers,
  selectedPlatforms,
  onGenreChange,
  onPublisherChange: _onPublisherChange,
  onPlatformsChange,
  onClearFilters,
  showAllGenres,
}: GameFiltersProps) {
  const t = useTranslations("games");

  // Slug → name lookup pour les chips actifs
  const platformMap = useMemo(() => {
    const map = new Map<string, string>();
    platforms.forEach((p) => map.set(p.slug, p.name));
    return map;
  }, [platforms]);

  const handleGenreToggle = (genreName: string) => {
    const updated = selectedGenres.includes(genreName)
      ? selectedGenres.filter((g) => g !== genreName)
      : [...selectedGenres, genreName];
    onGenreChange(updated);
  };

  const hasFilters =
    selectedGenres.length > 0 || _selectedPublishers.length > 0 || selectedPlatforms.length > 0;

  if (!hasFilters && !showAllGenres) return null;

  return (
    <div className="space-y-3">
      {hasFilters && (
        <div className="flex items-center gap-2">
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            {selectedGenres.map((genre) => (
              <ActiveChip
                key={genre}
                label={genre}
                onRemove={() => handleGenreToggle(genre)}
                variant="blue"
              />
            ))}
            {selectedPlatforms.map((slug) => (
              <ActiveChip
                key={slug}
                label={platformMap.get(slug) || slug}
                onRemove={() => onPlatformsChange(selectedPlatforms.filter((s) => s !== slug))}
                variant="violet"
              />
            ))}
          </div>
          <button
            onClick={onClearFilters}
            className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            {t("clearAll")}
          </button>
        </div>
      )}

      {showAllGenres && (
        <div className="rounded-xl bg-white/60 p-4 ring-1 ring-gray-200/50 backdrop-blur-sm dark:bg-slate-800/50 dark:ring-slate-700/50">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t("genres")}</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {genres.length} {t("available")}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {genres.map((genre) => {
              const isSelected = selectedGenres.includes(genre.name);
              return (
                <button
                  key={genre.id}
                  onClick={() => handleGenreToggle(genre.name)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700/50 dark:text-gray-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {genre.name}
                  <span className="ml-1 opacity-60">{genre.gameCount}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showAllGenres && (
        <PlatformFilter
          platforms={platforms}
          selectedPlatforms={selectedPlatforms}
          onPlatformsChange={onPlatformsChange}
        />
      )}
    </div>
  );
}

/** Chip affichant un filtre actif avec bouton de suppression */
function ActiveChip({
  label,
  onRemove,
  variant,
}: {
  label: string;
  onRemove: () => void;
  variant: "blue" | "violet";
}) {
  const colors =
    variant === "blue"
      ? "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
      : "bg-violet-100 text-violet-800 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50";

  return (
    <button
      onClick={onRemove}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${colors}`}
    >
      {label}
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
}
