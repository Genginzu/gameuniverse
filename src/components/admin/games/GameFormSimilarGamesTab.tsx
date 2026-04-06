"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAdminSimilarGames } from "@/hooks/useAdminSimilarGames";
import { Icon } from "@iconify/react";

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
}

interface GameFormSimilarGamesTabProps {
  gameId: string;
}

export function GameFormSimilarGamesTab({ gameId }: GameFormSimilarGamesTabProps) {
  const t = useTranslations("admin.games.form");
  const {
    similarGames: rawData,
    loading,
    error,
    adding,
    removing,
    addSimilarGame,
    removeSimilarGame,
  } = useAdminSimilarGames(gameId);

  const similarGames = Array.isArray(rawData) ? rawData : [];

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/games/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data) ? data : []);
          setShowDropdown(true);
        }
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = async (game: SearchResult) => {
    setAddError(null);
    const result = await addSimilarGame(game.slug);
    if (result.ok) {
      setQuery("");
      setResults([]);
      setShowDropdown(false);
    } else {
      setAddError(result.error ?? t("similarGamesAddError"));
    }
  };

  // Filter out games already in the similar list
  const existingIds = new Set(similarGames.map((sg) => sg.game?.id).filter(Boolean));
  const filteredResults = results.filter((r) => r.id !== gameId && !existingIds.has(r.id));

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Search input with dropdown */}
      <div ref={containerRef} className="relative">
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("similarGamesSearchLabel")}
        </label>
        <div className="relative">
          <Icon
            icon="fa:search"
            className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
          />
          <Input
            placeholder={t("similarGamesSearchPlaceholder")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setAddError(null);
            }}
            onFocus={() => query.trim().length >= 2 && results.length > 0 && setShowDropdown(true)}
            className="pl-9"
            disabled={adding}
          />
          {searching && (
            <div className="absolute top-1/2 right-3 -translate-y-1/2">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && filteredResults.length > 0 && (
          <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {filteredResults.map((game) => (
              <button
                key={game.id}
                type="button"
                disabled={adding}
                onClick={() => handleSelect(game)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-gray-700/50"
              >
                {game.coverImage ? (
                  <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded border border-gray-200 dark:border-gray-600">
                    <Image src={game.coverImage} alt="" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-10 w-7 shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700">
                    <Icon icon="mdi:gamepad-variant" className="h-3 w-3 text-gray-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                    {game.title}
                  </p>
                  <p className="truncate text-xs text-gray-400">{game.slug}</p>
                </div>
                <Icon icon="fa:plus" className="h-3 w-3 shrink-0 text-gray-400" />
              </button>
            ))}
          </div>
        )}

        {showDropdown && !searching && query.trim().length >= 2 && filteredResults.length === 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-center text-sm text-gray-400 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {t("similarGamesNoResults")}
          </div>
        )}
      </div>

      {addError && <p className="text-sm text-red-600 dark:text-red-400">{addError}</p>}

      {/* Current similar games list */}
      {similarGames.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
          {t("similarGamesEmpty")}
        </p>
      ) : (
        <div className="space-y-2">
          {similarGames.map((sg) => (
            <div
              key={sg.id}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 dark:border-gray-700/30 dark:bg-gray-900/20"
            >
              {sg.game ? (
                <Link
                  href={`/admin/games/${sg.game.id}/edit`}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-lg transition-colors hover:bg-gray-100/60 dark:hover:bg-gray-700/30"
                >
                  {sg.game.coverImage ? (
                    <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
                      <Image
                        src={sg.game.coverImage}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700">
                      <Icon icon="mdi:gamepad-variant" className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                      {sg.game.title}
                    </p>
                    <p className="truncate text-xs text-gray-400">{sg.game.slug}</p>
                  </div>
                </Link>
              ) : (
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-12 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700">
                    <Icon icon="mdi:gamepad-variant" className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                      {`IGDB #${sg.similarIgdbId}`}
                    </p>
                  </div>
                </div>
              )}
              <button
                type="button"
                disabled={removing === sg.id}
                onClick={() => removeSimilarGame(sg.id)}
                className="shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-900/20"
                aria-label={t("similarGamesRemove")}
              >
                {removing === sg.id ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Icon icon="fa:times" className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500">
        {t("similarGamesCount", { count: similarGames.length })}
      </p>
    </div>
  );
}
