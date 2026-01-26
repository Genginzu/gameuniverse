"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LazyImage } from "@/components/ui/lazy-image";
import { PlayerLibraryGrid } from "./PlayerLibraryGrid";
import Link from "next/link";
import { ArrowLeft, Gamepad2, Trophy, Clock, Star, Calendar, User } from "lucide-react";
import type { PlayerDetails } from "@/types/player";

interface PlayerDetailsContentProps {
  player: PlayerDetails;
  locale: string;
}

export function PlayerDetailsContent({ player, locale }: PlayerDetailsContentProps) {
  const t = useTranslations("players");
  const tCommon = useTranslations("common");

  // Display name with fallback - Requirements 5.2
  const displayName = player.fullName || t("card.anonymousPlayer");

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900" />

        {/* Navigation - Requirements 7.2 */}
        <div className="relative z-10 px-4 py-4">
          <div className="container mx-auto">
            <Link href={`/${locale}/players`}>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("details.back")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Profile header */}
        <div className="container relative z-10 mx-auto px-4 pb-12 pt-8">
          <div className="flex flex-col items-center text-center md:flex-row md:items-start md:text-left">
            {/* Avatar - Requirements 5.2 */}
            <div className="relative mb-6 md:mb-0 md:mr-8">
              <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white/20 bg-gradient-to-br from-blue-100 to-indigo-100 shadow-2xl md:h-40 md:w-40">
                {player.avatarUrl ? (
                  <LazyImage
                    src={player.avatarUrl}
                    alt={displayName}
                    fill
                    className="object-cover"
                    sizes="160px"
                    priority
                    showSkeleton={true}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-16 w-16 text-blue-300 md:h-20 md:w-20" />
                  </div>
                )}
              </div>
              {/* Online indicator (decorative) */}
              <div className="absolute bottom-2 right-2 h-5 w-5 rounded-full border-2 border-slate-900 bg-green-500" />
            </div>

            {/* Player info */}
            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">{displayName}</h1>
              <div className="flex items-center justify-center gap-2 text-slate-300 md:justify-start">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  {t("details.memberSince")} {formatDate(player.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section - Requirements 6.4 */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* Total Games */}
          <Card className="rounded-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center gap-2 text-slate-400">
                <Gamepad2 className="h-5 w-5 text-blue-400" />
                <span className="text-sm font-medium">{t("details.totalGames")}</span>
              </div>
              <p className="text-2xl font-bold text-white md:text-3xl">{player.stats.totalGames}</p>
            </CardContent>
          </Card>

          {/* Completed Games */}
          <Card className="rounded-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center gap-2 text-slate-400">
                <Trophy className="h-5 w-5 text-green-400" />
                <span className="text-sm font-medium">{t("details.completedGames")}</span>
              </div>
              <p className="text-2xl font-bold text-white md:text-3xl">
                {player.stats.completedGames}
              </p>
            </CardContent>
          </Card>

          {/* Total Play Time */}
          <Card className="rounded-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center gap-2 text-slate-400">
                <Clock className="h-5 w-5 text-purple-400" />
                <span className="text-sm font-medium">{t("details.totalPlayTime")}</span>
              </div>
              <p className="text-2xl font-bold text-white md:text-3xl">
                {player.stats.totalPlayTime}
                <span className="ml-1 text-base font-normal text-slate-400">h</span>
              </p>
            </CardContent>
          </Card>

          {/* Average Rating */}
          <Card className="rounded-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center gap-2 text-slate-400">
                <Star className="h-5 w-5 text-yellow-400" />
                <span className="text-sm font-medium">{t("details.averageRating")}</span>
              </div>
              <p className="text-2xl font-bold text-white md:text-3xl">
                {player.stats.averageRating !== null ? (
                  <>
                    {player.stats.averageRating.toFixed(1)}
                    <span className="ml-1 text-base font-normal text-slate-400">/5</span>
                  </>
                ) : (
                  <span className="text-lg text-slate-500">{t("details.noRating")}</span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Library Section - Requirements 6.1, 6.2, 6.3 */}
        <div className="mb-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white md:text-2xl">
              <Gamepad2 className="h-6 w-6 text-blue-400" />
              {t("details.library")}
            </h2>
            <span className="rounded-full bg-slate-700/50 px-3 py-1 text-sm text-slate-300">
              {player.library.length} {tCommon("games")} {t("details.inLibrary")}
            </span>
          </div>

          <PlayerLibraryGrid games={player.library} locale={locale} />
        </div>
      </div>
    </div>
  );
}
