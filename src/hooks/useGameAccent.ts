"use client";

/**
 * useGameAccent : retourne une `AccentPalette` dérivée de `game.accentColor`
 * (ou de n'importe quelle chaîne hex passée directement).
 *
 * Memoizé sur la valeur de la chaîne pour éviter de régénérer la palette à
 * chaque render. Si l'entrée est invalide ou vide, retourne `DEFAULT_PALETTE`
 * (fallback gracieux).
 *
 * Usage :
 *
 * ```tsx
 * const palette = useGameAccent(game);
 * // ou directement
 * const palette = useGameAccent(game.accentColor);
 * // ou même
 * const palette = useGameAccent(character);  // si character a accentColor
 *
 * return (
 *   <DynamicAccent palette={palette}>
 *     <GameDetailContent ... />
 *   </DynamicAccent>
 * );
 * ```
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import { useMemo } from "react";

import {
  paletteFromHex,
  type AccentPalette,
} from "@/lib/utils/accent-palette";

/**
 * Toute entité ayant une couleur d'accent optionnelle. Le champ peut être
 * `undefined` (ancien jeu sans accent) ou `null` (Supabase renvoie souvent
 * `null` pour les colonnes nullable).
 */
interface AccentBearing {
  accentColor?: string | null;
}

export function useGameAccent(
  source: AccentBearing | string | null | undefined,
  paletteName?: string
): AccentPalette {
  const hex = extractHex(source);
  return useMemo(() => paletteFromHex(hex, paletteName), [hex, paletteName]);
}

function extractHex(source: AccentBearing | string | null | undefined): string | null {
  if (typeof source === "string") return source;
  if (source && typeof source === "object" && "accentColor" in source) {
    return source.accentColor ?? null;
  }
  return null;
}
