"use client";

/**
 * StatsSection : 4 compteurs réels (jeux, personnages, joueurs, avis) issus
 * du payload ISR `/api/home`, animés en count-up au scroll.
 *
 * La valeur finale formatée selon la locale est toujours présente dans le
 * HTML (texte `sr-only`) pour les crawlers et lecteurs d'écran ; le chiffre
 * animé est purement visuel. Animation coupée si `prefers-reduced-motion`.
 */

import { useRef } from "react";
import { useLocale, useTranslations } from "next-intl";

import { KickerLabel } from "@/components/shared/KickerLabel";
import { StatXL } from "@/components/shared/StatXL";
import { useCountUp } from "@/hooks/useCountUp";
import { useInView } from "@/hooks/useInView";
import type { HomeStats } from "@/types/home";

const STAT_LABELS: Record<keyof HomeStats, string> = {
  games: "gamesReferenced",
  characters: "characters",
  players: "players",
  reviews: "reviews",
};

const STAT_ORDER: (keyof HomeStats)[] = ["games", "characters", "players", "reviews"];

interface AnimatedStatProps {
  label: string;
  target: number;
  isVisible: boolean;
  formatter: Intl.NumberFormat;
}

function AnimatedStat({ label, target, isVisible, formatter }: AnimatedStatProps) {
  const count = useCountUp(target, isVisible);

  return (
    <StatXL
      value={
        <>
          <span aria-hidden="true">{formatter.format(count)}</span>
          <span className="sr-only">{formatter.format(target)}</span>
        </>
      }
      label={label}
    />
  );
}

interface StatsSectionProps {
  stats: HomeStats;
}

export function StatsSection({ stats }: StatsSectionProps) {
  const t = useTranslations("landing.stats");
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useInView(ref, { threshold: 0.3 });
  const formatter = new Intl.NumberFormat(locale);

  return (
    <section
      ref={ref}
      data-testid="home-stats"
      className="w-full px-4 py-16 md:px-8 md:py-24 lg:px-10 lg:py-28"
    >
      <div className="mx-auto w-full max-w-[1536px]">
        <header className="mb-10 flex max-w-[720px] flex-col gap-3 md:mb-14">
          <KickerLabel>{t("kicker")}</KickerLabel>
          <h2 className="font-display text-[clamp(2rem,5vw,3.75rem)] leading-none font-bold tracking-tight text-white">
            {t("title")}{" "}
            <span className="from-neon-secondary to-neon-primary bg-gradient-to-r bg-clip-text text-transparent">
              {t("titleAccent")}
            </span>
          </h2>
        </header>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {STAT_ORDER.map((key) => (
            <AnimatedStat
              key={key}
              label={t(STAT_LABELS[key])}
              target={stats[key]}
              isVisible={isVisible}
              formatter={formatter}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
