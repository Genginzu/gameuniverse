"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { AppImage } from "@/components/ui/app-image";
import { ConsentGate } from "@/components/legal/ConsentGate";
import { buildYouTubeEmbedSrc } from "@/lib/utils/youtube";
import type { GameMediaViewerItem } from "@/types/game";

interface MediaLightboxStageProps {
  item: GameMediaViewerItem;
}

/** Enlarged rendering of the current viewer item: contained image or embedded video. */
export function MediaLightboxStage({ item }: MediaLightboxStageProps) {
  const t = useTranslations("gameDetails.editorial.mediaViewer");

  if (item.kind === "image") {
    return (
      <div className="relative h-full w-full">
        <AppImage src={item.url} alt={item.alt} fill sizes="100vw" className="object-contain" priority />
      </div>
    );
  }

  const embedSrc = buildYouTubeEmbedSrc(item.url, true);

  return (
    <div className="aspect-video w-full max-w-6xl overflow-hidden rounded-lg border border-editorial-line bg-black">
      {embedSrc ? (
        <ConsentGate category="media">
          <iframe
            src={embedSrc}
            title={item.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full border-0"
          />
        </ConsentGate>
      ) : (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-full min-h-[44px] w-full items-center justify-center gap-2 text-sm font-semibold text-white hover:text-editorial-accent"
        >
          <Icon icon="lucide:external-link" className="size-5" />
          {t("openVideo")}
        </a>
      )}
    </div>
  );
}
