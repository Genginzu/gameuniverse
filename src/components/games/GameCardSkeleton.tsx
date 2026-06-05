/**
 * GameCardSkeleton : silhouette d'une `GameCard` pendant le loading.
 *
 * Réutilise la classe utilitaire `editorial-card-skeleton` définie dans
 * `editorial/game-card.css` (aspect 3/4, fond sombre, shimmer).
 */
export function GameCardSkeleton() {
  return <div className="editorial-card-skeleton" aria-hidden="true" />;
}
