export interface CoachProfile {
  id: string;
  playerId: string;
  bio: string | null;
  experience: string | null;
  languages: string[];
  isActive: boolean;
  isVerified: boolean;
  verifiedAt: string | null;
  averageRating: number;
  totalReviews: number;
  totalSessions: number;
  cancellationPolicy: CancellationPolicy;
  createdAt: string;
}

export interface CancellationPolicy {
  free_until_hours: number;
  partial_refund_percentage: number;
  no_refund_after_hours: number;
}

export interface CoachGame {
  id: string;
  coachId: string;
  gameId: string;
  rankLevel: string | null;
  hoursExperience: number;
  specialties: string[];
  isActive: boolean;
  createdAt: string;
  game?: { id: string; slug: string; title: string; coverImage: string | null };
}

export interface CoachPricing {
  id: string;
  coachGameId: string;
  sessionType: SessionType;
  priceAmount: number;
  priceCurrency: string;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
  gameTitle?: string;
  gameCoverImage?: string | null;
}

export type SessionType = "single" | "pack_5" | "pack_10" | "monthly";

export const SESSION_TYPES: SessionType[] = ["single", "pack_5", "pack_10", "monthly"];

export const COACH_SPECIALTY_GROUPS = [
  { key: "level", specialties: ["beginner", "casual", "advanced", "competitive"] },
  { key: "mode", specialties: ["solo", "teamplay", "ranked", "battle_royale", "mmo_raid"] },
  {
    key: "style",
    specialties: ["mechanics_aim", "game_sense", "strategy", "speedrun", "progression_build"],
  },
] as const;

export const COACH_SPECIALTIES = COACH_SPECIALTY_GROUPS.flatMap((g) => g.specialties);

export type CoachSpecialty = (typeof COACH_SPECIALTIES)[number];
