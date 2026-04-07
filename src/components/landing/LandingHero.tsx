"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";


/**
 * Hero section with dark gaming background, animated CSS grid,
 * bold typography with neon accents, and CTA buttons with neon style.
 */
export function LandingHero() {
  const t = useTranslations("landing");

  return (
    <section className="relative overflow-hidden bg-slate-950 py-24 text-white">
      {/* Animated CSS grid background — respects prefers-reduced-motion via globals.css */}
      <div className="landing-grid-bg absolute inset-0 opacity-20" />
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-slate-950/60 to-slate-950" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="text-center">
          <h1 className="neon-text mb-8 text-3xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
            {t("title")}
          </h1>
          <p className="mx-auto mb-12 max-w-3xl text-lg leading-relaxed text-slate-300 sm:text-2xl">
            {t("subtitle")}
          </p>

          {/* CTA Buttons with neon style */}
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
            <Button
              size="lg"
              className="neon-btn rounded-xl bg-neon-violet/20 px-6 py-3 font-semibold text-white transition-all duration-200 hover:scale-105 sm:px-8"
              asChild
            >
              <Link href="/auth?mode=signup">
                <Icon icon="fa:users" className="mr-3 h-5 w-5"  />
                {t("cta.signup")}
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="neon-btn rounded-xl border-2 border-neon-cyan/40 bg-transparent px-6 py-3 font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-neon-cyan/10 sm:px-8"
              asChild
            >
              <Link href="/auth?mode=signin">{t("cta.login")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
