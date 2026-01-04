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

export default function GameCard({ game, locale = "fr" }: GameCardProps) {
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
    <Link href={`/${locale}/library/${game.slug}`}>
      <Card className="group h-full cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
          {game.coverImage ? (
            <Image
              src={game.coverImage}
              alt={game.title}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
              <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Metascore badge */}
          {game.metascore && (
            <div className="absolute right-2 top-2">
              <div
                className={`${getMetascoreColor(
                  game.metascore
                )} rounded-full px-2 py-1 text-xs font-bold text-white shadow-lg`}
              >
                {game.metascore}
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="mb-2 line-clamp-2 text-lg font-semibold transition-colors group-hover:text-blue-600">
            {game.title}
          </h3>

          {game.description && (
            <p className="mb-3 line-clamp-2 text-sm text-gray-600">{game.description}</p>
          )}

          <div className="mb-3 space-y-1 text-sm text-gray-700">
            <div>
              <span className="font-medium">{locale === "fr" ? "Développeur:" : "Developer:"}</span>{" "}
              {game.developer}
            </div>
            {game.publisher !== game.developer && (
              <div>
                <span className="font-medium">{locale === "fr" ? "Éditeur:" : "Publisher:"}</span>{" "}
                {game.publisher}
              </div>
            )}
          </div>

          {/* Genres */}
          {game.genres.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {game.genres.slice(0, 3).map((genre, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {genre.name}
                </Badge>
              ))}
              {game.genres.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{game.genres.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0">
          {game.releaseDate && (
            <div className="text-sm text-gray-500">
              {game.releaseYear || formatReleaseDate(game.releaseDate)}
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
