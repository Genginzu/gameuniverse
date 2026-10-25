import type { RelatedGameCard } from "./game-metadata";

/** Franchise (IGDB `franchises` or admin-created) or IGDB collection, shown as one page type. */
export type FranchiseKind = "franchise" | "series";

export interface FranchiseSummary {
  kind: FranchiseKind;
  id: string;
  slug: string;
  name: string;
  gameCount: number;
  /** Cover of the franchise's most popular game. */
  coverImage: string | null;
}

export interface FranchisesApiResponse {
  franchises: FranchiseSummary[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

export interface FranchiseDetail {
  kind: FranchiseKind;
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  /** Non-adult games, in release order (undated last). */
  games: RelatedGameCard[];
}
