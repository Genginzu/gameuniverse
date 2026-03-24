"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { useRef } from "react";
import { useInView } from "@/hooks/useInView";

const FEATURES = [
  { key: "library", icon: "mdi:bookshelf", color: "from-violet-500 to-purple-600" },
  { key: "characters", icon: "mdi:account-star", color: "from-cyan-500 to-blue-600" },
  { key: "community", icon: "mdi:account-group", color: "from-pink-500 to-rose-600" },
  { key: "search", icon: "mdi:magnify", color: "from-amber-500 to-orange-600" },
  { key: "tracking", icon: "mdi:chart-timeline-variant", color: "from-emerald-500 to-green-600" },
  { key: "reviews", icon: "mdi:star-shooting", color: "from-indigo-500 to-violet-600" },
] as const;

function FeatureCard({
  featureKey,
  icon,
  colorGradient,
  index,
}: {
  featureKey: string;
  icon: string;
  colorGradient: string;
  index: number;
}) {
  const t = useTranslations("landing.features");
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useInView(ref, { threshold: 0.2 });

  return (
    <div
      ref={ref}
      className={`glass-card group rounded-2xl p-6 transition-all duration-500 hover:scale-[1.03] ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Icon with gradient background */}
      <div className={`mb-4 inline-flex rounded-xl bg-linear-to-br ${colorGradient} p-3 shadow-lg`}>
        <Icon icon={icon} className="h-6 w-6 text-white" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
        {t(`${featureKey}.title`)}
      </h3>
      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        {t(`${featureKey}.description`)}
      </p>
    </div>
  );
}

export function FeaturesSection() {
  const t = useTranslations("landing.features");

  return (
    <section className="relative px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-14 text-center">
          <h2 className="neon-text mb-3 text-3xl font-black text-gray-900 sm:text-4xl dark:text-white">
            {t("mainTitle")}
          </h2>
          <p className="mx-auto max-w-xl text-gray-600 dark:text-gray-400">{t("mainSubtitle")}</p>
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <FeatureCard
              key={feature.key}
              featureKey={feature.key}
              icon={feature.icon}
              colorGradient={feature.color}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
