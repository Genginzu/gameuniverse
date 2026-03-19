import type {
  OverviewMetrics,
  GenreDistributionEntry,
  PlatformDistributionEntry,
  CompletionStats,
  ReviewBucket,
  MonthlyActivity,
  PlaytimeData,
  AchievementDefinition,
  AchievementData,
  DayFrequency,
} from "@/types/dashboard-stats";

// --- 1. Overview Metrics (Req 1.2, 1.3, 1.4) ---

export function computeOverviewMetrics(
  libraryEntries: Array<{ play_time_hours: number | null }>,
  reviews: Array<{ rating: number }>,
  collections: unknown[],
  friends: unknown[]
): OverviewMetrics {
  const totalGames = libraryEntries.length;
  const totalPlayTimeHours = libraryEntries.reduce((sum, e) => sum + (e.play_time_hours ?? 0), 0);
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
      : null;

  return {
    totalGames,
    totalPlayTimeHours,
    reviewCount,
    averageRating,
    collectionsCount: collections.length,
    friendsCount: friends.length,
  };
}

// --- 2. Genre Distribution (Req 2.2, 2.3, 2.4) ---

export function computeGenreDistribution(
  libraryWithGenres: Array<{ genres: string[] }>
): GenreDistributionEntry[] {
  const genreCounts = new Map<string, number>();

  for (const entry of libraryWithGenres) {
    for (const genre of entry.genres) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    }
  }

  if (genreCounts.size === 0) return [];

  const totalAssignments = Array.from(genreCounts.values()).reduce((a, b) => a + b, 0);

  const sorted = Array.from(genreCounts.entries()).sort((a, b) => b[1] - a[1]);

  if (sorted.length <= 5) {
    return sorted.map(([genre, count]) => ({
      genre,
      count,
      percentage: Math.round((count / totalAssignments) * 1000) / 10,
    }));
  }

  const top5 = sorted.slice(0, 5);
  const restCount = sorted.slice(5).reduce((sum, [, c]) => sum + c, 0);

  return [
    ...top5.map(([genre, count]) => ({
      genre,
      count,
      percentage: Math.round((count / totalAssignments) * 1000) / 10,
    })),
    {
      genre: "Autres",
      count: restCount,
      percentage: Math.round((restCount / totalAssignments) * 1000) / 10,
    },
  ];
}

// --- 3. Completion Stats (Req 3.1, 3.2, 3.3) ---

type LibraryStatus = "owned" | "playing" | "completed" | "wishlist";

export function computeCompletionStats(
  libraryEntries: Array<{ status: LibraryStatus }>
): CompletionStats {
  const counts = { owned: 0, playing: 0, completed: 0, wishlist: 0 };
  for (const entry of libraryEntries) {
    if (entry.status in counts) counts[entry.status]++;
  }
  const total = counts.owned + counts.playing + counts.completed + counts.wishlist;
  const completionPercentage = total > 0 ? Math.round((counts.completed / total) * 100) : 0;

  return { total, ...counts, completionPercentage };
}

// --- 4. Review Distribution (Req 4.1, 4.2) ---

const REVIEW_BUCKETS: Array<{ range: string; min: number; max: number }> = [
  { range: "0-5", min: 0, max: 5 },
  { range: "6-10", min: 6, max: 10 },
  { range: "11-15", min: 11, max: 15 },
  { range: "16-20", min: 16, max: 20 },
];

export function computeReviewDistribution(ratings: number[]): ReviewBucket[] {
  const buckets: ReviewBucket[] = REVIEW_BUCKETS.map((b) => ({ ...b, count: 0 }));
  for (const r of ratings) {
    const idx = r <= 5 ? 0 : r <= 10 ? 1 : r <= 15 ? 2 : 3;
    buckets[idx].count++;
  }
  return buckets;
}

// --- 5. Review Statistics (Req 4.3) ---

export function computeReviewStatistics(ratings: number[]): {
  average: number | null;
  median: number | null;
  mode: number | null;
  max: number | null;
} {
  if (ratings.length === 0) return { average: null, median: null, mode: null, max: null };

  const sum = ratings.reduce((a, b) => a + b, 0);
  const average = Math.round((sum / ratings.length) * 10) / 10;

  const sorted = [...ratings].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  const max = sorted[sorted.length - 1];

  // Mode: most frequent, smallest in case of tie
  const freq = new Map<number, number>();
  for (const r of ratings) freq.set(r, (freq.get(r) ?? 0) + 1);
  let maxFreq = 0;
  let mode = ratings[0];
  for (const [val, count] of freq) {
    if (count > maxFreq || (count === maxFreq && val < mode)) {
      maxFreq = count;
      mode = val;
    }
  }

  return { average, median, mode, max };
}

// --- 6. Activity By Month (Req 6.1, 6.2, 6.3) ---

