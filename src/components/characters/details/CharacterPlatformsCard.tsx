"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import type { PlatformSummary } from "@/types/platform";
import { Icon } from "@iconify/react";
import { getPlatformIcon } from "@/lib/utils/platform-icons";

const ACCENT = "rgb(var(--accent-rgb, var(--neon-primary)))";

interface CharacterPlatformsCardProps {
  platforms: PlatformSummary[];
}

export function CharacterPlatformsCard({ platforms }: CharacterPlatformsCardProps) {
  const t = useTranslations();

  return (
    <div className="border-editorial-line bg-editorial-2 rounded-2xl border p-6">
      <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
        <Icon icon="lucide:monitor" className="h-5 w-5" style={{ color: ACCENT }} />
        {t("characters.details.platforms")}
      </h4>
      {platforms.length === 0 ? (
        <p className="text-editorial-muted text-sm">{t("characters.details.noPlatforms")}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => (
            <Badge
              key={platform.id}
              variant="secondary"
              className="border-editorial-line bg-editorial-3 text-editorial-muted inline-flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors hover:text-white"
            >
              <Icon icon={getPlatformIcon(platform.slug)} className="h-3.5 w-3.5 shrink-0" />
              {platform.abbreviation || platform.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
