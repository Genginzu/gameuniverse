"use client";

import { useState, useEffect, useCallback } from "react";
import { CommonGamesIndicator } from "./CommonGamesIndicator";
import { CommonGamesList } from "./CommonGamesList";
import type { CommonGame, CommonGamesResult } from "@/types/player";

interface LibraryComparisonSectionProps {
  playerId: string;
  locale: string;
}

/**
 * Orchestrator for the library comparison feature on a player's profile.
 * Fetches common games data and coordinates the indicator + list display.
 *
 * Hides entirely on error to avoid breaking the profile page (Req 7.2).
 * Only rendered when the current user is authenticated and viewing
 * another player's profile — that check lives in the parent component.
 */
export function LibraryComparisonSection({ playerId, locale }: LibraryComparisonSectionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [commonGamesCount, setCommonGamesCount] = useState(0);
  const [commonGames, setCommonGames] = useState<CommonGame[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
  });

  const fetchCommonGames = useCallback(
    async (page: number) => {
      try {
        setIsLoading(true);
        setHasError(false);

        const res = await fetch(
          `/api/players/${playerId}/common-games?locale=${locale}&page=${page}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch common games");
        }

        const data: CommonGamesResult = await res.json();
        setCommonGamesCount(data.commonGamesCount);
        setCommonGames(data.commonGames);
        setPagination(data.pagination);
      } catch (err) {
        // Req 7.2 — hide the section rather than showing a broken state
        console.warn("Error fetching common games:", err);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [playerId, locale]
  );

  // Initial fetch on mount
  useEffect(() => {
    fetchCommonGames(1);
  }, [fetchCommonGames]);

  const handlePageChange = (page: number) => {
    fetchCommonGames(page);
  };

  const handleIndicatorClick = () => {
    setIsExpanded((prev) => !prev);
  };

  // Req 7.2 — silently hide the entire section on error
  if (hasError) return null;

  return (
    <section className="mb-8 space-y-4">
      <CommonGamesIndicator
        count={commonGamesCount}
        isLoading={isLoading}
        onClick={handleIndicatorClick}
      />

      {isExpanded && !isLoading && commonGamesCount > 0 && (
        <CommonGamesList
          games={commonGames}
          locale={locale}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}
    </section>
  );
}
