"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { GameSummary } from "@/types/game";
import { SESSION_INPUT_CLASS } from "./session-field-classes";

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
      <div className="border-editorial-line bg-editorial-3 flex h-11 items-center gap-2 rounded-md border pr-1 pl-3.5">
        <Icon icon="lucide:gamepad-2" className="text-editorial-accent size-4" />
        <span className="flex-1 truncate text-base text-white">{selectedLabel}</span>
        <button
          type="button"
          onClick={onClear}
          aria-label={t("clearGame")}
          className="text-editorial-muted flex size-9 items-center justify-center rounded-full transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <Icon icon="lucide:x" className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Icon
          icon="lucide:search"
          className="text-editorial-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("gamePlaceholder")}
          aria-label={t("gamePlaceholder")}
          className={`${SESSION_INPUT_CLASS} pr-10 pl-10`}
        />
        {isLoading && (
          <Icon
            icon="lucide:loader-2"
            className="text-editorial-muted absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin"
          />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul
          role="listbox"
          className="editorial-scrollbar-accent border-editorial-line bg-editorial-2 absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border shadow-lg shadow-black/40"
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
                className="flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left text-sm text-white transition-colors hover:bg-white/[0.06]"
              >
                {game.coverImage ? (
                  <img
                    src={game.coverImage}
                    alt=""
                    className="h-10 w-8 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="bg-editorial-3 flex h-10 w-8 shrink-0 items-center justify-center rounded">
                    <Icon icon="lucide:gamepad-2" className="text-editorial-muted h-4 w-4" />
                  </div>
                )}
                <span className="truncate">{game.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && !isLoading && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-editorial-muted mt-2 text-sm">{t("noResults")}</p>
      )}
    </div>
  );
}
