import type { DailySessionStats } from "@/types/dashboard-stats";

export const SESSION_HISTORY_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Aggregates sessions per UTC calendar day over the last `days` days (today included),
 * oldest first. Days without sessions are kept with zero values so the chart has no gaps.
 */
export function computeDailySessions(
  sessions: Array<{ startedAt: string; durationMinutes: number }>,
  now: Date = new Date(),
  days: number = SESSION_HISTORY_DAYS
): DailySessionStats[] {
  const buckets = new Map<string, DailySessionStats>();
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = toUtcDateKey(new Date(now.getTime() - offset * DAY_MS));
    buckets.set(date, { date, sessionCount: 0, totalMinutes: 0 });
  }

  for (const session of sessions) {
    const started = new Date(session.startedAt);
    if (Number.isNaN(started.getTime())) continue;
    const bucket = buckets.get(toUtcDateKey(started));
    if (!bucket) continue;
    bucket.sessionCount += 1;
    bucket.totalMinutes += session.durationMinutes;
  }

  return [...buckets.values()];
}
