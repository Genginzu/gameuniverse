"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";

interface Genre {
  name: string;
}

interface GameCardProps {
  game: {
    id: string;
    slug: string;
    title: string;
    description?: string;
    coverImage?: string;
    releaseDate?: string;
    releaseYear?: number;
    genres: Genre[];
    developer: string;
    publisher: string;
    metascore?: number;
  };
  locale?: string;
}

export function GameCard({ game, locale = "fr" }: GameCardProps) {
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
    if (score >= 90) return "bg-green-600";
    if (score >= 75) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <Link href={`/${locale}/games/${game.slug}`}>
      <Card className="group relative h-full cursor-pointer overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/10">
        {/* Cover Image */}
        <div className="relative aspect-[3/4] overflow-hidden">
          {game.coverImage ? (
            <Image
              src={game.coverImage}
              alt={game.title}
              fill
              className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="rounded-full bg-white/80 p-4 shadow-lg">
                <svg
                  className="h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

          {/* Metascore badge */}
          {game.metascore && (
            <div className="absolute right-3 top-3">
              <div
                className={`${getMetascoreColor(
                  game.metascore
                )} flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg ring-2 ring-white/20 backdrop-blur-sm`}
              >
                {game.metascore}
              </div>
            </div>
          )}

          {/* Quick action button */}
          <div className="absolute bottom-3 right-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm hover:bg-white">
              <svg
                className="h-4 w-4 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>

        <CardContent className="p-5">
          <h3 className="mb-3 line-clamp-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-600">
            {game.title}
          </h3>

          {game.description && (
            <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-600">
              {game.description}
            </p>
          )}

          <div className="mb-4 space-y-2 text-sm">
            <div className="flex items-center text-gray-700">
              <div className="mr-2 h-1 w-1 rounded-full bg-blue-500"></div>
              <span className="font-medium text-gray-500">Dev:</span>
              <span className="ml-1 font-medium">{game.developer}</span>
            </div>
            {game.publisher !== game.developer && (
              <div className="flex items-center text-gray-700">
                <div className="mr-2 h-1 w-1 rounded-full bg-green-500"></div>
                <span className="font-medium text-gray-500">Pub:</span>
                <span className="ml-1 font-medium">{game.publisher}</span>
              </div>
            )}
          </div>

          {/* Genres */}
          {game.genres.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {game.genres.slice(0, 2).map((genre, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:from-blue-100 hover:to-indigo-100"
                >
                  {genre.name}
                </Badge>
              ))}
              {game.genres.length > 2 && (
                <Badge
                  variant="outline"
                  className="rounded-full border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500"
                >
                  +{game.genres.length - 2}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="px-5 pb-5 pt-0">
          <div className="flex w-full items-center justify-between">
            {game.releaseDate && (
              <div className="flex items-center text-sm text-gray-500">
                <svg
                  className="mr-1.5 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {game.releaseYear || formatReleaseDate(game.releaseDate)}
              </div>
            )}
            <div className="flex items-center text-xs font-medium text-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Voir détails
              <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
