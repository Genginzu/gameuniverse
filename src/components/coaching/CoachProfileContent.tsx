"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { CoachReviewsSection } from "./CoachReviewsSection";
import { BookingModal } from "./BookingModal";

interface CoachProfileData {
  player: { username: string; avatarUrl: string | null; displayName: string | null };
  coach: {
    id: string;
    bio: string | null;
    experience: string | null;
    languages: string[];
    averageRating: number;
    totalReviews: number;
    totalSessions: number;
    isVerified: boolean;
  };
  games: Array<{
    id: string;
    gameId: string;
    title: string;
    slug: string;
    coverImage: string | null;
    coverImageUrl: string | null;
    specialties: string[];
    pricing: Array<{
      id: string;
      sessionType: string;
      priceAmount: number;
      priceCurrency: string;
      durationMinutes: number;
    }>;
  }>;
}

const LANGUAGE_LABELS: Record<string, string> = {
  Français: "Français",
  Fr: "Français",
  fr: "Français",
  English: "English",
  En: "English",
  en: "English",
};

export function CoachProfileContent({ username }: { username: string }) {
  const t = useTranslations("coaching.publicProfile");
  const tGames = useTranslations("coaching.settings.games");
  const locale = useLocale();
  const { data, isLoading, error } = useSWR<CoachProfileData>(
    `/api/coaching/${username}?locale=${locale}`,
    fetcher
  );
  const [bookingGame, setBookingGame] = useState<CoachProfileData["games"][0] | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <div className="h-32 animate-pulse rounded-2xl bg-white/[0.06]" />
        <div className="h-48 animate-pulse rounded-2xl bg-white/[0.06]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Icon icon="lucide:user-x" className="text-editorial-muted mb-3 size-12" />
        <p className="text-editorial-muted">{t("notFound")}</p>
      </div>
    );
  }

  const { player, coach, games } = data;
  const minPrice = Math.min(...games.flatMap((g) => g.pricing.map((p) => p.priceAmount)), Infinity);

  return (
    <div className="space-y-6 p-4 md:space-y-8 md:p-6 lg:p-8">
      {/* Header */}
      <div className="border-editorial-line bg-editorial-2 flex flex-col items-center gap-4 rounded-2xl border p-6 sm:flex-row sm:items-start">
        <div className="from-palette-secondary-500 to-palette-primary-500 flex size-20 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-2xl font-bold text-white">
          {player.avatarUrl ? (
            <img src={player.avatarUrl} alt="" className="size-20 rounded-full object-cover" />
          ) : (
            player.username[0].toUpperCase()
          )}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
              {player.displayName || player.username}
            </h1>
            {coach.isVerified && (
              <span className="bg-editorial-accent/15 text-editorial-accent rounded-full px-2 py-0.5 text-xs font-medium">
                <Icon icon="lucide:badge-check" className="mr-1 inline size-3" />
                {t("verified")}
              </span>
            )}
          </div>
          <p className="text-editorial-muted mt-1 text-sm">@{player.username}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm sm:justify-start">
            <span className="flex items-center gap-1 text-amber-400">
              <Icon icon="lucide:star" className="size-4" /> {coach.averageRating.toFixed(1)}
              <span className="text-editorial-muted">({coach.totalReviews})</span>
            </span>
            <span className="text-editorial-muted">
              {coach.totalSessions} {t("sessions")}
            </span>
            {minPrice < Infinity && (
              <span className="text-editorial-accent font-medium">
                {t("from")} {minPrice}€
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bio & Experience */}
      {(coach.bio || coach.experience) && (
        <div className="border-editorial-line bg-editorial-2 space-y-4 rounded-2xl border p-6">
          {coach.bio && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-white">{t("bio")}</h2>
              <p className="text-editorial-muted text-sm">{coach.bio}</p>
            </div>
          )}
          {coach.experience && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-white">{t("experience")}</h2>
              <p className="text-editorial-muted text-sm">{coach.experience}</p>
            </div>
          )}
          {coach.languages.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-white">{t("languages")}</h2>
              <div className="flex flex-wrap gap-1.5">
                {coach.languages.map((l) => (
                  <span
                    key={l}
                    className="text-editorial-muted rounded-full bg-white/10 px-2.5 py-0.5 text-xs"
                  >
                    {LANGUAGE_LABELS[l] ?? l}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Games & Pricing */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-bold tracking-tight text-white">{t("gamesCoached")}</h2>
        {games.length === 0 ? (
          <p className="text-editorial-muted text-sm">{t("noGames")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {games.map((game) => (
              <div key={game.id} className="border-editorial-line bg-editorial-2 flex gap-4 rounded-xl border p-4">
                {(game.coverImageUrl || game.coverImage) && (
                  <img
                    src={(game.coverImageUrl || game.coverImage)!}
                    alt=""
                    className="h-20 w-14 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <Link
                    href={`/games/${game.slug}`}
                    className="hover:text-editorial-accent font-medium text-white"
                  >
                    {game.title}
                  </Link>
                  {game.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {game.specialties.map((s) => (
                        <span
                          key={s}
                          className="bg-editorial-accent/15 text-editorial-accent rounded-full px-2 py-0.5 text-xs"
                        >
                          {tGames(`specialties.${s}`)}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setBookingGame(game)}
                    className="from-palette-secondary-500 to-palette-primary-500 rounded-lg bg-linear-to-r px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                  >
                    <Icon icon="lucide:calendar-plus" className="mr-1 inline size-3.5" />
                    {t("book")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Reviews */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-bold tracking-tight text-white">{t("reviews")}</h2>
        <CoachReviewsSection coachId={coach.id} />
      </div>

      {bookingGame && (
        <BookingModal
          coachId={coach.id}
          gameId={bookingGame.gameId}
          gameTitle={bookingGame.title}
          pricing={bookingGame.pricing}
          onClose={() => setBookingGame(null)}
        />
      )}
    </div>
  );
}
