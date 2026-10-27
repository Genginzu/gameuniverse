"use client";

import Image, { type ImageLoader } from "next/image";
import type { ComponentProps } from "react";
import {
  getImageStrategy,
  igdbImageLoader,
  unsplashImageLoader,
  type ImageStrategy,
} from "@/lib/utils/imageLoader";

export type AppImageProps = ComponentProps<typeof Image>;

const SOURCE_LOADERS: Partial<Record<ImageStrategy, ImageLoader>> = {
  igdb: igdbImageLoader,
  unsplash: unsplashImageLoader,
};

/**
 * Drop-in replacement for `next/image` applying the project image policy
 * (see `src/lib/utils/imageLoader.ts`). Loaders are functions, which cannot
 * cross the server/client boundary: they are resolved here, client-side.
 */
export function AppImage(props: AppImageProps) {
  if (props.unoptimized || props.loader) {
    return <Image {...props} />;
  }
  const strategy = getImageStrategy(props.src);
  if (strategy === "passthrough") {
    return <Image {...props} unoptimized />;
  }
  const loader = SOURCE_LOADERS[strategy];
  return loader ? <Image {...props} loader={loader} /> : <Image {...props} />;
}
