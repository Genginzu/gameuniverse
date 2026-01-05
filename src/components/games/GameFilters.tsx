"use client";

import { useState } from "react";

interface Genre {
  id: string;
  name: string;
  gameCount: number;
}

interface GameFiltersProps {
  genres: Genre[];
  selectedGenres: string[];
  selectedPublishers: string[];
  onGenreChange: (genres: string[]) => void;
  onPublisherChange: (publishers: string[]) => void;
  onClearFilters: () => void;
}

export function GameFilters({
  genres,
  selectedGenres,
  selectedPublishers,
  onGenreChange,
  onPublisherChange,
  onClearFilters,
}: GameFiltersProps) {
  const [showAllGenres, setShowAllGenres] = useState(false);

  const handleGenreToggle = (genreName: string) => {
    const newSelectedGenres = selectedGenres.includes(genreName)
      ? selectedGenres.filter((g) => g !== genreName)
      : [...selectedGenres, genreName];

    onGenreChange(newSelectedGenres);
  };

  const displayedGenres = showAllGenres ? genres : genres.slice(0, 8);
  const hasFilters = selectedGenres.length > 0 || selectedPublishers.length > 0;

  return (
    <div className="space-y-4">
      {/* Quick filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Filtres rapides:</span>

        {/* Clear all button */}
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
          >
            <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Tout effacer
          </button>
        )}

        {/* Popular genres as quick filters */}
        {genres.slice(0, 4).map((genre) => (
          <button
            key={genre.id}
            onClick={() => handleGenreToggle(genre.name)}
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
              selectedGenres.includes(genre.name)
                ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
            }`}
          >
            {genre.name}
            <span className="ml-1 text-xs opacity-75">({genre.gameCount})</span>
          </button>
        ))}

        {/* More filters toggle */}
        <button
          onClick={() => setShowAllGenres(!showAllGenres)}
          className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1 text-xs font-medium text-blue-700 transition-all hover:from-blue-100 hover:to-indigo-100"
        >
          <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
            />
          </svg>
          {showAllGenres ? "Moins de filtres" : "Plus de filtres"}
        </button>
      </div>

      {/* Active filters display */}
      {hasFilters && (
        <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">Filtres actifs</span>
            <span className="text-xs text-blue-600">{selectedGenres.length} sélectionné(s)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedGenres.map((genre) => (
              <div
                key={genre}
                className="inline-flex items-center rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200"
              >
                <span className="mr-2">{genre}</span>
                <button
                  onClick={() => handleGenreToggle(genre)}
                  className="rounded-full p-0.5 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-600"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded filters */}
      {showAllGenres && (
        <div className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-200">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Tous les genres</h3>
            <span className="text-sm text-gray-500">{genres.length} disponibles</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {genres.map((genre) => (
              <label
                key={genre.id}
                className="group relative flex cursor-pointer items-center rounded-lg border border-gray-200 p-3 transition-all hover:border-blue-300 hover:bg-blue-50"
              >
                <input
                  type="checkbox"
                  checked={selectedGenres.includes(genre.name)}
                  onChange={() => handleGenreToggle(genre.name)}
                  className="sr-only"
                />
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                    selectedGenres.includes(genre.name)
                      ? "border-blue-600 bg-blue-600"
                      : "border-gray-300 group-hover:border-blue-400"
                  }`}
                >
                  {selectedGenres.includes(genre.name) && (
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <span className="text-sm font-medium text-gray-900">{genre.name}</span>
                  <div className="text-xs text-gray-500">{genre.gameCount} jeux</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
