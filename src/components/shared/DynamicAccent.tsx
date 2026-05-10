/**
 * DynamicAccent : injecte une palette d'accent dans le sous-arbre via des
 * variables CSS inline.
 *
 * Pas de `"use client"` : ce composant ne fait qu'appliquer un objet `style`,
 * il fonctionne aussi bien en Server Component qu'en Client Component.
 *
 * Usage :
 *
 * ```tsx
 * import { DynamicAccent } from "@/components/shared/DynamicAccent";
 * import { paletteFromHex } from "@/lib/utils/accent-palette";
 *
 * <DynamicAccent palette={paletteFromHex(game.accentColor)}>
 *   <GameDetailContent ... />
 * </DynamicAccent>
 * ```
 *
 * Les variables exposées dans le sous-arbre :
 *   --accent-50 → --accent-900   (échelle de couleur)
 *   --accent-rgb                  (triplet RGB principal, alias --accent-glow)
 *   --accent-glow                 (utilisé par les box-shadow rgba)
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

import type { CSSProperties, ReactNode } from "react";

import type { AccentPalette } from "@/lib/utils/accent-palette";

interface DynamicAccentProps {
  palette: AccentPalette;
  children: ReactNode;
  className?: string;
  /** Élément HTML rendu (par défaut `div`). */
  as?: "div" | "section" | "article" | "main";
}

export function DynamicAccent({
  palette,
  children,
  className,
  as: Tag = "div",
}: DynamicAccentProps) {
  const style: CSSProperties = {
    "--accent-50": palette.scale[50],
    "--accent-100": palette.scale[100],
    "--accent-200": palette.scale[200],
    "--accent-300": palette.scale[300],
    "--accent-400": palette.scale[400],
    "--accent-500": palette.scale[500],
    "--accent-600": palette.scale[600],
    "--accent-700": palette.scale[700],
    "--accent-800": palette.scale[800],
    "--accent-900": palette.scale[900],
    "--accent-rgb": palette.rgbTriplet,
    "--accent-glow": palette.rgbTriplet,
  } as CSSProperties;

  return (
    <Tag style={style} className={className} data-accent={palette.name}>
      {children}
    </Tag>
  );
}
