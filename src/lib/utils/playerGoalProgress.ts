import type { PlayerGoal } from "@/types/dashboard-stats";

export interface GoalProgressSources {
  sessions: Array<{ startedAt: string; durationMinutes: number }>;
  completedGames: Array<{ addedAt: string | null }>;
  reviews: Array<{ createdAt: string }>;
  collections: Array<{ createdAt: string }>;
}

interface GoalWindow {
  startMs: number;
  endMs: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A goal counts activity from the UTC day it was created (sessions can be
 * backdated to earlier that day) up to the end of its deadline day.
 */
function goalWindow(goal: Pick<PlayerGoal, "createdAt" | "deadline">): GoalWindow {
  const created = new Date(goal.createdAt);
  const startMs = Date.UTC(created.getUTCFullYear(), created.getUTCMonth(), created.getUTCDate());
  const endMs = goal.deadline ? Date.parse(`${goal.deadline}T00:00:00Z`) + DAY_MS - 1 : Infinity;
  return { startMs, endMs };
}

function inWindow(timestamp: string | null, window: GoalWindow): boolean {
  if (!timestamp) return false;
  const ms = Date.parse(timestamp);
  return ms >= window.startMs && ms <= window.endMs;
}

function countInWindow(rows: Array<string | null>, window: GoalWindow): number {
  return rows.filter((ts) => inWindow(ts, window)).length;
}

export function computeGoalProgress(
  goal: Pick<PlayerGoal, "goalType" | "createdAt" | "deadline">,
  sources: GoalProgressSources
): number {
  const window = goalWindow(goal);
  switch (goal.goalType) {
    case "play_time_hours": {
      const minutes = sources.sessions
        .filter((s) => inWindow(s.startedAt, window))
        .reduce((sum, s) => sum + s.durationMinutes, 0);
      return Math.round((minutes / 60) * 10) / 10;
    }
    case "games_to_complete":
      return countInWindow(
        sources.completedGames.map((g) => g.addedAt),
        window
      );
    case "reviews_to_write":
      return countInWindow(
        sources.reviews.map((r) => r.createdAt),
        window
      );
    case "collections_to_create":
      return countInWindow(
        sources.collections.map((c) => c.createdAt),
        window
      );
  }
}

export function isGoalExpired(
  goal: Pick<PlayerGoal, "createdAt" | "deadline" | "currentValue" | "targetValue">,
  now: Date = new Date()
): boolean {
  if (!goal.deadline || goal.currentValue >= goal.targetValue) return false;
  return now.getTime() > goalWindow(goal).endMs;
}
