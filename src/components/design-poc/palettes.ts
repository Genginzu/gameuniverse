/**
 * Palettes d'accent du POC design — module pur (pas de "use client").
 *
 * Important : ce fichier est délibérément séparé de DynamicAccent.tsx car ce
 * dernier est marqué "use client". Si on exportait les palettes depuis le
 * client component, leur lecture côté server (par les pages POC qui sont des
 * server components) renverrait une référence client opaque au lieu de la
 * valeur réelle, et `palette.scale[400]` serait undefined côté serveur.
 */

export interface AccentPalette {
  /** Identifiant lisible (debug, future feature « picker ») */
  name: string;
  /** Échelle 50 → 900 en hex */
  scale: {
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
  };
  /** Triplet RGB (sans virgule) pour box-shadow rgba(var(--poc-accent-glow), 0.5) */
  rgbTriplet: string;
}

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
  rgbTriplet: "219 68 224",
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
  rgbTriplet: "252 225 51",
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
  rgbTriplet: "255 70 85",
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
  rgbTriplet: "251 191 36",
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
  rgbTriplet: "75 227 214",
};
