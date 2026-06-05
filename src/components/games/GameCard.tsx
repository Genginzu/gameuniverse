"use client";

/**
 * GameCard : carte de jeu unique pour la refonte éditoriale.
 *
 * Utilisée sur toutes les pages éditoriales refondues : `/`,
 * `/library`, `/games`, `/games/[slug]` (similaires, recommandations),
 * `/trending`, `/upcoming`, `/players/[id]` (library + common games).
 *
 * Design (mode par défaut) :
 *   - Cover 3/4 full-bleed
 *   - Plateformes en haut à gauche (toujours visibles)
 *   - Métascore en haut à droite (visible au hover uniquement)
 *   - Gradient sombre localisé sur la moitié basse (lisibilité du footer)
 *   - Footer : titre + studio + année (visible au repos)
 *   - Au hover : description tronquée + bouton "Découvrir" qui slide
 *     depuis le bas par-dessus le footer
 *
 * Variantes via le prop `overlay` :
 *   - `library` : badge status + rating étoile + playtime dans le footer
 *     (remplace plateformes + métascore + studio·année)
 *   - `common`  : chips genres dans le footer (remplace studio·année)
 *
 * Toutes les classes CSS utilisent le préfixe `editorial-card-*`.
 */

import Image from "next/image";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { getDistinctPlatformIcons } from "@/lib/utils/platform-icons";
import type { GameSummary } from "@/types/game";

/**
 * Overlay contextuel optionnel. Permet à `GameCard` de rester un composant
 * unique tout en s'adaptant aux contextes spécifiques (bibliothèque d'un
 * joueur, comparaison de bibliothèques, etc.).
 */
export type GameCardOverlay =
  | {
      type: "library";
      status: "owned" | "wishlist" | "completed" | "playing";
      rating: number | null;
      playtimeHours: number;
    }
  | {
      type: "common";
      genres: string[];
    };

interface GameCardProps {
  game: GameSummary;
  /** Hint Next/Image priority (au-dessus du fold). */
  priority?: boolean;
  /** Classes additionnelles. */
  className?: string;
  /** Overlay contextuel optionnel (bibliothèque, comparaison, etc.). */
  overlay?: GameCardOverlay;
}

function getMetascoreColor(score: number): string {
  if (score >= 75) return "rgb(74, 222, 128)";
  if (score >= 50) return "rgb(250, 204, 21)";
  return "rgb(248, 113, 113)";
}

export function GameCard({
  game,
  priority = false,
  className = "",
  overlay,
}: GameCardProps) {
  const t = useTranslations("games");
  const description = game.description?.trim() ?? "";

  return (
    <Link
      href={`/games/${game.slug}`}
      className={`editorial-card ${className}`.trim()}
      data-testid="editorial-card"
      data-game-id={game.id}
      data-overlay={overlay?.type ?? "default"}
    >
      <div className="editorial-card-media">
        {game.coverImage ? (
          <Image
            src={game.coverImage}
            alt={game.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            priority={priority}
            className="editorial-card-image"
          />
        ) : (
          <div className="editorial-card-placeholder">
            <Icon icon="lucide:gamepad-2" className="size-12" aria-hidden />
          </div>
        )}

        {/* Gradient localisé sur la moitié basse pour la lisibilité du footer */}
        <div className="editorial-card-gradient" aria-hidden="true" />

        <CardTopLeft game={game} overlay={overlay} />
        <CardTopRight game={game} overlay={overlay} />

        {game.isEsport && (
          <span className="editorial-card-badge" aria-label="Esport">
            ESPORT
          </span>
        )}

        <CardFooter game={game} overlay={overlay} />

        {/* Hover panel : description + CTA (slide depuis le bas).
            Désactivé pour les overlays métier qui occupent déjà l'espace. */}
        {description && !overlay && (
          <div className="editorial-card-hover" aria-hidden="true">
            <p className="editorial-card-description">{description}</p>
            <span className="editorial-card-cta">
              <span>{t("readMore", { defaultValue: "Découvrir" })}</span>
              <Icon icon="lucide:arrow-up-right" className="size-3.5" />
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

/** Top-left : plateformes (default) ou badge status (library). */
function CardTopLeft({
  game,
  overlay,
}: {
  game: GameSummary;
  overlay?: GameCardOverlay;
}) {
  const t = useTranslations("players.library.status");

  if (overlay?.type === "library") {
    return (
      <span
        className="editorial-card-status-badge"
        data-status={overlay.status}
        title={t(overlay.status, { defaultValue: overlay.status })}
      >
        {t(overlay.status, { defaultValue: overlay.status })}
      </span>
    );
  }

  if (overlay?.type === "common") {
    // Pas de plateformes en mode "common" — l'info n'est pas disponible.
    return null;
  }

  const platformIcons = game.platforms
    ? getDistinctPlatformIcons(game.platforms, 3)
    : [];

  if (platformIcons.length === 0) return null;

  return (
    <div className="editorial-card-platforms" aria-hidden="true">
      {platformIcons.map((p) => (
        <span
          key={p.icon}
          className="editorial-card-platform-chip"
          title={p.name}
        >
          <Icon icon={p.icon} className="size-3" />
        </span>
      ))}
    </div>
  );
}

/** Top-right : métascore (default, hover) ou rating étoile (library, toujours visible). */
function CardTopRight({
  game,
  overlay,
}: {
  game: GameSummary;
  overlay?: GameCardOverlay;
}) {
  if (overlay?.type === "library") {
    if (overlay.rating === null) return null;
    return (
      <span className="editorial-card-rating" title={`Rating ${overlay.rating}/5`}>
        <Icon icon="lucide:star" className="size-3 fill-current" />
        {overlay.rating}
      </span>
    );
  }

  if (overlay?.type === "common") {
    return null;
  }

  const metascore = game.metascore ?? null;
  if (metascore === null) return null;

  return (
    <span
      className="editorial-card-score"
      style={{ color: getMetascoreColor(metascore) }}
      title={`Metascore ${metascore}`}
    >
      {metascore}
    </span>
  );
}

/** Footer : titre + sous-ligne adaptée au contexte. */
function CardFooter({
  game,
  overlay,
}: {
  game: GameSummary;
  overlay?: GameCardOverlay;
}) {
  return (
    <div className="editorial-card-footer">
      <h3 className="editorial-card-title">{game.title}</h3>
      <CardByline game={game} overlay={overlay} />
    </div>
  );
}

function CardByline({
  game,
  overlay,
}: {
  game: GameSummary;
  overlay?: GameCardOverlay;
}) {
  if (overlay?.type === "library") {
    if (overlay.playtimeHours <= 0) return null;
    return (
      <div className="editorial-card-byline">
        <Icon icon="lucide:clock" className="size-3" aria-hidden />
        <span>{overlay.playtimeHours}h</span>
      </div>
    );
  }

  if (overlay?.type === "common") {
    if (overlay.genres.length === 0) return null;
    return (
      <div className="editorial-card-byline editorial-card-byline-genres">
        {overlay.genres.slice(0, 2).map((genre) => (
          <span key={genre} className="editorial-card-genre-chip">
            {genre}
          </span>
        ))}
      </div>
    );
  }

  // Default : studio · année
  const releaseYear = game.releaseYear ?? null;
  const studio = game.developer || game.publisher || null;

  if (!studio && !releaseYear) return null;

  return (
    <div className="editorial-card-byline">
      {studio && <span>{studio}</span>}
      {studio && releaseYear && (
        <span aria-hidden className="editorial-card-byline-sep">
          ·
        </span>
      )}
      {releaseYear && <span>{releaseYear}</span>}
    </div>
  );
}
