/** Métriques résumées du dashboard (Req 1) */
export interface OverviewMetrics {
  totalGames: number;
  totalPlayTimeHours: number;
  reviewCount: number;
  averageRating: number | null;
  collectionsCount: number;
  friendsCount: number;
}

/** Entrée de répartition par genre (Req 2) */
export interface GenreDistributionEntry {
  genre: string;
  count: number;
  percentage: number;
}

/** Stats de complétion (Req 3) */
export interface CompletionStats {
  total: number;
  owned: number;
  playing: number;
  completed: number;
  wishlist: number;
  completionPercentage: number;
}

/** Analyse des avis (Req 4) */
export interface ReviewAnalyticsData {
  distribution: ReviewBucket[];
  averageRating: number | null;
  medianRating: number | null;
  modeRating: number | null;
  totalReviews: number;
  helpfulVotesReceived: number;
}

export interface ReviewBucket {
  range: string; // "0-5", "6-10", "11-15", "16-20"
  min: number;
  max: number;
  count: number;
}

/** Stats sociales (Req 5) */
export interface SocialStatsData {
  friendsCount: number;
  commentsCount: number;
  favoritesCount: number;
  collectionsCount: number;
}

/** Activité mensuelle (Req 6) */
export interface MonthlyActivity {
  month: number; // 1-12
  year: number;
  label: string; // Nom du mois localisé
  gamesAdded: number;
}

/** Temps de jeu (Req 7) */
export interface PlaytimeData {
  averagePlayTimeHours: number | null;
  topGame: {
    id: string;
    title: string;
    coverImage: string | null;
    playTimeHours: number;
  } | null;
}

/** Succès/Achievement (Req 11) */
export interface AchievementData {
  key: string;
  unlockedAt: string | null; // ISO date or null if locked
}

export interface AchievementDefinition {
  key: string;
  threshold: number;
  category: "library" | "reviews" | "social" | "playtime";
}

/** Stats de sessions (Req 12) */
export interface SessionStatsData {
  totalSessions: number;
  averageDurationMinutes: number | null;
  longestSessionMinutes: number | null;
  frequencyByDayOfWeek: DayFrequency[];
}

export interface DayFrequency {
  day: number; // 0=lundi, 6=dimanche
  label: string;
  sessionCount: number;
}

/** Objectif personnel (Req 13) */
export interface PlayerGoal {
  id: string;
  goalType: "games_to_complete" | "play_time_hours" | "reviews_to_write" | "collections_to_create";
  targetValue: number;
  currentValue: number;
  deadline: string | null; // ISO date
  createdAt: string;
}

/** Réponse complète de l'API dashboard */
export interface DashboardStatsResponse {
  overview: OverviewMetrics;
  genreDistribution: GenreDistributionEntry[];
  completion: CompletionStats;
  reviewAnalytics: ReviewAnalyticsData;
  social: SocialStatsData;
  activityTimeline: MonthlyActivity[];
  playtime: PlaytimeData;
  achievements: AchievementData[];
  achievementDefinitions: AchievementDefinition[];
  sessions: SessionStatsData;
  goals: PlayerGoal[];
}

/** Réponse API quand stats privées */
export interface DashboardStatsPrivateResponse {
  stats: null;
  private: true;
}

/** Définitions des 10 succès disponibles (constante applicative) */
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  { key: "first_game", threshold: 1, category: "library" },
  { key: "library_10", threshold: 10, category: "library" },
  { key: "library_50", threshold: 50, category: "library" },
  { key: "first_review", threshold: 1, category: "reviews" },
  { key: "reviews_10", threshold: 10, category: "reviews" },
  { key: "playtime_100h", threshold: 100, category: "playtime" },
  { key: "playtime_500h", threshold: 500, category: "playtime" },
  { key: "first_friend", threshold: 1, category: "social" },
  { key: "friends_10", threshold: 10, category: "social" },
  { key: "first_collection", threshold: 1, category: "social" },
];
