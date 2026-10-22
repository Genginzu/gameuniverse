import type { CharacterSummary } from "@/types/character";
import type { GameSummary } from "@/types/game";
import type { ReviewWithVotes } from "@/types/review";

/** Real platform counts displayed on the logged-out landing. */
export interface HomeStats {
  games: number;
  characters: number;
  players: number;
  reviews: number;
}

/** Public review shown in the landing "reviews" preview block. */
export interface HomeReviewPreview extends ReviewWithVotes {
  gameTitle: string | null;
  gameSlug: string | null;
}

export type HomeShowcaseKind = "game" | "character";

export const SHOWCASE_LIBRARY_STATUSES = ["playing", "completed", "wishlist", "owned"] as const;
export type ShowcaseLibraryStatus = (typeof SHOWCASE_LIBRARY_STATUSES)[number];

/** Maximum number of items shown per preview block. */
export const SHOWCASE_LIMITS: Record<HomeShowcaseKind, number> = { game: 3, character: 4 };

/** Admin-picked game for the library preview, with its demo library status. */
export interface HomeShowcaseGame {
  game: GameSummary;
  status: ShowcaseLibraryStatus;
}

/** Payload of `GET /api/home` (ISR, shared by the landing and the dashboard). */
export interface HomeApiResponse {
  trending: GameSummary[];
  upcoming: GameSummary[];
  popularCharacters: CharacterSummary[];
  recentReviews: HomeReviewPreview[];
  /** Admin selection; empty means "fall back to trending / popular". */
  showcaseGames: HomeShowcaseGame[];
  showcaseCharacters: CharacterSummary[];
  /** `null` when the counts could not be fetched: the stats section is hidden. */
  stats: HomeStats | null;
}

/** Row of the admin showcase manager (`GET /api/admin/home-showcase`). */
export interface AdminShowcaseItem {
  id: string;
  kind: HomeShowcaseKind;
  displayOrder: number;
  libraryStatus: ShowcaseLibraryStatus | null;
  entity: {
    id: string;
    slug: string;
    name: string;
    imageUrl: string | null;
  } | null;
}

/** Result of the admin showcase search pickers. */
export interface ShowcaseSearchResult {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  subtitle?: string;
}

/** IGDB game not necessarily imported yet, offered for import from the picker. */
export interface ShowcaseIgdbResult {
  igdbId: number;
  name: string;
  slug: string;
  coverUrl: string | null;
  releaseYear: number | null;
}
