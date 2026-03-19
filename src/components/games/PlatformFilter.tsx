"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface PlatformOption {
  id: string;
  slug: string;
  name: string;
  abbreviation?: string | null;
  iconUrl?: string | null;
  gameCount: number;
}

interface PlatformFilterProps {
  selectedPlatforms: string[];
  onPlatformsChange: (slugs: string[]) => void;
  locale?: string;
}

export function PlatformFilter({
  selectedPlatforms,
  onPlatformsChange,
  locale = "fr",
}: PlatformFilterProps) {
  const t = useTranslations("platforms");
  const [platforms, setPlatforms] = useState<PlatformOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlatforms() {
      try {
        const res = await fetch(`/api/platforms?locale=${locale}`);
        if (!res.ok) return;
        const data = await res.json();
        setPlatforms(data.platforms || []);
      } catch {
        // Silently fail — filter just won't show platforms
      } finally {
        setLoading(false);
      }
    }
    fetchPlatforms();
  }, [locale]);

  const handleToggle = (slug: string) => {
    const updated = selectedPlatforms.includes(slug)
      ? selectedPlatforms.filter((s) => s !== slug)
      : [...selectedPlatforms, slug];
    onPlatformsChange(updated);
  };

  if (loading || platforms.length === 0) return null;

  return (
    <div className="rounded-xl bg-white/40 p-4 shadow-lg ring-1 ring-white/20 backdrop-blur-xl transition-all duration-300 dark:bg-slate-800/50 dark:ring-slate-700/50 sm:p-6">
      <div className="mb-4 flex flex-col items-start justify-between sm:flex-row sm:items-center">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
          {t("filter.title")}
        </h3>
        <span className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
          {platforms.length} {t("filter.available")}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {platforms.map((platform) => (
          <label
            key={platform.id}
            className="group relative flex cursor-pointer items-center rounded-lg border border-white/20 bg-white/30 p-3 transition-all hover:border-violet-400 hover:bg-white/50 dark:border-slate-700/50 dark:bg-slate-700/30 dark:hover:border-violet-500 dark:hover:bg-slate-700/50"
          >
            <input
              type="checkbox"
              checked={selectedPlatforms.includes(platform.slug)}
              onChange={() => handleToggle(platform.slug)}
              className="sr-only"
            />
            <div
              className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-all sm:h-5 sm:w-5 ${
                selectedPlatforms.includes(platform.slug)
                  ? "border-violet-600 bg-gradient-to-r from-[#615dfa] via-[#5b36d4] to-[#7c5cfc]"
                  : "border-gray-300 group-hover:border-violet-400 dark:border-gray-600"
              }`}
            >
              {selectedPlatforms.includes(platform.slug) && (
                <svg
                  className="h-2.5 w-2.5 text-white sm:h-3 sm:w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <div className="ml-2 min-w-0 flex-1 sm:ml-3">
              <span className="text-xs font-medium text-gray-900 dark:text-white sm:text-sm">
                {platform.name}
              </span>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {platform.gameCount} {platform.gameCount === 1 ? "jeu" : "jeux"}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
