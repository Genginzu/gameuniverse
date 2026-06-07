/**
 * KickerLabel : petit label uppercase mono utilisé comme « kicker »
 * au-dessus des titres éditoriaux ou comme en-tête de section.
 *
 * Style identique à la classe utilitaire `.editorial-kicker` (font mono,
 * petite taille, lettrage espacé, couleur muted). Le composant garde la
 * sémantique HTML correcte selon le contexte : `as="p"` par défaut,
 * `as="span"` quand on l'inline, `as="div"` pour un en-tête de section.
 *
 * Voir docs/design/editorial-refonte-plan.md (direction artistique).
 */

import type { ReactNode } from "react";

type KickerTag = "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface KickerLabelProps {
  children: ReactNode;
  /** Élément HTML rendu (par défaut `p`). */
  as?: KickerTag;
  /** Classes Tailwind additionnelles (ex `mb-4`, `text-white/80`). */
  className?: string;
}

export function KickerLabel({ children, as: Tag = "p", className = "" }: KickerLabelProps) {
  const merged = `editorial-kicker ${className}`.trim();
  return <Tag className={merged}>{children}</Tag>;
}
