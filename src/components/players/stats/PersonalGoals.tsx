"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Icon } from "@iconify/react";
import type { PlayerGoal } from "@/types/dashboard-stats";
import { StatsEmptyState } from "@/components/players/stats/StatsEmptyState";
import { StatsSectionTitle } from "@/components/players/stats/StatsSectionTitle";
import { PersonalGoalForm } from "@/components/players/stats/PersonalGoalForm";

interface PersonalGoalsProps {
  goals: PlayerGoal[];
  isOwnProfile: boolean;
  playerId: string;
  /** When provided, controls form visibility from parent (GoalsTab button) */
  showFormExternal?: boolean;
  onFormClosed?: () => void;
}

function formatDeadline(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(isoDate));
}

export function PersonalGoals({
  goals: initialGoals,
  isOwnProfile,
  playerId,
  showFormExternal,
  onFormClosed,
}: PersonalGoalsProps) {
  const t = useTranslations("playerStats");
  const locale = useLocale();
  const [goals, setGoals] = useState<PlayerGoal[]>(initialGoals);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync with external form toggle
  useEffect(() => {
    if (showFormExternal !== undefined) setShowForm(showFormExternal);
  }, [showFormExternal]);

  // Keep goals in sync when parent re-fetches
  useEffect(() => {
    setGoals(initialGoals);
  }, [initialGoals]);

  if (!isOwnProfile) return null;

  async function handleDelete(goalId: string) {
    setDeletingId(goalId);
    try {
      const res = await fetch(`/api/players/${playerId}/stats/dashboard/goals?id=${goalId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setGoals((prev) => prev.filter((g) => g.id !== goalId));
      }
    } finally {
      setDeletingId(null);
    }
  }

  function handleCreated(goal: PlayerGoal) {
    setGoals((prev) => [...prev, goal]);
    setShowForm(false);
    onFormClosed?.();
  }

  function handleCancel() {
    setShowForm(false);
    onFormClosed?.();
  }

  return (
    <section>
      <StatsSectionTitle>{t("goals.title")}</StatsSectionTitle>

      <div className="glass-card rounded-xl p-6">
        {goals.length === 0 && !showForm ? (
          <StatsEmptyState
            icon={<Icon icon="lucide:target" className="h-8 w-8" />}
            message={t("goals.empty")}
          />
        ) : (
          <div className="grid gap-3">
            {goals.map((goal) => {
              const progress = Math.min(goal.currentValue / goal.targetValue, 1);
              const percent = Math.round(progress * 100);
              const isCompleted = goal.currentValue >= goal.targetValue;

              return (
                <div
                  key={goal.id}
                  className="rounded-xl bg-white/30 p-4 transition-all duration-300 dark:bg-slate-700/40"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {t(`goals.goalTypes.${goal.goalType}` as Parameters<typeof t>[0])}
                      </span>
                      {isCompleted && (
                        <Icon icon="lucide:check-circle" className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isCompleted && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {t("goals.completed")}
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(goal.id)}
                        disabled={deletingId === goal.id}
                        className="rounded-lg p-1.5 text-gray-400 transition-all duration-300 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50 dark:text-slate-500 dark:hover:text-red-400"
                        title={t("goals.deleteGoal")}
                      >
                        <Icon icon="lucide:trash-2" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-1 h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
                    <div
                      className="from-neon-violet to-neon-cyan h-full rounded-full bg-linear-to-r transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                    <span>
                      {goal.currentValue} / {goal.targetValue} — {percent}%
                    </span>
                    {goal.deadline && (
                      <span>
                        {t("goals.deadline")}: {formatDeadline(goal.deadline, locale)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showForm && (
          <PersonalGoalForm
            playerId={playerId}
            onCreated={handleCreated}
            onCancel={handleCancel}
          />
        )}
      </div>
    </section>
  );
}
