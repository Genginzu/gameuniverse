"use client";

/**
 * Injecte une couleur d'accent dynamique sur le sous-arbre.
 *
 * Usage : <DynamicAccent palette={CYBERPUNK_PALETTE}>...</DynamicAccent>
 *
 * Une palette définit 50→900 + le triplet RGB pour les box-shadow rgba().
 * Le scope est strictement local (style inline) — n'affecte rien hors du
 * composant.
 *
 * Les palettes elles-mêmes sont définies dans `./palettes.ts` (module pur)
 * pour pouvoir être lues côté server. Voir le commentaire en tête de ce
 * fichier pour les détails.
 */

import type { CSSProperties, ReactNode } from "react";
import type { AccentPalette } from "./palettes";

interface DynamicAccentProps {
  palette: AccentPalette;
  children: ReactNode;
  className?: string;
}

export function DynamicAccent({ palette, children, className }: DynamicAccentProps) {
  const style = {
    "--poc-accent-50": palette.scale[50],
    "--poc-accent-100": palette.scale[100],
    "--poc-accent-200": palette.scale[200],
    "--poc-accent-300": palette.scale[300],
    "--poc-accent-400": palette.scale[400],
    "--poc-accent-500": palette.scale[500],
    "--poc-accent-600": palette.scale[600],
    "--poc-accent-700": palette.scale[700],
    "--poc-accent-800": palette.scale[800],
    "--poc-accent-900": palette.scale[900],
    "--poc-accent-rgb": palette.rgbTriplet,
    "--poc-accent-glow": palette.rgbTriplet,
  } as CSSProperties;

  return (
    <div style={style} className={className}>
      {children}
    </div>
  );
}
