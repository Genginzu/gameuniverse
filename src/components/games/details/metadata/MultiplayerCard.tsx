"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { SpotlightCard } from "@/components/shared/SpotlightCard";
import { summarizeMultiplayer, type MultiplayerCapability } from "@/lib/utils/multiplayerSummary";
import type { GameMultiplayerMode } from "@/types/game-metadata";

interface MultiplayerCardProps {
  modes: GameMultiplayerMode[];
}

const CAPABILITY_ICONS: Record<MultiplayerCapability["key"], string> = {
  onlineMax: "lucide:globe",
  onlineCoop: "lucide:users",
  offlineMax: "lucide:sofa",
  offlineCoop: "lucide:handshake",
  splitscreen: "lucide:columns-2",
  splitscreenOnline: "lucide:monitor-smartphone",
  lanCoop: "lucide:network",
  campaignCoop: "lucide:swords",
  dropIn: "lucide:log-in",
};

/** IGDB multiplayer capabilities merged across platforms, with player caps. */
export function MultiplayerCard({ modes }: MultiplayerCardProps) {
  const t = useTranslations("gameDetails.editorial.universe");
  const { capabilities, platforms } = summarizeMultiplayer(modes);

  if (capabilities.length === 0) return null;

  return (
    <SpotlightCard className="p-5 md:p-6">
      <h3 className="mb-4 font-display text-lg">{t("multiplayer")}</h3>
      <ul className="grid grid-cols-1 gap-3 xs:grid-cols-2">
        {capabilities.map((capability) => (
          <li
            key={capability.key}
            className="flex items-center gap-3 rounded-md border border-editorial-line bg-white/[0.03] px-4 py-3"
          >
            <Icon
              icon={CAPABILITY_ICONS[capability.key]}
              className="size-5 shrink-0 text-editorial-accent"
              aria-hidden
            />
            <span className="min-w-0 text-sm">
              {t(`capabilities.${capability.key}`)}
              {capability.players !== null && (
                <span className="block text-editorial-muted">
                  {t("upToPlayers", { count: capability.players })}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      {platforms.length > 0 && (
        <p className="mt-4 text-sm text-editorial-muted">
          {t("multiplayerPlatforms", { platforms: platforms.join(", ") })}
        </p>
      )}
    </SpotlightCard>
  );
}
