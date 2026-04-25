"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useGameSync } from "@/hooks/useGameSync";
import { toast } from "@/hooks/use-toast";
import { TRACKABLE_FIELDS } from "@/lib/utils/field-tracking";
import type { TrackableField } from "@/types/admin-games";
import { Icon } from "@iconify/react";

interface GameFormSyncTabProps {
  gameId: string;
  igdbId: number | null;
  /** Called after a successful sync so the parent can reload game data */
  onSyncComplete?: () => void;
}

/** Maps each trackable field to its i18n label key */
const FIELD_LABEL_KEYS: Record<TrackableField, string> = {
  translations: "translations",
  cover_image: "coverImage",
  background_image: "backgroundImage",
  release_date: "releaseDate",
  metascore: "metascore",
  genres: "genres",
  companies: "companies",
  platforms: "gamePlatforms",
  screenshots: "screenshots",
  artworks: "artwork",
  age_ratings: "ageRatings",
  versions: "versions",
  languages: "gameLanguages",
  playtime: "playtime",
  popularity: "popularity",
  videos: "videos",
  similar_games: "similarGames",
};

export function GameFormSyncTab({ gameId, igdbId, onSyncComplete }: GameFormSyncTabProps) {
  const t = useTranslations("admin.games.form");
  const { overrides, loadingOverrides, syncingField, syncField, syncAll, error } =
    useGameSync(gameId);

  if (!igdbId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-900/20">
        <p className="text-amber-700 dark:text-amber-400">{t("noIgdbLink")}</p>
      </div>
    );
  }

  const isSyncing = syncingField !== null;
  const overriddenFields = new Set(overrides.map((o) => o.fieldName));

  return (
    <div className="space-y-4">
      {/* Sync all button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">IGDB #{igdbId}</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isSyncing}
          onClick={async () => {
            toast({
              title: t("syncStarted"),
              description: t("syncAllDescription"),
            });
            const ok = await syncAll();
            if (ok) {
              toast({ title: t("syncSuccess"), variant: "success" });
              onSyncComplete?.();
            } else {
              toast({ title: t("syncError"), variant: "destructive" });
            }
          }}
          className="gap-2"
        >
          {syncingField === "all" ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Icon icon="fa:sync" className="h-3 w-3" />
          )}
          {t("syncAll")}
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {t("syncError")}: {error}
        </div>
      )}

      {/* Field list */}
      {loadingOverrides ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      ) : (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
          {TRACKABLE_FIELDS.map((field) => {
            const isOverridden = overriddenFields.has(field);
            const isSyncingThis = syncingField === field;

            return (
              <div key={field} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  {isOverridden ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                      <Icon
                        icon="fa:pen"
                        className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400"
                      />
                    </span>
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                      <Icon
                        icon="fa:check"
                        className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400"
                      />
                    </span>
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t(FIELD_LABEL_KEYS[field])}
                  </span>
                  <span className="text-xs text-gray-400">
                    {isOverridden ? t("fieldOverridden") : t("fieldSynced")}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isSyncing}
                  onClick={async () => {
                    const fieldLabel = t(FIELD_LABEL_KEYS[field]);
                    toast({
                      title: t("syncFieldStarted", { field: fieldLabel }),
                      description:
                        field === "similar_games" ? t("syncSimilarGamesHint") : undefined,
                    });
                    const ok = await syncField(field);
                    if (ok) {
                      toast({
                        title: t("syncFieldSuccess", { field: fieldLabel }),
                        variant: "success",
                      });
                      onSyncComplete?.();
                    } else {
                      toast({
                        title: t("syncFieldError", { field: fieldLabel }),
                        variant: "destructive",
                      });
                    }
                  }}
                  className="gap-1.5 text-xs"
                >
                  {isSyncingThis ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Icon icon="fa:sync" className="h-2.5 w-2.5" />
                  )}
                  {t("syncField")}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
