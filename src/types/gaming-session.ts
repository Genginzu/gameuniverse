/** A single gaming session logged by a player (issue #2). */
export interface GamingSession {
  id: string;
  userId: string;
  gameId: string;
  gameSlug: string;
  gameName: string;
  coverImage: string | null;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  createdAt: string;
}

export interface GamingSessionsResponse {
  sessions: GamingSession[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
  };
}

export interface CreateGamingSessionPayload {
  gameId: string;
  /** ISO date (YYYY-MM-DD) — interpreted as the session day. */
  date: string;
  /** Total duration in minutes, 1..1440. */
  durationMinutes: number;
}
