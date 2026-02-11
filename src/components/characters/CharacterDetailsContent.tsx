"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LazyImage } from "@/components/ui/lazy-image";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  Eye,
  Gamepad2,
  BookOpen,
  Users,
  Star,
  Calendar,
  Swords,
  UserCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { CharacterDetails } from "@/types/character";
import { useState } from "react";

interface CharacterDetailsContentProps {
  character: CharacterDetails;
  locale: string;
}

// Dynamic color system based on character role
const getCharacterColors = (role?: string) => {
  const characterRole = role?.toLowerCase() || "";

  if (characterRole.includes("protagonist") || characterRole.includes("hero")) {
    return {
      primary: "#3b82f6",
      secondary: "#1d4ed8",
      accent: "#60a5fa",
      bg: "from-blue-500/20 to-indigo-500/20",
    };
  }

  if (characterRole.includes("antagonist") || characterRole.includes("villain")) {
    return {
      primary: "#ef4444",
      secondary: "#b91c1c",
      accent: "#f87171",
      bg: "from-red-500/20 to-purple-500/20",
    };
  }

  if (characterRole.includes("supporting") || characterRole.includes("ally")) {
    return {
      primary: "#10b981",
      secondary: "#059669",
      accent: "#34d399",
      bg: "from-emerald-500/20 to-teal-500/20",
    };
  }

  return {
    primary: "#8b5cf6",
    secondary: "#7c3aed",
    accent: "#a78bfa",
    bg: "from-violet-500/20 to-blue-500/20",
  };
};

