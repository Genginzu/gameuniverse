"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlatformIcon } from "@/lib/utils/platform-icons";
import { PlatformFilterOption } from "@/types/platform";

interface PlatformFilterProps {
  platforms: PlatformFilterOption[];
  selectedPlatforms: string[];
  onPlatformsChange: (slugs: string[]) => void;
  showSkeleton?: boolean;
}

export function PlatformFilter({
  platforms,
  selectedPlatforms,
  onPlatformsChange,
  showSkeleton = false,
}: PlatformFilterProps) {
  const t = useTranslations("platforms");

  const handleToggle = (slug: string) => {
    const updated = selectedPlatforms.includes(slug)
      ? selectedPlatforms.filter((s) => s !== slug)
      : [...selectedPlatforms, slug];
    onPlatformsChange(updated);
  };

  // Afficher un skeleton si demandé et pas encore de données
  if (platforms.length === 0 && showSkeleton) {
    const widths = [88, 104, 80, 96, 72, 92, 84, 100];
    return (
      <div className="rounded-xl bg-white/60 p-4 ring-1 ring-gray-200/50 backdrop-blur-xs dark:bg-slate-800/50 dark:ring-slate-700/50">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {widths.map((w, i) => (
            <Skeleton key={i} className="h-7 rounded-full" style={{ width: `${w}px` }} />
          ))}
        </div>
      </div>
    );
  }

  if (platforms.length === 0) return null;

  return (
    <div className="rounded-xl bg-white/60 p-4 ring-1 ring-gray-200/50 backdrop-blur-xs dark:bg-slate-800/50 dark:ring-slate-700/50">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t("filter.title")}</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {platforms.length} {t("filter.available")}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {platforms.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.slug);
          const iconName = getPlatformIcon(platform.slug);
          return (
            <button
              key={platform.id}
              onClick={() => handleToggle(platform.slug)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                isSelected
                  ? "bg-linear-to-r from-cyan-500 to-violet-500 text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700/50 dark:text-gray-300 dark:hover:bg-slate-700"
              }`}
            >
              <Icon icon={iconName} className="h-3.5 w-3.5 shrink-0" />
              {platform.name}
              <span className="opacity-60">{platform.gameCount}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
