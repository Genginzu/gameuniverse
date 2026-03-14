"use client";

import type { ReactNode } from "react";

interface StatsEmptyStateProps {
  icon: ReactNode;
  message: string;
}

export function StatsEmptyState({ icon, message }: StatsEmptyStateProps) {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-3 rounded-xl p-8 text-center transition-all duration-300">
      <div className="text-violet-500 dark:text-cyan-400">{icon}</div>
      <p className="text-sm text-gray-500 dark:text-slate-400">{message}</p>
    </div>
  );
}
