// Types pour la recherche globale multi-entités
// Requirements: 8.1, 8.2, 8.3

import type { CharacterSummary } from "./character";
import type { GameSummary } from "./game";
import type { IGDBSearchResult } from "./igdb";
import type { PlayerSummary } from "./player";

/** Requête de recherche globale */
export interface GlobalSearchRequest {
  query: string;
  locale?: string;
  gamesLimit?: number;
  charactersLimit?: number;
  playersLimit?: number;
}

/** Réponse de la recherche globale */
export interface GlobalSearchResponse {
  games: GlobalSearchGameItem[];
  characters: GlobalSearchCharacterItem[];
  players: GlobalSearchPlayerItem[];
  counts: {
    games: number;
    characters: number;
    players: number;
  };
}

/** Résultat jeu dans la recherche globale */
export interface GlobalSearchGameItem {
  id: string;
  igdbId?: number;
  slug: string;
  title: string;
  coverUrl?: string;
  developer?: string;
  releaseYear?: number;
  source: "local" | "igdb";
}

/** Résultat personnage dans la recherche globale */
export interface GlobalSearchCharacterItem {
  id: string;
  slug: string;
  name: string;
  mainImage?: string;
  role?: string;
  primaryGame?: string;
}

/** Résultat joueur dans la recherche globale */
export interface GlobalSearchPlayerItem {
  id: string;
  username: string;
  avatarUrl?: string;
}

/** Résultat brut avant transformation en réponse API */
export interface GlobalSearchResult {
  games: { local: GameSummary[]; igdb: IGDBSearchResult[] };
  characters: CharacterSummary[];
  players: PlayerSummary[];
  errors: string[];
}
