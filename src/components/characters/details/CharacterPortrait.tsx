"use client";

import { useState } from "react";

import { AppImage } from "@/components/ui/app-image";

const FRAME_RATIO = 3 / 4;

interface CharacterPortraitProps {
  src: string;
  alt: string;
}

/**
 * Character hero portrait scaled to fill its 3/4 frame on the limiting axis, so
 * the img box matches the visible picture and its rounded corners stay on it.
 */
export function CharacterPortrait({ src, alt }: CharacterPortraitProps) {
  const [ratio, setRatio] = useState<number | null>(null);

  const fitClass =
    ratio === null
      ? "h-full w-full object-contain"
      : ratio < FRAME_RATIO
        ? "h-full w-auto"
        : "h-auto w-full";

  return (
    <AppImage
      src={src}
      alt={alt}
      width={360}
      height={480}
      className={`${fitClass} rounded-3xl [mask-composite:intersect] [mask-image:linear-gradient(to_bottom,transparent,#000_15%,#000_85%,transparent),linear-gradient(to_right,transparent,#000_15%,#000_85%,transparent)]`}
      sizes="(max-width: 768px) 375px, 450px"
      priority
      onLoad={(event) => {
        const { naturalWidth, naturalHeight } = event.currentTarget;
        if (naturalWidth > 0 && naturalHeight > 0) setRatio(naturalWidth / naturalHeight);
      }}
    />
  );
}
