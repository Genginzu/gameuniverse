"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LazyImage } from "@/components/ui/lazy-image";
import { GamePlaytime } from "./GamePlaytime";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Users,
  Globe,
  Play,
  Heart,
  Share2,
  Info,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Settings,
  MessageSquare,
  Clock,
  Star,
  Smartphone,
  Languages,
  Music,
  Monitor,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { GameDetails } from "@/types/game";
import { useState } from "react";

interface GameDetailsProps {
  game: GameDetails;
  locale: string;
}

// Système de couleurs dynamiques simplifié
const getGameColors = (gameTitle: string, _genres: string[]) => {
  const title = gameTitle.toLowerCase();

  if (title.includes("witcher")) {
    return {
      primary: "#f59e0b", // amber-500
      secondary: "#d97706", // amber-600
      accent: "#fbbf24", // amber-400
      bg: "from-amber-500/10 to-orange-500/10",
    };
  }

  if (title.includes("cyberpunk")) {
    return {
      primary: "#06b6d4", // cyan-500
      secondary: "#8b5cf6", // violet-500
      accent: "#22d3ee", // cyan-400
      bg: "from-cyan-500/10 to-violet-500/10",
    };
  }

  if (title.includes("minecraft")) {
    return {
      primary: "#10b981", // emerald-500
      secondary: "#059669", // emerald-600
      accent: "#34d399", // emerald-400
      bg: "from-emerald-500/10 to-green-500/10",
    };
  }

  // Couleurs par défaut
  return {
    primary: "#8b5cf6", // violet-500
    secondary: "#7c3aed", // violet-600
    accent: "#a78bfa", // violet-400
    bg: "from-violet-500/10 to-blue-500/10",
  };
};

