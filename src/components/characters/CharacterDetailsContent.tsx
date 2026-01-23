"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LazyImage } from "@/components/ui/lazy-image";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Play,
  Eye,
  Gamepad2,
  BookOpen,
  Users,
  Star,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { CharacterDetails } from "@/types/character";
import { useState } from "react";

interface CharacterDetailsContentProps {
  character: CharacterDetails;
  locale: string;
}

// Dynamic color system based on character name and role
const getCharacterColors = (characterName: string, role?: string) => {
  const name = characterName.toLowerCase();
  const characterRole = role?.toLowerCase() || "";

  // Protagonist colors - heroic blue/gold
  if (characterRole.includes("protagonist") || characterRole.includes("hero")) {
    return {
      primary: "#3b82f6", // blue-500
      secondary: "#1d4ed8", // blue-700
      accent: "#60a5fa", // blue-400
      bg: "from-blue-500/10 to-indigo-500/10",
    };
  }

  // Antagonist colors - dark red/purple
  if (characterRole.includes("antagonist") || characterRole.includes("villain")) {
    return {
      primary: "#ef4444", // red-500
      secondary: "#b91c1c", // red-700
      accent: "#f87171", // red-400
      bg: "from-red-500/10 to-purple-500/10",
    };
  }

  // Supporting character colors - green/teal
  if (characterRole.includes("supporting") || characterRole.includes("ally")) {
    return {
      primary: "#10b981", // emerald-500
      secondary: "#059669", // emerald-600
      accent: "#34d399", // emerald-400
      bg: "from-emerald-500/10 to-teal-500/10",
    };
  }

  // NPC colors - amber/orange
  if (characterRole.includes("npc")) {
    return {
      primary: "#f59e0b", // amber-500
      secondary: "#d97706", // amber-600
      accent: "#fbbf24", // amber-400
      bg: "from-amber-500/10 to-orange-500/10",
    };
  }

  // Default colors - violet
  return {
    primary: "#8b5cf6", // violet-500
    secondary: "#7c3aed", // violet-600
    accent: "#a78bfa", // violet-400
    bg: "from-violet-500/10 to-blue-500/10",
  };
};

