/**
 * Static demo data for the landing mockups whose real data is private
 * (libraries, profiles, personal stats). Pseudonyms are fictional.
 */

import type { GameCardOverlay } from "@/components/games/GameCard";
import type { PlayerSummary } from "@/types/player";

type LibraryOverlay = Extract<GameCardOverlay, { type: "library" }>;
type LibraryStatus = LibraryOverlay["status"];

/** Demo playtime per status: only games actually played show hours. Metascore replaces the rating. */
const DEMO_PLAYTIME_BY_STATUS: Record<LibraryStatus, number> = {
  playing: 42,
  completed: 87,
  owned: 0,
  wishlist: 0,
};

export function demoLibraryOverlay(status: LibraryStatus): LibraryOverlay {
  return {
    type: "library",
    status,
    rating: null,
    playtimeHours: DEMO_PLAYTIME_BY_STATUS[status],
    showMetascore: true,
  };
}

/** Statuses used when no admin selection exists (fallback on trending games). */
export const DEMO_LIBRARY_STATUSES: LibraryStatus[] = ["playing", "completed", "wishlist"];

const DEMO_PLAYER_BASE = {
  avatarUrl: null,
  bannerUrl: null,
  socialLinks: {},
  createdAt: "2026-01-01T00:00:00Z",
} satisfies Partial<PlayerSummary>;

export const DEMO_PLAYERS: PlayerSummary[] = [
  {
    ...DEMO_PLAYER_BASE,
    id: "demo-1",
    fullName: "NovaRunner",
    level: 12,
    gamesCount: 184,
    reviewCount: 23,
  },
  {
    ...DEMO_PLAYER_BASE,
    id: "demo-2",
    fullName: "PixelMage",
    level: 8,
    gamesCount: 96,
    reviewCount: 11,
  },
  {
    ...DEMO_PLAYER_BASE,
    id: "demo-3",
    fullName: "ByteKnight",
    level: 15,
    gamesCount: 241,
    reviewCount: 37,
  },
];

/** Progress percentages of the "now playing" rows in the tracking mockup. */
export const DEMO_PROGRESS = [72, 35] as const;

export const DEMO_TRACKING_STATS = {
  playtimeHours: 248,
  completedGames: 37,
  averageRating: 16,
} as const;

export const DEMO_REVIEW_META = {
  id: "demo-review",
  userId: "demo-1",
  playerName: "NovaRunner",
  rating: 17,
  createdAt: "2026-09-14T10:00:00Z",
} as const;
