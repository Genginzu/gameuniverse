"use client";

interface GameFilterButtonProps {
  hasFilters: boolean;
  filterCount: number;
  onClick: () => void;
}

export function GameFilterButton({ hasFilters, filterCount, onClick }: GameFilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-14 items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-base font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
    >
      <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
        />
      </svg>
      Filtrer
      {hasFilters && (
        <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-sm">{filterCount}</span>
      )}
    </button>
  );
}
