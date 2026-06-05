"use client";

/**
 * PlayerLibraryGrid : grille des jeux de la bibliothèque d'un joueur.
 *
 * Utilise le composant `GameCard` éditorial unique avec son overlay
 * `library` (badge status + rating + playtime). Pas de markup glass legacy.
 */

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { GameCard } from "@/components/games/GameCard";
import type { GameSummary } from "@/types/game";
import type { PlayerLibraryGame } from "@/types/player";

interface PlayerLibraryGridProps {
  games: PlayerLibraryGame[];
  locale: string;
}

/**
 * Adapte un `PlayerLibraryGame` vers la forme attendue par `GameCard`.
 * Les champs absents (developer, publisher, plateformes…) sont laissés
 * `undefined`, ce qui est géré nativement par `GameCard`.
 */
function toGameSummary(game: PlayerLibraryGame): GameSummary {
  return {
    id: game.gameId,
    slug: game.slug,
    title: game.title,
    coverImage: game.coverImage ?? undefined,
    developer: "",
    publisher: "",
    genres: [],
  };
}

export function PlayerLibraryGrid({ games, locale: _locale }: PlayerLibraryGridProps) {
  const t = useTranslations("players");

  const sortedGames = useMemo(
    () => [...games].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()),
    [games]
  );

  if (sortedGames.length === 0) {
    return (
      <div className="editorial-library-empty">
        <div className="editorial-library-empty-icon">
          <Icon icon="lucide:gamepad-2" className="h-7 w-7" />
        </div>
        <h3 className="editorial-library-empty-title">{t("library.empty")}</h3>
        <p className="editorial-library-empty-text">{t("library.emptyDescription")}</p>
      </div>
    );
  }

  return (
    <div className="editorial-library-grid">
      {sortedGames.map((game, index) => (
        <GameCard
          key={game.id}
          game={toGameSummary(game)}
          priority={index < 5}
          overlay={{
            type: "library",
            status: game.status,
            rating: game.rating,
            playtimeHours: game.playTimeHours,
          }}
        />
      ))}
    </div>
  );
}
