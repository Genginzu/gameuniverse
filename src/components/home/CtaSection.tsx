"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { useRef } from "react";
import { useInView } from "@/hooks/useInView";

export function CtaSection() {
  const t = useTranslations("landing.cta");
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useInView(ref, { threshold: 0.3 });

  return (
    <section ref={ref} className="relative px-4 py-20 sm:px-6 lg:px-8">
      <div
        className={`glass mx-auto max-w-4xl overflow-hidden rounded-3xl transition-all duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        {/* Gradient accent top border */}
        <div className="h-1 w-full bg-linear-to-r from-palette-secondary-500 to-palette-primary-500" />

        <div className="relative px-6 py-14 text-center sm:px-12">
          {/* Background orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-palette-primary-500/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-palette-secondary-500/10 blur-3xl" />
          </div>

          <div className="relative z-10">
            <Icon
              icon="mdi:controller"
              className="mx-auto mb-4 h-12 w-12 text-palette-primary-500 dark:text-palette-primary-400"
            />
            <h2 className="neon-text mb-3 text-3xl font-black text-gray-900 sm:text-4xl dark:text-white">
              {t("title")}
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-gray-600 dark:text-gray-400">
              {t("subtitle")}
            </p>
            <Link
              href="/auth?mode=signup"
              className="group inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-palette-primary-500/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-palette-primary-500/30"
            >
              <Icon
                icon="mdi:rocket-launch"
                className="h-5 w-5 transition-transform group-hover:-translate-y-0.5"
              />
              {t("signup")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
