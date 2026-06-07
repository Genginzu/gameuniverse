"use client";

import { LazyImage } from "@/components/ui/lazy-image";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import type { CharacterDetails } from "@/types/character";
import { FavoriteCharacterButton } from "./FavoriteCharacterButton";

interface CharacterHeroSectionProps {
  character: CharacterDetails;
  heroBackgroundImage?: string;
  primaryGame: CharacterDetails["games"][number] | undefined;
}

export function CharacterHeroSection({
  character,
  heroBackgroundImage,
  primaryGame,
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
          {/* Dégradés sombres vers le fond éditorial (pas de blur) */}
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--editorial-bg)]/40 via-transparent to-[var(--editorial-bg)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--editorial-bg)]/80 via-transparent to-[var(--editorial-bg)]/80" />
        </div>
      )}

      {/* Identité + portrait */}
      <div className="relative z-10 mx-auto max-w-[1536px] px-4 pt-16 pb-12 md:px-8 md:pb-16">
        <div className="flex flex-col items-center justify-center lg:flex-row lg:items-center lg:justify-center">
          <div className="relative shrink-0">
            <div
              className="absolute -inset-8 rounded-full opacity-30 blur-3xl"
              style={{ background: "rgb(var(--accent-rgb, var(--neon-primary)))" }}
              aria-hidden="true"
            />
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

          <div className="mt-2 max-w-lg text-center lg:mt-0 lg:flex-1 lg:pl-6 lg:text-left">
            <div className="mb-3 flex items-end justify-center gap-3 lg:justify-start">
              <h1 className="font-display text-[clamp(2.5rem,5vw+1rem,4rem)] leading-none font-bold tracking-tight text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.5)]">
                {character.name}
              </h1>
              <FavoriteCharacterButton characterSlug={character.slug} />
            </div>

            {(character.gender || character.species) && (
              <div className="mb-3 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                {character.gender && (
                  <MetaChip
                    icon="lucide:user"
                    label={t("characters.details.gender")}
                    value={character.gender.name}
                  />
                )}
                {character.species && (
                  <MetaChip
                    icon="lucide:dna"
                    label={t("characters.details.species")}
                    value={character.species.name}
                  />
                )}
              </div>
            )}

            {character.description && (
              <p className="text-lg leading-relaxed text-white/80 [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]">
                {character.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <span className="border-editorial-line bg-editorial-2 text-editorial-muted inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-sm">
      <Icon icon={icon} className="h-3.5 w-3.5" />
      <span>{label}:</span>
      <span className="text-white">{value}</span>
    </span>
  );
}
