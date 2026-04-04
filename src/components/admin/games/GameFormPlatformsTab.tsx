"use client";

import { useState } from "react";
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
  t,
  isIgdbField,
}: PlatformsTabProps) {
  const [search, setSearch] = useState("");
  const selected = form.watch("game_platforms");

  const filtered = gamePlatforms.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {selected.length} {selected.length === 1 ? "plateforme" : "plateformes"}
        {isIgdbField && (
          <IgdbFieldIndicator fieldName="platforms" isIgdbField={isIgdbField("platforms")} />
        )}
      </p>
      <div className="relative mb-3">
        <Icon
          icon="mdi:magnify"
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlatform") ?? "Rechercher une plateforme..."}
          className="focus:border-primary focus:ring-primary w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm text-gray-900 focus:ring-1 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {filtered.map((platform) => {
          const isSelected = selected.some((gp) => gp.platform_id === platform.id);
          const platformIconName = getPlatformIcon(platform.slug);
          return (
            <button
              key={platform.id}
              type="button"
              onClick={() => togglePlatform(platform.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary dark:bg-primary/20 shadow-xs"
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
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400">
            {t("noResultsPlatform") ?? "Aucune plateforme trouvée"}
          </p>
        )}
      </div>
      {form.formState.errors.game_platforms && (
        <p className="text-destructive mt-3 text-sm font-medium">
          {form.formState.errors.game_platforms.message}
        </p>
      )}
    </div>
  );
}
