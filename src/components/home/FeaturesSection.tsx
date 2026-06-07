"use client";

/**
 * FeaturesSection : présentation des 6 piliers de Gamers Universe en
 * cartes éditoriales numérotées 01..06 avec halo lumineux (`SpotlightCard`).
 *
 * Pas de glassmorphism : on s'appuie uniquement sur les surfaces sombres
 * et bordures fines des composants partagés.
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { KickerLabel } from "@/components/shared/KickerLabel";
import { SpotlightCard } from "@/components/shared/SpotlightCard";

const FEATURES = [
  { key: "library", icon: "mdi:bookshelf" },
  { key: "characters", icon: "mdi:account-star" },
  { key: "community", icon: "mdi:account-group" },
  { key: "search", icon: "mdi:magnify" },
  { key: "tracking", icon: "mdi:chart-timeline-variant" },
  { key: "reviews", icon: "mdi:star-shooting" },
] as const;

export function FeaturesSection() {
  const t = useTranslations("landing.features");

  return (
    <section className="w-full px-4 py-16 md:px-8 md:py-24 lg:px-10 lg:py-28">
      <div className="mx-auto w-full max-w-[1536px]">
        <header className="mb-10 flex max-w-[720px] flex-col gap-3 md:mb-14">
          <KickerLabel>{t("kicker")}</KickerLabel>
          <h2 className="font-display text-[clamp(2rem,5vw,3.75rem)] leading-none font-bold tracking-tight text-white">
            {t("title")}{" "}
            <span className="from-neon-secondary to-neon-primary bg-gradient-to-r bg-clip-text text-transparent">
              {t("titleAccent")}
            </span>
          </h2>
          <p className="text-editorial-muted text-[0.95rem] leading-relaxed md:text-base">
            {t("description")}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <SpotlightCard key={feature.key} className="flex flex-col gap-3 p-6">
              <div className="flex items-center justify-between">
                <span className="bg-editorial-accent/15 text-editorial-accent grid size-10 place-items-center rounded-xl">
                  <Icon icon={feature.icon} className="size-5" aria-hidden />
                </span>
                <span className="text-editorial-muted font-mono text-sm">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-white">
                {t(`items.${feature.key}.title`)}
              </h3>
              <p className="text-editorial-muted text-sm leading-relaxed">
                {t(`items.${feature.key}.description`)}
              </p>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}
