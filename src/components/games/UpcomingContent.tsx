"use client";

/**
 * UpcomingContent : page Prochaines sorties (`/upcoming`) au look éditorial.
 *
 * Conserve la logique métier (SWR + ISR fallbackData, filtre par mois,
 * pagination). Style : Tailwind inline + tokens éditoriaux, grille de
 * `GameCard`, skeletons éditoriaux.
 */

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations, useLocale } from "next-intl";
import useSWR from "swr";
import { Icon } from "@iconify/react";

import { fetcher } from "@/lib/swr/fetcher";
import { GameCard } from "@/components/games/GameCard";
import { GameCardSkeleton } from "@/components/games/GameCardSkeleton";
import { KickerLabel } from "@/components/shared/KickerLabel";
import type { GameSummary } from "@/types/game";

const Pagination = dynamic(() =>
  import("@/components/shared/Pagination").then((m) => m.Pagination)
);

export interface UpcomingResponse {
  games: GameSummary[];
  pagination: { currentPage: number; totalPages: number; totalCount: number };
}

interface UpcomingContentProps {
  initialData?: UpcomingResponse;
}

const GRID =
  "grid grid-cols-2 gap-4 min-[475px]:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5 min-[1536px]:grid-cols-6";

function MonthSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTranslations("upcoming");
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
      active
        ? "border-transparent bg-editorial-accent/15 text-editorial-accent"
        : "border-editorial-line text-editorial-muted hover:border-white/30 hover:text-white"
    }`;

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => onChange("")} className={chip(!value)}>
        {t("allMonths")}
      </button>
      {months.map((m) => {
        const [y, mo] = m.split("-");
        const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString(undefined, {
          month: "short",
          year: "numeric",
        });
        return (
          <button key={m} onClick={() => onChange(m)} className={chip(value === m)}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function UpcomingContent({ initialData }: UpcomingContentProps) {
  const t = useTranslations("upcoming");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState("");

  const params = new URLSearchParams({ locale, page: String(page), limit: "24" });
  if (month) params.set("month", month);

  const isDefaultView = page === 1 && !month;
  const fallbackData = isDefaultView ? initialData : undefined;

  const { data, isLoading } = useSWR<UpcomingResponse>(`/api/games/upcoming?${params}`, fetcher, {
    fallbackData,
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const handleMonthChange = (m: string) => {
    setMonth(m);
    setPage(1);
  };

  const handlePageChange = (p: number) => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    setPage(p);
  };

  return (
    <section className="w-full">
      <div className="mx-auto max-w-[1536px] px-4 pt-8 pb-16 md:px-8 md:pt-12 md:pb-20">
        <header className="mb-8 flex flex-col gap-3">
          <KickerLabel>{t("kicker")}</KickerLabel>
          <h1 className="font-display text-[clamp(2rem,4vw+1rem,3.5rem)] leading-[1.05] font-bold tracking-tight text-white">
            {t("title")}
          </h1>
          <p className="text-editorial-muted flex flex-wrap items-baseline gap-5 text-sm">
            <span>{t("subtitle")}</span>
            {data && (
              <>
                <span>·</span>
                <span className="text-editorial-accent font-mono">
                  {t("count", { count: data.pagination.totalCount })}
                </span>
              </>
            )}
          </p>
        </header>

        <div className="mb-8">
          <MonthSelector value={month} onChange={handleMonthChange} />
        </div>

        {isLoading ? (
          <div className={GRID}>
            {Array.from({ length: 12 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))}
          </div>
        ) : data && data.games.length === 0 ? (
          <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-4 rounded-3xl border px-8 py-16 text-center">
            <div className="bg-editorial-accent/15 text-editorial-accent grid size-14 place-items-center rounded-full">
              <Icon icon="lucide:calendar-x" className="h-6 w-6" />
            </div>
            <p className="text-editorial-muted max-w-[50ch]">{t("empty")}</p>
          </div>
        ) : (
          <>
            <div className={GRID}>
              {data?.games.filter(Boolean).map((game, i) => (
                <GameCard key={game.id} game={game} priority={i < 6} />
              ))}
            </div>
            {data && data.pagination.totalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={data.pagination.currentPage}
                  totalPages={data.pagination.totalPages}
                  totalCount={data.pagination.totalCount}
                  onPageChange={handlePageChange}
                  translationNamespace="pagination"
                  variant="editorial"
                />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