export function computeActivityByMonth(
  libraryEntries: Array<{ added_at: string }>,
  referenceDate: Date,
  locale: string
): MonthlyActivity[] {
  // Build 12 month slots going backwards from referenceDate
  const slots: MonthlyActivity[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
    const month = d.getMonth() + 1; // 1-12
    const year = d.getFullYear();
    const label = new Intl.DateTimeFormat(locale, { month: "long" }).format(d);
    slots.push({ month, year, label, gamesAdded: 0 });
  }

  // Count entries per month
  for (const entry of libraryEntries) {
    const date = new Date(entry.added_at);
    if (isNaN(date.getTime())) continue;
    const entryMonth = date.getMonth() + 1;
    const entryYear = date.getFullYear();
    const slot = slots.find((s) => s.month === entryMonth && s.year === entryYear);
    if (slot) slot.gamesAdded++;
  }

  return slots;
}

// --- 7. Average Playtime (Req 7.1, 7.2) ---

export function computeAveragePlaytime(playTimes: number[]): number | null {
  const nonZero = playTimes.filter((t) => t > 0);
  if (nonZero.length === 0) return null;
  const avg = nonZero.reduce((a, b) => a + b, 0) / nonZero.length;
  return Math.round(avg * 10) / 10;
}

// --- 8. Top Game (Req 7.3) ---

export function computeTopGame(
  games: Array<{ id: string; title: string; coverImage: string | null; playTimeHours: number }>
): PlaytimeData["topGame"] {
  if (games.length === 0) return null;
  const top = games.reduce((best, g) => (g.playTimeHours > best.playTimeHours ? g : best));
  if (top.playTimeHours <= 0) return null;
  return top;
}

// --- 9. Achievement Progress (Req 11.3, 11.6) ---

export function computeAchievementProgress(
  definitions: AchievementDefinition[],
  playerCounts: Record<string, number>,
  unlockedKeys: string[]
): { achievements: AchievementData[]; unlockedCount: number; totalCount: number } {
  const unlockedSet = new Set(unlockedKeys);
  const achievements: AchievementData[] = definitions.map((def) => ({
    key: def.key,
    unlockedAt: unlockedSet.has(def.key) ? new Date().toISOString() : null,
  }));

  // Check if player meets threshold even if not yet in unlockedKeys
  for (const achievement of achievements) {
    const def = definitions.find((d) => d.key === achievement.key)!;
    const count = playerCounts[def.category] ?? 0;
    if (count >= def.threshold && !achievement.unlockedAt) {
      achievement.unlockedAt = new Date().toISOString();
    }
  }

  const unlockedCount = achievements.filter((a) => a.unlockedAt !== null).length;
  return { achievements, unlockedCount, totalCount: definitions.length };
}

// --- 10. Session Frequency (Req 12.3) ---

const DAY_LABELS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export function computeSessionFrequency(sessions: Array<{ startedAt: string }>): DayFrequency[] {
  const counts = new Array(7).fill(0) as number[];

  for (const session of sessions) {
    const date = new Date(session.startedAt);
    if (isNaN(date.getTime())) continue;
    // JS getDay: 0=Sunday, 1=Monday ... 6=Saturday
    // We want 0=Monday ... 6=Sunday
    const jsDay = date.getDay();
    const idx = jsDay === 0 ? 6 : jsDay - 1;
    counts[idx]++;
  }

  return counts.map((sessionCount, i) => ({
    day: i,
    label: DAY_LABELS[i],
    sessionCount,
  }));
}

// --- 11. Goal Progress (Req 13.3, 13.4) ---

export function computeGoalProgress(goal: { targetValue: number; currentValue: number }): {
  ratio: number;
  isCompleted: boolean;
} {
  const ratio = Math.min(goal.currentValue / goal.targetValue, 1);
  const isCompleted = goal.currentValue >= goal.targetValue;
  return { ratio, isCompleted };
}

// --- 12. Platform Distribution (Req 5.1, 5.3) ---

export function computePlatformDistribution(
  libraryWithPlatforms: Array<{ platforms: string[] }>
): PlatformDistributionEntry[] {
  const platformCounts = new Map<string, number>();

  for (const entry of libraryWithPlatforms) {
    for (const platform of entry.platforms) {
      platformCounts.set(platform, (platformCounts.get(platform) ?? 0) + 1);
    }
  }

  if (platformCounts.size === 0) return [];

  const totalAssignments = Array.from(platformCounts.values()).reduce((a, b) => a + b, 0);

  const sorted = Array.from(platformCounts.entries()).sort((a, b) => b[1] - a[1]);

  return sorted.map(([platform, count]) => ({
    platform,
    count,
    percentage: Math.round((count / totalAssignments) * 1000) / 10,
  }));
}
