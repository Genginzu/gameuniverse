"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/ui/lazy-image";
import { PlayerLibraryGrid } from "./PlayerLibraryGrid";
import Link from "next/link";
import { ArrowLeft, Gamepad2, Calendar, User } from "lucide-react";
import { PlayerFavoriteCharacters } from "./PlayerFavoriteCharacters";
import { PlayerCollections } from "./PlayerCollections";
import { useAuth } from "@/hooks/useAuth";
import { LibraryComparisonSection } from "@/components/players/LibraryComparisonSection";
import { PersonalRecommendationSection } from "@/components/games/PersonalRecommendationSection";
import { PlayerEnrichedStats } from "./PlayerEnrichedStats";
import { YearInReviewLink } from "./YearInReviewLink";
import type { PlayerDetails } from "@/types/player";

/**
 * Pure helper — determines whether the library comparison section should be shown.
 * Exported for property-based testing (Property 3: Visibility of the indicator).
 */
export function shouldShowComparison(
  isAuthenticated: boolean,
  currentUserId: string | null,
  targetPlayerId: string
): boolean {
  return isAuthenticated && currentUserId !== null && currentUserId !== targetPlayerId;
}

interface PlayerDetailsContentProps {
  player: PlayerDetails;
  locale: string;
}

export function PlayerDetailsContent({ player, locale }: PlayerDetailsContentProps) {
  const t = useTranslations("players");
  const tCommon = useTranslations("common");
  const { user } = useAuth();
  const isOwner = user?.id === player.id;

  // Fetch available years for the year-in-review link (Req 7.1)
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    fetch(`/api/players/${player.id}/year/${currentYear}?locale=${locale}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.yearReview?.availableYears) {
          setAvailableYears(json.yearReview.availableYears);
        }
      })
      .catch(() => {});
  }, [player.id, locale]);

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
              <h1 className="neon-text mb-2 text-3xl font-bold text-white md:text-4xl">
                {displayName}
              </h1>
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
        {/* Enriched Stats Section — Req 4.1 */}
        <PlayerEnrichedStats
          playerId={player.id}
          locale={locale}
          isOwnProfile={isOwner}
          statsPrivate={player.statsPrivate}
          totalGames={player.library.length}
        />

        {/* Year in Review Link — Req 7.1 */}
        {availableYears.length > 0 && (
          <div className="mb-8">
            <YearInReviewLink playerId={player.id} availableYears={availableYears} />
          </div>
        )}

        {/* Library Comparison Section - Requirements 2.1, 2.2, 2.3 */}
        {shouldShowComparison(!!user, user?.id ?? null, player.id) && (
          <LibraryComparisonSection playerId={player.id} locale={locale} />
        )}

        {/* Library Section - Requirements 6.1, 6.2, 6.3 */}
        <div className="mb-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
              <Gamepad2 className="h-6 w-6 text-blue-400" />
              {t("details.library")}
            </h2>
            <span className="rounded-full bg-slate-700/50 px-3 py-1 text-sm text-slate-300">
              {player.library.length} {tCommon("games")} {t("details.inLibrary")}
            </span>
          </div>

          <PlayerLibraryGrid games={player.library} locale={locale} />
        </div>

        {/* Favorite Characters Section - Requirements 4.1 */}
        <PlayerFavoriteCharacters playerId={player.id} locale={locale} />

        {/* Collections Section */}
        <PlayerCollections playerId={player.id} locale={locale} isOwner={isOwner} />

        {/* Personal Recommendations — only for the profile owner */}
        {isOwner && <PersonalRecommendationSection locale={locale} />}
      </div>
    </div>
  );
}