export function CharacterDetailsContent({ character, locale }: CharacterDetailsContentProps) {
  const t = useTranslations();

  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState(0);
  const [selectedArtworkIndex, setSelectedArtworkIndex] = useState(0);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"media" | "games" | "description">("description");

  const colors = getCharacterColors(character.role);

  // Get primary game background for the hero section
  const primaryGame = character.games.find((g) => g.isPrimary) || character.games[0];
  const heroBackgroundImage = primaryGame?.backgroundImage || character.media.backgroundImage;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: character.backgroundColor || "#0f172a" }}
    >
      {/* Hero Section - Character centered over game background */}
      <div className="relative min-h-[45vh] overflow-hidden">
        {/* Game background image */}
        {heroBackgroundImage && (
          <div className="absolute inset-0 z-0">
            <LazyImage
              src={heroBackgroundImage}
              alt={`${primaryGame?.title || character.primaryGame} background`}
              fill
              className="object-cover object-center"
              sizes="100vw"
              priority
              showSkeleton={true}
            />
            {/* Multiple gradient overlays for depth */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, 
                  ${character.backgroundColor || "#0f172a"}40 0%, 
                  transparent 30%, 
                  transparent 50%,
                  ${character.backgroundColor || "#0f172a"}95 85%, 
                  ${character.backgroundColor || "#0f172a"} 100%)`,
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to right, 
                  ${character.backgroundColor || "#0f172a"}90 0%, 
                  transparent 25%, 
                  transparent 75%,
                  ${character.backgroundColor || "#0f172a"}90 100%)`,
              }}
            />
            {/* Vignette */}
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at center bottom, transparent 30%, ${character.backgroundColor || "#0f172a"}60 100%)`,
              }}
            />
          </div>
        )}

        {/* Navigation buttons - positioned at top of hero */}
        <div className="absolute left-0 right-0 top-0 z-20 px-4 py-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <Link href={`/${locale}/characters`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 hover:text-white"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("common.back")}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="container relative z-10 mx-auto px-4 pt-16">
          <div className="flex flex-col items-center justify-center lg:flex-row lg:items-center lg:justify-center">
            {/* Character Image - Centered */}
            <div className="relative flex-shrink-0">
              <div
                className={`absolute -inset-8 bg-gradient-to-t ${colors.bg} rounded-full opacity-30 blur-3xl`}
              />
              <div className="relative">
                {/* Main character image with transparent background effect */}
                <div className="relative h-[400px] w-[300px] lg:h-[480px] lg:w-[360px]">
                  <LazyImage
                    src={character.media.mainImage}
                    alt={character.name}
                    fill
                    className="object-contain object-bottom drop-shadow-2xl"
                    sizes="(max-width: 768px) 375px, 450px"
                    priority
                    showSkeleton={true}
                  />
                </div>
              </div>
            </div>

            {/* Character Info - Right side */}
            <div className="mt-2 max-w-lg text-center lg:mt-0 lg:flex-1 lg:pl-6 lg:text-left">
              {/* Character name */}
              <h1 className="mb-3 text-5xl font-bold leading-tight text-white drop-shadow-lg [text-shadow:_0_2px_8px_rgba(0,0,0,0.5)] lg:text-6xl">
                {character.name}
              </h1>

              {/* Short description */}
              {character.description && (
                <p className="text-lg leading-relaxed text-slate-200 [text-shadow:_0_1px_4px_rgba(0,0,0,0.4)]">
                  {character.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section - Below the hero */}
      <div className="relative z-20 mt-2">
        <div className="container mx-auto px-4 pb-16">
          {/* Tabs navigation */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex gap-1 rounded-2xl border border-slate-700/50 bg-slate-800/80 p-1.5 backdrop-blur-sm">
              <button
                onClick={() => setActiveTab("description")}
                className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === "description"
                    ? "bg-white text-slate-900 shadow-lg"
                    : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <BookOpen className="mr-2 inline h-4 w-4" />
                {t("characters.tabs.description")}
              </button>
              <button
                onClick={() => setActiveTab("games")}
                className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === "games"
                    ? "bg-white text-slate-900 shadow-lg"
                    : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <Gamepad2 className="mr-2 inline h-4 w-4" />
                {t("characters.tabs.games")} ({character.games.length})
              </button>
              <button
                onClick={() => setActiveTab("media")}
                className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === "media"
                    ? "bg-white text-slate-900 shadow-lg"
                    : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <Eye className="mr-2 inline h-4 w-4" />
                {t("characters.tabs.media")}
              </button>
            </div>
          </div>

          {/* Tab content */}
          <div className="mx-auto max-w-6xl">
            {/* Media Tab */}
            {activeTab === "media" && (
              <div className="space-y-12">
                {/* Screenshots */}
                {character.media.screenshots.length > 0 && (
                  <section>
                    <h3 className="mb-6 text-xl font-bold text-white">
                      {t("characters.media.screenshots")}
                    </h3>
                    <div className="relative mb-4 aspect-video overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50">
                      <LazyImage
                        src={character.media.screenshots[selectedScreenshotIndex]?.url || ""}
                        alt={`${character.name} screenshot`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 80vw"
                        showSkeleton={true}
                      />
                      {character.media.screenshots.length > 1 && (
                        <>
                          <button
                            onClick={() =>
                              setSelectedScreenshotIndex((prev) =>
                                prev > 0 ? prev - 1 : character.media.screenshots.length - 1
                              )
                            }
                            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white backdrop-blur-sm transition-all hover:bg-black/80"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              setSelectedScreenshotIndex((prev) =>
                                prev < character.media.screenshots.length - 1 ? prev + 1 : 0
                              )
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white backdrop-blur-sm transition-all hover:bg-black/80"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      <div className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur-sm">
                        {selectedScreenshotIndex + 1} / {character.media.screenshots.length}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8">
                      {character.media.screenshots.map((screenshot, index) => (
                        <button
                          key={screenshot.id}
                          onClick={() => setSelectedScreenshotIndex(index)}
                          className={`relative aspect-video overflow-hidden rounded-lg transition-all ${
                            selectedScreenshotIndex === index
                              ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900"
                              : "opacity-60 hover:opacity-100"
                          }`}
                        >
                          <LazyImage
                            src={screenshot.url}
                            alt={`Screenshot ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="100px"
                            showSkeleton={true}
                          />
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Artwork */}
                {character.media.artwork.length > 0 && (
                  <section>
                    <h3 className="mb-6 text-xl font-bold text-white">
                      {t("characters.media.artwork")}
                    </h3>
                    <div className="relative mb-4 aspect-video overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50">
                      <LazyImage
                        src={character.media.artwork[selectedArtworkIndex]?.url || ""}
                        alt={`${character.name} artwork`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 80vw"
                        showSkeleton={true}
                      />
                      {character.media.artwork.length > 1 && (
                        <>
                          <button
                            onClick={() =>
                              setSelectedArtworkIndex((prev) =>
                                prev > 0 ? prev - 1 : character.media.artwork.length - 1
                              )
                            }
                            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white backdrop-blur-sm transition-all hover:bg-black/80"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              setSelectedArtworkIndex((prev) =>
                                prev < character.media.artwork.length - 1 ? prev + 1 : 0
                              )
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white backdrop-blur-sm transition-all hover:bg-black/80"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      <div className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur-sm">
                        {selectedArtworkIndex + 1} / {character.media.artwork.length}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8">
                      {character.media.artwork.map((art, index) => (
                        <button
                          key={art.id}
                          onClick={() => setSelectedArtworkIndex(index)}
                          className={`relative aspect-video overflow-hidden rounded-lg transition-all ${
                            selectedArtworkIndex === index
                              ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900"
                              : "opacity-60 hover:opacity-100"
                          }`}
                        >
                          <LazyImage
                            src={art.url}
                            alt={`Artwork ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="100px"
                            showSkeleton={true}
                          />
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Videos */}
                {character.media.videos.length > 0 && (
                  <section>
                    <h3 className="mb-6 text-xl font-bold text-white">
                      {t("characters.media.videos")}
                    </h3>
                    <div className="relative mb-4 aspect-video overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50">
                      {character.media.videos[selectedVideoIndex]?.url ? (
                        <video
                          src={character.media.videos[selectedVideoIndex].url}
                          controls
                          className="h-full w-full object-cover"
                          poster={character.media.videos[selectedVideoIndex]?.thumbnailUrl}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Play className="h-16 w-16 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                      {character.media.videos.map((video, index) => (
                        <button
                          key={video.id}
                          onClick={() => setSelectedVideoIndex(index)}
                          className={`group relative overflow-hidden rounded-xl border transition-all ${
                            selectedVideoIndex === index
                              ? "border-white ring-2 ring-white/20"
                              : "border-slate-700/50 hover:border-slate-600"
                          }`}
                        >
                          <div className="relative aspect-video">
                            {video.thumbnailUrl ? (
                              <LazyImage
                                src={video.thumbnailUrl}
                                alt={video.title}
                                fill
                                className="object-cover"
                                sizes="200px"
                                showSkeleton={true}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-slate-800">
                                <Play className="h-8 w-8 text-slate-400" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                              <Play className="h-8 w-8 text-white" />
                            </div>
                          </div>
                          <div className="bg-slate-800/80 p-2">
                            <p className="truncate text-sm font-medium text-white">{video.title}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Empty state */}
                {character.media.screenshots.length === 0 &&
                  character.media.artwork.length === 0 &&
                  character.media.videos.length === 0 && (
                    <div className="py-16 text-center">
                      <Eye className="mx-auto mb-4 h-12 w-12 text-slate-500" />
                      <p className="text-slate-400">{t("characters.media.noMedia")}</p>
                    </div>
                  )}
              </div>
            )}

            {/* Games Tab */}
            {activeTab === "games" && (
              <div>
                <h3 className="mb-6 text-xl font-bold text-white">
                  {t("characters.details.gameAppearances")}
                </h3>
                {character.games.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {character.games.map((game) => (
                      <Link
                        key={game.id}
                        href={`/${locale}/games/${game.slug}`}
                        className={`group relative overflow-hidden rounded-2xl border transition-all hover:scale-[1.02] ${
                          game.isPrimary
                            ? "border-2 shadow-lg shadow-violet-500/20"
                            : "border-slate-700/50 hover:border-slate-600"
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
                              sizes="250px"
                              showSkeleton={true}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-slate-800">
                              <Gamepad2 className="h-12 w-12 text-slate-500" />
                            </div>
                          )}
                          {game.isPrimary && (
                            <div className="absolute left-2 top-2">
                              <Badge
                                className="text-xs font-bold text-white shadow-lg"
                                style={{ backgroundColor: colors.primary }}
                              >
                                {t("characters.details.primary")}
                              </Badge>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h4 className="text-lg font-bold text-white">{game.title}</h4>
                            {game.releaseYear && (
                              <p className="flex items-center gap-1 text-sm text-slate-300">
                                <Calendar className="h-3 w-3" />
                                {game.releaseYear}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <Gamepad2 className="mx-auto mb-4 h-12 w-12 text-slate-500" />
                    <p className="text-slate-400">{t("characters.details.noGames")}</p>
                  </div>
                )}
              </div>
            )}

            {/* Description Tab */}
            {activeTab === "description" && (
              <div className="space-y-8">
                {/* Character Info Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Role */}
                  {character.role && (
                    <Card className="rounded-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                      <CardContent className="p-6">
                        <div className="mb-2 flex items-center gap-2 text-slate-400">
                          <Star className="h-4 w-4" style={{ color: colors.accent }} />
                          <span className="text-sm font-medium">
                            {t("characters.details.role")}
                          </span>
                        </div>
                        <p className="text-lg font-semibold text-white">{character.role}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Primary Game */}
                  <Card className="rounded-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="mb-2 flex items-center gap-2 text-slate-400">
                        <Gamepad2 className="h-4 w-4" style={{ color: colors.accent }} />
                        <span className="text-sm font-medium">
                          {t("characters.details.primaryGame")}
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-white">{character.primaryGame}</p>
                      {primaryGame?.releaseYear && (
                        <p className="mt-1 text-sm text-slate-400">{primaryGame.releaseYear}</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Appearances */}
                  <Card className="rounded-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="mb-2 flex items-center gap-2 text-slate-400">
                        <Users className="h-4 w-4" style={{ color: colors.accent }} />
                        <span className="text-sm font-medium">
                          {t("characters.details.appearances")}
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-white">
                        {t("characters.details.gamesCount", { count: character.games.length })}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Weapons */}
                {character.weapons && (
                  <Card className="rounded-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                        <Swords className="h-5 w-5" style={{ color: colors.accent }} />
                        {t("characters.details.weaponsEquipment")}
                      </h4>
                      <p className="whitespace-pre-wrap leading-relaxed text-slate-300">
                        {character.weapons}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Biography */}
                {character.biography && (
                  <Card className="rounded-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                        <BookOpen className="h-5 w-5" style={{ color: colors.accent }} />
                        {t("characters.details.biography")}
                      </h4>
                      <div className="prose prose-invert max-w-none">
                        <p className="whitespace-pre-wrap leading-relaxed text-slate-300">
                          {character.biography}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Relationships */}
                {character.relationships && character.relationships.length > 0 && (
                  <Card className="rounded-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <h4 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
                        <UserCircle className="h-5 w-5" style={{ color: colors.accent }} />
                        {t("characters.details.relationships")}
                      </h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {character.relationships.map((rel) => (
                          <Link
                            key={rel.id}
                            href={`/${locale}/characters/${rel.relatedCharacter.slug}`}
                            className="group flex items-center gap-4 rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 transition-all hover:border-slate-600 hover:bg-slate-800/50"
                          >
                            {/* Character avatar */}
                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-slate-600">
                              {rel.relatedCharacter.mainImage ? (
                                <LazyImage
                                  src={rel.relatedCharacter.mainImage}
                                  alt={rel.relatedCharacter.name}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                  showSkeleton={true}
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-slate-700">
                                  <UserCircle className="h-8 w-8 text-slate-500" />
                                </div>
                              )}
                            </div>
                            {/* Info */}
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-white transition-colors group-hover:text-violet-300">
                                {rel.relatedCharacter.name}
                              </p>
                              <Badge
                                variant="secondary"
                                className="mt-1 text-xs"
                                style={{
                                  backgroundColor:
                                    rel.relationshipType === "ally" ||
                                    rel.relationshipType === "friend"
                                      ? "#10b98120"
                                      : rel.relationshipType === "enemy" ||
                                          rel.relationshipType === "rival"
                                        ? "#ef444420"
                                        : rel.relationshipType === "family" ||
                                            rel.relationshipType === "romantic"
                                          ? "#f59e0b20"
                                          : "#8b5cf620",
                                  color:
                                    rel.relationshipType === "ally" ||
                                    rel.relationshipType === "friend"
                                      ? "#34d399"
                                      : rel.relationshipType === "enemy" ||
                                          rel.relationshipType === "rival"
                                        ? "#f87171"
                                        : rel.relationshipType === "family" ||
                                            rel.relationshipType === "romantic"
                                          ? "#fbbf24"
                                          : "#a78bfa",
                                }}
                              >
                                {t(
                                  `characters.details.relationshipTypes.${rel.relationshipType}`
                                ) ||
                                  rel.relationshipType.charAt(0).toUpperCase() +
                                    rel.relationshipType.slice(1)}
                              </Badge>
                              {rel.description && (
                                <p className="mt-1 line-clamp-1 text-sm text-slate-400">
                                  {rel.description}
                                </p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Empty state */}
                {!character.biography &&
                  !character.weapons &&
                  (!character.relationships || character.relationships.length === 0) && (
                    <div className="py-16 text-center">
                      <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-500" />
                      <p className="text-slate-400">{t("characters.details.noDescription")}</p>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
