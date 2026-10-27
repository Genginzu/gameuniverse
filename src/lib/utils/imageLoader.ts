import type { ImageLoaderProps } from "next/image";

/**
 * Image delivery policy. Every remote image is routed to the cheapest path that
 * still yields a correctly sized file, so the Vercel optimizer quota is only
 * spent on images that have no sized variants at their source.
 *
 * - `igdb`: IGDB CDN exposes fixed size presets (`t_{size}`), picked per width.
 * - `unsplash`: Unsplash CDN resizes on the fly via query params.
 * - `passthrough`: hosts serving small, pre-compressed files (avatars, video
 *   thumbnails, store logos); served as-is.
 * - `optimize`: everything else (local assets, Supabase uploads, Wikimedia,
 *   esport logos) goes through the Next.js / Vercel optimizer.
 */
export type ImageStrategy = "igdb" | "unsplash" | "passthrough" | "optimize";

const IGDB_HOST = "images.igdb.com";
const UNSPLASH_HOST = "images.unsplash.com";

const PASSTHROUGH_HOSTS = new Set([
  "i.ytimg.com",
  "img.youtube.com",
  "avatars.steamstatic.com",
  "avatars.akamai.steamstatic.com",
  "avatars.cloudflare.steamstatic.com",
  "images-eds-ssl.xboxlive.com",
  "cdn.discordapp.com",
  "store.playstation.com",
  "store.steampowered.com",
  "www.gog.com",
  "www.microsoft.com",
  "static-assets-prod.epicgames.com",
  "www.nintendo.com",
]);

function getHostname(src: string): string | null {
  if (src.startsWith("//")) {
    return getHostname(`https:${src}`);
  }
  if (!/^https?:\/\//i.test(src)) {
    return null;
  }
  try {
    return new URL(src).hostname;
  } catch {
    return null;
  }
}

export function getImageStrategy(src: unknown): ImageStrategy {
  if (typeof src !== "string") {
    return "optimize";
  }
  const hostname = getHostname(src);
  if (!hostname) {
    return "optimize";
  }
  if (hostname === IGDB_HOST) {
    // URLs without a size preset cannot be resized: serve them as-is.
    return IGDB_SIZE_SEGMENT.test(src) ? "igdb" : "passthrough";
  }
  if (hostname === UNSPLASH_HOST) {
    return "unsplash";
  }
  return PASSTHROUGH_HOSTS.has(hostname) ? "passthrough" : "optimize";
}

interface IgdbPreset {
  name: string;
  width: number;
}

/**
 * Preset ladders per aspect family, ascending by delivered width. Each family
 * keeps the framing of the stored preset (portrait cover, 16:9 media, logo,
 * square thumb), only the resolution changes.
 */
const IGDB_LADDERS: Record<string, IgdbPreset[]> = {
  cover: [
    { name: "cover_small", width: 90 },
    { name: "cover_small_2x", width: 180 },
    { name: "cover_big", width: 264 },
    { name: "cover_big_2x", width: 528 },
    { name: "1080p", width: 810 },
  ],
  media: [
    { name: "screenshot_med", width: 569 },
    { name: "screenshot_big", width: 889 },
    { name: "720p", width: 1280 },
    { name: "1080p", width: 1920 },
  ],
  logo: [
    { name: "logo_med", width: 284 },
    { name: "logo_med_2x", width: 568 },
  ],
  thumb: [
    { name: "micro", width: 35 },
    { name: "micro_2x", width: 70 },
    { name: "thumb", width: 90 },
    { name: "thumb_2x", width: 180 },
  ],
};

const IGDB_SIZE_SEGMENT = /\/t_([a-z0-9_]+)\//;

function getIgdbFamily(preset: string): string {
  const base = preset.replace(/_2x$/, "");
  if (base.startsWith("cover_")) {
    return "cover";
  }
  if (base.startsWith("logo_")) {
    return "logo";
  }
  if (base === "thumb" || base === "micro") {
    return "thumb";
  }
  return "media";
}

function pickPreset(ladder: IgdbPreset[], width: number): IgdbPreset {
  return ladder.find((preset) => preset.width >= width) ?? ladder[ladder.length - 1];
}

/**
 * Rewrites the `t_{size}` segment of an IGDB URL to the smallest preset of the
 * same family that covers the requested width. Next.js already multiplies the
 * width by the device pixel ratio when building the srcset.
 *
 * The `w` query param (ignored by the IGDB CDN) carries the preset width:
 * Next.js warns in dev when a loader returns `src` unchanged, which happens
 * whenever the picked preset is the stored one. Using the preset width rather
 * than the requested one keeps a single URL, hence a single cache entry, per preset.
 */
export function igdbImageLoader({ src, width }: ImageLoaderProps): string {
  const absoluteSrc = src.startsWith("//") ? `https:${src}` : src;
  const match = absoluteSrc.match(IGDB_SIZE_SEGMENT);
  if (!match) {
    return absoluteSrc;
  }
  const preset = pickPreset(IGDB_LADDERS[getIgdbFamily(match[1])], width);
  const url = new URL(absoluteSrc.replace(IGDB_SIZE_SEGMENT, `/t_${preset.name}/`));
  url.searchParams.set("w", String(preset.width));
  return url.toString();
}

export function unsplashImageLoader({ src, width, quality }: ImageLoaderProps): string {
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "max");
  return url.toString();
}
