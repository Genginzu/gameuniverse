"use client";

import { GlobalSearchCharacterItem } from "@/components/shared/GlobalSearchCharacterItem";
import { GlobalSearchGameItem } from "@/components/shared/GlobalSearchGameItem";
import { GlobalSearchPlayerItem } from "@/components/shared/GlobalSearchPlayerItem";
import type { FlatSearchItem } from "@/lib/utils/global-search-utils";
import type { GlobalSearchResponse } from "@/types/global-search";
import { Gamepad2, Loader2, Swords, Users, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface GlobalSearchDropdownProps {
  results: GlobalSearchResponse;
  flatItems: FlatSearchItem[];
  activeIndex: number;
  isLoading: boolean;
  onSelect: (item: FlatSearchItem) => void;
  importingId: string | null;
}

function CategoryHeader({
  icon: Icon,
  label,
  count,
}: {
  icon: LucideIcon;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-white/10 pb-2">
      <Icon className="h-4 w-4 text-white/50" />
      <span className="text-sm font-semibold uppercase tracking-wider text-white/50">{label}</span>
      <span className="text-xs text-white/30">({count})</span>
    </div>
  );
}

export function GlobalSearchDropdown({
  results,
  flatItems,
  activeIndex,
  isLoading,
  onSelect,
  importingId,
}: GlobalSearchDropdownProps) {
  const t = useTranslations("globalSearch");
  const hasResults = flatItems.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-12 text-base text-white/50">
        <Loader2 className="h-5 w-5 animate-spin" />
        {t("loading")}
      </div>
    );
  }

  if (!hasResults) {
    return <div className="py-12 text-center text-base text-white/50">{t("noResults")}</div>;
  }

  const gamesOffset = 0;
  const charsOffset = results.games.length;
  const playersOffset = charsOffset + results.characters.length;

  return (
    <div className="space-y-8">
      {results.games.length > 0 && (
        <section>
          <CategoryHeader
            icon={Gamepad2}
            label={t("categories.games")}
            count={results.counts.games}
          />
          <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {results.games.map((_, index) => {
              const flatIndex = gamesOffset + index;
              const flatItem = flatItems[flatIndex];
              const isActive = flatIndex === activeIndex;
              return (
                <button
                  key={flatItem.id}
                  type="button"
                  className="text-left"
                  onClick={() => onSelect(flatItem)}
                  disabled={importingId === flatItem.id}
                  data-active={isActive || undefined}
                >
                  <GlobalSearchGameItem
                    item={flatItem as FlatSearchItem & { type: "game" }}
                    isActive={isActive}
                    isImporting={importingId === flatItem.id}
                  />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {(results.characters.length > 0 || results.players.length > 0) && (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {results.characters.length > 0 && (
            <section>
              <CategoryHeader
                icon={Swords}
                label={t("categories.characters")}
                count={results.counts.characters}
              />
              <div className="mt-3 space-y-1">
                {results.characters.map((_, index) => {
                  const flatIndex = charsOffset + index;
                  const flatItem = flatItems[flatIndex];
                  const isActive = flatIndex === activeIndex;
                  return (
                    <button
                      key={flatItem.id}
                      type="button"
                      className="w-full text-left"
                      onClick={() => onSelect(flatItem)}
                      data-active={isActive || undefined}
                    >
                      <GlobalSearchCharacterItem
                        item={flatItem as FlatSearchItem & { type: "character" }}
                        isActive={isActive}
                      />
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {results.players.length > 0 && (
            <section>
              <CategoryHeader
                icon={Users}
                label={t("categories.players")}
                count={results.counts.players}
              />
              <div className="mt-3 space-y-1">
                {results.players.map((_, index) => {
                  const flatIndex = playersOffset + index;
                  const flatItem = flatItems[flatIndex];
                  const isActive = flatIndex === activeIndex;
                  return (
                    <button
                      key={flatItem.id}
                      type="button"
                      className="w-full text-left"
                      onClick={() => onSelect(flatItem)}
                      data-active={isActive || undefined}
                    >
                      <GlobalSearchPlayerItem
                        item={flatItem as FlatSearchItem & { type: "player" }}
                        isActive={isActive}
                      />
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
