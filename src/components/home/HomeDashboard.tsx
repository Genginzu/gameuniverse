"use client";

/**
 * HomeDashboard : page d'accueil pour les utilisateurs connectés.
 *
 * Refonte éditoriale :
 *   - Header sobre (kicker + titre display)
 *   - Section Trending : grille `GameCard`
 *   - Section Upcoming : grille `GameCard` (cohérence avec Trending)
 *
 * Pas de glassmorphism, surfaces sombres `--editorial-bg-*`, accent
 * dynamique disponible via `--accent-rgb` (fallback `--neon-primary`).
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

interface HomeDashboardProps {
  /** Données initiales hydratées server-side via ISR. */
  initialData?: HomeApiResponse;
}

const DASHBOARD_GRID =
  "grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5 min-[1536px]:grid-cols-6 min-[1536px]:gap-5";

export function HomeDashboard({ initialData }: HomeDashboardProps) {
  const t = useTranslations("homeDashboard");
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

  const trending = (data?.trending ?? []).filter(Boolean).slice(0, 6);
  const upcoming = (data?.upcoming ?? []).filter(Boolean).slice(0, 6);
  const isFetching = isLoading || isValidating;

  return (
    <div className="bg-editorial-bg min-h-[calc(100vh-64px)] px-4 pt-12 pb-20 text-white md:px-8 md:pt-16 md:pb-24 lg:px-10 lg:pt-20 lg:pb-28">
      <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-14">
        <header className="flex flex-col gap-3">
          <KickerLabel>{t("kicker")}</KickerLabel>
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-none font-bold tracking-tight text-white">
            {t("title")}
          </h1>
          <p className="text-editorial-muted text-base">{t("subtitle")}</p>
        </header>

        {/* Trending */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <KickerLabel>{t("trendingKicker")}</KickerLabel>
              <h2 className="font-display text-[clamp(1.5rem,3vw,2rem)] leading-tight font-semibold text-white">
                {t("trending")}
              </h2>
            </div>
            <Link
              href="/trending"
              className="text-editorial-accent border-editorial-accent/50 inline-flex min-h-11 items-center gap-2 border-b pb-1 font-mono text-xs tracking-[0.16em] uppercase transition-colors hover:border-white hover:text-white"
            >
              {t("seeAllTrending")}
              <Icon icon="mdi:arrow-top-right" className="size-4" aria-hidden />
            </Link>
          </div>

          {trending.length === 0 ? (
            <div className="border-editorial-line text-editorial-muted flex min-h-24 items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center text-sm">
              {isFetching ? (
                <Icon
                  icon="mdi:loading"
                  className="size-6 animate-spin text-[color:var(--editorial-muted)]"
                  aria-label={t("trendingKicker")}
                />
              ) : (
                t("noTrending")
              )}
            </div>
          ) : (
            <div className={DASHBOARD_GRID}>
              {trending.map((game, index) => (
                <GameCard key={game.id} game={game} priority={index < 3} />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <KickerLabel>{t("upcomingKicker")}</KickerLabel>
              <h2 className="font-display text-[clamp(1.5rem,3vw,2rem)] leading-tight font-semibold text-white">
                {t("upcoming")}
              </h2>
            </div>
            <Link
              href="/upcoming"
              className="text-editorial-accent border-editorial-accent/50 inline-flex min-h-11 items-center gap-2 border-b pb-1 font-mono text-xs tracking-[0.16em] uppercase transition-colors hover:border-white hover:text-white"
            >
              {t("seeAllUpcoming")}
              <Icon icon="mdi:arrow-top-right" className="size-4" aria-hidden />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="border-editorial-line text-editorial-muted flex min-h-24 items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center text-sm">
              {isFetching ? (
                <Icon
                  icon="mdi:loading"
                  className="size-6 animate-spin text-[color:var(--editorial-muted)]"
                  aria-label={t("upcomingKicker")}
                />
              ) : (
                t("noUpcoming")
              )}
            </div>
          ) : (
            <div className={DASHBOARD_GRID}>
              {upcoming.map((game, index) => (
                <GameCard key={game.id} game={game} priority={index < 3} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
