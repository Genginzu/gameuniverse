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
    <div className="border-editorial-accent/20 bg-editorial-accent/8 flex flex-col gap-2 rounded-xl border p-3">
      <div className="flex items-center gap-2">
        <Icon icon="lucide:sparkles" className="text-editorial-accent h-4 w-4" />
        <p className="text-editorial-accent text-sm">{t("suggestionsTitle")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => {
          const meta = PLATFORM_META[s.platform];
          const oauthRoute = OAUTH_ROUTES[s.platform];
          return (
            <div
              key={s.platform}
              className="border-editorial-line bg-editorial-3 flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm"
            >
              <Icon icon={meta.icon} className={`h-4 w-4 ${meta.color}`} />
              <span className="font-medium text-white">{t(`names.${s.platform}`)}</span>
              <span className="text-editorial-muted">({s.username})</span>
              {oauthRoute ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="hover:bg-editorial-accent/12 hover:text-editorial-accent h-7 px-2 text-xs text-white/70"
                  onClick={() => {
                    window.location.href = oauthRoute;
                  }}
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
