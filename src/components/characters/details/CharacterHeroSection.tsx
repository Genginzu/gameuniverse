"use client";

import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/ui/lazy-image";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import type { CharacterDetails } from "@/types/character";
import { FavoriteCharacterButton } from "./FavoriteCharacterButton";

interface CharacterColors {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
}

interface CharacterHeroSectionProps {
  character: CharacterDetails;
  colors: CharacterColors;
  heroBackgroundImage?: string;
  primaryGame: CharacterDetails["games"][number] | undefined;
  bgColor: string;
}

export function CharacterHeroSection({
  character,
  colors,
  heroBackgroundImage,
  primaryGame,
  bgColor,
}: CharacterHeroSectionProps) {
  const t = useTranslations();

  return (
    <div className="relative min-h-[45vh] overflow-hidden">
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
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${bgColor}40 0%, transparent 30%, transparent 50%, ${bgColor}95 85%, ${bgColor} 100%)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${bgColor}90 0%, transparent 25%, transparent 75%, ${bgColor}90 100%)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center bottom, transparent 30%, ${bgColor}60 100%)`,
            }}
          />
        </div>
      )}

      {/* Navigation flottante */}
      <div className="absolute top-0 right-0 left-0 z-20 px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/characters">
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px] bg-slate-900/60 text-slate-300 backdrop-blur-xs hover:bg-slate-900/80 hover:text-white"
            >
              <Icon icon="lucide:arrow-left" className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <FavoriteCharacterButton characterSlug={character.slug} />
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-16">
        <div className="flex flex-col items-center justify-center lg:flex-row lg:items-center lg:justify-center">
          <div className="relative shrink-0">
            <div
              className={`absolute -inset-8 bg-linear-to-t ${colors.bg} rounded-full opacity-30 blur-3xl`}
            />
            <div className="relative">
              <div className="relative h-[320px] w-[240px] sm:h-[400px] sm:w-[300px] lg:h-[480px] lg:w-[360px]">
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

          <div className="mt-2 max-w-lg text-center lg:mt-0 lg:flex-1 lg:pl-6 lg:text-left">
            <div className="mb-3 flex items-center justify-center gap-3 lg:justify-start">
              <h1 className="neon-text text-5xl leading-tight font-bold text-white drop-shadow-lg [text-shadow:0_2px_8px_rgba(0,0,0,0.5)] lg:text-6xl">
                {character.name}
              </h1>
            </div>
            {(character.gender || character.species) && (
              <div className="mb-3 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                {character.gender && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600/40 bg-slate-800/50 px-3 py-1 text-sm text-slate-300 backdrop-blur-xs">
                    <Icon icon="lucide:user" className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-slate-400">{t("characters.details.gender")}:</span>
                    <span className="text-slate-200">{character.gender.name}</span>
                  </span>
                )}
                {character.species && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600/40 bg-slate-800/50 px-3 py-1 text-sm text-slate-300 backdrop-blur-xs">
                    <Icon icon="lucide:dna" className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-slate-400">{t("characters.details.species")}:</span>
                    <span className="text-slate-200">{character.species.name}</span>
                  </span>
                )}
              </div>
            )}
            {character.description && (
              <p className="text-lg leading-relaxed text-slate-200 [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]">
                {character.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
