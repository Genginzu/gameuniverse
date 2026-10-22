"use client";

/**
 * PreviewBlock : un pilier du landing = texte + mockup visuel.
 *
 * Mobile : empilé (texte puis visuel). Desktop (`lg:`) : deux colonnes,
 * alternées via `reverse`. Un seul lien discret vers le catalogue public :
 * l'inscription est portée par le hero et le CTA final.
 */

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { KickerLabel } from "@/components/shared/KickerLabel";
import { Link } from "@/i18n/navigation";
import { PreviewFrame } from "./PreviewFrame";

export type PreviewKey = "library" | "characters" | "community" | "search" | "tracking" | "reviews";

interface PreviewBlockProps {
  previewKey: PreviewKey;
  index: number;
  icon: string;
  exploreHref: string;
  reverse?: boolean;
  children: ReactNode;
}

export function PreviewBlock({
  previewKey,
  index,
  icon,
  exploreHref,
  reverse = false,
  children,
}: PreviewBlockProps) {
  const t = useTranslations("landing.previews");
  const number = String(index + 1).padStart(2, "0");

  return (
    <article
      data-testid={`home-preview-${previewKey}`}
      className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16"
    >
      <div className={`flex min-w-0 flex-col gap-4 ${reverse ? "lg:order-2" : ""}`.trim()}>
        <div className="flex items-center gap-3">
          <span className="bg-editorial-accent/15 text-editorial-accent grid size-11 place-items-center rounded-xl">
            <Icon icon={icon} className="size-5" aria-hidden />
          </span>
          <span className="text-editorial-muted font-mono text-sm">{number}</span>
          <KickerLabel as="span">{t(`items.${previewKey}.kicker`)}</KickerLabel>
        </div>
        <h3 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-tight font-bold tracking-tight text-white">
          {t(`items.${previewKey}.title`)}
        </h3>
        <p className="text-editorial-muted max-w-[56ch] text-base leading-relaxed">
          {t(`items.${previewKey}.description`)}
        </p>
        <Link
          href={exploreHref}
          className="text-editorial-accent border-editorial-accent/50 mt-2 inline-flex min-h-11 items-center gap-2 self-start border-b pb-1 font-mono text-sm tracking-[0.12em] uppercase transition-colors hover:border-white hover:text-white"
        >
          {t(`items.${previewKey}.explore`)}
          <Icon icon="mdi:arrow-top-right" className="size-4" aria-hidden />
        </Link>
      </div>

      <div className={`min-w-0 ${reverse ? "lg:order-1" : ""}`.trim()}>
        <PreviewFrame>{children}</PreviewFrame>
      </div>
    </article>
  );
}
