"use client";

import type { GameFormTabProps } from "@/types/admin-games";
import { IgdbFieldIndicator } from "./IgdbFieldIndicator";
import { Icon } from "@iconify/react";
import { getPlatformIcon } from "@/lib/utils/platform-icons";

interface PlatformsTabProps extends GameFormTabProps {
  gamePlatforms: Array<{ id: string; slug: string; name: string }>;
  togglePlatform: (platformId: string) => void;
}

export function GameFormPlatformsTab({
  form,
  gamePlatforms,
  togglePlatform,
  isIgdbField,
}: PlatformsTabProps) {
  const selected = form.watch("game_platforms");

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {selected.length} {selected.length === 1 ? "plateforme" : "plateformes"}
        {isIgdbField && (
          <IgdbFieldIndicator fieldName="platforms" isIgdbField={isIgdbField("platforms")} />
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {gamePlatforms.map((platform) => {
          const isSelected = selected.some((gp) => gp.platform_id === platform.id);
          const platformIconName = getPlatformIcon(platform.slug);
          return (
            <button
              key={platform.id}
              type="button"
              onClick={() => togglePlatform(platform.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary shadow-xs dark:bg-primary/20"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
              }`}
              aria-pressed={isSelected}
              aria-label={platform.name}
            >
              <Icon icon={platformIconName} className="h-4 w-4 shrink-0" />
              {platform.name}
            </button>
          );
        })}
      </div>
      {form.formState.errors.game_platforms && (
        <p className="mt-3 text-sm font-medium text-destructive">
          {form.formState.errors.game_platforms.message}
        </p>
      )}
    </div>
  );
}
