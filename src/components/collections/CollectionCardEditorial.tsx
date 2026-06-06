"use client";

/**
 * CollectionCardEditorial : carte d'une collection au look éditorial.
 *
 * Variante visuelle dédiée à la page `/collections` (et toute autre page
 * éditoriale). Conserve le composant `CollectionCard` legacy pour les usages
 * historiques (profil joueur, dashboard).
 *
 * Style : Tailwind inline + tokens éditoriaux.
 */

import { Icon } from "@iconify/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LazyImage } from "@/components/ui/lazy-image";
import type { CollectionSummary } from "@/types/collection";

interface CollectionCardEditorialProps {
  collection: CollectionSummary;
  /** Chemin de base pour le lien (ex: "/collections" pour user courant). */
  basePath: string;
  /** Affiche le badge de visibilité (réservé aux owners). */
  showVisibility?: boolean;
}

const BADGE =
  "inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 font-mono font-semibold text-white backdrop-blur-md";

export function CollectionCardEditorial({
  collection,
  basePath,
  showVisibility = false,
}: CollectionCardEditorialProps) {
  const t = useTranslations("collections.card");
  const locale = useLocale();

  const formattedDate = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(collection.updatedAt));

  const coverImages = collection.coverImages.slice(0, 4);
  const href = `${basePath}/${collection.slug}`;

  return (
    <Link
      href={href}
      className="border-editorial-line bg-editorial-2 hover:border-editorial-accent/50 hover:bg-editorial-3 group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))]"
      aria-label={collection.name}
    >
      <div className="from-editorial-accent/[0.18] to-editorial-accent/[0.06] relative aspect-[16/10] overflow-hidden bg-gradient-to-br">
        {collection.coverImageUrl ? (
          <LazyImage
            src={collection.coverImageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            showSkeleton
          />
        ) : coverImages.length > 0 ? (
          <CoverGrid images={coverImages} />
        ) : (
          <EmptyCover />
        )}

        {/* Vignette top→bottom pour lisibilité des badges */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/40"
          aria-hidden="true"
        />

        <div className="absolute inset-x-3 top-3 z-[1] flex items-center justify-between gap-2">
          {showVisibility ? (
            <span
              className={`${BADGE} text-[0.65rem] tracking-[0.12em] uppercase ${collection.isPublic ? "!text-editorial-accent" : ""}`}
            >
              <Icon
                icon={collection.isPublic ? "lucide:globe" : "lucide:lock"}
                className="h-3 w-3"
                aria-hidden="true"
              />
              {collection.isPublic ? t("public") : t("private")}
            </span>
          ) : (
            <span aria-hidden="true" />
          )}
          <span className={`${BADGE} text-[0.7rem]`}>
            <Icon icon="lucide:gamepad-2" className="h-3 w-3" aria-hidden="true" />
            {t("gamesCount", { count: collection.gamesCount })}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-[1.125rem] pt-4 pb-[1.125rem]">
        <h3 className="font-display text-lg font-bold tracking-tight text-white line-clamp-1">
          {collection.name}
        </h3>
        <p className="text-editorial-muted min-h-[2.5em] text-sm line-clamp-2">
          {collection.description || t("noDescription")}
        </p>
        <p className="mt-1 font-mono text-[0.7rem] font-medium tracking-[0.08em] text-white/40 uppercase">
          {t("updatedAt", { date: formattedDate })}
        </p>
      </div>
    </Link>
  );
}

function CoverGrid({ images }: { images: string[] }) {
  if (images.length === 1) {
    return (
      <LazyImage
        src={images[0]}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        showSkeleton
      />
    );
  }

  return (
    <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5">
      {images.map((src, index) => (
        <div key={index} className="relative overflow-hidden bg-white/[0.04]">
          <LazyImage
            src={src}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12vw"
            showSkeleton
          />
        </div>
      ))}
      {Array.from({ length: 4 - images.length }).map((_, i) => (
        <div key={`empty-${i}`} className="relative overflow-hidden bg-white/[0.04]" />
      ))}
    </div>
  );
}

function EmptyCover() {
  return (
    <div className="text-editorial-accent/50 grid h-full w-full place-items-center">
      <Icon icon="lucide:layers" className="h-10 w-10" aria-hidden="true" />
    </div>
  );
}
