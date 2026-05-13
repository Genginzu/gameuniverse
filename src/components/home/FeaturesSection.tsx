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
    <section className="editorial-home-section">
      <div className="editorial-home-section-inner">
        <header className="editorial-home-section-header">
          <KickerLabel>{t("kicker")}</KickerLabel>
          <h2 className="editorial-home-section-title">
            {t("title")}{" "}
            <span className="editorial-home-section-title-accent">{t("titleAccent")}</span>
          </h2>
          <p className="editorial-home-section-description">{t("description")}</p>
        </header>

        <div className="editorial-home-features-grid">
          {FEATURES.map((feature, index) => (
            <SpotlightCard key={feature.key} className="editorial-home-feature">
              <div className="flex items-center justify-between">
                <span className="editorial-home-feature-icon">
                  <Icon icon={feature.icon} className="size-5" aria-hidden />
                </span>
                <span className="editorial-home-feature-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="editorial-home-feature-title">{t(`items.${feature.key}.title`)}</h3>
              <p className="editorial-home-feature-description">
                {t(`items.${feature.key}.description`)}
              </p>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}
