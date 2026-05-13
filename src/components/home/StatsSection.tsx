"use client";

/**
 * StatsSection : ligne de 4 statistiques XL avec animation count-up
 * au scroll. Réutilise `StatXL` (composant partagé F0-04) pour le rendu.
 *
 * L'animation est désactivée si `prefers-reduced-motion: reduce`.
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { KickerLabel } from "@/components/shared/KickerLabel";
import { StatXL } from "@/components/shared/StatXL";
import { useInView } from "@/hooks/useInView";

const STATS = [
  { key: "gamesReferenced", target: 5000, suffix: "+" },
  { key: "characters", target: 2000, suffix: "+" },
  { key: "players", target: 500, suffix: "+" },
  { key: "reviews", target: 1200, suffix: "+" },
] as const;

/** Anime un compteur de 0 vers la valeur cible quand visible. */
function useCountUp(target: number, isVisible: boolean, duration = 1800): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    // Respect prefers-reduced-motion : skip directement à la valeur cible.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setCount(target);
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, target, duration]);

  return count;
}

function AnimatedStat({
  statKey,
  target,
  suffix,
  isVisible,
}: {
  statKey: string;
  target: number;
  suffix: string;
  isVisible: boolean;
}) {
  const t = useTranslations("landing.stats");
  const count = useCountUp(target, isVisible);

  return (
    <StatXL
      value={
        <>
          {count.toLocaleString()}
          {suffix}
        </>
      }
      label={t(statKey)}
    />
  );
}

export function StatsSection() {
  const t = useTranslations("landing.stats");
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useInView(ref, { threshold: 0.3 });

  return (
    <section ref={ref} className="editorial-home-section">
      <div className="editorial-home-section-inner">
        <header className="editorial-home-section-header">
          <KickerLabel>{t("kicker")}</KickerLabel>
          <h2 className="editorial-home-section-title">
            {t("title")}{" "}
            <span className="editorial-home-section-title-accent">{t("titleAccent")}</span>
          </h2>
        </header>

        <div className="editorial-home-stats-grid">
          {STATS.map((stat) => (
            <AnimatedStat
              key={stat.key}
              statKey={stat.key}
              target={stat.target}
              suffix={stat.suffix}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
