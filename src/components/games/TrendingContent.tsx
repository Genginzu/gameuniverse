"use client";

import { useTranslations, useLocale } from "next-intl";

import { GameCard } from "@/components/games/GameCard";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";
import { LibraryStatusProvider } from "@/components/providers/LibraryStatusProvider";
import { useListingQuery } from "@/hooks/useListingQuery";
import { trendingListing } from "@/lib/listing/resources/games";
import type { GameSummary, TrendingGamesData } from "@/types/game";

import { TRENDING_GRID, TRENDING_SECTION_KEYS } from "./trendingGrid";
import { TrendingSectionsSkeleton } from "./TrendingSkeleton";

/** A game can appear in several trending sections: seed its status once. */
function uniqueGameIds(games: GameSummary[]): string[] {
  return [...new Set(games.filter(Boolean).map((game) => game.id))];
}

interface TrendingContentProps {
  initialData?: TrendingGamesData;
}

const SECTION_KEYS = TRENDING_SECTION_KEYS;
const GRID = TRENDING_GRID;

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
          <TrendingSectionsSkeleton />
        ) : (
          <LibraryStatusProvider
            gameIds={uniqueGameIds(SECTION_KEYS.flatMap((key) => data?.[key] ?? []))}
          >
            {SECTION_KEYS.map((key) => (
              <TrendingSection key={key} titleKey={key} games={data?.[key] ?? []} />
            ))}
          </LibraryStatusProvider>
        )}
      </EditorialContainer>
    </section>
  );
}
