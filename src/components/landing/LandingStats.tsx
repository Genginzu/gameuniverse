"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@iconify/react";


const STATS = [
  {
    key: "gamesReferenced" as const,
    value: "10,000+",
    icon: "fa:gamepad",
    color: "text-neon-secondary",
  },
  {
    key: "ratings" as const,
    value: "50,000+",
    icon: "fa:star",
    color: "text-neon-primary",
  },
  {
    key: "newGamesPerMonth" as const,
    value: "1,000+",
    icon: "fa:chart-line",
    color: "text-neon-accent",
  },
];

/**
 * Stats section with neon glow counters and colored gaming icons.
 */
export function LandingStats() {
  const t = useTranslations("landing");

  return (
    <section className="bg-slate-900/95 py-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="mb-16 text-center">
          <h2 className="neon-text mb-4 text-4xl font-bold text-white sm:text-5xl">
            {t("stats.title")}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">{t("stats.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {STATS.map(({ key, value, icon, color }) => (
            <Card
              key={key}
              className="glass-card group rounded-2xl border-0 text-center transition-all duration-300 hover:scale-105"
            >
              <CardContent className="p-8">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-xl bg-slate-800/60">
                  <Icon icon={icon} className={`h-10 w-10 ${color}`} />
                </div>
                <div className="neon-text mb-2 text-4xl font-bold text-white">{value}</div>
                <div className="text-lg text-slate-400">{t(`stats.${key}`)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
