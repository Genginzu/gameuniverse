"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";

/** Floating animated orbs for the hero background */
function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Large violet orb */}
      <div className="absolute -top-32 -left-32 h-96 w-96 animate-[float_8s_ease-in-out_infinite] rounded-full bg-palette-primary-500/20 blur-3xl dark:bg-palette-primary-500/10" />
      {/* Cyan orb */}
      <div className="absolute top-1/4 -right-20 h-72 w-72 animate-[float_6s_ease-in-out_infinite_reverse] rounded-full bg-palette-secondary-500/20 blur-3xl dark:bg-palette-secondary-500/10" />
      {/* Small magenta orb */}
      <div className="absolute bottom-10 left-1/3 h-56 w-56 animate-[float_10s_ease-in-out_infinite] rounded-full bg-pink-500/15 blur-3xl dark:bg-pink-500/8" />
      {/* Grid pattern overlay */}
      <div className="landing-grid-bg absolute inset-0" />
    </div>
  );
}

export function HeroSection() {
  const t = useTranslations("landing");

  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
      <FloatingOrbs />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Main title with gradient highlight */}
        <h1 className="animate-slide-in-up mb-6 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl lg:text-7xl dark:text-white">
          {t("title")}{" "}
          <span className="bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 bg-clip-text text-transparent">
            {t("titleHighlight")}
          </span>
          <br />
          {t("titleEnd")}
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in mx-auto mb-10 max-w-2xl text-lg text-gray-600 sm:text-xl dark:text-gray-400">
          {t("subtitle")}
        </p>

        {/* CTA buttons */}
        <div className="animate-fade-in flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/auth?mode=signup"
            className="group inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-palette-primary-500/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-palette-primary-500/30"
          >
            <Icon
              icon="mdi:rocket-launch"
              className="h-5 w-5 transition-transform group-hover:-translate-y-0.5"
            />
            {t("cta.signup")}
          </Link>
          <Link
            href="/games"
            className="neon-btn inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-lg font-semibold text-gray-900 transition-all duration-300 hover:scale-105 dark:text-white"
          >
            <Icon icon="mdi:gamepad-variant" className="h-5 w-5" />
            {t("cta.explore")}
          </Link>
        </div>
      </div>
    </section>
  );
}
