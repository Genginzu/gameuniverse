/**
 * Système d'accent dynamique pour la refonte éditoriale.
 *
 * Ce module est volontairement **server-safe** (pas de `"use client"`,
 * aucun import React). Il définit :
 *
 * - Le type `AccentPalette` (échelle 50-900 + triplet RGB pour les glows).
 * - Cinq palettes prédéfinies (magenta, cyberpunk, valorant, gold, cyan).
 * - `paletteFromHex(hex)` : génère une palette complète à partir d'une seule
 *   couleur hex (typiquement `game.accentColor`).
 *
 * Le composant React `DynamicAccent` (client) consomme ces palettes et
 * injecte les variables CSS `--accent-*` dans le sous-arbre.
 *
 * Voir docs/design/editorial-refonte-plan.md.
 */

// ============================================================================
// Types
// ============================================================================

/** Échelle d'une palette (Tailwind-like : du plus clair au plus foncé). */
export interface AccentScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface AccentPalette {
  /** Identifiant lisible (debug, sélecteur futur). */
  name: string;
  /** Échelle 50 → 900 en hex. */
  scale: AccentScale;
  /**
   * Triplet RGB sans virgule ni parenthèse, pour les box-shadow rgba :
   * `rgba(var(--accent-rgb), 0.4)`. Correspond à `scale[500]`.
   */
  rgbTriplet: string;
}

// ============================================================================
// Palettes prédéfinies
// ============================================================================

export const MAGENTA_PALETTE: AccentPalette = {
  name: "magenta",
  scale: {
    50: "#fbe7fd",
    100: "#f6c4fb",
    200: "#ee94f5",
    300: "#e564ed",
    400: "#db44e0",
    500: "#c233cb",
    600: "#a02bab",
    700: "#771f81",
    800: "#4d1556",
    900: "#2c0c33",
  },
  rgbTriplet: "194 51 203",
};

export const CYBERPUNK_PALETTE: AccentPalette = {
  name: "cyberpunk-yellow",
  scale: {
    50: "#fffce6",
    100: "#fff7b3",
    200: "#fff080",
    300: "#ffe84d",
    400: "#fce133",
    500: "#f5d40c",
    600: "#c4aa00",
    700: "#8a7800",
    800: "#5a4f00",
    900: "#332d00",
  },
  rgbTriplet: "245 212 12",
};

export const VALORANT_PALETTE: AccentPalette = {
  name: "valorant-red",
  scale: {
    50: "#ffe5e7",
    100: "#ffb8bd",
    200: "#ff8a92",
    300: "#ff5b67",
    400: "#ff4655",
    500: "#e02e3d",
    600: "#b3232f",
    700: "#7d1822",
    800: "#4a0d14",
    900: "#26060a",
  },
  rgbTriplet: "224 46 61",
};

export const GOLD_PALETTE: AccentPalette = {
  name: "gold",
  scale: {
    50: "#fff7e0",
    100: "#ffe7a3",
    200: "#ffd76a",
    300: "#ffc933",
    400: "#fbbf24",
    500: "#e0a30c",
    600: "#b07f00",
    700: "#7a5800",
    800: "#4d3700",
    900: "#291d00",
  },
  rgbTriplet: "224 163 12",
};

export const CYAN_PALETTE: AccentPalette = {
  name: "cyan",
  scale: {
    50: "#e0fbf7",
    100: "#a6f1e6",
    200: "#6de6d6",
    300: "#4be3d6",
    400: "#22d3c0",
    500: "#10b8a3",
    600: "#0a8c7c",
    700: "#076258",
    800: "#053f37",
    900: "#02211d",
  },
  rgbTriplet: "16 184 163",
};

/** Palette par défaut — utilisée comme fallback si `accentColor` est invalide. */
export const DEFAULT_PALETTE: AccentPalette = MAGENTA_PALETTE;

// ============================================================================
// Algorithme paletteFromHex
// ============================================================================

/**
 * Cibles de luminosité (L dans HSL, 0..1) pour chaque palier de l'échelle.
 * Choisies pour matcher le rendu visuel de Tailwind / Material : 50 très clair,
 * 500 = couleur d'origine (à peu près), 900 très foncé.
 */
const LIGHTNESS_TARGETS: Record<keyof AccentScale, number> = {
  50: 0.95,
  100: 0.88,
  200: 0.78,
  300: 0.68,
  400: 0.58,
  500: 0.5,
  600: 0.4,
  700: 0.3,
  800: 0.2,
  900: 0.12,
};

/**
 * Génère une `AccentPalette` complète à partir d'une couleur hex.
 *
 * - Si `hex` est `null`, `undefined`, vide ou invalide, retourne
 *   `DEFAULT_PALETTE`.
 * - La teinte (H) et la saturation (S) sont préservées sur toute l'échelle ;
 *   seule la luminosité (L) varie selon `LIGHTNESS_TARGETS`.
 * - `scale[500]` est calculé à partir de la couleur d'origine, mais avec L
 *   clampée à 0.5 pour avoir un mid-tone cohérent. Pour récupérer la couleur
 *   exacte, on l'expose via `rgbTriplet`.
 *
 * @param hex Format `#rgb`, `#rrggbb`, `rgb`, ou `rrggbb`.
 * @param name Identifiant optionnel (debug). Défaut : `"custom"`.
 */
export function paletteFromHex(
  hex: string | null | undefined,
  name = "custom"
): AccentPalette {
  if (!hex || typeof hex !== "string") return DEFAULT_PALETTE;

  const rgb = parseHex(hex);
  if (!rgb) return DEFAULT_PALETTE;

  const [h, s] = rgbToHsl(rgb);

  const scale = {} as AccentScale;
  (Object.keys(LIGHTNESS_TARGETS) as Array<keyof AccentScale>).forEach((key) => {
    const targetL = LIGHTNESS_TARGETS[key];
    const rgbForKey = hslToRgb(h, s, targetL);
    scale[key] = rgbToHexString(rgbForKey);
  });

  return {
    name,
    scale,
    rgbTriplet: `${rgb[0]} ${rgb[1]} ${rgb[2]}`,
  };
}

// ============================================================================
// Helpers de conversion (privés)
// ============================================================================

type Rgb = [number, number, number];

/**
 * Parse une chaîne hex (avec ou sans `#`, 3 ou 6 chiffres) en triplet RGB.
 * Retourne `null` si le format est invalide.
 */
function parseHex(input: string): Rgb | null {
  const trimmed = input.trim().replace(/^#/, "");

  if (!/^[0-9a-fA-F]+$/.test(trimmed)) return null;

  let normalized: string;
  if (trimmed.length === 3) {
    normalized = trimmed
      .split("")
      .map((c) => c + c)
      .join("");
  } else if (trimmed.length === 6) {
    normalized = trimmed;
  } else {
    return null;
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return [r, g, b];
}

function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;

  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  if (s === 0) {
    const gray = Math.round(l * 255);
    return [gray, gray, gray];
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    Math.round(hueToChannel(p, q, h + 1 / 3) * 255),
    Math.round(hueToChannel(p, q, h) * 255),
    Math.round(hueToChannel(p, q, h - 1 / 3) * 255),
  ];
}

function hueToChannel(p: number, q: number, t: number): number {
  let tn = t;
  if (tn < 0) tn += 1;
  if (tn > 1) tn -= 1;
  if (tn < 1 / 6) return p + (q - p) * 6 * tn;
  if (tn < 1 / 2) return q;
  if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
  return p;
}

function rgbToHexString([r, g, b]: Rgb): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}
