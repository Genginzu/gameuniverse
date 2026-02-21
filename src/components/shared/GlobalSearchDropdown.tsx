"use client";

import { GlobalSearchCharacterItem } from "@/components/shared/GlobalSearchCharacterItem";
import { GlobalSearchGameItem } from "@/components/shared/GlobalSearchGameItem";
import { GlobalSearchPlayerItem } from "@/components/shared/GlobalSearchPlayerItem";
import type { FlatSearchItem } from "@/lib/utils/global-search-utils";
import type { GlobalSearchResponse } from "@/types/global-search";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface GlobalSearchDropdownProps {
  results: GlobalSearchResponse;
  flatItems: FlatSearchItem[];
  activeIndex: number;
  isLoading: boolean;
  onSelect: (item: FlatSearchItem) => void;
  importingId: string | null;
}

/** Display order for categories — games first, then characters, then players */
const CATEGORIES = ["games", "characters", "players"] as const;

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
      <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("loading")}
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className="px-4 py-6 text-center text-sm text-muted-foreground">{t("noResults")}</div>
    );
  }

  // Track the running flat index offset per category
  let flatOffset = 0;

  return (
    <div className="max-h-[400px] overflow-y-auto py-1">
      {CATEGORIES.map((category) => {
        const items = results[category];
        if (items.length === 0) return null;

        const categoryOffset = flatOffset;
        flatOffset += items.length;

        return (
          <div key={category} role="group">
            <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t(`categories.${category}`)}
            </div>
            {items.map((_, index) => {
              const flatIndex = categoryOffset + index;
              const flatItem = flatItems[flatIndex];
              const isActive = flatIndex === activeIndex;

              return (
                <button
                  key={flatItem.id}
                  type="button"
                  className="w-full cursor-pointer text-left"
                  onClick={() => onSelect(flatItem)}
                  disabled={importingId === flatItem.id}
                  data-active={isActive || undefined}
                >
                  {category === "games" && (
                    <GlobalSearchGameItem
                      item={flatItem as FlatSearchItem & { type: "game" }}
                      isActive={isActive}
                      isImporting={importingId === flatItem.id}
                    />
                  )}
                  {category === "characters" && (
                    <GlobalSearchCharacterItem
                      item={flatItem as FlatSearchItem & { type: "character" }}
                      isActive={isActive}
                    />
                  )}
                  {category === "players" && (
                    <GlobalSearchPlayerItem
                      item={flatItem as FlatSearchItem & { type: "player" }}
                      isActive={isActive}
                    />
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
