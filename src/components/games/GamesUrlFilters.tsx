"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import {
  gamesFiltersFromSearchParams,
  type GamesListingFilters,
} from "@/lib/listing/resources/games";

interface GamesUrlFiltersProps {
  onFilters: (patch: Partial<GamesListingFilters>) => void;
}

/**
 * Applies the filters of a deep link (`/games?themes=open-world`) after
 * hydration. Rendered inside a Suspense boundary so reading the search params
 * does not opt the ISR listing page out of static rendering.
 */
export function GamesUrlFilters({ onFilters }: GamesUrlFiltersProps) {
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  useEffect(() => {
    const patch = gamesFiltersFromSearchParams(new URLSearchParams(query));
    if (patch) onFilters(patch);
  }, [query, onFilters]);

  return null;
}
