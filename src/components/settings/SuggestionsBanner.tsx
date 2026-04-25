"use client";

import useSWR from "swr";
import { Icon } from "@iconify/react";
import { fetcher } from "@/lib/swr/fetcher";
import { Button } from "@/components/ui/button";
import { PLATFORM_META, type GamingPlatform } from "@/types/linked-platforms";

interface Suggestion {
  platform: GamingPlatform;
  username: string;
  verified: boolean;
}

interface Payload {
  suggestions: Suggestion[];
}

const OAUTH_ROUTES: Partial<Record<GamingPlatform, string>> = {
  steam: "/api/auth/steam",
  xbox: "/api/auth/xbox",
  epic: "/api/auth/epic",
  battlenet: "/api/auth/battlenet",
  itch: "/api/auth/itch",
};

export function SuggestionsBanner({
  linked,
  t,
}: {
  linked: Set<GamingPlatform>;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const hasDiscord = linked.has("discord");
  const { data } = useSWR<Payload>(
    hasDiscord ? "/api/profile/linked-platforms/suggestions" : null,
    fetcher
  );

  const suggestions = data?.suggestions ?? [];
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-palette-secondary-200/60 bg-palette-secondary-50/70 p-3 backdrop-blur-xl dark:border-palette-secondary-900/40 dark:bg-palette-secondary-900/20">
      <div className="flex items-center gap-2">
        <Icon icon="lucide:sparkles" className="h-4 w-4 text-palette-secondary-600 dark:text-palette-secondary-400" />
        <p className="text-sm text-palette-secondary-900 dark:text-palette-secondary-100">
          {t("suggestionsTitle")}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => {
          const meta = PLATFORM_META[s.platform];
          const oauthRoute = OAUTH_ROUTES[s.platform];
          return (
            <div
              key={s.platform}
              className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-1.5 text-sm shadow-sm dark:bg-slate-800/50"
            >
              <Icon icon={meta.icon} className={`h-4 w-4 ${meta.color}`} />
              <span className="font-medium">{t(`names.${s.platform}`)}</span>
              <span className="text-gray-500 dark:text-gray-400">({s.username})</span>
              {oauthRoute ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => { window.location.href = oauthRoute; }}
                >
                  {t("suggestionLink")}
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
