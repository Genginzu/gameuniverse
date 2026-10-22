"use client";

import { useLocale } from "next-intl";
import useSWRInfinite from "swr/infinite";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { fetcher } from "@/lib/swr/fetcher";
import type { HomeShowcaseKind, ShowcaseSearchResult } from "@/types/home";

const PAGE_SIZE = 20;

interface SearchPage {
  results: ShowcaseSearchResult[];
  totalCount: number;
  hasNextPage: boolean;
}

interface AdminPagination {
  totalCount: number;
  hasNextPage: boolean;
}

interface AdminGamesResponse {
  games: { id: string; slug: string; title: string; coverImage: string | null }[];
  pagination: AdminPagination;
}

interface AdminCharactersResponse {
  characters: {
    id: string;
    slug: string;
    name: string;
    mainImage: string | null;
    primaryGame: string;
  }[];
  pagination: AdminPagination;
}

function pageUrl(kind: HomeShowcaseKind, query: string, locale: string, page: number): string {
  const q = encodeURIComponent(query);
  const common = `search=${q}&locale=${locale}&page=${page}&limit=${PAGE_SIZE}`;
  return kind === "game"
    ? `/api/admin/games?${common}&sort_by=title&sort_order=asc`
    : `/api/admin/characters?${common}`;
}

function toPage(kind: HomeShowcaseKind, payload: unknown): SearchPage {
  if (kind === "game") {
    const { games, pagination } = payload as AdminGamesResponse;
    return {
      results: games.map((game) => ({
        id: game.id,
        slug: game.slug,
        name: game.title,
        imageUrl: game.coverImage,
      })),
      ...pagination,
    };
  }
  const { characters, pagination } = payload as AdminCharactersResponse;
  return {
    results: characters.map((character) => ({
      id: character.id,
      slug: character.slug,
      name: character.name,
      imageUrl: character.mainImage,
      subtitle: character.primaryGame || undefined,
    })),
    ...pagination,
  };
}

/** Debounced, paginated admin search of games or characters for the showcase picker. */
export function useShowcaseSearch(kind: HomeShowcaseKind, query: string) {
  const locale = useLocale();
  const debounced = useDebouncedValue(query.trim(), 300);
  const enabled = debounced.length >= 2;

  const { data, size, setSize, isLoading, isValidating } = useSWRInfinite<SearchPage>(
    (index, previous: SearchPage | null) => {
      if (!enabled || (previous && !previous.hasNextPage)) return null;
      return pageUrl(kind, debounced, locale, index + 1);
    },
    async (url: string) => toPage(kind, await fetcher(url)),
    { revalidateFirstPage: false }
  );

  const pages = enabled ? (data ?? []) : [];
  const lastPage = pages[pages.length - 1];
  const loadingMore = isValidating && size > pages.length;

  return {
    results: pages.flatMap((page) => page.results),
    totalCount: lastPage?.totalCount ?? 0,
    hasMore: !!lastPage?.hasNextPage,
    loadingMore,
    searching: isLoading || (query.trim().length >= 2 && debounced !== query.trim()),
    loadMore: () => {
      if (lastPage?.hasNextPage && !loadingMore) void setSize(size + 1);
    },
  };
}
