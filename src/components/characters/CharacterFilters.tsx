"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { PlatformFilterOption } from "@/types/platform";
import { RoleFilterOption } from "@/types/character";
import { FilterSection } from "@/components/shared/FilterSection";
import { FilterChip, ActiveFilterChip } from "@/components/shared/FilterChip";
import { getPlatformIcon } from "@/lib/utils/platform-icons";

// Chargement dynamique d'Iconify — le panneau filtres n'est pas toujours visible
const Icon = dynamic(() => import("@iconify/react").then((mod) => mod.Icon), {
  ssr: false,
  loading: () => <span className="inline-block h-3.5 w-3.5 shrink-0" />,
});

interface CharacterFiltersProps {
  selectedRoles: string[];
  selectedPlatforms: string[];
  roles: RoleFilterOption[];
  platforms: PlatformFilterOption[];
  onRoleChange: (roles: string[]) => void;
  onPlatformsChange: (slugs: string[]) => void;
  onClearFilters: () => void;
  showAllFilters: boolean;
}

export function CharacterFilters({
  selectedRoles,
  selectedPlatforms,
  roles,
  platforms,
  onRoleChange,
  onPlatformsChange,
  onClearFilters,
  showAllFilters,
}: CharacterFiltersProps) {
  const tPlatforms = useTranslations("platforms");
  const tFilters = useTranslations("filters");

  const platformMap = useMemo(() => {
    const map = new Map<string, string>();
    platforms.forEach((p) => map.set(p.slug, p.name));
    return map;
  }, [platforms]);

  const roleMap = useMemo(() => {
    const map = new Map<string, string>();
    roles.forEach((r) => map.set(r.slug, r.name));
    return map;
  }, [roles]);

  const handleRoleToggle = (slug: string) => {
    const updated = selectedRoles.includes(slug)
      ? selectedRoles.filter((r) => r !== slug)
      : [...selectedRoles, slug];
    onRoleChange(updated);
  };

  const handlePlatformToggle = (slug: string) => {
    const updated = selectedPlatforms.includes(slug)
      ? selectedPlatforms.filter((s) => s !== slug)
      : [...selectedPlatforms, slug];
    onPlatformsChange(updated);
  };

  const hasFilters = selectedRoles.length > 0 || selectedPlatforms.length > 0;

  if (!hasFilters && !showAllFilters) return null;

  return (
    <div className="space-y-3">
      {hasFilters && (
        <div className="flex items-center gap-2">
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            {selectedRoles.map((slug) => (
              <ActiveFilterChip
                key={slug}
                label={roleMap.get(slug) || slug}
                onRemove={() => handleRoleToggle(slug)}
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
            className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            {tFilters("clearAll")}
          </button>
        </div>
      )}

      {showAllFilters && (
        <FilterSection
          title={tFilters("roles")}
          availableLabel={tFilters("available", { count: roles.length })}
          loading={roles.length === 0}
        >
          {roles.map((role) => (
            <FilterChip
              key={role.id}
              label={role.name}
              selected={selectedRoles.includes(role.slug)}
              onClick={() => handleRoleToggle(role.slug)}
              count={role.characterCount}
            />
          ))}
        </FilterSection>
      )}

      {showAllFilters && (
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
              icon={<Icon icon={getPlatformIcon(platform.slug)} className="h-3.5 w-3.5 shrink-0" />}
            />
          ))}
        </FilterSection>
      )}
    </div>
  );
}
