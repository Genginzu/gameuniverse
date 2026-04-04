"use client";

import { useState } from "react";
import type { GameFormTabProps, AdminGenre } from "@/types/admin-games";
import { IgdbFieldIndicator } from "./IgdbFieldIndicator";
import { Icon } from "@iconify/react";

interface GenresTabProps extends GameFormTabProps {
  genres: AdminGenre[];
  toggleGenre: (genreId: string) => void;
}

export function GameFormGenresTab({ form, genres, toggleGenre, t, isIgdbField }: GenresTabProps) {
  const [search, setSearch] = useState("");

  const filtered = genres.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {form.watch("genres").length} {form.watch("genres").length === 1 ? "genre" : "genres"}
        {isIgdbField && (
          <IgdbFieldIndicator fieldName="genres" isIgdbField={isIgdbField("genres")} />
        )}
      </p>
      <div className="relative mb-3">
        <Icon
          icon="mdi:magnify"
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchGenre") ?? "Rechercher un genre..."}
          className="focus:border-primary focus:ring-primary w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm text-gray-900 focus:ring-1 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {filtered.map((genre) => {
          const selected = form.watch("genres").some((g) => g.genre_id === genre.id);
          return (
            <button
              key={genre.id}
              type="button"
              onClick={() => toggleGenre(genre.id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                selected
                  ? "border-primary bg-primary/10 text-primary dark:bg-primary/20 shadow-xs"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
              }`}
              aria-pressed={selected}
              aria-label={genre.name}
            >
              {genre.name}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400">{t("noResultsGenre") ?? "Aucun genre trouvé"}</p>
        )}
      </div>
      {form.formState.errors.genres && (
        <p className="text-destructive mt-3 text-sm font-medium">
          {form.formState.errors.genres.message}
        </p>
      )}
    </div>
  );
}
