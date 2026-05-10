"use client";

/**
 * EditorialGameCard : carte de jeu sobre pour les grilles éditoriales.
 *
 * Style minimaliste hérité du POC : cover en plein cadre, titre en bas
 * dans une bande sombre, petite flèche dans le coin inférieur droit qui
 * s'éclaire au hover. Pas d'overlay verbeux, pas de toggle bibliothèque.
 *
 * Pour les contextes qui nécessitent ces fonctionnalités (admin, library
 * privée), continuer à utiliser `EntityCard` avec `gameCardConfig`.
 */

import Image from "next/image";
import { Icon } from "@iconify/react";

import { Link } from "@/i18n/navigation";
import type { GameSummary } from "@/types/game";

interface EditorialGameCardProps {
  game: GameSummary;
  /** Hint Next/Image priority (au-dessus du fold). */
  priority?: boolean;
  /** Classes additionnelles. */
  className?: string;
}

export function EditorialGameCard({
  game,
  priority = false,
  className = "",
}: EditorialGameCardProps) {
  const releaseYear = game.releaseYear ?? null;
  return (
    <Link
      href={`/games/${game.slug}`}
      className={`editorial-game-card ${className}`.trim()}
      data-testid="editorial-game-card"
      data-game-id={game.id}
    >
      <div className="editorial-game-card-cover">
        {game.coverImage ? (
          <Image
            src={game.coverImage}
            alt={game.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            priority={priority}
            className="object-cover"
          />
        ) : (
          <div className="editorial-game-card-placeholder">
            <Icon icon="lucide:gamepad-2" className="size-10" aria-hidden />
          </div>
        )}
        {game.isEsport && (
          <span className="editorial-game-card-esport-badge" aria-label="Esport">
            ESPORT
          </span>
        )}
      </div>

      <div className="editorial-game-card-footer">
        <div className="editorial-game-card-text">
          <h3 className="editorial-game-card-title">{game.title}</h3>
          {releaseYear && (
            <span className="editorial-game-card-year">{releaseYear}</span>
          )}
        </div>
        <span className="editorial-game-card-arrow" aria-hidden>
          <Icon icon="lucide:arrow-up-right" className="size-4" />
        </span>
      </div>
    </Link>
  );
}
