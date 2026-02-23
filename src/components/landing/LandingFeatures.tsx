"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaGamepad, FaSearch, FaInfoCircle } from "react-icons/fa";

const FEATURES = [
  {
    key: "library" as const,
    icon: FaGamepad,
    gradient: "from-neon-violet to-neon-cyan",
  },
  {
    key: "search" as const,
    icon: FaSearch,
    gradient: "from-neon-cyan to-neon-magenta",
  },
  {
    key: "details" as const,
    icon: FaInfoCircle,
    gradient: "from-neon-magenta to-neon-violet",
  },
];

/**
 * Features section with glass-card gaming style (neon borders, glow).
 */
export function LandingFeatures() {
  const t = useTranslations("landing");

  return (
    <section className="bg-slate-950/95 py-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="text-center">
          <h2 className="neon-text mb-6 text-4xl font-bold text-white sm:text-5xl">
            {t("features.mainTitle")}
          </h2>
          <p className="mx-auto mb-20 max-w-2xl text-lg leading-relaxed text-slate-400">
            {t("features.mainSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ key, icon: Icon, gradient }) => (
            <Card
              key={key}
              className="glass-card group rounded-2xl border-0 transition-all duration-300 hover:scale-105"
            >
              <CardHeader className="pb-6 text-center">
                <div
                  className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-xl transition-shadow duration-300 group-hover:shadow-neon-violet/30`}
                >
                  <Icon className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">
                  {t(`features.${key}.title`)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-base leading-relaxed text-slate-400">
                  {t(`features.${key}.description`)}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
