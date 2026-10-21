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
import { GHOST_CTA_CLASS, PRIMARY_CTA_CLASS } from "./landingButtonClasses";

export function CtaSection() {
  const t = useTranslations("landing.cta");

  return (
    <section className="w-full px-4 py-16 md:px-8 md:py-24 lg:px-10 lg:py-28">
      <div className="mx-auto w-full max-w-[1536px]">
        <div className="border-editorial-line bg-editorial-2 relative flex flex-col gap-8 overflow-hidden rounded-3xl border p-8 md:p-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="from-neon-secondary to-neon-primary absolute inset-x-0 top-0 h-px bg-gradient-to-r" />
          <div className="flex flex-col gap-3">
            <KickerLabel>{t("kicker")}</KickerLabel>
            <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-none font-bold tracking-tight text-white">
              {t("title")}{" "}
              <span className="from-neon-secondary to-neon-primary bg-gradient-to-r bg-clip-text text-transparent">
                {t("titleAccent")}
              </span>
            </h2>
            <p className="text-editorial-muted max-w-[60ch] text-[0.95rem] leading-relaxed md:text-base">
              {t("description")}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link href="/auth?mode=signup" className={PRIMARY_CTA_CLASS}>
              <Icon icon="mdi:rocket-launch" className="size-4" aria-hidden />
              {t("signup")}
            </Link>
            <Link href="/games" className={GHOST_CTA_CLASS}>
              <Icon icon="mdi:gamepad-variant" className="size-4" aria-hidden />
              {t("explore")}
            </Link>
            <Link
              href="/auth"
              className="text-editorial-muted inline-flex min-h-11 items-center justify-center px-2 text-sm underline-offset-4 hover:text-white hover:underline"
            >
              {t("login")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
