"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { SearchResultItem } from "@/types/search";
import type { UIEvent } from "react";
import Image from "next/image";

interface SelectedGamePreviewProps {
  game: SearchResultItem;
  onClear: () => void;
}

/** Compact preview of the selected game with source badge and clear button */
export function SelectedGamePreview({ game, onClear }: SelectedGamePreviewProps) {
  const t = useTranslations("collections.addGame");

  return (
    <div className="border-editorial-line bg-editorial-3 flex items-center gap-3 rounded-xl border p-3">
      {game.coverUrl ? (
        <Image
          src={game.coverUrl}
          alt={game.title}
          width={36}
          height={48}
          className="h-12 w-9 rounded object-cover"
        />
      ) : (
        <div className="bg-editorial-2 flex h-12 w-9 items-center justify-center rounded text-xs">
          🎮
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-white">{game.title}</p>
          <SourceBadge source={game.source} />
        </div>
        {game.releaseYear && <p className="text-editorial-muted text-xs">{game.releaseYear}</p>}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="text-editorial-muted text-xs transition-colors hover:text-[rgb(var(--accent-rgb,var(--neon-primary)))]"
      >
        {t("changeGame")}
      </button>
    </div>
  );
}

interface SearchInputProps {
  query: string;
  onChange: (value: string) => void;
  results: SearchResultItem[];
  isSearching: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onSelect: (game: SearchResultItem) => void;
  placeholder: string;
  noResultsText: string;
}

/** Search input with dropdown results showing local and IGDB games */
export function SearchInput({
  query,
  onChange,
  results,
  isSearching,
  isLoadingMore,
  hasMore,
  onLoadMore,
  onSelect,
  placeholder,
  noResultsText,
}: SearchInputProps) {
  const showDropdown = query.trim().length >= 2;

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom && hasMore && !isSearching && !isLoadingMore) {
      onLoadMore();
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Icon
          icon="lucide:search"
          className="text-editorial-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
        />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => onChange(e.target.value)}
          className="border-editorial-line bg-editorial-3 pl-9 text-white placeholder:text-editorial-muted"
        />
      </div>

      {showDropdown && (
        <div
          onScroll={handleScroll}
          className="border-editorial-line bg-editorial-2 absolute top-full right-0 left-0 z-50 mt-1 max-h-[55vh] overflow-y-auto rounded-xl border shadow-lg"
        >
          {isSearching ? (
            <div className="flex items-center justify-center p-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[rgb(var(--accent-rgb,var(--neon-primary)))] border-t-transparent" />
            </div>
          ) : results.length === 0 ? (
            <p className="text-editorial-muted p-4 text-center text-sm">{noResultsText}</p>
          ) : (
            <>
              <ul className="divide-editorial-line divide-y">
                {results.map((game) => (
                  <li key={`${game.source}-${game.id}`}>
                    <button
                      type="button"
                      onClick={() => onSelect(game)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-white/[0.04]"
                    >
                      {game.coverUrl ? (
                        <Image
                          src={game.coverUrl}
                          alt={game.title}
                          width={28}
                          height={40}
                          className="h-10 w-7 rounded object-cover"
                        />
                      ) : (
                        <div className="bg-editorial-3 flex h-10 w-7 items-center justify-center rounded text-xs">
                          🎮
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-white">{game.title}</p>
                          <SourceBadge source={game.source} />
                        </div>
                        <p className="text-editorial-muted truncate text-xs">
                          {[game.releaseYear, game.developer].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              {isLoadingMore && (
                <div className="flex items-center justify-center p-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[rgb(var(--accent-rgb,var(--neon-primary)))] border-t-transparent" />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Badge indicating whether a game is from local DB or IGDB */
function SourceBadge({ source }: { source: "local" | "igdb" }) {
  if (source === "local") {
    return (
      <Badge
        variant="outline"
        className="border-editorial-line text-editorial-muted shrink-0 gap-1 bg-white/[0.04] px-1.5 py-0 text-[10px]"
      >
        <Icon icon="lucide:database" className="h-2.5 w-2.5" />
        Local
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="shrink-0 gap-1 border-purple-500/40 bg-purple-500/10 px-1.5 py-0 text-[10px] text-purple-300"
    >
      <Icon icon="lucide:globe" className="h-2.5 w-2.5" />
      IGDB
    </Badge>
  );
}
