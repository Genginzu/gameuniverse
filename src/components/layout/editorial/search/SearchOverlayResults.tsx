"use client";

/**
 * SearchOverlayResults : conteneur des 6 groupes de résultats. Aplatit la
 * réponse via `flattenResults`, calcule les frontières par groupe, et délègue
 * le rendu à `SearchOverlayGroup`. Renvoie un message d'absence de résultat
 * ou rien si `results` est null.
 *
 * SearchOverlayGroup : en-tête KickerLabel uppercase avec compteur, suivi de
 * la liste des items du groupe et d'un lien "Voir tous" si le groupe a plus
 * d'items que la limite affichée.
 */

import type { ReactNode } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import {
  flattenResults,
  GROUP_OF_TYPE,
  SEARCH_GROUP_ORDER,
  type FlatSearchItem,
  type SearchGroupKey,
  type SearchTab,
} from "@/lib/utils/global-search-utils";
import type { GlobalSearchResponse } from "@/types/global-search";

import { SearchOverlayItem } from "./SearchOverlayItem";

// ============================================================================
// Group keys / labels & listing routes
// ============================================================================

// `SearchGroupKey` / `SEARCH_GROUP_ORDER` / `GROUP_OF_TYPE` are re-exported here
// for backward compatibility with existing importers.
export type { SearchGroupKey };
export { SEARCH_GROUP_ORDER };

/** Listing routes for the "See all" link of each group. */
const GROUP_LISTING_ROUTE: Record<SearchGroupKey, string> = {
  games: "/games",
  characters: "/characters",
  players: "/players",
  teams: "/esport/teams",
  proPlayers: "/esport/players",
  coaches: "/coaching",
};

// ============================================================================
// Public API
// ============================================================================

interface SearchOverlayResultsProps {
  results: GlobalSearchResponse | null;
  /** Activated index in the flattened list. -1 means none. */
  activeIndex: number;
  /** Original query string (used for "See all" link and empty state). */
  query: string;
  /** Called when an item is selected (click or Enter). The parent decides what
   * to do (typically: persist the query in recent searches and navigate).
   */
  onSelect: (item: FlatSearchItem) => void;
  /** ID of an IGDB game currently being imported (shows a spinner). */
  importingId?: string | null;
  /** Active filter tab. Defaults to "all" (mixed results). */
  activeTab?: SearchTab;
  /** Selectable tabs. When fewer than 2, the tab bar is hidden. */
  tabs?: SearchTab[];
  /** Called when a tab is clicked. */
  onTabChange?: (tab: SearchTab) => void;
}

export function SearchOverlayResults({
  results,
  activeIndex,
  query,
  onSelect,
  importingId,
  activeTab = "all",
  tabs = [],
  onTabChange,
}: SearchOverlayResultsProps) {
  const t = useTranslations("globalSearch.overlay");
  const tTabs = useTranslations("globalSearch.overlay.tabs");
  const tGroups = useTranslations("globalSearch.overlay.groups");

  if (!results) return null;

  // Tab-filtered flat list — indices here match the hook's `flatItems` used
  // for keyboard navigation, because both call `flattenResults(results, tab)`.
  const flat = flattenResults(results, activeTab);

  const showTabs = tabs.length > 1;

  // No results across all groups
  if (flat.length === 0) {
    return (
      <div className="search-overlay-empty-results">
        <p className="search-overlay-empty-title">
          {t("noResults", { query: query.trim() })}
        </p>
        <p className="search-overlay-empty-hint">{t("noResultsHint")}</p>
      </div>
    );
  }

  // Compute per-group slices with their starting index in the (filtered) flat
  // list. `flat` is already tab-filtered, so groups outside the active tab
  // yield empty slices and are dropped below.
  let cursor = 0;
  const slices = SEARCH_GROUP_ORDER.map((key) => {
    const items = flat.filter((item) => GROUP_OF_TYPE[item.type] === key);
    const start = cursor;
    cursor += items.length;
    return { key, items, start };
  }).filter((slice) => slice.items.length > 0);

  return (
    <div className="search-overlay-results-wrapper">
      {showTabs && (
        <div
          role="tablist"
          aria-label={t("tabsAriaLabel")}
          className="search-overlay-tabs"
        >
          {tabs.map((tab) => {
            const isActive = tab === activeTab;
            const label = tab === "all" ? tTabs("all") : tGroups(tab);
            const count = tab === "all" ? undefined : results.counts[tab];
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-tab={tab}
                className={`search-overlay-tab ${isActive ? "is-active" : ""}`.trim()}
                onClick={() => onTabChange?.(tab)}
              >
                <span className="search-overlay-tab-label">{label}</span>
                {count !== undefined && (
                  <span className="search-overlay-tab-count">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <ul
        role="listbox"
        aria-label={t("resultsAriaLabel")}
        className="search-overlay-results"
      >
        {slices.map((slice) => (
          <SearchOverlayGroup
            key={slice.key}
            groupKey={slice.key}
            items={slice.items}
            startIndex={slice.start}
            activeIndex={activeIndex}
            query={query}
            onSelect={onSelect}
            importingId={importingId}
          />
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// SearchOverlayGroup
// ============================================================================

interface SearchOverlayGroupProps {
  groupKey: SearchGroupKey;
  items: FlatSearchItem[];
  /** Starting index (in the flat list) of this group's first item. */
  startIndex: number;
  activeIndex: number;
  query: string;
  onSelect: (item: FlatSearchItem) => void;
  importingId?: string | null;
}

export function SearchOverlayGroup({
  groupKey,
  items,
  startIndex,
  activeIndex,
  query,
  onSelect,
  importingId,
}: SearchOverlayGroupProps) {
  const t = useTranslations("globalSearch.overlay");
  const tGroups = useTranslations("globalSearch.overlay.groups");

  const groupLabel = tGroups(groupKey);
  const total = items.length;

  return (
    <li className="search-overlay-group" data-group={groupKey}>
      <div className="editorial-kicker search-overlay-group-header">
        <span>{groupLabel}</span>
        <span className="search-overlay-group-count">{total}</span>
      </div>

      <ul className="search-overlay-group-list">
        {items.map((item, i) => (
          <SearchOverlayItem
            key={`${item.type}:${item.id}`}
            item={item}
            index={startIndex + i}
            active={startIndex + i === activeIndex}
            onSelect={() => onSelect(item)}
            importing={item.type === "game" && importingId === item.id}
          />
        ))}
      </ul>

      <SeeAllLink
        groupKey={groupKey}
        category={groupLabel}
        query={query}
        label={t("seeAll", { category: groupLabel, query: query.trim() })}
      />
    </li>
  );
}

// ============================================================================
// SeeAllLink
// ============================================================================

interface SeeAllLinkProps {
  groupKey: SearchGroupKey;
  category: string;
  query: string;
  label: ReactNode;
}

function SeeAllLink({ groupKey, query, label }: SeeAllLinkProps) {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const href = `${GROUP_LISTING_ROUTE[groupKey]}?q=${encodeURIComponent(trimmed)}`;

  return (
    <Link href={href} className="search-overlay-see-all">
      <span className="search-overlay-see-all-label">{label}</span>
      <Icon
        icon="lucide:arrow-right"
        className="search-overlay-see-all-arrow size-4"
        aria-hidden
      />
    </Link>
  );
}
