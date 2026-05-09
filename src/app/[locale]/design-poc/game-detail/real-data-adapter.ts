/**
 * Adaptateur : convertit les vraies données de la BDD (GameDetails du site)
 * vers le format simplifié `PocGameData` utilisé par les composants POC.
 *
 * Permet d'afficher la maquette avec des vraies données sans réécrire les
 * composants. Une fois le design validé, on basculerait directement sur
 * `GameDetails` sans cet adaptateur.
 */

import type {
  GameDetails,
  GamePricing,
  GameRating,
  GameLanguage,
  GamePlaytime,
  PlayerPlaytimeStats,
  GameVersion,
  GameDlcExtension,
  SimilarGame,
} from "@/types/game";
import {
  type AccentPalette,
  MAGENTA_PALETTE,
} from "@/components/design-poc/palettes";
import type { PocGameData } from "./game-data";

interface PriceHistoryPoint {
  recorded_at: string;
  price: number;
}

interface AdapterInput {
  game: GameDetails;
  /** Stats playtime communauté (depuis /api/games/[slug]/playtime) */
  playerPlaytime?: PlayerPlaytimeStats | null;
  /** Historique prix (depuis /api/games/[slug]/price-history) */
  priceHistory?: PriceHistoryPoint[];
  /** Live stats simulées (à terme : un vrai endpoint) */
  liveStats?: { playersOnline: number; activeStreams: number; tournaments: number };
  /** Reviews (à terme : depuis ReviewService) */
  reviews?: Array<{
    author: string;
    avatar: string;
    rating: number;
    quote: string;
    date: string;
  }>;
}

/**
 * Construit une palette d'accent à partir de la couleur du jeu (BDD).
 * On utilise `accentColor` comme couleur principale, et on dérive 50→900
 * en faisant varier la luminosité avec une approche simple HSL.
 */
