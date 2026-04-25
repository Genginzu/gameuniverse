"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Genre } from "@/types/genre";
import { PlatformFilterOption } from "@/types/platform";
import { FilterSection } from "@/components/shared/FilterSection";
import { FilterChip, ActiveFilterChip } from "@/components/shared/FilterChip";
import { getPlatformIcon } from "@/lib/utils/platform-icons";

interface GameFiltersProps {
  genres: Genre[];
  platforms: PlatformFilterOption[];
  selectedGenres: string[];
  selectedPublishers: string[];
  selectedPlatforms: string[];
  esportFilter: boolean | null;
  onGenreChange: (genres: string[]) => void;
  onPublisherChange: (publishers: string[]) => void;
  onPlatformsChange: (platforms: string[]) => void;
  onEsportChange: (value: boolean | null) => void;
  onClearFilters: () => void;
  showAllGenres: boolean;
}

export function GameFilters({
  genres,
  platforms,
  selectedGenres,
  selectedPublishers: _selectedPublishers,
  selectedPlatforms,
  esportFilter,
  onGenreChange,
  onPublisherChange: _onPublisherChange,
  onPlatformsChange,
  onEsportChange,
  onClearFilters,
  showAllGenres,
}: GameFiltersProps) {
  const t = useTranslations("games");
  const tPlatforms = useTranslations("platforms");
  const tFilters = useTranslations("filters");

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

  const handlePlatformToggle = (slug: string) => {
    const updated = selectedPlatforms.includes(slug)
      ? selectedPlatforms.filter((s) => s !== slug)
      : [...selectedPlatforms, slug];
    onPlatformsChange(updated);
  };

  const hasFilters =
    selectedGenres.length > 0 ||
    _selectedPublishers.length > 0 ||
    selectedPlatforms.length > 0 ||
    esportFilter !== null;

  if (!hasFilters && !showAllGenres) return null;

  return (
    <div className="space-y-3">
      {hasFilters && (
        <div className="flex items-center gap-2">
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            {esportFilter !== null && (
              <ActiveFilterChip
                label={t("esportFilter")}
                onRemove={() => onEsportChange(null)}
                variant="blue"
              />
            )}
            {selectedGenres.map((genre) => (
              <ActiveFilterChip
                key={genre}
                label={genre}
                onRemove={() => handleGenreToggle(genre)}
                variant="blue"
              />
            ))}
            {selectedPlatforms.map((slug) => (
              <ActiveFilterChip
                key={slug}
                label={platformMap.get(slug) || slug}
                onRemove={() => onPlatformsChange(selectedPlatforms.filter((s) => s !== slug))}
                variant="violet"
              />
            ))}
          </div>
          <button
            onClick={onClearFilters}
            className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            {tFilters("clearAll")}
          </button>
        </div>
      )}

      {showAllGenres && (
        <>
          <FilterSection title={t("esportSection")} loading={false}>
            <FilterChip
              label={t("esportOnly")}
              selected={esportFilter === true}
              onClick={() => onEsportChange(esportFilter === true ? null : true)}
              icon={<Icon icon="mdi:trophy" className="h-3.5 w-3.5 shrink-0" />}
            />
          </FilterSection>

          <FilterSection
            title={t("genres")}
            availableLabel={genres.length > 0 ? t("available", { count: genres.length }) : ""}
            loading={genres.length === 0}
            skeletonWidths={[72, 88, 64, 96, 80, 68, 92, 76, 84, 60, 100, 72]}
          >
            {genres.map((genre) => (
              <FilterChip
                key={genre.id}
                label={genre.name}
                selected={selectedGenres.includes(genre.name)}
                onClick={() => handleGenreToggle(genre.name)}
                count={genre.gameCount}
              />
            ))}
          </FilterSection>

          <FilterSection
            title={tPlatforms("filter.title")}
            availableLabel={`${platforms.length} ${tPlatforms("filter.available")}`}
            loading={platforms.length === 0}
          >
            {platforms.map((platform) => (
              <FilterChip
                key={platform.id}
                label={platform.name}
                selected={selectedPlatforms.includes(platform.slug)}
                onClick={() => handlePlatformToggle(platform.slug)}
                count={platform.gameCount}
                icon={
                  <Icon icon={getPlatformIcon(platform.slug)} className="h-3.5 w-3.5 shrink-0" />
                }
              />
            ))}
          </FilterSection>
        </>
      )}
    </div>
  );
}