export function GameDetailsContent({ game, locale }: GameDetailsProps) {
  const t = useTranslations();
  const tDetails = useTranslations("gameDetails");
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState(0);
  const [selectedArtworkIndex, setSelectedArtworkIndex] = useState(0);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "media" | "specs" | "reviews" | "playtime" | "languages" | "music"
  >("media");
  const [isWishlisted, setIsWishlisted] = useState(false);

  const colors = getGameColors(
    game.title,
    game.genres.map((g) => g.name)
  );

  const formatReleaseDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const getMetascoreColor = (score?: number) => {
    if (!score) return "bg-gray-500";
    if (score >= 90) return "bg-green-500";
    if (score >= 75) return "bg-green-400";
    if (score >= 60) return "bg-yellow-400";
    if (score >= 40) return "bg-orange-400";
    return "bg-red-400";
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: game.backgroundColor || "#0f172a", // fallback to slate-950
      }}
    >
      {/* Header avec navigation */}
      <div className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/${locale}/games`}>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("common.back")}
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`${isWishlisted ? "text-red-400" : "text-slate-300"} hover:text-white`}
                onClick={() => setIsWishlisted(!isWishlisted)}
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section avec image de fond */}
      <div className="relative">
        {/* Image de fond - uniquement pour la section hero */}
        {game.media.backgroundImage && (
          <div className="absolute inset-0 z-0 h-[80vh] overflow-hidden">
            <LazyImage
              src={game.media.backgroundImage}
              alt={`${game.title} background`}
              fill
              className="object-cover object-center"
              sizes="100vw"
              priority
              showSkeleton={true}
            />
            {/* Overlay gradient pour l'ambiance */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, ${game.backgroundColor || "#0f172a"}20 0%, ${game.backgroundColor || "#0f172a"}60 40%, ${game.backgroundColor || "#0f172a"}90 70%, ${game.backgroundColor || "#0f172a"} 100%)`,
              }}
            />
            {/* Effet de vignette pour l'ambiance */}
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at center, transparent 0%, ${game.backgroundColor || "#0f172a"}40 70%, ${game.backgroundColor || "#0f172a"}80 100%)`,
              }}
            />
          </div>
        )}

        <div className="container relative z-10 mx-auto flex min-h-[80vh] items-center px-4 py-8">
          <div className="grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-12">
            {/* Cover et actions - Colonne gauche */}
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                {/* Cover principale */}
                <div className="group relative mx-auto max-w-[400px]">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${colors.bg} scale-105 rounded-xl opacity-50 blur-xl`}
                  />
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-slate-700 bg-slate-800/80 backdrop-blur-sm">
                    <LazyImage
                      src={game.media.coverImage}
                      alt={game.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="400px"
                      priority
                      showSkeleton={true}
                    />

                    {/* Badge Metascore */}
                    {game.metascore && (
                      <div className="absolute right-4 top-4">
                        <div
                          className={`${getMetascoreColor(game.metascore)} rounded-full px-3 py-1 text-sm font-bold text-white shadow-lg`}
                        >
                          {game.metascore}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section Prix */}
                {game.pricing.length > 0 && (
                  <div className="mt-6">
                    <div className="space-y-3">
                      {game.pricing.slice(0, 3).map((price, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/80 p-3 backdrop-blur-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="text-sm font-medium text-white">
                                {price.store.name}
                              </div>
                              <div className="text-xs text-slate-400">{price.platform}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold" style={{ color: colors.accent }}>
                              {formatPrice(price.price, price.currency)}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              <ExternalLink className="mr-1 h-3 w-3" />
                              {tDetails("view")}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contenu principal - Colonne droite */}
            <div className="lg:col-span-8">
              {/* En-tête du jeu */}
              <div className="mb-8">
                {/* Genres */}
                {game.genres.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {game.genres.slice(0, 3).map((genre) => (
                      <Badge
                        key={genre.id}
                        variant="secondary"
                        className="border-slate-600 bg-slate-800/80 text-slate-300 backdrop-blur-sm"
                      >
                        {genre.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Titre */}
                <h1 className="mb-4 text-4xl font-bold leading-tight text-white drop-shadow-lg lg:text-6xl">
                  {game.title}
                </h1>

                {/* Métadonnées */}
                <div className="mb-6 flex flex-wrap gap-6 text-slate-300">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" style={{ color: colors.accent }} />
                    <span>{game.developer}</span>
                  </div>
                  {game.publisher !== game.developer && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" style={{ color: colors.accent }} />
                      <span>{game.publisher}</span>
                    </div>
                  )}
                  {game.releaseDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" style={{ color: colors.accent }} />
                      <span>{formatReleaseDate(game.releaseDate)}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {game.description && (
                  <p className="max-w-4xl text-lg leading-relaxed text-slate-200 drop-shadow-sm">
                    {game.description}
                  </p>
                )}
              </div>

              {/* Contenu principal - Sections séparées */}
              <div className="space-y-12">
                {/* Section Aperçu - Informations du jeu */}
                <div>
                  <h2 className="mb-6 text-2xl font-bold text-white">{tDetails("overview")}</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Développeur */}
                    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" style={{ color: colors.accent }} />
                        <div className="text-sm text-slate-400">{t("game.developer")}</div>
                      </div>
                      <div className="font-medium text-white">{game.developer}</div>
                    </div>

                    {/* Éditeur */}
                    {game.publisher !== game.developer && (
                      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Globe className="h-4 w-4" style={{ color: colors.accent }} />
                          <div className="text-sm text-slate-400">{t("game.publisher")}</div>
                        </div>
                        <div className="font-medium text-white">{game.publisher}</div>
                      </div>
                    )}

                    {/* Date de sortie */}
                    {game.releaseDate && (
                      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Calendar className="h-4 w-4" style={{ color: colors.accent }} />
                          <div className="text-sm text-slate-400">{t("game.releaseDate")}</div>
                        </div>
                        <div className="font-medium text-white">
                          {formatReleaseDate(game.releaseDate)}
                        </div>
                      </div>
                    )}

                    {/* Metascore */}
                    {game.metascore && (
                      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Star className="h-4 w-4" style={{ color: colors.accent }} />
                          <div className="text-sm text-slate-400">Metascore</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`${getMetascoreColor(game.metascore)} rounded-lg px-3 py-1 text-lg font-bold text-white`}
                          >
                            {game.metascore}
                          </div>
                          <div className="text-sm text-slate-300">
                            {game.metascore >= 90
                              ? tDetails("metascoreRatings.exceptional")
                              : game.metascore >= 75
                                ? tDetails("metascoreRatings.excellent")
                                : game.metascore >= 60
                                  ? tDetails("metascoreRatings.good")
                                  : game.metascore >= 40
                                    ? tDetails("metascoreRatings.average")
                                    : tDetails("metascoreRatings.poor")}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Plateformes */}
                    {game.pricing.length > 0 && (
                      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <Smartphone className="h-4 w-4" style={{ color: colors.accent }} />
                          <div className="text-sm text-slate-400">{tDetails("platforms")}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(new Set(game.pricing.map((p) => p.platform))).map(
                            (platform) => (
                              <Badge
                                key={platform}
                                variant="secondary"
                                className="border-slate-600 bg-slate-700 text-slate-200"
                              >
                                {platform}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Genres */}
                    {game.genres.length > 0 && (
                      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <Info className="h-4 w-4" style={{ color: colors.accent }} />
                          <div className="text-sm text-slate-400">{t("game.genres")}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {game.genres.map((genre) => (
                            <Badge
                              key={genre.id}
                              variant="outline"
                              className="border-slate-600 text-slate-300"
                            >
                              {genre.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation par onglets */}
                <div className="mb-8">
                  <div className="flex gap-1 rounded-xl border border-slate-700 bg-slate-800/50 p-1">
                    <button
                      onClick={() => setActiveTab("media")}
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
                      onClick={() => setActiveTab("specs")}
                      className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
                        activeTab === "specs"
                          ? "bg-white text-slate-900"
                          : "text-slate-400 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      <Settings className="mr-2 inline h-4 w-4" />
                      {tDetails("tabs.specs")}
                    </button>
                    <button
                      onClick={() => setActiveTab("reviews")}
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
                      onClick={() => setActiveTab("playtime")}
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
                      onClick={() => setActiveTab("languages")}
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
                      onClick={() => setActiveTab("music")}
                      className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
                        activeTab === "music"
                          ? "bg-white text-slate-900"
                          : "text-slate-400 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      <Music className="mr-2 inline h-4 w-4" />
                      {tDetails("tabs.music")}
                    </button>
                  </div>
                </div>

                {/* Contenu des onglets */}
                <div className="space-y-8">
                  {activeTab === "media" && (
                    <div className="space-y-12">
                      {/* Section Captures d'écran */}
                      {game.media.screenshots.length > 0 && (
                        <div>
                          <h3 className="mb-6 text-xl font-bold text-white">
                            {tDetails("media.screenshots")}
                          </h3>
                          <div>
                            {/* Image principale */}
                            <div className="relative mb-6 aspect-video overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
                              <LazyImage
                                src={game.media.screenshots[selectedScreenshotIndex]?.url || ""}
                                alt={`${game.title} screenshot`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 80vw"
                                showSkeleton={true}
                              />

                              {/* Navigation */}
                              {game.media.screenshots.length > 1 && (
                                <>
                                  <button
                                    onClick={() =>
                                      setSelectedScreenshotIndex((prev: number) =>
                                        prev > 0 ? prev - 1 : game.media.screenshots.length - 1
                                      )
                                    }
                                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                                  >
                                    <ChevronLeft className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setSelectedScreenshotIndex((prev: number) =>
                                        prev < game.media.screenshots.length - 1 ? prev + 1 : 0
                                      )
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                                  >
                                    <ChevronRight className="h-5 w-5" />
                                  </button>
                                </>
                              )}

                              {/* Indicateur */}
                              <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                                {selectedScreenshotIndex + 1} / {game.media.screenshots.length}
                              </div>
                            </div>

                            {/* Miniatures */}
                            <div className="grid grid-cols-4 gap-3 md:grid-cols-6 lg:grid-cols-8">
                              {game.media.screenshots.map((screenshot, index) => (
                                <button
                                  key={screenshot.id}
                                  onClick={() => setSelectedScreenshotIndex(index)}
                                  className={`relative aspect-video overflow-hidden rounded-xl transition-all ${
                                    selectedScreenshotIndex === index
                                      ? "scale-105 ring-2 ring-white"
                                      : "opacity-70 hover:opacity-100"
                                  }`}
                                >
                                  <LazyImage
                                    src={screenshot.url}
                                    alt={`${game.title} screenshot ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="120px"
                                    showSkeleton={true}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Section Artwork */}
                      {game.media.artwork.length > 0 && (
                        <div>
                          <h3 className="mb-6 text-xl font-bold text-white">
                            {tDetails("media.artwork")}
                          </h3>
                          <div>
                            {/* Image principale */}
                            <div className="relative mb-6 aspect-video overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
                              <LazyImage
                                src={game.media.artwork[selectedArtworkIndex]?.url || ""}
                                alt={`${game.title} artwork`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 80vw"
                                showSkeleton={true}
                              />

                              {/* Navigation */}
                              {game.media.artwork.length > 1 && (
                                <>
                                  <button
                                    onClick={() =>
                                      setSelectedArtworkIndex((prev: number) =>
                                        prev > 0 ? prev - 1 : game.media.artwork.length - 1
                                      )
                                    }
                                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                                  >
                                    <ChevronLeft className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setSelectedArtworkIndex((prev: number) =>
                                        prev < game.media.artwork.length - 1 ? prev + 1 : 0
                                      )
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                                  >
                                    <ChevronRight className="h-5 w-5" />
                                  </button>
                                </>
                              )}

                              {/* Indicateur */}
                              <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                                {selectedArtworkIndex + 1} / {game.media.artwork.length}
                              </div>
                            </div>

                            {/* Miniatures */}
                            <div className="grid grid-cols-4 gap-3 md:grid-cols-6 lg:grid-cols-8">
                              {game.media.artwork.map((artwork, index) => (
                                <button
                                  key={artwork.id}
                                  onClick={() => setSelectedArtworkIndex(index)}
                                  className={`relative aspect-video overflow-hidden rounded-xl transition-all ${
                                    selectedArtworkIndex === index
                                      ? "scale-105 ring-2 ring-white"
                                      : "opacity-70 hover:opacity-100"
                                  }`}
                                >
                                  <LazyImage
                                    src={artwork.url}
                                    alt={`${game.title} artwork ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="120px"
                                    showSkeleton={true}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Section Vidéos */}
                      {game.media.videos.length > 0 && (
                        <div>
                          <h3 className="mb-6 text-xl font-bold text-white">
                            {tDetails("media.videos")}
                          </h3>
                          <div>
                            {/* Vidéo principale */}
                            <div className="relative mb-6 aspect-video overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
                              {game.media.videos[selectedVideoIndex]?.url ? (
                                <video
                                  src={game.media.videos[selectedVideoIndex].url}
                                  controls
                                  className="h-full w-full object-cover"
                                  poster={game.media.videos[selectedVideoIndex]?.thumbnailUrl}
                                >
                                  {tDetails("media.videoNotSupported")}
                                </video>
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Play className="h-16 w-16 text-slate-400" />
                                </div>
                              )}

                              {/* Navigation */}
                              {game.media.videos.length > 1 && (
                                <>
                                  <button
                                    onClick={() =>
                                      setSelectedVideoIndex((prev: number) =>
                                        prev > 0 ? prev - 1 : game.media.videos.length - 1
                                      )
                                    }
                                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                                  >
                                    <ChevronLeft className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setSelectedVideoIndex((prev: number) =>
                                        prev < game.media.videos.length - 1 ? prev + 1 : 0
                                      )
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                                  >
                                    <ChevronRight className="h-5 w-5" />
                                  </button>
                                </>
                              )}

                              {/* Indicateur */}
                              <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                                {selectedVideoIndex + 1} / {game.media.videos.length}
                              </div>
                            </div>

                            {/* Liste des vidéos */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {game.media.videos.map((video, index) => (
                                <button
                                  key={video.id}
                                  onClick={() => setSelectedVideoIndex(index)}
                                  className={`group relative overflow-hidden rounded-xl border transition-all ${
                                    selectedVideoIndex === index
                                      ? "border-white ring-2 ring-white/20"
                                      : "border-slate-700 hover:border-slate-600"
                                  }`}
                                >
                                  <div className="relative aspect-video">
                                    {video.thumbnailUrl ? (
                                      <LazyImage
                                        src={video.thumbnailUrl}
                                        alt={video.title}
                                        fill
                                        className="object-cover"
                                        sizes="300px"
                                        showSkeleton={true}
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center bg-slate-800">
                                        <Play className="h-8 w-8 text-slate-400" />
                                      </div>
                                    )}

                                    {/* Overlay play button */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                                      <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                                        <Play className="h-6 w-6 text-white" />
                                      </div>
                                    </div>

                                    {/* Duration */}
                                    {video.duration && (
                                      <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                                        {Math.floor(video.duration / 60)}:
                                        {(video.duration % 60).toString().padStart(2, "0")}
                                      </div>
                                    )}
                                  </div>

                                  <div className="p-3">
                                    <h4 className="line-clamp-2 text-left text-sm font-medium text-white">
                                      {video.title}
                                    </h4>
                                    {video.description && (
                                      <p className="mt-1 line-clamp-2 text-left text-xs text-slate-400">
                                        {video.description}
                                      </p>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "specs" && (
                    <div>
                      {game.systemRequirements ? (
                        <Card className="rounded-xl border-slate-700 bg-slate-800/50">
                          <CardContent className="p-6">
                            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
                              <Monitor className="h-5 w-5" style={{ color: colors.accent }} />
                              {t("game.systemRequirements")}
                            </h3>
                            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                              <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-slate-300">
                                {JSON.stringify(game.systemRequirements, null, 2)}
                              </pre>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="py-12 text-center text-slate-400">
                          <Monitor className="mx-auto mb-4 h-12 w-12 opacity-50" />
                          <p>{tDetails("specs.noSpecs")}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "reviews" && (
                    <div>
                      <div className="py-12 text-center text-slate-400">
                        <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
                        <p className="mb-2 text-lg font-medium text-white">
                          {tDetails("reviews.title")}
                        </p>
                        <p>{tDetails("reviews.comingSoon")}</p>
                      </div>
                    </div>
                  )}

                  {activeTab === "playtime" && (
                    <GamePlaytime playtime={game.playtime} accentColor={colors.accent} />
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
                                        <span>{lang.name}</span>
                                      </div>
                                    ))}
                                  {game.languages.filter((lang) => lang.hasInterface).length ===
                                    0 && (
                                    <p className="text-sm text-slate-500">
                                      {tDetails("languages.noData")}
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>

                            {/* Sous-titres */}
                            <Card className="rounded-xl border-slate-700 bg-slate-800/50">
                              <CardContent className="p-6">
                                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                                  <MessageSquare
                                    className="h-5 w-5"
                                    style={{ color: colors.accent }}
                                  />
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
                                        <span>{lang.name}</span>
                                      </div>
                                    ))}
                                  {game.languages.filter((lang) => lang.hasSubtitles).length ===
                                    0 && (
                                    <p className="text-sm text-slate-500">
                                      {tDetails("languages.noData")}
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>

                            {/* Voix */}
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
                                        <span>{lang.name}</span>
                                      </div>
                                    ))}
                                  {game.languages.filter((lang) => lang.hasAudio).length === 0 && (
                                    <p className="text-sm text-slate-500">
                                      {tDetails("languages.noData")}
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      ) : (
                        <div className="py-12 text-center text-slate-400">
                          <Languages className="mx-auto mb-4 h-12 w-12 opacity-50" />
                          <p className="mb-2 text-lg font-medium text-white">
                            {tDetails("languages.title")}
                          </p>
                          <p>{tDetails("languages.noData")}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "music" && (
                    <div>
                      <div className="space-y-8">
                        {/* Bande sonore */}
                        <Card className="rounded-xl border-slate-700 bg-slate-800/50">
                          <CardContent className="p-6">
                            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
                              <Music className="h-5 w-5" style={{ color: colors.accent }} />
                              {tDetails("music.soundtrack")}
                            </h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {/* Exemple de pistes */}
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

                        {/* Compositeur */}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
