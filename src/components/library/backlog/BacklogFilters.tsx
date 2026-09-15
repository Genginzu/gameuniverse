"use client";

import { useTranslations } from "next-intl";

import type { BacklogFilters as Filters } from "@/types/backlog";

interface Option {
  id: string;
  name: string;
}

interface BacklogFiltersProps {
  filters: Filters;
  genres: Option[];
  platforms: Option[];
  hasActiveFilters: boolean;
  onChange: (filters: Filters) => void;
  onClear: () => void;
}

const HOUR_CAPS = [5, 10, 20, 40];
const LONG_THRESHOLD = 40;

/** Filter controls for the backlog: genre, platform and maximum estimated length. */
export function BacklogFilters({
  filters,
  genres,
  platforms,
  hasActiveFilters,
  onChange,
  onClear,
}: BacklogFiltersProps) {
  const t = useTranslations("userLibrary.backlog");

  const toggle = (list: string[], id: string): string[] =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  return (
    <div className="border-editorial-line bg-editorial-2 flex flex-col gap-4 rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
          {t("filters.title")}
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-editorial-accent text-xs hover:underline"
          >
            {t("filters.clear")}
          </button>
        )}
      </div>

      {/* Max estimated length */}
      <Group label={t("filters.maxDuration")}>
        {HOUR_CAPS.map((cap) => (
          <Chip
            key={cap}
            active={filters.maxHours === cap}
            onClick={() =>
              onChange({
                ...filters,
                maxHours: filters.maxHours === cap ? null : cap,
                minHours: null,
              })
            }
          >
            {t("filters.underHours", { hours: cap })}
          </Chip>
        ))}
        <Chip
          active={filters.minHours === LONG_THRESHOLD}
          onClick={() =>
            onChange({
              ...filters,
              minHours: filters.minHours === LONG_THRESHOLD ? null : LONG_THRESHOLD,
              maxHours: null,
            })
          }
        >
          {t("filters.overHours", { hours: LONG_THRESHOLD })}
        </Chip>
      </Group>

      {genres.length > 0 && (
        <Group label={t("filters.genre")}>
          {genres.map((genre) => (
            <Chip
              key={genre.id}
              active={filters.genreIds.includes(genre.id)}
              onClick={() => onChange({ ...filters, genreIds: toggle(filters.genreIds, genre.id) })}
            >
              {genre.name}
            </Chip>
          ))}
        </Group>
      )}

      {platforms.length > 0 && (
        <Group label={t("filters.platform")}>
          {platforms.map((platform) => (
            <Chip
              key={platform.id}
              active={filters.platformIds.includes(platform.id)}
              onClick={() =>
                onChange({ ...filters, platformIds: toggle(filters.platformIds, platform.id) })
              }
            >
              {platform.name}
            </Chip>
          ))}
        </Group>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-editorial-muted text-xs uppercase tracking-wide">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-9 rounded-full px-3 text-sm transition-colors ${
        active
          ? "bg-editorial-accent text-black"
          : "border-editorial-line text-editorial-muted hover:text-white border"
      }`}
    >
      {children}
    </button>
  );
}
