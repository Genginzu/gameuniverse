"use client";

import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { CharacterSummary } from "@/types/character";

interface CharacterCardProps {
  character: CharacterSummary;
  locale?: string;
  priority?: boolean; // For optimizing loading of first cards
}

export function CharacterCard({ character, locale = "fr", priority = false }: CharacterCardProps) {
  const t = useTranslations("characters.card");

  return (
    <div className="group relative">
      <Link href={`/${locale}/characters/${character.slug}`}>
        {/* Cover Image with Overlay */}
        <div
          className="relative aspect-3/4 cursor-pointer overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/10"
          style={{
            backgroundColor: character.backgroundColor || "#f3f4f6", // Fallback to gray-100
          }}
        >
          <LazyImage
            src={character.mainImage}
            alt={character.name}
            fill
            className="rounded-2xl object-cover transition-all duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
            showSkeleton={true}
            priority={priority}
          />

          {/* Role badge - top right */}
          {character.role && (
            <div className="absolute right-3 top-3 z-20">
              <Badge
                variant="secondary"
                className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-900 shadow-lg backdrop-blur-xs"
              >
                {character.role}
              </Badge>
            </div>
          )}

          {/* Hover Overlay - appears on the cover */}
          <div className="absolute inset-0 z-10 flex flex-col justify-end rounded-2xl bg-linear-to-t from-black/90 via-black/60 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100">
            <div className="p-4">
              {/* Name */}
              <h3 className="mb-2 line-clamp-2 text-lg font-bold text-white">{character.name}</h3>

              {/* Description */}
              {character.description && (
                <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-gray-200">
                  {character.description}
                </p>
              )}

              {/* Primary Game */}
              <div className="mb-3 space-y-1 text-xs">
                <div className="flex items-center text-gray-300">
                  <span className="font-medium text-gray-400">{t("game")}</span>
                  <span className="ml-1 font-medium text-white">{character.primaryGame}</span>
                </div>
              </div>

              {/* Games count */}
              <div className="flex items-center text-xs text-gray-300">
                <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                {t("games", { count: character.gamesCount })}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
