"use client";

import { useTranslations } from "next-intl";
import { Search, Globe, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { SearchResultItem } from "@/types/search";
import Image from "next/image";

interface SelectedGamePreviewProps {
  game: SearchResultItem;
  onClear: () => void;
}

/** Compact preview of the selected game with source badge and clear button */
export function SelectedGamePreview({ game, onClear }: SelectedGamePreviewProps) {
  const t = useTranslations("collections.addGame");

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      {game.coverUrl ? (
        <Image
          src={game.coverUrl}
          alt={game.title}
          width={36}
          height={48}
          className="h-12 w-9 rounded object-cover"
        />
      ) : (
        <div className="bg-muted flex h-12 w-9 items-center justify-center rounded text-xs">🎮</div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{game.title}</p>
          <SourceBadge source={game.source} />
        </div>
        {game.releaseYear && <p className="text-muted-foreground text-xs">{game.releaseYear}</p>}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="text-muted-foreground hover:text-foreground text-xs"
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
  onSelect,
  placeholder,
  noResultsText,
}: SearchInputProps) {
  const showDropdown = query.trim().length >= 2;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {showDropdown && (
        <div className="bg-popover absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border shadow-md">
          {isSearching ? (
            <div className="flex items-center justify-center p-4">
              <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
            </div>
          ) : results.length === 0 ? (
            <p className="text-muted-foreground p-4 text-center text-sm">{noResultsText}</p>
          ) : (
            <ul className="divide-y">
              {results.map((game) => (
                <li key={`${game.source}-${game.id}`}>
                  <button
                    type="button"
                    onClick={() => onSelect(game)}
                    className="hover:bg-accent flex w-full items-center gap-3 px-3 py-2 text-left transition-colors"
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
                      <div className="bg-muted flex h-10 w-7 items-center justify-center rounded text-xs">
                        🎮
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{game.title}</p>
                        <SourceBadge source={game.source} />
                      </div>
                      <p className="text-muted-foreground truncate text-xs">
                        {[game.releaseYear, game.developer].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
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
      <Badge variant="secondary" className="shrink-0 gap-1 px-1.5 py-0 text-[10px]">
        <Database className="h-2.5 w-2.5" />
        Local
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="shrink-0 gap-1 border-purple-300 px-1.5 py-0 text-[10px] text-purple-600 dark:border-purple-600 dark:text-purple-400"
    >
      <Globe className="h-2.5 w-2.5" />
      IGDB
    </Badge>
  );
}
