"use client";

/**
 * IGDB metadata filters of the games listing: chip sections for themes,
 * game modes and perspectives, and active chips for every metadata filter
 * (engines and franchises are only reachable through game page links).
 */

import { useTranslations } from "next-intl";
import { FilterChip, ActiveFilterChip } from "@/components/shared/FilterChip";
import { FilterSection, type FilterVariant } from "@/components/shared/FilterSection";
import { igdbLabel, type IgdbLabelGroup } from "@/lib/utils/igdbLabels";
import type {
  GameMetadataFilterOptions,
  MetadataFilterOption,
  MetadataFilterSelection,
} from "@/types/game-metadata";

export interface MetadataFiltersProps {
  selected: MetadataFilterSelection;
  options: GameMetadataFilterOptions;
  onChange: (patch: Partial<MetadataFilterSelection>) => void;
  variant?: FilterVariant;
  /** Options still loading: show section skeletons instead of hiding empty sections. */
  loading?: boolean;
}

type MetadataKey = keyof MetadataFilterSelection;

const LABEL_GROUPS: Partial<Record<MetadataKey, IgdbLabelGroup>> = {
  themes: "themes",
  gameModes: "gameModes",
  perspectives: "playerPerspectives",
};

const KEYS: MetadataKey[] = ["themes", "gameModes", "perspectives", "engines", "franchises"];
const SECTION_KEYS: MetadataKey[] = ["themes", "gameModes", "perspectives"];

export function metadataFilterCount(selected: MetadataFilterSelection): number {
  return KEYS.reduce((count, key) => count + selected[key].length, 0);
}

function useMetadataLabel(options: GameMetadataFilterOptions) {
  const tLabels = useTranslations("igdbMetadata");
  return (key: MetadataKey, slug: string) => {
    const option = options[key].find((candidate) => candidate.slug === slug);
    const group = LABEL_GROUPS[key];
    if (!option) return slug;
    return group ? igdbLabel(tLabels, group, option.igdbId, option.name) : option.name;
  };
}

function toggle(values: string[], slug: string): string[] {
  return values.includes(slug) ? values.filter((value) => value !== slug) : [...values, slug];
}

export function MetadataActiveChips({
  selected,
  options,
  onChange,
  variant,
}: MetadataFiltersProps) {
  const labelOf = useMetadataLabel(options);
  return KEYS.flatMap((key) =>
    selected[key].map((slug) => (
      <ActiveFilterChip
        key={`${key}-${slug}`}
        label={labelOf(key, slug)}
        onRemove={() => onChange({ [key]: selected[key].filter((value) => value !== slug) })}
        variant="violet"
        themeVariant={variant}
      />
    ))
  );
}

export function MetadataFilterSections({
  selected,
  options,
  onChange,
  variant,
  loading = false,
}: MetadataFiltersProps) {
  const t = useTranslations("games.metadataFilters");
  const labelOf = useMetadataLabel(options);

  return SECTION_KEYS.map((key) => {
    const sectionOptions: MetadataFilterOption[] = options[key];
    if (!loading && sectionOptions.length === 0) return null;
    return (
      <FilterSection
        key={key}
        title={t(key)}
        availableLabel={
          sectionOptions.length > 0 ? t("available", { count: sectionOptions.length }) : ""
        }
        loading={sectionOptions.length === 0}
        variant={variant}
      >
        {sectionOptions
          .map((option) => ({
            slug: option.slug,
            label: labelOf(key, option.slug),
            gameCount: option.gameCount,
          }))
          .sort((a, b) => a.label.localeCompare(b.label))
          .map((option) => (
            <FilterChip
              key={option.slug}
              label={option.label}
              selected={selected[key].includes(option.slug)}
              onClick={() => onChange({ [key]: toggle(selected[key], option.slug) })}
              count={option.gameCount}
              variant={variant}
            />
          ))}
      </FilterSection>
    );
  });
}
