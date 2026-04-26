"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { GameSummary } from "@/types/game";

interface GameSearchPickerProps {
  locale: string;
  selectedLabel: string;
  onSelect: (game: { id: string; title: string }) => void;
  onClear: () => void;
}

/** Lightweight search + picker for the session composer. Hits /api/games. */
export function GameSearchPicker({
  locale,
  selectedLabel,
  onSelect,
  onClear,
}: GameSearchPickerProps) {
  const t = useTranslations("players.sessions");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (selectedLabel) {
      setIsOpen(false);
      return;
    }
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          locale,
          page: "1",
          limit: "8",
          search: trimmed,
        });
        const res = await fetch(`/api/games?${params.toString()}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const body = (await res.json()) as { games: GameSummary[] };
        setResults(body.games ?? []);
        setIsOpen(true);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [query, locale, selectedLabel]);

  if (selectedLabel) {
    return (
      <div className="border-palette-primary-300 dark:border-palette-primary-500/50 flex items-center gap-2 rounded-xl border-2 bg-white/60 p-3 dark:bg-slate-700/40">
        <Icon
          icon="lucide:gamepad-2"
          className="text-palette-primary-500 dark:text-palette-primary-300 h-4 w-4"
        />
        <span className="flex-1 truncate text-sm text-gray-800 dark:text-slate-100">
          {selectedLabel}
        </span>
        <button
          type="button"
          onClick={onClear}
          aria-label={t("clearGame")}
          className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        >
          <Icon icon="lucide:x" className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="border-palette-primary-300 focus-within:border-palette-primary-400 focus-within:ring-palette-primary-400/20 dark:border-palette-primary-500/50 flex items-center gap-2 rounded-xl border-2 bg-white/60 p-3 focus-within:ring-2 dark:bg-slate-700/40">
        <Icon icon="lucide:search" className="h-4 w-4 text-gray-400 dark:text-slate-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("gamePlaceholder")}
          aria-label={t("gamePlaceholder")}
          className="flex-1 bg-transparent text-base text-gray-800 placeholder-gray-400 focus:outline-hidden dark:text-slate-100 dark:placeholder-slate-500"
        />
        {isLoading && (
          <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          {results.map((game) => (
            <li key={game.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect({ id: game.id, title: game.title });
                  setQuery("");
                  setIsOpen(false);
                }}
                className="hover:bg-palette-primary-50 flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-800 transition-colors dark:text-slate-100 dark:hover:bg-slate-700/60"
              >
                {game.coverImage ? (
                  <img
                    src={game.coverImage}
                    alt=""
                    className="h-10 w-8 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-8 shrink-0 items-center justify-center rounded bg-gray-100 dark:bg-slate-700">
                    <Icon icon="lucide:gamepad-2" className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                <span className="truncate">{game.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && !isLoading && query.trim().length >= 2 && results.length === 0 && (
        <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">{t("noResults")}</p>
      )}
    </div>
  );
}
