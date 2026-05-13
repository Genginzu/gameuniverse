"use client";

/**
 * CtaSection : bloc final éditorial pour inciter à la création de compte.
 *
 * Design : carte sombre avec bordure fine, bordure haute en gradient
 * secondary→primary, kicker mono + titre display avec accent gradient,
 * description et 2 CTAs (signup + login).
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { KickerLabel } from "@/components/shared/KickerLabel";
import { Link } from "@/i18n/navigation";

export function CtaSection() {
  const t = useTranslations("landing.cta");

  return (
    <section className="editorial-home-section">
      <div className="editorial-home-section-inner">
        <div className="editorial-home-cta">
          <div className="editorial-home-cta-text">
            <KickerLabel>{t("kicker")}</KickerLabel>
            <h2 className="editorial-home-cta-title">
              {t("title")}{" "}
              <span className="editorial-home-section-title-accent">{t("titleAccent")}</span>
            </h2>
            <p className="editorial-home-cta-description">{t("description")}</p>
          </div>

          <div className="editorial-home-cta-actions">
            <Link href="/auth?mode=signup" className="editorial-button-primary">
              <Icon icon="mdi:rocket-launch" className="size-4" aria-hidden />
              {t("signup")}
            </Link>
            <Link href="/auth" className="editorial-button-ghost">
              {t("login")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
