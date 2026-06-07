"use client";

/**
 * TrendingSection : grille de 4 jeux tendances en `GameCard`.
 *
 * Remplace l'ancien `RecentGamesSection`. Branchée sur l'API `/api/home`
 * (qui retourne `trending` + `upcoming`). Données initiales hydratées
 * via `fallbackData` SWR pour rendu immédiat (ISR).
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import useSWR from "swr";

import { GameCard } from "@/components/games/GameCard";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { fetcher } from "@/lib/swr/fetcher";
import { Link } from "@/i18n/navigation";
import type { GameSummary } from "@/types/game";

interface HomeApiResponse {
  trending: GameSummary[];
  upcoming: GameSummary[];
}

interface TrendingSectionProps {
  initialData?: HomeApiResponse;
}

export function TrendingSection({ initialData }: TrendingSectionProps) {
  const t = useTranslations("landing.trending");
  const locale = useLocale();

  const { data, isLoading, isValidating } = useSWR<HomeApiResponse>(
    `/api/home?locale=${locale}`,
    fetcher,
    {
      fallbackData: initialData,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const trending = (data?.trending ?? []).filter(Boolean).slice(0, 4);
  const isFetching = isLoading || isValidating;

  return (
    <section className="w-full px-4 py-16 md:px-8 md:py-24 lg:px-10 lg:py-28">
      <div className="mx-auto w-full max-w-[1536px]">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
          <div className="flex flex-col gap-3">
            <KickerLabel>{t("kicker")}</KickerLabel>
            <h2 className="font-display text-[clamp(2rem,5vw,3.75rem)] leading-none font-bold tracking-tight text-white">
              {t("title")}{" "}
              <span className="from-neon-secondary to-neon-primary bg-gradient-to-r bg-clip-text text-transparent">
                {t("titleAccent")}
              </span>
            </h2>
          </div>
          <Link
            href="/trending"
            className="text-editorial-accent border-editorial-accent/50 inline-flex min-h-11 items-center gap-2 border-b pb-1 font-mono text-xs tracking-[0.16em] uppercase transition-colors hover:border-white hover:text-white"
          >
            {t("viewAll")}
            <Icon icon="mdi:arrow-top-right" className="size-4" aria-hidden />
          </Link>
        </div>

        {trending.length === 0 ? (
          <div className="border-editorial-line text-editorial-muted flex min-h-24 items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center text-sm">
            {isFetching ? (
              <Icon
                icon="mdi:loading"
                className="size-6 animate-spin text-[color:var(--editorial-muted)]"
                aria-label={t("kicker")}
              />
            ) : (
              t("empty")
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {trending.map((game, index) => (
              <GameCard key={game.id} game={game} priority={index < 2} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
