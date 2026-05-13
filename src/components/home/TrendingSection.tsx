"use client";

/**
 * TrendingSection : grille de 4 jeux tendances en `EditorialGameCard`.
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

import { EditorialGameCard } from "@/components/games/EditorialGameCard";
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

  const { data } = useSWR<HomeApiResponse>(`/api/home?locale=${locale}`, fetcher, {
    fallbackData: initialData,
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const trending = (data?.trending ?? []).filter(Boolean).slice(0, 4);

  return (
    <section className="editorial-home-section">
      <div className="editorial-home-section-inner">
        <div className="editorial-home-trending-header">
          <div className="editorial-home-trending-title-group">
            <KickerLabel>{t("kicker")}</KickerLabel>
            <h2 className="editorial-home-section-title">
              {t("title")}{" "}
              <span className="editorial-home-section-title-accent">{t("titleAccent")}</span>
            </h2>
          </div>
          <Link href="/trending" className="editorial-home-trending-link">
            {t("viewAll")}
            <Icon icon="mdi:arrow-top-right" className="size-4" aria-hidden />
          </Link>
        </div>

        {trending.length === 0 ? (
          <div className="editorial-home-trending-empty">{t("empty")}</div>
        ) : (
          <div className="editorial-home-trending-grid">
            {trending.map((game, index) => (
              <EditorialGameCard key={game.id} game={game} priority={index < 2} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