function paletteFromHex(hex: string | undefined): AccentPalette {
  if (!hex) return MAGENTA_PALETTE;

  // Normaliser
  const cleaned = hex.replace("#", "").trim();
  if (cleaned.length !== 6) return MAGENTA_PALETTE;

  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  const rgbTriplet = `${r} ${g} ${b}`;

  // Conversion en HSL pour générer l'échelle
  const { h, s } = rgbToHsl(r, g, b);

  // L'échelle 50→900 est définie par luminosité décroissante
  const lightnessSteps: Record<keyof AccentPalette["scale"], number> = {
    50: 0.95,
    100: 0.88,
    200: 0.78,
    300: 0.66,
    400: 0.58,
    500: 0.48,
    600: 0.38,
    700: 0.28,
    800: 0.18,
    900: 0.1,
  };

  const scale = Object.fromEntries(
    Object.entries(lightnessSteps).map(([key, l]) => [key, hslToHex(h, s, l)])
  ) as AccentPalette["scale"];

  return {
    name: `auto-${hex}`,
    scale,
    rgbTriplet,
  };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/* ============================================================================ */

export function adaptGameDetailsToPoc({
  game,
  playerPlaytime,
  priceHistory,
  liveStats,
  reviews,
}: AdapterInput): PocGameData {
  const palette = paletteFromHex(game.accentColor);

  return {
    id: game.id,
    slug: game.slug,
    title: game.title,
    tagline: game.description?.split(".")[0] ?? game.title,
    description: game.description ?? "",
    storyline: game.storyline ?? "",

    releaseDate: game.releaseDate ?? "2020-01-01",
    metascore: game.metascore ?? 0,
    developers:
      game.companies?.developers?.map((d) => d.name) ??
      (game.developer ? [game.developer] : []),
    publishers:
      game.companies?.publishers?.map((p) => p.name) ??
      (game.publisher ? [game.publisher] : []),

    cover: game.media?.coverImage ?? "",
    hero: game.media?.backgroundImage ?? game.media?.coverImage ?? "",

    screenshots:
      game.media?.screenshots
        ?.map((s) => s.url)
        .filter((u): u is string => Boolean(u))
        .slice(0, 6) ?? [],

    videos:
      game.media?.videos?.slice(0, 4).map((v) => ({
        thumbnail: v.thumbnailUrl ?? game.media?.coverImage ?? "",
        title: v.title,
        durationLabel: v.duration ? formatDuration(v.duration) : "—",
      })) ?? [],

    platforms:
      game.platforms?.map((p) => ({
        id: p.id,
        name: p.name,
        abbreviation: p.abbreviation || p.name,
        iconified: p.abbreviation || p.name,
      })) ?? [],

    genres:
      game.genres?.map((g) => ({
        id: g.id,
        name: g.name,
      })) ?? [],

    pricing: adaptPricing(game.pricing),
    priceHistory: adaptPriceHistory(priceHistory),

    ageRatings:
      game.ageRatings?.map((r) => adaptRating(r)) ??
      (game.ageRating ? [adaptRating(game.ageRating)] : []),

    languages: adaptLanguages(game.languages),

    playtime: adaptPlaytime(game.playtime, playerPlaytime),

    music: game.music
      ? {
          composers: game.music.composer ? [game.music.composer] : [],
          tracksCount: 0,
          streamingPlatforms: [
            ...(game.music.spotifyEmbedUrl
              ? [{ name: "Spotify", icon: "logos:spotify-icon", url: game.music.spotifyEmbedUrl }]
              : []),
            ...(game.music.youtubeVideoUrl
              ? [{ name: "YouTube", icon: "logos:youtube-icon", url: game.music.youtubeVideoUrl }]
              : []),
          ],
        }
      : null,

    versions: adaptVersions(game.versions),
    dlcExtensions: adaptDlc(game.dlcExtensions),
    similarGames: adaptSimilar(game.similarGames),

    reviews: reviews ?? [],

    liveStats: liveStats ?? { playersOnline: 0, activeStreams: 0, tournaments: 0 },

    paletteKey: "auto",
    palette,
  };
}

function adaptPricing(pricing: GamePricing[] | undefined): PocGameData["pricing"] {
  if (!pricing) return [];
  return pricing.map((p) => ({
    store: p.store?.name ?? "Store",
    price: p.price,
    currency: p.currency,
    platform: p.platform,
    url: p.storeUrl ?? p.store?.websiteUrl ?? "#",
  }));
}

function adaptPriceHistory(history: PriceHistoryPoint[] | undefined): PocGameData["priceHistory"] {
  if (!history || history.length === 0) return [];
  return history.map((p) => ({
    date: p.recorded_at.slice(0, 10),
    price: Number(p.price),
  }));
}

function adaptRating(r: GameRating): PocGameData["ageRatings"][number] {
  return {
    system: r.system,
    rating: r.rating,
    minimumAge: r.minimumAge ?? null,
    descriptors: r.contentDescriptors?.map((d) => d.name) ?? [],
  };
}

function adaptLanguages(languages: GameLanguage[] | undefined): PocGameData["languages"] {
  if (!languages) return [];
  return languages.map((l) => ({
    code: l.code,
    name: l.name,
    interface: l.hasInterface,
    audio: l.hasAudio,
    subtitles: l.hasSubtitles,
  }));
}

function adaptPlaytime(
  official: GamePlaytime | null | undefined,
  community: PlayerPlaytimeStats | null | undefined
): PocGameData["playtime"] {
  return {
    official:
      official && (official.hastily || official.normally || official.completely)
        ? {
            mainStory: official.hastily ?? 0,
            mainSides: official.normally ?? 0,
            completionist: official.completely ?? 0,
          }
        : null,
    community:
      community && community.count > 0
        ? {
            avg:
              Math.round(
                ((community.averages.normally ??
                  community.averages.hastily ??
                  community.averages.completely ??
                  0) +
                  Number.EPSILON) *
                  10
              ) / 10,
            sample: community.count,
          }
        : null,
    contributors:
      community?.contributors?.slice(0, 5).map((c) => ({
        name: c.username ?? "—",
        avatar: c.avatarUrl ?? "https://i.pravatar.cc/64",
        hours:
          c.playtime.normally ??
          c.playtime.hastily ??
          c.playtime.completely ??
          0,
      })) ?? [],
  };
}

function adaptVersions(versions: GameVersion[] | undefined): PocGameData["versions"] {
  if (!versions) return [];
  return versions.map((v) => ({
    name: v.title,
    cover: v.coverImageUrl ?? "",
    price: 0,
    currency: "EUR",
    description: v.description ?? "",
  }));
}

function adaptDlc(dlc: GameDlcExtension[] | undefined): PocGameData["dlcExtensions"] {
  if (!dlc) return [];
  return dlc.map((d) => ({
    name: d.name,
    cover: d.coverImageUrl ?? "",
    releaseDate: d.releaseDate ?? "",
    description: d.summary ?? "",
  }));
}

function adaptSimilar(similar: SimilarGame[] | undefined): PocGameData["similarGames"] {
  if (!similar) return [];
  return similar
    .filter((s) => s.game)
    .slice(0, 8)
    .map((s) => ({
      title: s.game!.title,
      cover: s.game!.coverImage ?? "",
      year: "—",
    }));
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
