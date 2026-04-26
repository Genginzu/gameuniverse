"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";

/**
 * Bottom CTA section with dark gaming background and neon-styled buttons.
 */
export function LandingCta() {
  const t = useTranslations("landing");

  return (
    <section className="relative overflow-hidden bg-slate-950 py-24 text-white">
      <div className="from-neon-primary/10 to-neon-secondary/10 absolute inset-0 bg-linear-to-br via-transparent" />

      <div className="relative mx-auto max-w-4xl px-6 text-center sm:px-8 lg:px-12">
        <h2 className="neon-text mb-6 text-3xl font-bold sm:text-4xl sm:text-5xl">
          {t("cta.title")}
        </h2>
        <p className="mb-12 text-lg leading-relaxed text-slate-300 sm:text-xl">
          {t("cta.subtitle")}
        </p>
        <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
          <Button
            size="lg"
            className="neon-btn bg-neon-primary/20 rounded-xl px-6 py-3 font-semibold text-white transition-all duration-200 hover:scale-105 sm:px-8"
            asChild
          >
            <Link href="/auth?mode=signup">
              <Icon icon="fa:users" className="mr-3 h-5 w-5" />
              {t("cta.signup")}
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="neon-btn border-neon-secondary/40 hover:bg-neon-secondary/10 rounded-xl border-2 bg-transparent px-6 py-3 font-semibold text-white transition-all duration-200 hover:scale-105 sm:px-8"
            asChild
          >
            <Link href="/auth?mode=signin">{t("cta.login")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
