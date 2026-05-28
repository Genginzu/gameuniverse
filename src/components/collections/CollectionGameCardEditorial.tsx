"use client";

/**
 * CollectionGameCardEditorial : carte d'un jeu dans une collection (look éditorial).
 *
 * Affichée dans la grille de la page Collection detail (`/collections/[slug]`).
 * Si `onRemove` est fourni (owner uniquement), un bouton « Retirer » apparaît
 * en haut à droite — révélé au hover sur desktop, toujours visible sur mobile.
 *
 * Le bouton stoppe la propagation pour ne pas déclencher la navigation vers
 * la fiche jeu rendue par le `Link` sous-jacent.
 */

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { LazyImage } from "@/components/ui/lazy-image";
import type { CollectionItem } from "@/types/collection";

interface CollectionGameCardEditorialProps {
  item: CollectionItem;
  /**
   * Callback de suppression. Si défini, affiche le bouton trash overlay.
   * Owner-only : la décision de fournir ou non ce callback est prise par le
   * parent via `user.id === collection.userId`.
   */
  onRemove?: () => void;
}

export function CollectionGameCardEditorial({ item, onRemove }: CollectionGameCardEditorialProps) {
  const t = useTranslations("collections.editorial.detail.removeItem");

  const handleRemoveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <div className="editorial-collection-game-card-wrapper">
      <Link
        href={`/games/${item.slug}`}
        className="editorial-collection-game-card"
        aria-label={item.title}
      >
        <div className="editorial-collection-game-card-cover">
          <LazyImage
            src={item.coverImage ?? undefined}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 14vw"
            showSkeleton
          />
        </div>
        <h3 className="editorial-collection-game-card-title">{item.title}</h3>
        {item.note && <p className="editorial-collection-game-card-note">{item.note}</p>}
      </Link>

      {onRemove && (
        <button
          type="button"
          onClick={handleRemoveClick}
          className="editorial-collection-game-card-remove"
          aria-label={t("ariaLabel", { title: item.title })}
        >
          <Icon icon="lucide:trash-2" className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
