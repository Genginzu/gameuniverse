"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useShowcaseIgdbSearch } from "@/hooks/useShowcaseIgdbSearch";
import { useShowcaseSearch } from "@/hooks/useShowcaseSearch";
import type { HomeShowcaseKind, ShowcaseIgdbResult, ShowcaseSearchResult } from "@/types/home";
import { ShowcaseIgdbResults } from "./ShowcaseIgdbResults";
import { ShowcaseSearchResults } from "./ShowcaseSearchResults";

interface ShowcaseSearchPickerProps {
  kind: HomeShowcaseKind;
  excludedIds: Set<string>;
  disabled: boolean;
  onSelect: (result: ShowcaseSearchResult) => void;
  /** Games only: import an IGDB game then add it. Resolves once done. */
  onImport?: (result: ShowcaseIgdbResult) => Promise<void>;
}

export function ShowcaseSearchPicker({
  kind,
  excludedIds,
  disabled,
  onSelect,
  onImport,
}: ShowcaseSearchPickerProps) {
  const t = useTranslations("admin.homeShowcase");
  const [query, setQuery] = useState("");
  const [importingId, setImportingId] = useState<number | null>(null);
  const search = useShowcaseSearch(kind, query);
  const igdb = useShowcaseIgdbSearch(query, !!onImport);

  const visible = search.results.filter((result) => !excludedIds.has(result.id));
  const localSlugs = new Set(search.results.map((result) => result.slug));
  const igdbOnly = igdb.results.filter((result) => !localSlugs.has(result.slug));

  const handleSelect = (result: ShowcaseSearchResult) => {
    onSelect(result);
    setQuery("");
  };

  const handleImport = async (result: ShowcaseIgdbResult) => {
    if (!onImport) return;
    setImportingId(result.igdbId);
    try {
      await onImport(result);
      setQuery("");
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div>
      <label
        htmlFor={`showcase-search-${kind}`}
        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {t(`${kind}.searchLabel`)}
      </label>
      <div className="relative">
        <Icon
          icon="lucide:search"
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
        <Input
          id={`showcase-search-${kind}`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t(`${kind}.searchPlaceholder`)}
          disabled={disabled || importingId !== null}
          className="glass-input min-h-11 pl-9 text-base"
          autoComplete="off"
        />
        {(search.searching || igdb.searching) && (
          <div className="absolute top-1/2 right-3 -translate-y-1/2">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>

      {query.trim().length >= 2 && (
        <>
          <ShowcaseSearchResults
            kind={kind}
            results={visible}
            totalCount={search.totalCount}
            searching={search.searching}
            hasMore={search.hasMore}
            loadingMore={search.loadingMore}
            onLoadMore={search.loadMore}
            onSelect={handleSelect}
          />
          {onImport && (
            <ShowcaseIgdbResults
              results={igdbOnly}
              searching={igdb.searching}
              failed={igdb.failed}
              importingId={importingId}
              disabled={disabled}
              onImport={handleImport}
            />
          )}
        </>
      )}
    </div>
  );
}
