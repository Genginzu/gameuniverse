"use client";

import { useTranslations } from "next-intl";
import { useUserLibrary } from "@/hooks/useUserLibrary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EntityCard } from "@/components/shared/EntityCard";
import { gameCardConfig } from "@/components/shared/entityCardPresets";
import { LibrarySkeleton } from "./LibrarySkeleton";
import { FaGamepad, FaPlus, FaClock, FaStar } from "react-icons/fa";
import Link from "next/link";

export function UserLibraryContent() {
  const t = useTranslations("userLibrary");
  const tLib = useTranslations("library");
  const { games, stats, loading, error } = useUserLibrary();

  if (loading) {
    return <LibrarySkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <Card className="bg-white">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-red-100 p-4 sm:p-6">
              <FaGamepad className="h-8 w-8 text-red-400 sm:h-12 sm:w-12" />
            </div>
            <h3 className="mb-2 text-base font-medium text-gray-900 sm:text-lg">
              {t("loadingError")}
            </h3>
            <p className="mb-6 max-w-md text-sm text-gray-500 sm:text-base">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {t("retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="neon-text mb-2 text-xl font-bold text-gray-900 sm:text-2xl">
          {tLib("title")}
        </h1>
        <p className="text-sm text-gray-600 sm:text-base">{t("subtitle")}</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:gap-6 md:grid-cols-4">
        <Card className="bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <div className="rounded-lg bg-blue-100 p-2">
                <FaGamepad className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
              </div>
              <div className="ml-3">
                <CardTitle className="text-sm font-medium text-gray-900">
                  {t("stats.gamesOwned")}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 sm:text-2xl">{stats.totalGames}</div>
            <p className="text-xs text-gray-500">{t("stats.inLibrary")}</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <div className="rounded-lg bg-green-100 p-2">
                <FaGamepad className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
              </div>
              <div className="ml-3">
                <CardTitle className="text-sm font-medium text-gray-900">
                  {t("stats.gamesCompleted")}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 sm:text-2xl">
              {stats.completedGames}
            </div>
            <p className="text-xs text-gray-500">{t("stats.completedPercent")}</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <div className="rounded-lg bg-purple-100 p-2">
                <FaClock className="h-4 w-4 text-purple-600 sm:h-5 sm:w-5" />
              </div>
              <div className="ml-3">
                <CardTitle className="text-sm font-medium text-gray-900">
                  {t("stats.playTime")}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 sm:text-2xl">
              {stats.totalPlayTime}h
            </div>
            <p className="text-xs text-gray-500">{t("stats.totalPlayed")}</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <div className="rounded-lg bg-yellow-100 p-2">
                <FaStar className="h-4 w-4 text-yellow-600 sm:h-5 sm:w-5" />
              </div>
              <div className="ml-3">
                <CardTitle className="text-sm font-medium text-gray-900">
                  {t("stats.averageRating")}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 sm:text-2xl">
              {stats.averageRating ? `${stats.averageRating}/5` : "—"}
            </div>
            <p className="text-xs text-gray-500">{t("stats.yourRatings")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {games.length === 0 && (
        <Card className="bg-white">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4 sm:p-6">
              <FaGamepad className="h-8 w-8 text-gray-400 sm:h-12 sm:w-12" />
            </div>
            <h3 className="mb-2 text-base font-medium text-gray-900 sm:text-lg">
              {t("empty.title")}
            </h3>
            <p className="mb-6 max-w-md text-sm text-gray-500 sm:text-base">
              {t("empty.description")}
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/games">
                <FaPlus className="mr-2 h-4 w-4" />
                {t("empty.exploreGames")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* User Games Grid */}
      {games.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("yourGames", { count: games.length })}
            </h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/games">
                <FaPlus className="mr-2 h-4 w-4" />
                {t("empty.addGames")}
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {games.map((game, index) => (
              <EntityCard
                key={game.id}
                entity={game}
                config={gameCardConfig}
                locale="fr"
                priority={index < 12} // Prioritize first 12 games for loading
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
