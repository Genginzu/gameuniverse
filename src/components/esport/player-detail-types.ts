/** Shared types for the esport player detail UI components. */

export interface PlayerDetail {
  id: number;
  name: string;
  firstName: string | null;
  lastName: string | null;
  nationality: string | null;
  imageUrl: string | null;
  role: string | null;
  teamName: string | null;
  teamImageUrl: string | null;
  game: string | null;
}
