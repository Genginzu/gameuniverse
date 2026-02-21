"use client";

import { Card, CardContent } from "@/components/ui/card";
import { GamePlaytime } from "../GamePlaytime";
import { GameAgeRatings } from "../GameAgeRatings";
import { GameVersions } from "../GameVersions";
import { GameDlcExtensions } from "../GameDlcExtensions";
import { GameMediaGallery } from "./GameMediaGallery";
import {
  Play,
  Eye,
  Shield,
  MessageSquare,
  Clock,
  Languages,
  Music,
  Monitor,
  Package,
  Puzzle,
  Users,
  TrendingUp,
} from "lucide-react";
import { PriceHistoryTab } from "@/components/games/details/PriceHistoryTab";
import { GameReviewsTab } from "../reviews/GameReviewsTab";
import { useTranslations } from "next-intl";
import { GameDetails } from "@/types/game";
import { GameColors } from "@/lib/utils/game-utils";

export type TabType =
  | "media"
  | "specs"
  | "reviews"
  | "playtime"
  | "languages"
  | "music"
  | "ageRatings"
  | "versions"
  | "dlcExtensions"
  | "priceHistory";

interface GameDetailsTabsProps {
  game: GameDetails;
  colors: GameColors;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function GameDetailsTabs({ game, colors, activeTab, onTabChange }: GameDetailsTabsProps) {
  const tDetails = useTranslations("gameDetails");

  return (
    <>
      {/* Tab navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-1 rounded-xl border border-slate-700 bg-slate-800/50 p-1">
          <button
            onClick={() => onTabChange("media")}
            className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
              activeTab === "media"
                ? "bg-white text-slate-900"
                : "text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Eye className="mr-2 inline h-4 w-4" />
            {tDetails("tabs.media")}
          </button>
          <button
            onClick={() => onTabChange("ageRatings")}
            className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
              activeTab === "ageRatings"
                ? "bg-white text-slate-900"
                : "text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Shield className="mr-2 inline h-4 w-4" />
            {tDetails("tabs.ageRatings")}
          </button>
          {game.versions && game.versions.length > 0 && (
            <button
              onClick={() => onTabChange("versions")}
              className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
                activeTab === "versions"
                  ? "bg-white text-slate-900"
                  : "text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Package className="mr-2 inline h-4 w-4" />
              {tDetails("tabs.versions")}
            </button>
          )}
          {game.dlcExtensions && game.dlcExtensions.length > 0 && (
            <button
              onClick={() => onTabChange("dlcExtensions")}
              className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
                activeTab === "dlcExtensions"
                  ? "bg-white text-slate-900"
                  : "text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Puzzle className="mr-2 inline h-4 w-4" />
              {tDetails("tabs.dlcExtensions")}
            </button>
          )}
          <button
            onClick={() => onTabChange("reviews")}
            className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
              activeTab === "reviews"
                ? "bg-white text-slate-900"
                : "text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <MessageSquare className="mr-2 inline h-4 w-4" />
            {tDetails("tabs.reviews")}
          </button>
          <button
            onClick={() => onTabChange("playtime")}
            className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
              activeTab === "playtime"
                ? "bg-white text-slate-900"
                : "text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Clock className="mr-2 inline h-4 w-4" />
            {tDetails("tabs.playtime")}
          </button>
          <button
            onClick={() => onTabChange("languages")}
            className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
              activeTab === "languages"
                ? "bg-white text-slate-900"
                : "text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Languages className="mr-2 inline h-4 w-4" />
            {tDetails("tabs.languages")}
          </button>
          <button
            onClick={() => onTabChange("music")}
            className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
              activeTab === "music"
                ? "bg-white text-slate-900"
                : "text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Music className="mr-2 inline h-4 w-4" />
            {tDetails("tabs.music")}
          </button>
          <button
            onClick={() => onTabChange("priceHistory")}
            className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
              activeTab === "priceHistory"
                ? "bg-white text-slate-900"
                : "text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <TrendingUp className="mr-2 inline h-4 w-4" />
            {tDetails("tabs.priceHistory")}
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="space-y-8">
        {activeTab === "media" && <GameMediaGallery media={game.media} gameTitle={game.title} />}

        {activeTab === "ageRatings" && (
          <GameAgeRatings ratings={game.ageRatings} accentColor={colors.accent} />
        )}

        {activeTab === "versions" && (
          <GameVersions versions={game.versions} accentColor={colors.accent} />
        )}

        {activeTab === "dlcExtensions" && (
          <GameDlcExtensions dlcExtensions={game.dlcExtensions ?? []} accentColor={colors.accent} />
        )}

        {activeTab === "reviews" && (
          <GameReviewsTab gameId={game.id} gameTitle={game.title} accentColor={colors.primary} />
        )}

        {activeTab === "playtime" && (
          <GamePlaytime playtime={game.playtime} accentColor={colors.accent} slug={game.slug} />
        )}

        {activeTab === "languages" && (
          <div>
            {game.languages && game.languages.length > 0 ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {/* Interface */}
                  <Card className="rounded-xl border-slate-700 bg-slate-800/50">
                    <CardContent className="p-6">
                      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                        <Monitor className="h-5 w-5" style={{ color: colors.accent }} />
                        {tDetails("languages.interface")}
                      </h3>
                      <div className="space-y-2">
                        {game.languages
                          .filter((lang) => lang.hasInterface)
                          .map((lang) => (
                            <div
                              key={`interface-${lang.code}`}
                              className="flex items-center gap-2 text-slate-300"
                            >
                              <div className="h-2 w-2 rounded-full bg-green-400"></div>
                              <span>{lang.nativeName ?? lang.name}</span>
                            </div>
                          ))}
                        {game.languages.filter((lang) => lang.hasInterface).length === 0 && (
                          <p className="text-sm text-slate-500">{tDetails("languages.noData")}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Subtitles */}
                  <Card className="rounded-xl border-slate-700 bg-slate-800/50">
                    <CardContent className="p-6">
                      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                        <MessageSquare className="h-5 w-5" style={{ color: colors.accent }} />
                        {tDetails("languages.subtitles")}
                      </h3>
                      <div className="space-y-2">
                        {game.languages
                          .filter((lang) => lang.hasSubtitles)
                          .map((lang) => (
                            <div
                              key={`subtitles-${lang.code}`}
                              className="flex items-center gap-2 text-slate-300"
                            >
                              <div className="h-2 w-2 rounded-full bg-green-400"></div>
                              <span>{lang.nativeName ?? lang.name}</span>
                            </div>
                          ))}
                        {game.languages.filter((lang) => lang.hasSubtitles).length === 0 && (
                          <p className="text-sm text-slate-500">{tDetails("languages.noData")}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Voice */}
                  <Card className="rounded-xl border-slate-700 bg-slate-800/50">
                    <CardContent className="p-6">
                      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                        <Play className="h-5 w-5" style={{ color: colors.accent }} />
                        {tDetails("languages.voice")}
                      </h3>
                      <div className="space-y-2">
                        {game.languages
                          .filter((lang) => lang.hasAudio)
                          .map((lang) => (
                            <div
                              key={`audio-${lang.code}`}
                              className="flex items-center gap-2 text-slate-300"
                            >
                              <div className="h-2 w-2 rounded-full bg-green-400"></div>
                              <span>{lang.nativeName ?? lang.name}</span>
                            </div>
                          ))}
                        {game.languages.filter((lang) => lang.hasAudio).length === 0 && (
                          <p className="text-sm text-slate-500">{tDetails("languages.noData")}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Languages className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p className="mb-2 text-lg font-medium text-white">{tDetails("languages.title")}</p>
                <p>{tDetails("languages.noData")}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "music" && (
          <div>
            <div className="space-y-8">
              {/* Soundtrack */}
              <Card className="rounded-xl border-slate-700 bg-slate-800/50">
                <CardContent className="p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
                    <Music className="h-5 w-5" style={{ color: colors.accent }} />
                    {tDetails("music.soundtrack")}
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Example tracks */}
                    <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-700">
                          <Play className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">Main Theme</h4>
                          <p className="text-sm text-slate-400">3:42</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-700">
                          <Play className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">Battle Music</h4>
                          <p className="text-sm text-slate-400">2:58</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-700">
                          <Play className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">Ambient Theme</h4>
                          <p className="text-sm text-slate-400">4:15</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Composer */}
              <Card className="rounded-xl border-slate-700 bg-slate-800/50">
                <CardContent className="p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
                    <Users className="h-5 w-5" style={{ color: colors.accent }} />
                    {tDetails("music.composer")}
                  </h3>
                  <div className="text-slate-300">
                    <p className="mb-2">{tDetails("music.comingSoon")}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "priceHistory" && (
          <PriceHistoryTab
            gameSlug={game.slug}
            currentPrice={game.pricing?.[0]?.price}
            colors={{ primary: colors.primary, secondary: colors.secondary }}
          />
        )}
      </div>
    </>
  );
}
