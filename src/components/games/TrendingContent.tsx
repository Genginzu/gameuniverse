"use client";

import { useTranslations, useLocale } from "next-intl";

import { GameCard } from "@/components/games/GameCard";
import { GameCardSkeleton } from "@/components/games/GameCardSkeleton";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";
import { useListingQuery } from "@/hooks/useListingQuery";
import { trendingListing } from "@/lib/listing/resources/games";
import type { GameSummary, TrendingGamesData } from "@/types/game";

interface TrendingContentProps {
  initialData?: TrendingGamesData;
}

const SECTION_KEYS = ["mostViewed", "mostPopular", "bestRated", "recentlyAdded"] as const;

const GRID =
  "grid grid-cols-2 gap-4 min-[475px]:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5 min-[1536px]:grid-cols-6";

function TrendingSection({ titleKey, games }: { titleKey: string; games: GameSummary[] }) {
  const t = useTranslations("trending");

  if (games.length === 0) return null;

  return (
    <section className="mb-12 md:mb-16">
      <header className="mb-6 flex items-baseline gap-4">
        <h2 className="font-display text-2xl font-bold tracking-tight text-white">
          {t(`sections.${titleKey}`)}
        </h2>
        <span className="text-editorial-accent font-mono text-sm">
          {t("count", { count: games.length })}
        </span>
      </header>
      <div className={GRID}>
        {games.filter(Boolean).map((game, i) => (
          <GameCard key={game.id} game={game} priority={i < 6} />
        ))}
      </div>
    </section>
  );
}

function TrendingSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, s) => (
        <section key={s} className="mb-12 md:mb-16">
          <div className="mb-6 h-7 w-48 animate-pulse rounded bg-white/10" />
          <div className={GRID}>
            {Array.from({ length: 6 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

export function TrendingContent({ initialData }: TrendingContentProps) {
  const t = useTranslations("trending");
  const locale = useLocale();

  const { data, isLoading } = useListingQuery(trendingListing, {
    locale,
    fallbackData: initialData,
  });

  return (
    <section className="w-full">
      <EditorialContainer>
        <header className="mb-12 flex flex-col gap-3">
          <KickerLabel>{t("kicker")}</KickerLabel>
          <h1 className="font-display text-[clamp(2rem,4vw+1rem,3.5rem)] leading-[1.05] font-bold tracking-tight text-white">
            {t("title")}
          </h1>
          <p className="text-editorial-muted max-w-[60ch] text-base">{t("subtitle")}</p>
        </header>

        {isLoading ? (
          <TrendingSkeleton />
        ) : (
          SECTION_KEYS.map((key) => (
            <TrendingSection key={key} titleKey={key} games={data?.[key] ?? []} />
          ))
        )}
      </EditorialContainer>
    </section>
  );
}
