// Types pour la recherche globale multi-entités
// Requirements: 8.1, 8.2, 8.3 + F0-07d (esport teams, pro players, coaches)

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
  /** Maximum d'équipes esport retournées (défaut 5). */
  teamsLimit?: number;
  /** Maximum de joueurs pros retournés (défaut 5). */
  proPlayersLimit?: number;
  /** Maximum de coachs retournés (défaut 5). */
  coachesLimit?: number;
}

/** Réponse de la recherche globale */
export interface GlobalSearchResponse {
  games: GlobalSearchGameItem[];
  characters: GlobalSearchCharacterItem[];
  players: GlobalSearchPlayerItem[];
  teams: GlobalSearchTeamItem[];
  proPlayers: GlobalSearchProPlayerItem[];
  coaches: GlobalSearchCoachItem[];
  counts: {
    games: number;
    characters: number;
    players: number;
    teams: number;
    proPlayers: number;
    coaches: number;
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

/** Résultat joueur Gamers Universe dans la recherche globale */
export interface GlobalSearchPlayerItem {
  id: string;
  username: string;
  avatarUrl?: string;
}

/**
 * Résultat équipe esport dans la recherche globale.
 * Mappé depuis `public.esport_teams`. L'ID externe est le `pandascore_id`.
 */
export interface GlobalSearchTeamItem {
  /** PandaScore numeric ID — équipes sans cet ID sont filtrées. */
  id: number;
  name: string;
  slug: string;
  acronym?: string;
  imageUrl?: string;
  location?: string;
  game?: string;
}

/**
 * Résultat joueur pro dans la recherche globale.
 * Mappé depuis `public.esport_players`. L'ID externe est le `pandascore_id`.
 */
export interface GlobalSearchProPlayerItem {
  /** PandaScore numeric ID — joueurs sans cet ID sont filtrés. */
  id: number;
  name: string;
  slug: string;
  firstName?: string;
  lastName?: string;
  nationality?: string;
  imageUrl?: string;
  role?: string;
  game?: string;
  /** Nom de l'équipe actuelle, joint depuis `esport_teams`. */
  teamName?: string;
}

/**
 * Résultat coach dans la recherche globale.
 * Mappé depuis `public.coach_profiles` joint avec `public.profiles` pour
 * le pseudo et l'avatar. Seuls les coachs `is_active = true` sont retournés.
 */
export interface GlobalSearchCoachItem {
  /** UUID du coach_profile (pas du player_id). */
  id: string;
  /** Pseudo (depuis `profiles.username`). Sert de slug pour `/coaching/[username]`. */
  username: string;
  avatarUrl?: string;
  /** Note moyenne (0..5), 0 si aucune review. */
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
}

/** Résultat brut avant transformation en réponse API */
export interface GlobalSearchResult {
  games: { local: GameSummary[]; igdb: IGDBSearchResult[] };
  characters: CharacterSummary[];
  players: PlayerSummary[];
  /** Équipes esport mappées depuis `esport_teams`. */
  teams: GlobalSearchTeamItem[];
  /** Joueurs pros mappés depuis `esport_players`. */
  proPlayers: GlobalSearchProPlayerItem[];
  /** Coachs mappés depuis `coach_profiles` ⨝ `profiles`. */
  coaches: GlobalSearchCoachItem[];
  errors: string[];
}
