"use client";

interface PlayersEmptyStateProps {
  hasFilters: boolean;
  title: string;
  description: string;
  clearLabel: string;
  onClear: () => void;
}

export function PlayersEmptyState({
  hasFilters,
  title,
  description,
  clearLabel,
  onClear,
}: PlayersEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-xs dark:bg-gray-800 sm:py-20">
      <div className="mb-6 rounded-full bg-linear-to-br from-gray-100 to-gray-200 p-6 dark:from-gray-700 dark:to-gray-600">
        <svg
          className="h-12 w-12 text-gray-400 sm:h-16 sm:w-16"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
        {title}
      </h3>
      <p className="max-w-md text-sm text-gray-500 dark:text-gray-400 sm:text-base">
        {description}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {clearLabel}
        </button>
      )}
    </div>
  );
}
