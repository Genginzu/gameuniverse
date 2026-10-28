"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { SpotlightCard } from "@/components/shared/SpotlightCard";
import type { GameWebsite } from "@/types/game-metadata";
import { igdbLabel } from "@/lib/utils/igdbLabels";
import { websiteIcon, websiteRank } from "./websiteIcons";

interface WebsitesCardProps {
  websites: GameWebsite[];
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Official site, stores and communities of the game, sorted by kind. */
export function WebsitesCard({ websites }: WebsitesCardProps) {
  const t = useTranslations("gameDetails.editorial.universe");
  const tLabels = useTranslations("igdbMetadata");

  if (websites.length === 0) return null;

  const sorted = [...websites].sort((a, b) => websiteRank(a.typeId) - websiteRank(b.typeId));

  return (
    <SpotlightCard className="p-5 md:p-6">
      <h3 className="mb-4 font-display text-lg">{t("websites")}</h3>
      <ul className="grid grid-cols-1 gap-2 xs:grid-cols-2">
        {sorted.map((website) => (
          <li key={website.url}>
            <a
              href={website.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex min-h-11 items-center gap-3 rounded-md border border-editorial-line bg-white/[0.03] px-4 py-2 transition-colors hover:border-editorial-accent hover:text-editorial-accent"
            >
              <Icon icon={websiteIcon(website.typeId)} className="size-5 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm">
                {igdbLabel(tLabels, "websiteTypes", website.typeId, hostOf(website.url))}
              </span>
              <Icon icon="lucide:external-link" className="size-4 shrink-0 text-editorial-muted" aria-hidden />
              <span className="sr-only">{t("opensInNewTab")}</span>
            </a>
          </li>
        ))}
      </ul>
    </SpotlightCard>
  );
}
