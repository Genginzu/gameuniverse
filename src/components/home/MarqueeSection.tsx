"use client";

/**
 * MarqueeSection : bandeau défilant entre le hero et les sections
 * éditoriales. Reprend les mots-clés de l'univers du site (trending,
 * esport, characters, reviews, coaching, library) en typo display.
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import { Fragment } from "react";
import { useTranslations } from "next-intl";

import { Marquee } from "@/components/shared/Marquee";

const MARQUEE_KEYS = [
  "trending",
  "esport",
  "characters",
  "reviews",
  "coaching",
  "library",
] as const;

export function MarqueeSection() {
  const t = useTranslations("landing.marquee");

  return (
    <Marquee
      className="border-editorial-line bg-editorial-bg border-y py-5"
      gapClassName="gap-12"
    >
      {MARQUEE_KEYS.map((key, idx) => (
        <Fragment key={key}>
          <span className="font-display text-[clamp(1.25rem,3vw,1.75rem)] font-semibold tracking-tight text-white uppercase">
            {t(key)}
          </span>
          <span
            className="text-neon-primary font-display text-[clamp(1.25rem,3vw,1.75rem)] leading-none"
            aria-hidden
          >
            ·
          </span>
          {idx === MARQUEE_KEYS.length - 1 && (
            <span className="font-display text-[clamp(1.25rem,3vw,1.75rem)] font-semibold tracking-tight text-white uppercase">
              {t(MARQUEE_KEYS[0])}
            </span>
          )}
        </Fragment>
      ))}
    </Marquee>
  );
}