// Format date utility function
const formatDate = (dateString: string, locale: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

export function CharacterDetailsContent({ character, locale }: CharacterDetailsContentProps) {
  const t = useTranslations();

  // State management for media galleries
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState(0);
  const [selectedArtworkIndex, setSelectedArtworkIndex] = useState(0);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

  // State for active tab
  const [activeTab, setActiveTab] = useState<"media" | "games" | "bio">("media");

  // State for favorites
  const [isFavorited, setIsFavorited] = useState(false);

  // Get dynamic colors based on character
  const colors = getCharacterColors(character.name, character.role);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: character.backgroundColor || "#0f172a",
      }}
    >
      {/* Sticky Header with navigation */}
      <div className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/${locale}/characters`}>
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
                className={`${isFavorited ? "text-red-400" : "text-slate-300"} hover:text-white`}
                onClick={() => setIsFavorited(!isFavorited)}
              >
                <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section with background image */}
      <div className="relative">
        {/* Background image - only for hero section */}
        {character.media.backgroundImage && (
          <div className="absolute inset-0 z-0 h-[80vh] overflow-hidden">
            <LazyImage
              src={character.media.backgroundImage}
              alt={`${character.name} background`}
              fill
              className="object-cover object-center"
              sizes="100vw"
              priority
              showSkeleton={true}
            />
            {/* Overlay gradient for ambiance */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, ${character.backgroundColor || "#0f172a"}20 0%, ${character.backgroundColor || "#0f172a"}60 40%, ${character.backgroundColor || "#0f172a"}90 70%, ${character.backgroundColor || "#0f172a"} 100%)`,
              }}
            />
            {/* Vignette effect */}
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at center, transparent 0%, ${character.backgroundColor || "#0f172a"}40 70%, ${character.backgroundColor || "#0f172a"}80 100%)`,
              }}
            />
          </div>
        )}

        <div className="container relative z-10 mx-auto flex min-h-[80vh] items-center px-4 py-8">
          <div className="grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-12">
            {/* Left column - Character main image */}
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                {/* Main character image */}
                <div className="group relative">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${colors.bg} scale-105 rounded-xl opacity-50 blur-xl`}
                  />
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-slate-700 bg-slate-800/80 backdrop-blur-sm">
                    <LazyImage
                      src={character.media.mainImage}
                      alt={character.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      priority
                      showSkeleton={true}
                    />

                    {/* Role badge */}
                    {character.role && (
                      <div className="absolute right-4 top-4">
                        <Badge
                          className="px-3 py-1 text-sm font-bold text-white shadow-lg"
                          style={{ backgroundColor: colors.primary }}
                        >
                          {character.role}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Character info */}
            <div className="lg:col-span-8">
              {/* Character header */}
              <div className="mb-8">
                {/* Role badges */}
                {character.role && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      className="border-slate-600 bg-slate-800/80 text-slate-300 backdrop-blur-sm"
                    >
                      {character.role}
                    </Badge>
                  </div>
                )}

                {/* Character name */}
                <h1 className="mb-4 text-4xl font-bold leading-tight text-white drop-shadow-lg lg:text-6xl">
                  {character.name}
                </h1>

                {/* Metadata */}
                <div className="mb-6 flex flex-wrap gap-6 text-slate-300">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4" style={{ color: colors.accent }} />
                    <span>{character.primaryGame}</span>
                  </div>
                  {character.games.length > 1 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" style={{ color: colors.accent }} />
                      <span>
                        {locale === "fr"
                          ? `${character.games.length} jeux`
                          : `${character.games.length} games`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {character.description && (
                  <p className="max-w-4xl text-lg leading-relaxed text-slate-200 drop-shadow-sm">
                    {character.description}
                  </p>
                )}
              </div>

              {/* Overview section */}
              <div className="space-y-12">
                <div>
                  <h2 className="mb-6 text-2xl font-bold text-white">
                    {locale === "fr" ? "Aperçu" : "Overview"}
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Primary Game */}
                    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Gamepad2 className="h-4 w-4" style={{ color: colors.accent }} />
                        <div className="text-sm text-slate-400">
                          {locale === "fr" ? "Jeu principal" : "Primary Game"}
                        </div>
                      </div>
                      <div className="font-medium text-white">{character.primaryGame}</div>
                    </div>

                    {/* Role */}
                    {character.role && (
                      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Star className="h-4 w-4" style={{ color: colors.accent }} />
                          <div className="text-sm text-slate-400">
                            {locale === "fr" ? "Rôle" : "Role"}
                          </div>
                        </div>
                        <div className="font-medium text-white">{character.role}</div>
                      </div>
                    )}

                    {/* Appearances count */}
                    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" style={{ color: colors.accent }} />
                        <div className="text-sm text-slate-400">
                          {locale === "fr" ? "Apparitions" : "Appearances"}
                        </div>
                      </div>
                      <div className="font-medium text-white">
                        {character.games.length} {locale === "fr" ? "jeu(x)" : "game(s)"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs navigation */}
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
                      {locale === "fr" ? "Médias" : "Media"}
                    </button>
                    <button
                      onClick={() => setActiveTab("games")}
                      className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
                        activeTab === "games"
                          ? "bg-white text-slate-900"
                          : "text-slate-400 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      <Gamepad2 className="mr-2 inline h-4 w-4" />
                      {locale === "fr" ? "Jeux" : "Games"}
                    </button>
                    <button
                      onClick={() => setActiveTab("bio")}
                      className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
                        activeTab === "bio"
                          ? "bg-white text-slate-900"
                          : "text-slate-400 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      <BookOpen className="mr-2 inline h-4 w-4" />
                      {locale === "fr" ? "Biographie" : "Biography"}
                    </button>
                  </div>
                </div>

                {/* Tab content */}
                <div className="space-y-8">
                  {/* Media Tab */}
                  {activeTab === "media" && (
                    <div className="space-y-12">
                      {/* Screenshots section */}
                      {character.media.screenshots.length > 0 && (
                        <div>
                          <h3 className="mb-6 text-xl font-bold text-white">
                            {locale === "fr" ? "Captures d'écran" : "Screenshots"}
                          </h3>
                          <div>
                            {/* Main image */}
                            <div className="relative mb-6 aspect-video overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
                              <LazyImage
                                src={
                                  character.media.screenshots[selectedScreenshotIndex]?.url || ""
                                }
                                alt={`${character.name} screenshot`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 80vw"
                                showSkeleton={true}
                              />

                              {/* Navigation */}
                              {character.media.screenshots.length > 1 && (
                                <>
                                  <button
                                    onClick={() =>
                                      setSelectedScreenshotIndex((prev: number) =>
                                        prev > 0 ? prev - 1 : character.media.screenshots.length - 1
                                      )
                                    }
                                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                                  >
                                    <ChevronLeft className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setSelectedScreenshotIndex((prev: number) =>
                                        prev < character.media.screenshots.length - 1 ? prev + 1 : 0
                                      )
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                                  >
                                    <ChevronRight className="h-5 w-5" />
                                  </button>
                                </>
                              )}

                              {/* Indicator */}
                              <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                                {selectedScreenshotIndex + 1} / {character.media.screenshots.length}
                              </div>
                            </div>

                            {/* Thumbnails */}
                            <div className="grid grid-cols-4 gap-3 md:grid-cols-6 lg:grid-cols-8">
                              {character.media.screenshots.map((screenshot, index) => (
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
                                    alt={`${character.name} screenshot ${index + 1}`}
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

                      {/* Artwork section */}
                      {character.media.artwork.length > 0 && (
                        <div>
                          <h3 className="mb-6 text-xl font-bold text-white">
                            {locale === "fr" ? "Illustrations" : "Artwork"}
                          </h3>
                          <div>
                            {/* Main image */}
                            <div className="relative mb-6 aspect-video overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
                              <LazyImage
                                src={character.media.artwork[selectedArtworkIndex]?.url || ""}
                                alt={`${character.name} artwork`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 80vw"
                                showSkeleton={true}
                              />

                              {/* Navigation */}
                              {character.media.artwork.length > 1 && (
                                <>
                                  <button
                                    onClick={() =>
                                      setSelectedArtworkIndex((prev: number) =>
                                        prev > 0 ? prev - 1 : character.media.artwork.length - 1
                                      )
                                    }
                                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                                  >
                                    <ChevronLeft className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setSelectedArtworkIndex((prev: number) =>
                                        prev < character.media.artwork.length - 1 ? prev + 1 : 0
                                      )
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                                  >
                                    <ChevronRight className="h-5 w-5" />
                                  </button>
                                </>
                              )}

                              {/* Indicator */}
                              <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                                {selectedArtworkIndex + 1} / {character.media.artwork.length}
                              </div>
                            </div>

                            {/* Thumbnails */}
                            <div className="grid grid-cols-4 gap-3 md:grid-cols-6 lg:grid-cols-8">
                              {character.media.artwork.map((artwork, index) => (
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
                                    alt={`${character.name} artwork ${index + 1}`}
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

                      {/* Videos section */}
                      {character.media.videos.length > 0 && (
                        <div>
                          <h3 className="mb-6 text-xl font-bold text-white">
                            {locale === "fr" ? "Vidéos" : "Videos"}
                          </h3>
                          <div>
                            {/* Main video */}
                            <div className="relative mb-6 aspect-video overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
                              {character.media.videos[selectedVideoIndex]?.url ? (
                                <video
                                  src={character.media.videos[selectedVideoIndex].url}
                                  controls
                                  className="h-full w-full object-cover"
                                  poster={character.media.videos[selectedVideoIndex]?.thumbnailUrl}
                                >
                                  {locale === "fr"
                                    ? "Votre navigateur ne supporte pas la lecture vidéo."
                                    : "Your browser does not support video playback."}
                                </video>
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Play className="h-16 w-16 text-slate-400" />
                                </div>
                              )}

                              {/* Navigation */}
                              {character.media.videos.length > 1 && (
                                <>
                                  <button
                                    onClick={() =>
                                      setSelectedVideoIndex((prev: number) =>
                                        prev > 0 ? prev - 1 : character.media.videos.length - 1
                                      )
                                    }
                                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                                  >
                                    <ChevronLeft className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setSelectedVideoIndex((prev: number) =>
                                        prev < character.media.videos.length - 1 ? prev + 1 : 0
                                      )
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70"
                                  >
                                    <ChevronRight className="h-5 w-5" />
                                  </button>
                                </>
                              )}

                              {/* Indicator */}
                              <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                                {selectedVideoIndex + 1} / {character.media.videos.length}
                              </div>
                            </div>

                            {/* Video list */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {character.media.videos.map((video, index) => (
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

                      {/* Empty media state */}
                      {character.media.screenshots.length === 0 &&
                        character.media.artwork.length === 0 &&
                        character.media.videos.length === 0 && (
                          <div className="py-12 text-center text-slate-400">
                            <Eye className="mx-auto mb-4 h-12 w-12 opacity-50" />
                            <p>
                              {locale === "fr" ? "Aucun média disponible" : "No media available"}
                            </p>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Games Tab */}
                  {activeTab === "games" && (
                    <div>
                      <h3 className="mb-6 text-xl font-bold text-white">
                        {locale === "fr"
                          ? "Jeux avec ce personnage"
                          : "Games featuring this character"}
                      </h3>
                      {character.games.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {character.games.map((game) => (
                            <Link
                              key={game.id}
                              href={`/${locale}/games/${game.slug}`}
                              className={`group relative overflow-hidden rounded-xl border transition-all hover:border-slate-600 ${
                                game.isPrimary
                                  ? "border-2 ring-2 ring-white/20"
                                  : "border-slate-700"
                              }`}
                              style={{
                                borderColor: game.isPrimary ? colors.primary : undefined,
                              }}
                            >
                              <div className="relative aspect-[3/4]">
                                {game.coverImage ? (
                                  <LazyImage
                                    src={game.coverImage}
                                    alt={game.title}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    sizes="300px"
                                    showSkeleton={true}
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-slate-800">
                                    <Gamepad2 className="h-12 w-12 text-slate-400" />
                                  </div>
                                )}

                                {/* Primary game badge */}
                                {game.isPrimary && (
                                  <div className="absolute left-2 top-2">
                                    <Badge
                                      className="text-xs font-bold text-white"
                                      style={{ backgroundColor: colors.primary }}
                                    >
                                      {locale === "fr" ? "Jeu principal" : "Primary"}
                                    </Badge>
                                  </div>
                                )}

                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                {/* Game info */}
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                  <h4 className="text-lg font-bold text-white">{game.title}</h4>
                                  {game.releaseYear && (
                                    <p className="text-sm text-slate-300">{game.releaseYear}</p>
                                  )}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-slate-400">
                          <Gamepad2 className="mx-auto mb-4 h-12 w-12 opacity-50" />
                          <p>{locale === "fr" ? "Aucun jeu associé" : "No associated games"}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Biography Tab */}
                  {activeTab === "bio" && (
                    <div>
                      <h3 className="mb-6 text-xl font-bold text-white">
                        {locale === "fr" ? "Biographie" : "Biography"}
                      </h3>
                      {character.biography ? (
                        <Card className="rounded-xl border-slate-700 bg-slate-800/50">
                          <CardContent className="p-6">
                            <div className="prose prose-invert max-w-none">
                              <p className="whitespace-pre-wrap leading-relaxed text-slate-300">
                                {character.biography}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="py-12 text-center text-slate-400">
                          <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-50" />
                          <p>
                            {locale === "fr"
                              ? "Aucune biographie disponible"
                              : "No biography available"}
                          </p>
                        </div>
                      )}
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
