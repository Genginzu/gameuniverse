import type { ElementType, ReactNode } from "react";

/**
 * EditorialContainer : conteneur de page standard des layouts éditoriaux.
 *
 * Centralise le gabarit répété sur toutes les pages padées
 * (`mx-auto max-w-[1536px]` + gouttières + rythme vertical) afin d'éviter la
 * duplication de la chaîne Tailwind. Les pages full-bleed (héros de la home,
 * de la page jeu, etc.) n'utilisent volontairement PAS ce conteneur.
 *
 * Presets de rythme vertical (`spacing`) :
 *   - `default` : pt-8 pb-16 md:pt-12 md:pb-20 (cas courant : listings, pages).
 *   - `compact` : pt-6 pb-16 md:pt-10 md:pb-20 (détail collection).
 *   - `body`    : pb-16 uniquement (corps placé sous un héros qui gère le top).
 */

const SPACING = {
  default: "pt-8 pb-16 md:pt-12 md:pb-20",
  compact: "pt-6 pb-16 md:pt-10 md:pb-20",
  body: "pb-16",
} as const;

export type EditorialContainerSpacing = keyof typeof SPACING;

interface EditorialContainerProps {
  children: ReactNode;
  /** Preset de rythme vertical. Défaut: `default`. */
  spacing?: EditorialContainerSpacing;
  /** Élément racine rendu. Défaut: `div`. */
  as?: ElementType;
  /** Classes additionnelles ajoutées après les classes de base. */
  className?: string;
}

export function EditorialContainer({
  children,
  spacing = "default",
  as: Tag = "div",
  className = "",
}: EditorialContainerProps) {
  return (
    <Tag className={`mx-auto max-w-[1536px] px-4 md:px-8 ${SPACING[spacing]} ${className}`.trim()}>
      {children}
    </Tag>
  );
}
