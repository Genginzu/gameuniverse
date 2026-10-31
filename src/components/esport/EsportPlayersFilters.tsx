"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { ActiveFilterChip, FilterChip } from "@/components/shared/FilterChip";
import { FilterSection } from "@/components/shared/FilterSection";
import { getGameIcon } from "@/lib/utils/esport-utils";

interface EsportPlayersFiltersProps {
  games: string[];
  selectedGame: string | null;
  onGameChange: (game: string | null) => void;
  showPanel: boolean;
}

export function EsportPlayersFilters({
  games,
  selectedGame,
  onGameChange,
  showPanel,
}: EsportPlayersFiltersProps) {
  const t = useTranslations("esport.players");
  const tFilters = useTranslations("filters");

  if (!selectedGame && !showPanel) return null;

  return (
    <div className="mb-6 space-y-3">
      {selectedGame && (
        <div className="flex items-center gap-2">
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            <ActiveFilterChip
              label={selectedGame}
              onRemove={() => onGameChange(null)}
              themeVariant="editorial"
            />
          </div>
          <button
            type="button"
            onClick={() => onGameChange(null)}
            className="min-h-11 shrink-0 rounded-lg border border-transparent px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-400/10 hover:text-red-300"
          >
            {tFilters("clearAll")}
          </button>
        </div>
      )}

      {showPanel && (
        <FilterSection
          title={t("gamesSection")}
          availableLabel={games.length > 0 ? t("gamesAvailable", { count: games.length }) : ""}
          loading={games.length === 0}
          variant="editorial"
        >
          {games.map((game) => (
            <FilterChip
              key={game}
              label={game}
              selected={selectedGame === game}
              onClick={() => onGameChange(selectedGame === game ? null : game)}
              icon={<Icon icon={getGameIcon(game)} className="h-3.5 w-3.5 shrink-0" />}
              variant="editorial"
            />
          ))}
        </FilterSection>
      )}
    </div>
  );
}
