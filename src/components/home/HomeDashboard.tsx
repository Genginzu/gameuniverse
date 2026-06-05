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
    <div className="editorial-home-dashboard">
      <div className="editorial-home-dashboard-inner">
        <header className="editorial-home-dashboard-hello">
          <KickerLabel>{t("kicker")}</KickerLabel>
          <h1 className="editorial-home-dashboard-hello-title">{t("title")}</h1>
          <p className="editorial-home-dashboard-hello-subtitle">{t("subtitle")}</p>
        </header>

        {/* Trending */}
        <section className="editorial-home-dashboard-block">
          <div className="editorial-home-dashboard-block-header">
            <div className="editorial-home-dashboard-block-titles">
              <KickerLabel>{t("trendingKicker")}</KickerLabel>
              <h2 className="editorial-home-dashboard-block-title">{t("trending")}</h2>
            </div>
            <Link href="/trending" className="editorial-home-trending-link">
              {t("seeAllTrending")}
              <Icon icon="mdi:arrow-top-right" className="size-4" aria-hidden />
            </Link>
          </div>

          {trending.length === 0 ? (
            <div className="editorial-home-dashboard-empty">
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
            <div className="editorial-home-dashboard-grid">
              {trending.map((game, index) => (
                <GameCard key={game.id} game={game} priority={index < 3} />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming */}
        <section className="editorial-home-dashboard-block">
          <div className="editorial-home-dashboard-block-header">
            <div className="editorial-home-dashboard-block-titles">
              <KickerLabel>{t("upcomingKicker")}</KickerLabel>
              <h2 className="editorial-home-dashboard-block-title">{t("upcoming")}</h2>
            </div>
            <Link href="/upcoming" className="editorial-home-trending-link">
              {t("seeAllUpcoming")}
              <Icon icon="mdi:arrow-top-right" className="size-4" aria-hidden />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="editorial-home-dashboard-empty">
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
            <div className="editorial-home-dashboard-grid">
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
