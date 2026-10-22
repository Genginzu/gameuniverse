"use client";

/**
 * HeroSection : hero éditorial de la page d'accueil (visiteurs déconnectés).
 *
 *   - Illustration statique de la marque en fond plein cadre (amis qui jouent ensemble)
 *   - Kicker mono uppercase
 *   - Titre display géant avec accent gradient sur "gaming"
 *   - Description courte + CTAs (signup + explorer)
 *
 * Réutilise `EditorialHero` (composant partagé F0-04).
 */

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { EditorialHero, type EditorialHeroPart } from "@/components/shared/EditorialHero";
import { Link } from "@/i18n/navigation";
import { GHOST_CTA_CLASS, PRIMARY_CTA_CLASS } from "./landingButtonClasses";

const HERO_BACKGROUND = "/assets/home-hero.webp";

export function HeroSection() {
  const t = useTranslations("landing.hero");

  const parts: EditorialHeroPart[] = [
    { type: "text", value: t("titlePart1") },
    { type: "text", value: t("titlePart2") },
    { type: "break" },
    { type: "text", value: t("titlePart3"), accent: true },
    { type: "break" },
    { type: "text", value: t("titlePart4") },
  ];

  return (
    <EditorialHero
      kicker={t("kicker")}
      parts={parts}
      description={t("description")}
      backgroundImage={HERO_BACKGROUND}
      backgroundAlt={t("backgroundAlt")}
      ctas={
        <>
          <Link href="/auth?mode=signup" className={PRIMARY_CTA_CLASS}>
            <Icon icon="mdi:rocket-launch" className="size-4" aria-hidden />
            {t("ctaSignup")}
          </Link>
          <Link href="/games" className={GHOST_CTA_CLASS}>
            <Icon icon="mdi:gamepad-variant" className="size-4" aria-hidden />
            {t("ctaExplore")}
          </Link>
        </>
      }
    />
  );
}
