"use client";

/**
 * HeroSection : hero éditorial de la page d'accueil (visiteurs déconnectés).
 *
 * Pattern Imba-inspired :
 *   - Image de couverture du jeu trending #1 en background plein cadre
 *   - Kicker mono uppercase
 *   - Titre display géant (police Tomorrow) avec accent gradient sur "gaming"
 *   - Visuel inline rond (cover du jeu trending) entre 2 mots du titre
 *   - Description courte + CTAs (signup + explorer)
 *
 * Réutilise `EditorialHero` (composant partagé F0-04).
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { EditorialHero, type EditorialHeroPart } from "@/components/shared/EditorialHero";
import { Link } from "@/i18n/navigation";
import type { GameSummary } from "@/types/game";

interface HeroSectionProps {
  /** Jeu trending utilisé pour l'image de fond + l'image inline du titre. */
  featuredGame?: GameSummary;
}

/** Image de fallback quand aucun jeu featured n'est dispo. */
const FALLBACK_BACKGROUND = "/assets/no-cover.png";

export function HeroSection({ featuredGame }: HeroSectionProps) {
  const t = useTranslations("landing.hero");

  const backgroundImage =
    featuredGame?.backgroundImage || featuredGame?.coverImage || FALLBACK_BACKGROUND;
  const backgroundAlt = featuredGame
    ? `${t("imageAlt")} — ${featuredGame.title}`
    : t("fallbackBackgroundAlt");

  const inlineImage = featuredGame?.coverImage;

  const parts: EditorialHeroPart[] = [
    { type: "text", value: t("titlePart1") },
    { type: "text", value: t("titlePart2") },
    ...(inlineImage
      ? [{ type: "image" as const, src: inlineImage, alt: featuredGame?.title ?? t("imageAlt") }]
      : []),
    { type: "text", value: t("titlePart3"), accent: true },
    { type: "break" },
    { type: "text", value: t("titlePart4") },
  ];

  return (
    <EditorialHero
      kicker={t("kicker")}
      parts={parts}
      description={t("description")}
      backgroundImage={backgroundImage}
      backgroundAlt={backgroundAlt}
      ctas={
        <>
          <Link href="/auth?mode=signup" className="editorial-button-primary">
            <Icon icon="mdi:rocket-launch" className="size-4" aria-hidden />
            {t("ctaSignup")}
          </Link>
          <Link href="/games" className="editorial-button-ghost">
            <Icon icon="mdi:gamepad-variant" className="size-4" aria-hidden />
            {t("ctaExplore")}
          </Link>
        </>
      }
    />
  );
}
