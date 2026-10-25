/** Types of the franchises admin (`/admin/franchises`). */

export interface AdminFranchiseListItem {
  id: string;
  igdbId: number | null;
  slug: string;
  name: string;
  gameCount: number;
}

export interface AdminFranchise {
  id: string;
  igdbId: number | null;
  slug: string;
  name: string;
  translations: Array<{ language_code: string; description: string }>;
}


/** Game linked to a franchise, in the franchise admin. */
export interface AdminFranchiseGame {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  releaseDate: string | null;
}
