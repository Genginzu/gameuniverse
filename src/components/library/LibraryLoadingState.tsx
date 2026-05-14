"use client";

/**
 * LibraryLoadingState : loader éditorial affiché dans le conteneur des jeux
 * pendant qu'une recherche / changement de filtre / changement de page est
 * en cours.
 *
 * Design :
 *   - Barre de progression fine qui scanne en haut (accent dynamique)
 *   - Statut "Recherche en cours" en kicker avec 3 dots qui pulsent
 *   - 5 cartes ghost (silhouettes des EditorialGameCard) qui respirent
 *     avec un délai décalé par index pour un effet "wave"
 *
 * Reste cohérent avec la grille `.editorial-library-grid` (mêmes
 * breakpoints, mêmes proportions de carte).
 */

import { useTranslations } from "next-intl";

const GHOST_CARD_COUNT = 10;

export function LibraryLoadingState() {
  const t = useTranslations("userLibrary.editorial.loading");

  return (
    <div
      className="editorial-library-loading"
      role="status"
      aria-live="polite"
      aria-label={t("status")}
    >
      <div className="editorial-library-loading-bar" aria-hidden="true">
        <span className="editorial-library-loading-bar-fill" />
      </div>

      <div className="editorial-library-loading-status">
        <span className="editorial-library-loading-kicker">{t("status")}</span>
        <span className="editorial-library-loading-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </div>

      <div className="editorial-library-loading-grid" aria-hidden="true">
        {Array.from({ length: GHOST_CARD_COUNT }).map((_, i) => (
          <div
            key={i}
            className="editorial-library-loading-ghost"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
