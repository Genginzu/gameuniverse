"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";


/**
 * Bottom CTA section with dark gaming background and neon-styled buttons.
 */
export function LandingCta() {
  const t = useTranslations("landing");

  return (
    <section className="relative overflow-hidden bg-slate-950 py-24 text-white">
      <div className="absolute inset-0 bg-linear-to-br from-neon-violet/10 via-transparent to-neon-cyan/10" />

      <div className="relative mx-auto max-w-4xl px-6 text-center sm:px-8 lg:px-12">
        <h2 className="neon-text mb-6 text-4xl font-bold sm:text-5xl">{t("cta.title")}</h2>
        <p className="mb-12 text-xl leading-relaxed text-slate-300">{t("cta.subtitle")}</p>
        <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
          <Button
            size="lg"
            className="neon-btn rounded-xl bg-neon-violet/20 px-8 py-3 font-semibold text-white transition-all duration-200 hover:scale-105"
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
            className="neon-btn rounded-xl border-2 border-neon-cyan/40 bg-transparent px-8 py-3 font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-neon-cyan/10"
            asChild
          >
            <Link href="/auth?mode=signin">{t("cta.login")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
