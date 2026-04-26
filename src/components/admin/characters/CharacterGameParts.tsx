"use client";

import Image from "next/image";
import { useState, useMemo, useRef, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { AvailableGame } from "@/hooks/useCharacterForm";
import { Icon } from "@iconify/react";

/** Row for an already-assigned game */
export function AssignedGameRow({
  game,
  isPrimary,
  onTogglePrimary,
  onRemove,
  t,
}: {
  game: AvailableGame;
  isPrimary: boolean;
  onTogglePrimary: () => void;
  onRemove: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="border-primary/20 bg-primary/5 dark:bg-primary/10 flex items-center justify-between rounded-xl border px-4 py-3">
      <div className="flex items-center gap-3">
        {game.coverImage && (
          <Image
            src={game.coverImage}
            alt={game.title}
            width={32}
            height={40}
            className="h-10 w-8 rounded border border-gray-200 object-cover dark:border-gray-700"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{game.title}</span>
      </div>
      <div className="flex items-center gap-4">
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
          <Checkbox
            checked={isPrimary}
            onCheckedChange={onTogglePrimary}
            aria-label={`${game.title} - ${t("primaryGame") ?? "Jeu principal"}`}
          />
          {t("primaryGame") ?? "Jeu principal"}
        </label>
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          aria-label={`Remove ${game.title}`}
        >
          <Icon icon="fa:times" className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/** Picker with search field to find a game */
export function GameSearchPicker({
  availableGames,
  onSelect,
  onClose,
  t,
}: {
  availableGames: AvailableGame[];
  onSelect: (gameId: string) => void;
  onClose: () => void;
  t: (key: string) => string;
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredGames = useMemo(() => {
    if (!search.trim()) return availableGames;
    const query = search.toLowerCase().trim();
    return availableGames.filter((g) => g.title.toLowerCase().includes(query));
  }, [availableGames, search]);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700/30 dark:bg-gray-900/20">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("addGame") ?? "Ajouter un jeu"}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Icon icon="fa:times" className="h-3 w-3" />
        </button>
      </div>
      <div className="relative mb-3">
        <Icon
          icon="fa:search"
          className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
        />
        <Input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchGamePlaceholder") ?? "Rechercher un jeu..."}
          className="pl-9"
        />
      </div>
      {availableGames.length === 0 ? (
        <p className="text-sm text-gray-400">
          {t("allGamesAdded") ?? "Tous les jeux sont déjà ajoutés"}
        </p>
      ) : filteredGames.length === 0 ? (
        <p className="py-3 text-center text-sm text-gray-400">
          {t("noGameFound") ?? "Aucun jeu trouvé"}
        </p>
      ) : (
        <ul
          className="max-h-60 space-y-1 overflow-y-auto"
          role="listbox"
          aria-label={t("selectGame") ?? "Sélectionner un jeu"}
        >
          {filteredGames.map((game) => (
            <li key={game.id}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => onSelect(game.id)}
                className="hover:bg-primary/10 dark:hover:bg-primary/20 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors"
              >
                {game.coverImage && (
                  <Image
                    src={game.coverImage}
                    alt=""
                    width={24}
                    height={32}
                    className="h-8 w-6 shrink-0 rounded border border-gray-200 object-cover dark:border-gray-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <span className="truncate text-gray-900 dark:text-white">{game.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
