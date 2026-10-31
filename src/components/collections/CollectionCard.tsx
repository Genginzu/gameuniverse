"use client";

import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CollectionSummary } from "@/types/collection";

interface CollectionCardProps {
  collection: CollectionSummary;
  playerId: string;
  isOwner?: boolean;
  /** Override du chemin de base pour le lien (ex: "/collections" pour le dashboard) */
  basePath?: string;
  /** Si fourni, remplace la navigation par un callback (utilisé dans le profil joueur) */
  onSelect?: (slug: string) => void;
}

export function CollectionCard({
  collection,
  playerId,
  isOwner = false,
  basePath,
  onSelect,
}: CollectionCardProps) {
  const t = useTranslations("collections.card");
  const locale = useLocale();

  const formattedDate = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(collection.updatedAt));

  const coverImages = collection.coverImages.slice(0, 4);
  const href = basePath
    ? `${basePath}/${collection.slug}`
    : `/players/${playerId}/collections/${collection.slug}`;

  const cardContent = (
    <div className="border-editorial-line bg-editorial-3 group-hover:border-editorial-accent/55 relative cursor-pointer overflow-hidden rounded-lg border transition-colors duration-300">
      {/* Cover: image personnalisée ou grille auto */}
      <div className="from-editorial-accent/20 to-editorial-accent/5 relative aspect-video bg-linear-to-br">
        {collection.coverImageUrl ? (
          <LazyImage
            src={collection.coverImageUrl}
            alt={collection.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            showSkeleton
          />
        ) : coverImages.length > 0 ? (
          <CoverGrid images={coverImages} name={collection.name} />
        ) : (
          <EmptyCovers />
        )}

        {/* Visibility badge for owner */}
        {isOwner && (
          <div className="absolute top-2 left-2 z-20">
            <Badge
              variant={collection.isPublic ? "default" : "secondary"}
              className="px-1.5 py-0 text-[10px]"
            >
              {collection.isPublic ? t("public") : t("private")}
            </Badge>
          </div>
        )}

        {/* Games count badge */}
        <div className="absolute top-2 right-2 z-20">
          <div className="rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
            {t("gamesCount", { count: collection.gamesCount })}
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="p-3">
        <h3 className="group-hover:text-editorial-accent line-clamp-1 text-sm font-semibold text-white transition-colors">
          {collection.name}
        </h3>
        <p className="text-editorial-muted mt-0.5 line-clamp-1 text-xs">
          {collection.description || t("noDescription")}
        </p>
        <p className="text-editorial-muted mt-1 text-[10px]">
          {t("updatedAt", { date: formattedDate })}
        </p>
      </div>
    </div>
  );

  return (
    <div className="group relative">
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(collection.slug)}
          className="w-full text-left"
        >
          {cardContent}
        </button>
      ) : (
        <Link href={href}>{cardContent}</Link>
      )}
    </div>
  );
}

/** Grid of up to 4 cover thumbnails */
function CoverGrid({ images, name }: { images: string[]; name: string }) {
  if (images.length === 1) {
    return (
      <LazyImage
        src={images[0]}
        alt={name}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        showSkeleton
      />
    );
  }

  return (
    <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5">
      {images.map((src, index) => (
        <div key={index} className="relative overflow-hidden">
          <LazyImage
            src={src}
            alt={`${name} - ${index + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            showSkeleton
          />
        </div>
      ))}
      {/* Fill empty slots with placeholder backgrounds */}
      {Array.from({ length: 4 - images.length }).map((_, index) => (
        <div key={`empty-${index}`} className="bg-white/[0.06]" />
      ))}
    </div>
  );
}

/** Placeholder when collection has no games */
function EmptyCovers() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <svg
        className="text-editorial-accent h-8 w-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    </div>
  );
}
