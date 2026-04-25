"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { EntityCard, gameCardConfig } from "@/components/shared";
import { GridSkeleton } from "@/components/shared/GridSkeleton";
import { gameSkeletonConfig } from "@/components/shared/EntitySkeleton";
import { Pagination } from "@/components/shared/Pagination";
import { Icon } from "@iconify/react";
import type { GameSummary } from "@/types/game";

interface UpcomingResponse {
  games: GameSummary[];
  pagination: { currentPage: number; totalPages: number; totalCount: number };
}

function MonthSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTranslations("upcoming");
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange("")}
        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
          !value
            ? "bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        }`}
      >
        {t("allMonths")}
      </button>
      {months.map((m) => {
        const [y, mo] = m.split("-");
        const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString("fr", { month: "short", year: "numeric" });
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              value === m
                ? "bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function UpcomingContent() {
  const t = useTranslations("upcoming");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState("");

  const params = new URLSearchParams({ locale, page: String(page), limit: "24" });
  if (month) params.set("month", month);

  const { data, isLoading } = useSWR<UpcomingResponse>(
    `/api/games/upcoming?${params}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const handleMonthChange = (m: string) => { setMonth(m); setPage(1); };

  return (
    <div className="space-y-6 p-4 md:space-y-8 md:p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
      </div>

      <MonthSelector value={month} onChange={handleMonthChange} />

      {data && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("count", { count: data.pagination.totalCount })}
        </p>
      )}

      {isLoading ? (
        <GridSkeleton count={12} gridClassName="grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" skeletonConfig={gameSkeletonConfig} />
      ) : data?.games.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-xl p-8 text-center">
          <Icon icon="lucide:calendar-x" className="mb-3 size-10 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("empty")}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 xs:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
            {data?.games.filter(Boolean).map((game) => (
              <EntityCard key={game.id} entity={game} config={gameCardConfig} />
            ))}
          </div>
          {data && data.pagination.totalPages > 1 && (
            <Pagination
              currentPage={data.pagination.currentPage}
              totalPages={data.pagination.totalPages}
              totalCount={data.pagination.totalCount}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
