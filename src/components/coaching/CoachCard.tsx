"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";

interface CoachCardProps {
  coach: {
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
  };
}

export function CoachCard({ coach }: CoachCardProps) {
  const t = useTranslations("coaching.hub");

  return (
    <Link
      href={`/coaching/${coach.username}`}
      className="glass-card group flex flex-col rounded-xl p-4 transition-all hover:bg-white/60 dark:hover:bg-slate-700/60"
    >
      <div className="flex items-start gap-3">
        <div className="from-palette-secondary-500 to-palette-primary-500 flex size-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-sm font-bold text-white">
          {coach.avatarUrl ? (
            <img src={coach.avatarUrl} alt="" className="size-12 rounded-full object-cover" />
          ) : (
            coach.username[0].toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-medium text-gray-900 dark:text-white">
              {coach.displayName || coach.username}
            </span>
            {coach.isVerified && (
              <Icon
                icon="lucide:badge-check"
                className="text-palette-secondary-400 size-4 shrink-0"
              />
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-0.5 text-yellow-500">
              <Icon icon="lucide:star" className="size-3" /> {coach.averageRating.toFixed(1)}
            </span>
            <span>
              {coach.totalSessions} {t("sessions")}
            </span>
          </div>
        </div>
        {coach.minPrice !== null && (
          <span className="text-palette-secondary-400 shrink-0 text-sm font-semibold">
            {coach.minPrice}€
          </span>
        )}
      </div>

      {coach.bio && (
        <p className="mt-3 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{coach.bio}</p>
      )}

      {coach.games.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {coach.games.slice(0, 3).map((g) => (
            <span
              key={g.slug}
              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            >
              {g.title}
            </span>
          ))}
          {coach.games.length > 3 && (
            <span className="text-xs text-gray-400">+{coach.games.length - 3}</span>
          )}
        </div>
      )}
    </Link>
  );
}
