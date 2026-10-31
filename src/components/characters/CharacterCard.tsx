"use client";

import { Icon } from "@iconify/react";

import { AppImage } from "@/components/ui/app-image";
import { Link } from "@/i18n/navigation";
import type { CharacterSummary } from "@/types/character";

interface CharacterCardProps {
  character: CharacterSummary;
  priority?: boolean;
}

/**
 * Editorial character card, mirroring GameCard: 3/4 full-bleed image, name in
 * an always-visible footer, and a game the character appears in revealed
 * top-right on hover.
 */
export function CharacterCard({ character, priority = false }: CharacterCardProps) {
  return (
    <Link
      href={`/characters/${character.slug}`}
      className="editorial-card group/card"
      data-testid="character-card"
    >
      <div className="editorial-card-media">
        {character.mainImage ? (
          <AppImage
            src={character.mainImage}
            alt={character.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            priority={priority}
            className="editorial-card-image"
          />
        ) : (
          <div className="bg-editorial-3 text-editorial-muted grid size-full place-items-center">
            <Icon icon="lucide:user" className="size-10" aria-hidden />
          </div>
        )}

        <div className="editorial-card-gradient" aria-hidden="true" />

        {character.primaryGame && (
          <span
            className="absolute top-2 right-2 z-3 max-w-[calc(100%-1rem)] -translate-y-1 scale-95 truncate rounded-full border border-white/15 bg-black/60 px-2 py-1 font-mono text-[0.6rem] font-bold tracking-[0.12em] text-white uppercase opacity-0 backdrop-blur-sm transition-all duration-200 group-hover/card:translate-y-0 group-hover/card:scale-100 group-hover/card:opacity-100 motion-reduce:transition-none"
            title={character.primaryGame}
          >
            {character.primaryGame}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 z-2 px-3.5 py-3">
          <h3 className="editorial-card-title">{character.name}</h3>
        </div>
      </div>
    </Link>
  );
}
