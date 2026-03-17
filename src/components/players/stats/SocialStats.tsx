"use client";

import { useTranslations } from "next-intl";
import { Users, MessageCircle, Heart, FolderOpen } from "lucide-react";
import type { SocialStatsData } from "@/types/dashboard-stats";
import { formatLocalizedNumber } from "@/lib/utils/statsFormatters";
import { StatsEmptyState } from "@/components/players/stats/StatsEmptyState";
import { StatsSectionTitle } from "@/components/players/stats/StatsSectionTitle";
import type { ReactNode } from "react";

interface SocialStatsProps {
  social: SocialStatsData;
  locale: string;
}

interface SocialMetricCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  iconColorClass: string;
}

function SocialMetricCard({ icon, label, value, iconColorClass }: SocialMetricCardProps) {
  return (
    <div className="glass-card flex items-center gap-3 rounded-xl p-4 transition-all duration-300">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconColorClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-gray-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export function SocialStats({ social, locale }: SocialStatsProps) {
  const t = useTranslations("playerStats");

  const isEmpty =
    social.friendsCount === 0 &&
    social.commentsCount === 0 &&
    social.favoritesCount === 0 &&
    social.collectionsCount === 0;

  if (isEmpty) {
    return (
      <section>
        <StatsSectionTitle>{t("social.title")}</StatsSectionTitle>
        <StatsEmptyState icon={<Users className="h-8 w-8" />} message={t("social.empty")} />
      </section>
    );
  }

  const cards = [
    {
      icon: <Users className="h-5 w-5" />,
      label: t("social.friends"),
      value: formatLocalizedNumber(social.friendsCount, locale),
      iconColorClass: "bg-neon-violet/20 text-neon-violet",
    },
    {
      icon: <MessageCircle className="h-5 w-5" />,
      label: t("social.comments"),
      value: formatLocalizedNumber(social.commentsCount, locale),
      iconColorClass: "bg-neon-cyan/20 text-neon-cyan",
    },
    {
      icon: <Heart className="h-5 w-5" />,
      label: t("social.favorites"),
      value: formatLocalizedNumber(social.favoritesCount, locale),
      iconColorClass: "bg-neon-violet/20 text-neon-violet",
    },
    {
      icon: <FolderOpen className="h-5 w-5" />,
      label: t("social.collections"),
      value: formatLocalizedNumber(social.collectionsCount, locale),
      iconColorClass: "bg-neon-cyan/20 text-neon-cyan",
    },
  ];

  return (
    <section>
      <StatsSectionTitle>{t("social.title")}</StatsSectionTitle>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((card) => (
          <SocialMetricCard key={card.label} {...card} />
        ))}
      </div>
    </section>
  );
}
