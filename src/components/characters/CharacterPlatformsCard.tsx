"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Monitor } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PlatformSummary } from "@/types/platform";
import { Icon } from "@iconify/react";
import { getPlatformIcon } from "@/lib/utils/platform-icons";

interface CharacterPlatformsCardProps {
  platforms: PlatformSummary[];
  accentColor: string;
}

export function CharacterPlatformsCard({ platforms, accentColor }: CharacterPlatformsCardProps) {
  const t = useTranslations();

  if (platforms.length === 0) {
    return (
      <Card className="rounded-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Monitor className="h-5 w-5" style={{ color: accentColor }} />
            {t("characters.details.platforms")}
          </h4>
          <p className="text-sm text-slate-400">{t("characters.details.noPlatforms")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Monitor className="h-5 w-5" style={{ color: accentColor }} />
          {t("characters.details.platforms")}
        </h4>
        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => {
            const platformIconName = getPlatformIcon(platform.slug);
            return (
              <Badge
                key={platform.id}
                variant="secondary"
                className="inline-flex items-center gap-1.5 border-slate-600 bg-slate-900/50 px-3 py-1.5 text-sm text-slate-300 backdrop-blur-sm transition-all hover:bg-slate-700/60"
              >
                <Icon icon={platformIconName} className="h-3.5 w-3.5 shrink-0" />
                {platform.abbreviation || platform.name}
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
