"use client";

interface SyncProgressBarProps {
  synced: number;
  failed: number;
  remaining: number;
}

export function SyncProgressBar({ synced, failed, remaining }: SyncProgressBarProps) {
  const total = synced + failed + remaining;
  const percent = total > 0 ? Math.round(((synced + failed) / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-right text-xs text-gray-400">{percent}%</p>
    </div>
  );
}
