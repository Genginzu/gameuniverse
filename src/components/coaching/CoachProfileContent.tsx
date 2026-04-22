"use client";

import { useTranslations, useLocale } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";

interface CoachProfileData {
  player: { username: string; avatarUrl: string | null; displayName: string | null };
  coach: { bio: string | null; experience: string | null; languages: string[]; averageRating: number; totalReviews: number; totalSessions: number; isVerified: boolean };
  games: Array<{ id: string; gameId: string; title: string; slug: string; coverImage: string | null; specialties: string[]; pricing: Array<{ sessionType: string; priceAmount: number; priceCurrency: string; durationMinutes: number }> }>;
}

export function CoachProfileContent({ username }: { username: string }) {
  const t = useTranslations("coaching.publicProfile");
  const tGames = useTranslations("coaching.settings.games");
  const locale = useLocale();
  const { data, isLoading, error } = useSWR<CoachProfileData>(`/api/coaching/${username}?locale=${locale}`, fetcher);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <div className="h-32 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-48 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Icon icon="lucide:user-x" className="mb-3 size-12 text-gray-400" />
        <p className="text-gray-500 dark:text-gray-400">{t("notFound")}</p>
      </div>
    );
  }

  const { player, coach, games } = data;
  const minPrice = Math.min(...games.flatMap((g) => g.pricing.map((p) => p.priceAmount)), Infinity);

  return (
    <div className="space-y-6 p-4 md:space-y-8 md:p-6 lg:p-8">
      {/* Header */}
      <div className="glass-card flex flex-col items-center gap-4 rounded-2xl p-6 sm:flex-row sm:items-start">
        <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-violet-500 text-2xl font-bold text-white">
          {player.avatarUrl ? (
            <img src={player.avatarUrl} alt="" className="size-20 rounded-full object-cover" />
          ) : (
            player.username[0].toUpperCase()
          )}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
              {player.displayName || player.username}
            </h1>
            {coach.isVerified && (
              <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-medium text-cyan-400">
                <Icon icon="lucide:badge-check" className="mr-1 inline size-3" />{t("verified")}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">@{player.username}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm sm:justify-start">
            <span className="flex items-center gap-1 text-yellow-500">
              <Icon icon="lucide:star" className="size-4" /> {coach.averageRating.toFixed(1)}
              <span className="text-gray-400">({coach.totalReviews})</span>
            </span>
            <span className="text-gray-500 dark:text-gray-400">{coach.totalSessions} {t("sessions")}</span>
            {minPrice < Infinity && <span className="font-medium text-cyan-400">{t("from")} {minPrice}€</span>}
          </div>
        </div>
      </div>

      {/* Bio & Experience */}
      {(coach.bio || coach.experience) && (
        <div className="glass-card space-y-4 rounded-2xl p-6">
          {coach.bio && <div><h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">{t("bio")}</h2><p className="text-sm text-gray-600 dark:text-gray-300">{coach.bio}</p></div>}
          {coach.experience && <div><h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">{t("experience")}</h2><p className="text-sm text-gray-600 dark:text-gray-300">{coach.experience}</p></div>}
          {coach.languages.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {coach.languages.map((l) => (
                <span key={l} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">{l}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Games & Pricing */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("gamesCoached")}</h2>
        {games.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("noGames")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {games.map((game) => (
              <div key={game.id} className="glass-card flex gap-4 rounded-xl p-4">
                {game.coverImage && <img src={game.coverImage} alt="" className="h-20 w-14 shrink-0 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1 space-y-2">
                  <Link href={`/games/${game.slug}`} className="font-medium text-gray-900 hover:text-cyan-400 dark:text-white">{game.title}</Link>
                  {game.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {game.specialties.map((s) => (
                        <span key={s} className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400">{tGames(`specialties.${s}`)}</span>
                      ))}
                    </div>
                  )}
                  {game.pricing.length > 0 && (
                    <div className="space-y-1">
                      {game.pricing.map((p) => (
                        <div key={p.sessionType} className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">{t(`types.${p.sessionType}`)}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{p.priceAmount}€ <span className="text-xs text-gray-400">/ {p.durationMinutes}min</span></span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
