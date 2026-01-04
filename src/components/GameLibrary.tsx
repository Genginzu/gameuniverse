"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import GameCard from "./GameCard";
import SearchBar from "./SearchBar";
import Pagination from "./Pagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Genre {
  name: string;
}

interface Game {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
  releaseDate?: string;
  releaseYear?: number;
  genres: Genre[];
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

interface GameLibraryProps {
  locale?: string;
  initialGames?: Game[];
  initialPagination?: Pagination;
}

export default function GameLibrary({
  locale = "fr",
  initialGames = [],
  initialPagination,
}: GameLibraryProps) {
  const t = useTranslations("library");

  const [games, setGames] = useState<Game[]>(initialGames);
  const [pagination, setPagination] = useState<Pagination | null>(initialPagination || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const fetchGames = useCallback(
    async (search: string = "", genres: string[] = [], page: number = 1) => {
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
      fetchGames(query, selectedGenres, 1);
    },
    [fetchGames, selectedGenres]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      fetchGames(searchQuery, selectedGenres, page);
    },
    [fetchGames, searchQuery, selectedGenres]
  );

  // Initial load if no initial data provided
  useEffect(() => {
    if (initialGames.length === 0) {
      fetchGames();
    }
  }, [fetchGames, initialGames.length]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            {t("error")}: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">{t("title")}</h1>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar onSearch={handleSearch} placeholder={t("search")} initialValue={searchQuery} />
        </div>

        {/* Results info */}
        {pagination && (
          <div className="mb-4 text-sm text-gray-600">
            {searchQuery ? (
              <p>
                {t("searchResults", {
                  count: pagination.totalCount,
                  query: searchQuery,
                })}
              </p>
            ) : (
              <p>{t("totalGames", { count: pagination.totalCount })}</p>
            )}
          </div>
        )}
      </div>

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
              <h3 className="mb-2 text-lg font-medium text-gray-900">{t("noResults")}</h3>
              <p className="text-gray-500">
                {searchQuery
                  ? t("noResultsForQuery", { query: searchQuery })
                  : t("noGamesAvailable")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {games.map((game) => (
                <GameCard key={game.id} game={game} locale={locale} />
              ))}
            </div>
          )}

          {/* Pagination will be added in the next task */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              onPageChange={handlePageChange}
              loading={loading}
            />
          )}
        </>
      )}
    </div>
  );
}
