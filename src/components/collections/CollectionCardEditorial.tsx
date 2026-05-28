"use client";

/**
 * CollectionCardEditorial : carte d'une collection au look éditorial.
 *
 * Variante visuelle dédiée à la page `/collections` (et toute autre page
 * éditoriale). Conserve le composant `CollectionCard` legacy pour les usages
 * historiques (profil joueur, dashboard).
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
      className="editorial-collection-card group"
      aria-label={collection.name}
    >
      <div className="editorial-collection-card-cover">
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

        <div className="editorial-collection-card-badges">
          {showVisibility ? (
            <span
              className={`editorial-collection-card-visibility${collection.isPublic ? " public" : ""}`}
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
          <span className="editorial-collection-card-count">
            <Icon icon="lucide:gamepad-2" className="h-3 w-3" aria-hidden="true" />
            {t("gamesCount", { count: collection.gamesCount })}
          </span>
        </div>
      </div>

      <div className="editorial-collection-card-body">
        <h3 className="editorial-collection-card-name">{collection.name}</h3>
        <p className="editorial-collection-card-description">
          {collection.description || t("noDescription")}
        </p>
        <p className="editorial-collection-card-footer">
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
    <div className="editorial-collection-card-cover-grid">
      {images.map((src, index) => (
        <div key={index} className="editorial-collection-card-cover-cell">
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
        <div key={`empty-${i}`} className="editorial-collection-card-cover-cell" />
      ))}
    </div>
  );
}

function EmptyCover() {
  return (
    <div className="editorial-collection-card-cover-empty">
      <Icon icon="lucide:layers" className="h-10 w-10" aria-hidden="true" />
    </div>
  );
}
