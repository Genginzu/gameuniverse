"use client";

import { useState, useEffect, useCallback } from "react";
import { GameCard } from "./GameCard";
import { GameSearchBar } from "./GameSearchBar";
import { GameFilters } from "./GameFilters";
import { GamePagination } from "./GamePagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Genre {
  id: string;
  name: string;
  gameCount: number;
}

interface Game {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
  releaseDate?: string;
  releaseYear?: number;
  genres: { name: string }[];
  developer: string;
  publisher: string;
  metascore?: number;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface AllGamesContentProps {
  locale?: string;
}

export function AllGamesContent({ locale = "fr" }: AllGamesContentProps) {
  // const t = useTranslations("games"); // Unused for now

  const [games, setGames] = useState<Game[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);

  // Fetch genres
  const fetchGenres = useCallback(async () => {
    try {
      const response = await fetch(`/api/genres?locale=${locale}`);
      if (!response.ok) throw new Error("Failed to fetch genres");
      const data = await response.json();
      setGenres(data.genres || []);
    } catch (err) {
      console.error("Error fetching genres:", err);
    }
  }, [locale]);

  // Fetch games
  const fetchGames = useCallback(
    async (
      search: string = "",
      genres: string[] = [],
      publishers: string[] = [],
      page: number = 1
    ) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          locale,
          page: page.toString(),
          limit: "20",
        });

        if (search.trim()) {
          params.append("search", search.trim());
        }

        if (genres.length > 0) {
          params.append("genres", genres.join(","));
        }

        if (publishers.length > 0) {
          params.append("publishers", publishers.join(","));
        }

        const response = await fetch(`/api/games?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        setGames(data.games || []);
        setPagination(data.pagination || null);
      } catch (err) {
        console.error("Error fetching games:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [locale]
  );

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      fetchGames(query, selectedGenres, selectedPublishers, 1);
    },
    [fetchGames, selectedGenres, selectedPublishers]
  );

  // Handle genre filter
  const handleGenreFilter = useCallback(
    (genres: string[]) => {
      setSelectedGenres(genres);
      fetchGames(searchQuery, genres, selectedPublishers, 1);
    },
    [fetchGames, searchQuery, selectedPublishers]
  );

  // Handle publisher filter
  const handlePublisherFilter = useCallback(
    (publishers: string[]) => {
      setSelectedPublishers(publishers);
      fetchGames(searchQuery, selectedGenres, publishers, 1);
    },
    [fetchGames, searchQuery, selectedGenres]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      fetchGames(searchQuery, selectedGenres, selectedPublishers, page);
    },
    [fetchGames, searchQuery, selectedGenres, selectedPublishers]
  );

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedGenres([]);
    setSelectedPublishers([]);
    fetchGames("", [], [], 1);
  }, [fetchGames]);

  // Initial load
  useEffect(() => {
    fetchGenres();
    fetchGames();
  }, [fetchGenres, fetchGames]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Erreur: {error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Tous les jeux</h1>
        <p className="text-gray-600">Découvrez notre collection complète de jeux vidéo</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <GameSearchBar onSearch={handleSearch} initialValue={searchQuery} />
        </div>
        <div className="lg:col-span-2">
          <GameFilters
            genres={genres}
            selectedGenres={selectedGenres}
            selectedPublishers={selectedPublishers}
            onGenreChange={handleGenreFilter}
            onPublisherChange={handlePublisherFilter}
            onClearFilters={handleClearFilters}
          />
        </div>
      </div>

      {/* Results info */}
      {pagination && (
        <div className="mb-4 text-sm text-gray-600">
          {searchQuery ? (
            <p>
              {pagination.totalCount} résultat(s) pour "{searchQuery}"
            </p>
          ) : (
            <p>{pagination.totalCount} jeu(x) au total</p>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Games grid */}
      {!loading && (
        <>
          {games.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg
                className="mb-4 h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <h3 className="mb-2 text-lg font-medium text-gray-900">Aucun jeu trouvé</h3>
              <p className="text-gray-500">
                {searchQuery || selectedGenres.length > 0 || selectedPublishers.length > 0
                  ? "Essayez de modifier vos critères de recherche"
                  : "Aucun jeu disponible pour le moment"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {games.map((game) => (
                <GameCard key={game.id} game={game} locale={locale} />
              ))}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <GamePagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              onPageChange={handlePageChange}
              loading={loading}
            />
          )}
        </>
      )}
    </>
  );
}
