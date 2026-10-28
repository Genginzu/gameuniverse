"use client";

/**
 * Section "Other games of the franchise": games sharing a franchise or an
 * IGDB series with this one, in release order, plus links to the franchise pages.
 */

import { useTranslations } from "next-intl";
import { GameCard } from "@/components/games/GameCard";
import { LibraryStatusProvider } from "@/components/providers/LibraryStatusProvider";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { Link } from "@/i18n/navigation";
import type { GameDetails, GameSummary } from "@/types/game";
import type { RelatedGameCard } from "@/types/game-metadata";
import { accentRich } from "../utils/accent-rich";

interface FranchiseGamesSectionProps {
  game: GameDetails;
}

function toGameSummary(card: RelatedGameCard): GameSummary {
  return {
    id: card.id,
    slug: card.slug,
    title: card.title,
    coverImage: card.coverImage ?? undefined,
    genres: card.genres,
    developer: card.developer,
    publisher: "",
    metascore: card.metascore ?? undefined,
    releaseDate: card.releaseDate ?? undefined,
  };
}

export function FranchiseGamesSection({ game }: FranchiseGamesSectionProps) {
  const tEd = useTranslations("gameDetails.editorial");
  const franchiseGames = (game.metadata?.franchiseGames ?? []).map(toGameSummary);
  const franchises = game.metadata?.franchises ?? [];

  if (franchiseGames.length === 0) return null;

  return (
    <section className="editorial-game-detail-section editorial-game-detail-section--tight">
      <div className="editorial-game-detail-section-header">
        <div>
          <KickerLabel className="mb-3">14 — {tEd("sections.franchiseGames")}</KickerLabel>
          <h2>{tEd.rich("sections.franchiseGamesTitle", accentRich)}</h2>
        </div>
        {franchises.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {franchises.map((franchise) => (
              <li key={`${franchise.kind}-${franchise.slug}`}>
                <Link
                  href={`/franchises/${franchise.slug}`}
                  className="inline-flex min-h-11 items-center rounded-md border border-editorial-line px-4 text-sm transition-colors hover:border-editorial-accent hover:text-editorial-accent"
                >
                  {tEd("sections.viewFranchise", { name: franchise.name })}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <LibraryStatusProvider gameIds={franchiseGames.map((g) => g.id)}>
        <div className="editorial-game-detail-similar-grid">
          {franchiseGames.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      </LibraryStatusProvider>
    </section>
  );
}
