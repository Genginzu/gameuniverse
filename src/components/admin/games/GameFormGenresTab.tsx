"use client";

import type { GameFormTabProps, AdminGenre } from "@/types/admin-games";
import { IgdbFieldIndicator } from "./IgdbFieldIndicator";

interface GenresTabProps extends GameFormTabProps {
  genres: AdminGenre[];
  toggleGenre: (genreId: string) => void;
}

export function GameFormGenresTab({ form, genres, toggleGenre, isIgdbField }: GenresTabProps) {
  return (
    <div>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {form.watch("genres").length} {form.watch("genres").length === 1 ? "genre" : "genres"}
        {isIgdbField && (
          <IgdbFieldIndicator fieldName="genres" isIgdbField={isIgdbField("genres")} />
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => {
          const selected = form.watch("genres").some((g) => g.genre_id === genre.id);
          return (
            <button
              key={genre.id}
              type="button"
              onClick={() => toggleGenre(genre.id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                selected
                  ? "border-primary bg-primary/10 text-primary shadow-sm dark:bg-primary/20"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
              }`}
              aria-pressed={selected}
              aria-label={genre.name}
            >
              {genre.name}
            </button>
          );
        })}
      </div>
      {form.formState.errors.genres && (
        <p className="mt-3 text-sm font-medium text-destructive">
          {form.formState.errors.genres.message}
        </p>
      )}
    </div>
  );
}
