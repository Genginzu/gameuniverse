"use client";

import dynamic from "next/dynamic";
import { useTranslations, useLocale } from "next-intl";
import { Icon } from "@iconify/react";

import { GameCard } from "@/components/games/GameCard";
import { GameCardSkeleton } from "@/components/games/GameCardSkeleton";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";
import { useListingQuery } from "@/hooks/useListingQuery";
import { upcomingListing } from "@/lib/listing/resources/games";
import type { UpcomingGamesResponse } from "@/types/game";

import { UpcomingMonthSelector } from "./UpcomingMonthSelector";

const Pagination = dynamic(() =>
  import("@/components/shared/Pagination").then((m) => m.Pagination)
);

interface UpcomingContentProps {
  initialData?: UpcomingGamesResponse;
}

const GRID =
  "grid grid-cols-2 gap-4 min-[475px]:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5 min-[1536px]:grid-cols-6";

export function UpcomingContent({ initialData }: UpcomingContentProps) {
  const t = useTranslations("upcoming");
  const locale = useLocale();
  const { filters, setFilters, setPage, data, isLoading } = useListingQuery(upcomingListing, {
    locale,
    fallbackData: initialData,
  });

  return (
    <section className="w-full">
      <EditorialContainer>
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
          <UpcomingMonthSelector
            value={filters.month}
            onChange={(month) => setFilters({ month })}
          />
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
                  onPageChange={setPage}
                  translationNamespace="pagination"
                  variant="editorial"
                />
              </div>
            )}
          </>
        )}
      </EditorialContainer>
    </section>
  );
}
