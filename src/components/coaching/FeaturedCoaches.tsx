"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { CoachCard } from "./CoachCard";

interface CoachSummary {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  averageRating: number;
  totalReviews: number;
  totalSessions: number;
  isVerified: boolean;
  games: Array<{ title: string; slug: string; coverImage: string | null }>;
  minPrice: number | null;
}

interface Props {
  featured: { topRated: CoachSummary[]; newest: CoachSummary[]; popular: CoachSummary[] };
}

function Section({
  title,
  icon,
  coaches,
}: {
  title: string;
  icon: string;
  coaches: CoachSummary[];
}) {
  if (coaches.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon icon={icon} className="text-editorial-accent size-5" />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {coaches.map((c) => (
          <CoachCard key={c.id} coach={c} />
        ))}
      </div>
    </div>
  );
}

export function FeaturedCoaches({ featured }: Props) {
  const t = useTranslations("coaching.hub.featured");

  return (
    <div className="space-y-6">
      <Section title={t("topRated")} icon="lucide:star" coaches={featured.topRated} />
      <Section title={t("newest")} icon="lucide:sparkles" coaches={featured.newest} />
      <Section title={t("popular")} icon="lucide:flame" coaches={featured.popular} />
    </div>
  );
}
