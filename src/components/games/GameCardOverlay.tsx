"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface GameCardOverlayProps {
  title: string;
  developer: string;
  publisher: string;
  genres: Array<{ name: string; id?: string }>;
  releaseDate?: string;
  releaseYear?: number;
  formatReleaseDate: (dateString?: string) => string | null;
}

export function GameCardOverlay({
  title,
  developer,
  publisher,
  genres,
  releaseDate,
  releaseYear,
  formatReleaseDate,
}: GameCardOverlayProps) {
  const t = useTranslations("game");

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-end rounded-2xl bg-linear-to-t from-black/90 via-black/60 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100">
      <div className="p-4">
        <h3 className="mb-2 line-clamp-2 text-lg font-bold text-white">{title}</h3>

        <div className="mb-3 space-y-1 text-xs">
          <div className="flex items-center text-gray-300">
            <span className="font-medium text-gray-400">{t("developerShort")}:</span>
            <span className="ml-1 font-medium text-white">{developer}</span>
          </div>
          {publisher !== developer && (
            <div className="flex items-center text-gray-300">
              <span className="font-medium text-gray-400">{t("publisherShort")}:</span>
              <span className="ml-1 font-medium text-white">{publisher}</span>
            </div>
          )}
        </div>

        {genres.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {genres.slice(0, 2).map((genre, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-xs"
              >
                {genre.name}
              </Badge>
            ))}
            {genres.length > 2 && (
              <Badge
                variant="outline"
                className="rounded-full border-white/30 bg-white/10 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-xs"
              >
                +{genres.length - 2}
              </Badge>
            )}
          </div>
        )}

        {releaseDate && (
          <div className="flex items-center text-xs text-gray-300">
            <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {releaseYear || formatReleaseDate(releaseDate)}
          </div>
        )}
      </div>
    </div>
  );
}
