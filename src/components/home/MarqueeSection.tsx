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
    <Marquee className="editorial-home-marquee" gapClassName="gap-12">
      {MARQUEE_KEYS.map((key, idx) => (
        <Fragment key={key}>
          <span className="editorial-home-marquee-item">{t(key)}</span>
          <span className="editorial-home-marquee-dot" aria-hidden>
            ·
          </span>
          {idx === MARQUEE_KEYS.length - 1 && (
            <span className="editorial-home-marquee-item">{t(MARQUEE_KEYS[0])}</span>
          )}
        </Fragment>
      ))}
    </Marquee>
  );
}
