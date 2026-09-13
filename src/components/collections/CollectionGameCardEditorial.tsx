"use client";

/**
 * CollectionGameCardEditorial : carte d'un jeu dans une collection (look éditorial).
 *
 * Affichée dans la grille de la page Collection detail (`/collections/[slug]`).
 * Si `onRemove` est fourni (owner uniquement), un bouton « Retirer » apparaît
 * en haut à droite — révélé au hover sur desktop, toujours visible sur mobile
 * (variant Tailwind `pointer-coarse:`).
 *
 * Le bouton stoppe la propagation pour ne pas déclencher la navigation vers
 * la fiche jeu rendue par le `Link` sous-jacent.
 *
 * Style : Tailwind inline + tokens éditoriaux.
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
  /**
   * Callback d'édition de la note. Si défini, affiche le bouton crayon overlay
   * (owner-only, même logique que `onRemove`).
   */
  onEditNote?: () => void;
}

export function CollectionGameCardEditorial({
  item,
  onRemove,
  onEditNote,
}: CollectionGameCardEditorialProps) {
  const t = useTranslations("collections.editorial.detail.removeItem");
  const tNote = useTranslations("collections.editorial.detail.editNote");

  const handleRemoveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove?.();
  };

  const handleEditNoteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onEditNote?.();
  };

  return (
    <div className="group/card relative">
      <Link
        href={`/games/${item.slug}`}
        className="flex flex-col gap-2 overflow-hidden rounded-[0.875rem] transition-transform duration-200 group-hover/card:-translate-y-[3px] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))]"
        aria-label={item.title}
      >
        <div className="border-editorial-line bg-editorial-2 group-hover/card:border-editorial-accent/60 relative aspect-[3/4] overflow-hidden rounded-[0.625rem] border transition-all duration-200">
          <LazyImage
            src={item.coverImage ?? undefined}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 14vw"
            showSkeleton
          />
          {item.note && (
            <div className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100 group-focus-within/card:opacity-100">
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent"
                aria-hidden="true"
              />
              <div className="pointer-events-auto absolute inset-x-0 bottom-0 max-h-full overflow-y-auto p-2.5">
                <p className="text-editorial-accent text-[0.7rem] font-medium italic">
                  {item.note}
                </p>
              </div>
            </div>
          )}
        </div>
        <h3 className="px-0.5 text-sm leading-tight font-semibold text-white line-clamp-2">
          {item.title}
        </h3>
      </Link>

      {onRemove && (
        <button
          type="button"
          onClick={handleRemoveClick}
          className="pointer-events-none absolute top-2 right-2 z-[2] grid size-9 scale-90 place-items-center rounded-full border border-red-600/40 bg-[#140404]/80 text-red-300 opacity-0 backdrop-blur-md transition group-focus-within/card:pointer-events-auto group-focus-within/card:scale-100 group-focus-within/card:opacity-100 group-hover/card:pointer-events-auto group-hover/card:scale-100 group-hover/card:opacity-100 hover:border-red-600/90 hover:bg-red-600/90 hover:text-white focus-visible:scale-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 pointer-coarse:pointer-events-auto pointer-coarse:scale-100 pointer-coarse:opacity-100"
          aria-label={t("ariaLabel", { title: item.title })}
        >
          <Icon icon="lucide:trash-2" className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      {onEditNote && (
        <button
          type="button"
          onClick={handleEditNoteClick}
          className="pointer-events-none absolute top-2 left-2 z-[2] grid size-9 scale-90 place-items-center rounded-full border border-[rgba(var(--accent-rgb,var(--neon-primary)),0.5)] bg-[rgba(var(--accent-rgb,var(--neon-primary)),0.85)] text-white opacity-0 backdrop-blur-md transition group-focus-within/card:pointer-events-auto group-focus-within/card:scale-100 group-focus-within/card:opacity-100 group-hover/card:pointer-events-auto group-hover/card:scale-100 group-hover/card:opacity-100 hover:border-[rgb(var(--accent-rgb,var(--neon-primary)))] hover:bg-[rgb(var(--accent-rgb,var(--neon-primary)))] hover:text-white focus-visible:scale-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))] pointer-coarse:pointer-events-auto pointer-coarse:scale-100 pointer-coarse:opacity-100"
          aria-label={tNote("ariaLabel", { title: item.title })}
        >
          <Icon icon="lucide:pencil" className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
