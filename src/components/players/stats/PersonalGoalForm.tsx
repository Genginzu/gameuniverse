"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { PlayerGoal } from "@/types/dashboard-stats";

type GoalType = PlayerGoal["goalType"];

const GOAL_TYPES: GoalType[] = [
  "games_to_complete",
  "play_time_hours",
  "reviews_to_write",
  "collections_to_create",
];

interface PersonalGoalFormProps {
  playerId: string;
  onCreated: (goal: PlayerGoal) => void;
  onCancel: () => void;
}

export function PersonalGoalForm({ playerId, onCreated, onCancel }: PersonalGoalFormProps) {
  const t = useTranslations("playerStats");
  const [goalType, setGoalType] = useState<GoalType>("games_to_complete");
  const [targetValue, setTargetValue] = useState("");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const target = parseInt(targetValue, 10);
    if (!target || target <= 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/players/${playerId}/stats/dashboard/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal_type: goalType,
          target_value: target,
          deadline: deadline || null,
        }),
      });

      if (!res.ok) return;

      const raw = await res.json();
      const created: PlayerGoal = {
        id: raw.id,
        goalType: raw.goal_type,
        targetValue: raw.target_value,
        currentValue: raw.current_value ?? 0,
        deadline: raw.deadline ?? null,
        createdAt: raw.created_at,
      };
      onCreated(created);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-xl border border-white/20 bg-white/20 p-4 dark:border-slate-700/50 dark:bg-slate-800/30"
    >
      <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
        {t("goals.create.title")}
      </h4>

      <div className="grid gap-3">
        {/* Goal type select */}
        <div>
          <label className="mb-1 block text-xs text-gray-500 dark:text-slate-400">
            {t("goals.create.type")}
          </label>
          <select
            value={goalType}
            onChange={(e) => setGoalType(e.target.value as GoalType)}
            className="glass-input w-full rounded-lg px-3 py-2 text-sm"
          >
            {GOAL_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`goals.goalTypes.${type}` as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>
        </div>

        {/* Target value */}
        <div>
          <label className="mb-1 block text-xs text-gray-500 dark:text-slate-400">
            {t("goals.create.target")}
          </label>
          <input
            type="number"
            min={1}
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            required
            className="glass-input w-full rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Optional deadline */}
        <div>
          <label className="mb-1 block text-xs text-gray-500 dark:text-slate-400">
            {t("goals.create.deadline")}
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="glass-input w-full rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={submitting || !targetValue}
          className="rounded-lg bg-linear-to-r from-neon-violet to-neon-cyan px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:opacity-90 disabled:opacity-50"
        >
          {t("goals.create.submit")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-all duration-300 hover:bg-white/40 dark:text-slate-400 dark:hover:bg-slate-700/40"
        >
          {t("goals.create.cancel")}
        </button>
      </div>
    </form>
  );
}
