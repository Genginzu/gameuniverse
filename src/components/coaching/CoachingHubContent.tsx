"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { Icon } from "@iconify/react";
import { Pagination } from "@/components/shared/Pagination";
import { CoachCard } from "./CoachCard";
import { FeaturedCoaches } from "./FeaturedCoaches";

interface CoachSummary {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  averageRating: number;
  totalReviews: number;
  totalSessions: number;
  isVerified: boolean;
  games: Array<{ title: string; slug: string; coverImage: string | null }>;
  minPrice: number | null;
}

interface HubResponse {
  coaches: CoachSummary[];
  pagination: { currentPage: number; totalPages: number; totalCount: number; hasNextPage: boolean };
  featured?: { topRated: CoachSummary[]; newest: CoachSummary[]; popular: CoachSummary[] };
}

export function CoachingHubContent() {
  const t = useTranslations("coaching.hub");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("rating");

  const params = new URLSearchParams({ locale, page: String(page), limit: "12", sort });
  if (search) params.set("search", search);

  const { data, isLoading } = useSWR<HubResponse>(`/api/coaching?${params}`, fetcher, { revalidateOnFocus: false });

  const handleSearch = (q: string) => { setSearch(q); setPage(1); };

  return (
    <div className="space-y-6 p-4 md:space-y-8 md:p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl dark:text-white">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
      </div>

      {/* Featured sections (page 1 only) */}
      {page === 1 && data?.featured && <FeaturedCoaches featured={data.featured} />}

      {/* Search & Sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Icon icon="lucide:search" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="glass-input w-full rounded-lg py-2.5 pl-10 pr-3 text-base"
            placeholder={t("searchPlaceholder")}
          />
        </div>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="glass-input rounded-lg px-3 py-2.5 text-sm">
          <option value="rating">{t("sortRating")}</option>
          <option value="sessions">{t("sortSessions")}</option>
          <option value="price">{t("sortPrice")}</option>
        </select>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      ) : data?.coaches.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-xl p-8 text-center">
          <Icon icon="lucide:users" className="mb-3 size-10 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("empty")}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.coaches.map((coach) => <CoachCard key={coach.id} coach={coach} />)}
          </div>
          {data && data.pagination.totalPages > 1 && (
            <Pagination currentPage={data.pagination.currentPage} totalPages={data.pagination.totalPages} totalCount={data.pagination.totalCount} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
