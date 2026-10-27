"use client";

import { AppImage } from "@/components/ui/app-image";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { Link } from "@/i18n/navigation";
import type { FranchiseSummary } from "@/types/franchise";

/** Franchise tile: cover of its most popular game, name and game count. */
export function FranchiseCard({ franchise }: { franchise: FranchiseSummary }) {
  const t = useTranslations("franchises");

  return (
    <Link
      href={`/franchises/${franchise.slug}`}
      className="group border-editorial-line bg-editorial-2 hover:border-editorial-accent relative block overflow-hidden rounded-2xl border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <div className="bg-editorial-3 relative aspect-[3/4]">
        {franchise.coverImage ? (
          <AppImage
            src={franchise.coverImage}
            alt=""
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
          />
        ) : (
          <div className="text-editorial-muted grid h-full place-items-center">
            <Icon icon="lucide:library-big" className="size-10" aria-hidden />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h2 className="font-display line-clamp-2 text-lg leading-tight font-semibold text-white">
          {franchise.name}
        </h2>
        <p className="text-editorial-muted mt-1 text-sm">{t("gameCount", { count: franchise.gameCount })}</p>
      </div>
    </Link>
  );
}
