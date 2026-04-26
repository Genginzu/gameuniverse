"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { useRef, useState, useEffect } from "react";
import { useInView } from "@/hooks/useInView";

const STATS = [
  { key: "gamesReferenced", icon: "mdi:gamepad-variant", target: 5000, suffix: "+" },
  { key: "characters", icon: "mdi:account-star", target: 2000, suffix: "+" },
  { key: "players", icon: "mdi:account-group", target: 500, suffix: "+" },
  { key: "reviews", icon: "mdi:star", target: 1200, suffix: "+" },
] as const;

/** Animates a number from 0 to target when visible */
function useCountUp(target: number, isVisible: boolean, duration = 2000): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, target, duration]);

  return count;
}

function StatCard({
  statKey,
  icon,
  target,
  suffix,
  isVisible,
  index,
}: {
  statKey: string;
  icon: string;
  target: number;
  suffix: string;
  isVisible: boolean;
  index: number;
}) {
  const t = useTranslations("landing.stats");
  const count = useCountUp(target, isVisible);

  return (
    <div
      className={`glass-card flex flex-col items-center rounded-2xl p-6 text-center transition-all duration-500 sm:p-8 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div className="from-palette-secondary-500 to-palette-primary-500 mb-3 inline-flex rounded-xl bg-linear-to-br p-3">
        <Icon icon={icon} className="h-6 w-6 text-white" />
      </div>
      <span className="mb-1 text-3xl font-black text-gray-900 sm:text-4xl dark:text-white">
        {count.toLocaleString()}
        {suffix}
      </span>
      <span className="text-sm text-gray-600 dark:text-gray-400">{t(statKey)}</span>
    </div>
  );
}

export function StatsSection() {
  const t = useTranslations("landing.stats");
  const sectionRef = useRef<HTMLDivElement>(null);
  const isVisible = useInView(sectionRef, { threshold: 0.3 });

  return (
    <section ref={sectionRef} className="relative px-4 py-20 sm:px-6 lg:px-8">
      {/* Background accent */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-palette-primary-500/5 dark:bg-palette-primary-500/10 absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Section header */}
        <div className="mb-12 text-center">
          <h2 className="neon-text mb-3 text-3xl font-black text-gray-900 sm:text-4xl dark:text-white">
            {t("title")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{t("subtitle")}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {STATS.map((stat, index) => (
            <StatCard
              key={stat.key}
              statKey={stat.key}
              icon={stat.icon}
              target={stat.target}
              suffix={stat.suffix}
              isVisible={isVisible}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
