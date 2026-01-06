"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Star,
  Monitor,
  DollarSign,
  Users,
  Globe,
  Play,
  Heart,
  Share2,
  Download,
  Trophy,
  Gamepad2,
  Clock,
  Eye,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { GameDetails } from "@/types/game";
import { useState } from "react";

interface GameDetailsProps {
  game: GameDetails;
  locale: string;
}

export function GameDetailsContent({ game, locale }: GameDetailsProps) {
  const t = useTranslations();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const isAllowedImageHost = (url: string) => {
    const allowedHosts = [
      "igdb.com",
      "playstation.com",
      "gog.com",
      "steampowered.com",
      "microsoft.com",
      "epicgames.com",
    ];
    return allowedHosts.some((host) => url.includes(host));
  };

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
    if (!score) return "from-gray-500 to-gray-600";
    if (score >= 90) return "from-green-500 to-green-600";
    if (score >= 75) return "from-green-400 to-green-500";
    if (score >= 60) return "from-yellow-400 to-yellow-500";
    if (score >= 40) return "from-orange-400 to-orange-500";
    return "from-red-400 to-red-500";
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  const allMedia = [
    ...(game.media.coverImage ? [{ type: "cover", url: game.media.coverImage, id: "cover" }] : []),
    ...game.media.screenshots.map((s) => ({ type: "screenshot", url: s.url, id: s.id })),
    ...game.media.artwork.map((a) => ({ type: "artwork", url: a.url, id: a.id })),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section with Background */}
      <div className="relative">
        {/* Background Image */}
        {game.media.screenshots.length > 0 && (
          <div className="absolute inset-0 h-[70vh]">
            <Image
              src={game.media.screenshots[0].url}
              alt={game.title}
              fill
              className="object-cover opacity-30"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
          </div>
        )}

        {/* Navigation */}
        <div className="container relative z-10 mx-auto px-4 py-6">
          <Link href={`/${locale}/games`}>
            <Button variant="ghost" className="gap-2 text-white backdrop-blur-sm hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>
        </div>

        {/* Hero Content */}
        <div className="container relative z-10 mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12">
            {/* Cover Image */}
            <div className="lg:col-span-3">
              <div className="relative mx-auto aspect-[3/4] max-w-sm lg:mx-0">
                <div className="absolute inset-0 scale-105 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 blur-xl" />
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl ring-1 ring-white/10">
                  {game.media.coverImage ? (
                    <Image
                      src={game.media.coverImage}
                      alt={game.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 25vw"
                      priority
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Gamepad2 className="h-16 w-16 text-gray-400" />
                    </div>
                  )}

                  {/* Metascore Badge */}
                  {game.metascore && (
                    <div className="absolute right-4 top-4">
                      <div
                        className={`bg-gradient-to-br ${getMetascoreColor(game.metascore)} flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg ring-4 ring-white/20 backdrop-blur-sm`}
                      >
                        {game.metascore}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Game Info */}
            <div className="text-center lg:col-span-6 lg:text-left">
              <div className="space-y-4">
                {/* Genres */}
                {game.genres.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                    {game.genres.slice(0, 3).map((genre) => (
                      <Badge
                        key={genre.id}
                        className="border-purple-400/30 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-200 backdrop-blur-sm"
                      >
                        {genre.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h1 className="text-4xl font-bold leading-tight text-white lg:text-6xl">
                  {game.title}
                </h1>

                {/* Developer & Publisher */}
                <div className="flex flex-col justify-center gap-4 text-gray-300 sm:flex-row lg:justify-start">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span>{game.developer}</span>
                  </div>
                  {game.publisher !== game.developer && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-green-400" />
                      <span>{game.publisher}</span>
                    </div>
                  )}
                  {game.releaseDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-400" />
                      <span>{formatReleaseDate(game.releaseDate)}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {game.description && (
                  <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-300 lg:mx-0">
                    {game.description}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="lg:col-span-3">
              <div className="flex flex-col gap-3">
                <Button className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg hover:from-purple-700 hover:to-blue-700">
                  <Play className="mr-2 h-5 w-5" />
                  {locale === "fr" ? "Jouer maintenant" : "Play Now"}
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-white/20 text-white backdrop-blur-sm hover:bg-white/10"
                    onClick={() => setIsWishlisted(!isWishlisted)}
                  >
                    <Heart
                      className={`mr-2 h-4 w-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`}
                    />
                    {locale === "fr" ? "Favoris" : "Wishlist"}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="border-white/20 text-white backdrop-blur-sm hover:bg-white/10"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {game.metascore && (
                    <div className="rounded-lg bg-white/10 p-3 text-center backdrop-blur-sm">
                      <div className="mb-1 flex items-center justify-center gap-1 text-yellow-400">
                        <Star className="h-4 w-4" />
                        <span className="font-bold">{game.metascore}</span>
                      </div>
                      <div className="text-xs text-gray-300">Metascore</div>
                    </div>
                  )}

                  {game.ageRating && (
                    <div className="rounded-lg bg-white/10 p-3 text-center backdrop-blur-sm">
                      <div className="mb-1 flex items-center justify-center gap-1 text-orange-400">
                        <Trophy className="h-4 w-4" />
                        <span className="font-bold">
                          {game.ageRating.minimumAge || game.ageRating.ratingCode}
                        </span>
                      </div>
                      <div className="text-xs text-gray-300">{game.ageRating.system}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="container mx-auto space-y-8 px-4 py-8">
        {/* Media Gallery */}
        {allMedia.length > 0 && (
          <Card className="overflow-hidden border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white">
                <Eye className="h-6 w-6 text-purple-400" />
                {locale === "fr" ? "Galerie" : "Gallery"}
              </h2>

              {/* Main Image */}
              <div className="relative mb-4 aspect-video overflow-hidden rounded-xl bg-gray-800">
                <Image
                  src={allMedia[selectedImageIndex]?.url || game.media.coverImage || ""}
                  alt={game.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 80vw"
                />
              </div>

              {/* Thumbnail Strip */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allMedia.map((media, index) => (
                  <button
                    key={media.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg transition-all ${
                      selectedImageIndex === index
                        ? "scale-105 ring-2 ring-purple-400"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={media.url}
                      alt={`${game.title} ${media.type}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Game Details Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Pricing */}
          {game.pricing.length > 0 && (
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  {t("game.price")}
                </h3>
                <div className="space-y-3">
                  {game.pricing.slice(0, 3).map((price, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                    >
                      <div className="flex items-center gap-3">
                        {price.store.logoUrl && isAllowedImageHost(price.store.logoUrl) && (
                          <Image
                            src={price.store.logoUrl}
                            alt={price.store.name}
                            width={24}
                            height={24}
                            className="rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        <div>
                          <div className="font-medium text-white">{price.store.name}</div>
                          <div className="text-xs text-gray-400">{price.platform}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">
                          {formatPrice(price.price, price.currency)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Game Info */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                <Zap className="h-5 w-5 text-blue-400" />
                {locale === "fr" ? "Informations" : "Game Info"}
              </h3>
              <div className="space-y-4">
                {game.genres.length > 0 && (
                  <div>
                    <div className="mb-2 text-sm text-gray-400">{t("game.genres")}</div>
                    <div className="flex flex-wrap gap-1">
                      {game.genres.map((genre) => (
                        <Badge
                          key={genre.id}
                          variant="secondary"
                          className="border-purple-400/30 bg-purple-500/20 text-purple-200"
                        >
                          {genre.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {game.releaseDate && (
                  <div>
                    <div className="mb-1 text-sm text-gray-400">{t("game.releaseDate")}</div>
                    <div className="text-white">{formatReleaseDate(game.releaseDate)}</div>
                  </div>
                )}

                <div>
                  <div className="mb-1 text-sm text-gray-400">{t("game.developer")}</div>
                  <div className="text-white">{game.developer}</div>
                </div>

                {game.publisher !== game.developer && (
                  <div>
                    <div className="mb-1 text-sm text-gray-400">{t("game.publisher")}</div>
                    <div className="text-white">{game.publisher}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Requirements */}
          {game.systemRequirements && (
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                  <Monitor className="h-5 w-5 text-orange-400" />
                  {t("game.systemRequirements")}
                </h3>
                <div className="rounded-lg bg-black/20 p-4">
                  <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-gray-300">
                    {JSON.stringify(game.systemRequirements, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Videos Section */}
        {game.media.videos.length > 0 && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white">
                <Play className="h-6 w-6 text-red-400" />
                {t("game.trailers")}
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {game.media.videos.slice(0, 4).map((video) => (
                  <div key={video.id} className="group cursor-pointer">
                    <div className="relative mb-3 aspect-video overflow-hidden rounded-xl bg-gray-800">
                      {video.thumbnailUrl ? (
                        <Image
                          src={video.thumbnailUrl}
                          alt={video.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Monitor className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/40">
                        <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm transition-transform group-hover:scale-110">
                          <Play className="h-8 w-8 fill-white text-white" />
                        </div>
                      </div>
                    </div>
                    <h4 className="font-semibold text-white transition-colors group-hover:text-purple-300">
                      {video.title}
                    </h4>
                    {video.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-400">{video.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
