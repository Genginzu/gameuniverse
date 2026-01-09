"use client";

import { Genre } from "@/types/genre";

interface GameFiltersProps {
  genres: Genre[];
  selectedGenres: string[];
  selectedPublishers: string[];
  onGenreChange: (genres: string[]) => void;
  onPublisherChange: (publishers: string[]) => void;
  onClearFilters: () => void;
  showAllGenres: boolean;
}

export function GameFilters({
  genres,
  selectedGenres,
  selectedPublishers,
  onGenreChange,
  onPublisherChange: _onPublisherChange,
  onClearFilters,
  showAllGenres,
}: GameFiltersProps) {
  const handleGenreToggle = (genreName: string) => {
    const newSelectedGenres = selectedGenres.includes(genreName)
      ? selectedGenres.filter((g) => g !== genreName)
      : [...selectedGenres, genreName];

    onGenreChange(newSelectedGenres);
  };

  const hasFilters = selectedGenres.length > 0 || selectedPublishers.length > 0;

  // Don't render anything if no filters are active and panel is closed
  if (!hasFilters && !showAllGenres) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Clear all button - positioned at the right */}
      {hasFilters && (
        <div className="flex justify-end">
          <button
            onClick={onClearFilters}
            className="inline-flex items-center rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 sm:px-4"
          >
            <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span className="hidden sm:inline">Tout effacer</span>
            <span className="sm:hidden">Effacer</span>
          </button>
        </div>
      )}

      {/* Active filters display */}
      {hasFilters && (
        <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">Filtres actifs</span>
            <span className="text-xs text-blue-600">{selectedGenres.length} sélectionné(s)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedGenres.map((genre) => (
              <div
                key={genre}
                className="inline-flex items-center rounded-lg bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 sm:px-3 sm:py-1.5 sm:text-sm"
              >
                <span className="mr-1 sm:mr-2">{genre}</span>
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
        <div className="rounded-xl bg-white p-4 shadow-lg ring-1 ring-gray-200 sm:p-6">
          <div className="mb-4 flex flex-col items-start justify-between sm:flex-row sm:items-center">
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Tous les genres</h3>
            <span className="mt-1 text-sm text-gray-500 sm:mt-0">{genres.length} disponibles</span>
          </div>

          <div className="xs:grid-cols-2 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
                  className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-all sm:h-5 sm:w-5 ${
                    selectedGenres.includes(genre.name)
                      ? "border-blue-600 bg-blue-600"
                      : "border-gray-300 group-hover:border-blue-400"
                  }`}
                >
                  {selectedGenres.includes(genre.name) && (
                    <svg
                      className="h-2.5 w-2.5 text-white sm:h-3 sm:w-3"
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
                <div className="ml-2 min-w-0 flex-1 sm:ml-3">
                  <span className="text-xs font-medium text-gray-900 sm:text-sm">{genre.name}</span>
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
