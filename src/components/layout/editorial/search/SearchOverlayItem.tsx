"use client";

/**
 * SearchOverlayItem : ligne de résultat avec rendu spécifique par type
 * d'entité (jeu, personnage, joueur GU, équipe, joueur pro, coach).
 *
 * Tous les rendus partagent le même squelette : avatar à gauche, titre +
 * sous-titre au centre, méta à droite. Le composant est purement
 * présentationnel ; la navigation est gérée par le parent (`onSelect`).
 *
 * Voir docs/design/editorial-refonte-plan.md section 5.6.
 */

import { Icon } from "@iconify/react";

import type { FlatSearchItem } from "@/lib/utils/global-search-utils";

interface SearchOverlayItemProps {
  item: FlatSearchItem;
  /** True si l'item est focus via clavier (↑/↓). */
  active: boolean;
  /** Index global de l'item (utile pour `aria-posinset`/option-id). */
  index: number;
  /** Appelé au clic ou à l'activation clavier (Enter). */
  onSelect: () => void;
}

export function SearchOverlayItem({ item, active, index, onSelect }: SearchOverlayItemProps) {
  // Stagger fade-in : on plafonne `--i` à 8 pour que les items plus loin
  // apparaissent immédiatement (évite un délai cumulé excessif sur les
  // longs résultats).
  const staggerIndex = Math.min(index, 8);

  return (
    <li
      role="option"
      id={`search-option-${index}`}
      aria-selected={active}
      onClick={onSelect}
      className={`search-overlay-item ${active ? "is-active" : ""}`.trim()}
      data-type={item.type}
      style={{ "--stagger-index": staggerIndex } as React.CSSProperties}
    >
      {renderItemContent(item)}
    </li>
  );
}

function renderItemContent(item: FlatSearchItem) {
  switch (item.type) {
    case "game":
      return (
        <ItemLayout
          avatar={
            item.coverUrl ? (
              <img src={item.coverUrl} alt="" className="search-overlay-item-avatar avatar-game" />
            ) : (
              <div className="search-overlay-item-avatar avatar-game placeholder">
                <Icon icon="lucide:gamepad-2" className="size-5" aria-hidden />
              </div>
            )
          }
          title={item.title}
          subtitle={item.developer ?? null}
          meta={item.releaseYear ? String(item.releaseYear) : null}
        />
      );

    case "character":
      return (
        <ItemLayout
          avatar={
            item.mainImage ? (
              <img
                src={item.mainImage}
                alt=""
                className="search-overlay-item-avatar avatar-character"
              />
            ) : (
              <div className="search-overlay-item-avatar avatar-character placeholder">
                <Icon icon="lucide:user-circle" className="size-5" aria-hidden />
              </div>
            )
          }
          title={item.name}
          subtitle={item.primaryGame ?? null}
          meta={item.role ?? null}
        />
      );

    case "player":
      return (
        <ItemLayout
          avatar={
            item.avatarUrl ? (
              <img
                src={item.avatarUrl}
                alt=""
                className="search-overlay-item-avatar avatar-round"
              />
            ) : (
              <div className="search-overlay-item-avatar avatar-round placeholder">
                <Icon icon="lucide:user" className="size-5" aria-hidden />
              </div>
            )
          }
          title={item.username}
          subtitle={null}
          meta={null}
        />
      );

    case "team":
      return (
        <ItemLayout
          avatar={
            item.imageUrl ? (
              <img src={item.imageUrl} alt="" className="search-overlay-item-avatar avatar-team" />
            ) : (
              <div className="search-overlay-item-avatar avatar-team placeholder">
                <Icon icon="lucide:shield" className="size-5" aria-hidden />
              </div>
            )
          }
          title={item.name}
          subtitle={item.acronym ?? null}
          meta={item.location ?? item.game ?? null}
        />
      );

    case "proPlayer": {
      const fullName =
        [item.firstName, item.lastName].filter(Boolean).join(" ") || null;
      const teamAndGame =
        [item.teamName, item.game].filter(Boolean).join(" \u2014 ") || null;
      return (
        <ItemLayout
          avatar={
            item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                className="search-overlay-item-avatar avatar-round"
              />
            ) : (
              <div className="search-overlay-item-avatar avatar-round placeholder">
                <Icon icon="lucide:trophy" className="size-5" aria-hidden />
              </div>
            )
          }
          title={fullName ? `${item.name} \u2022 ${fullName}` : item.name}
          subtitle={teamAndGame}
          meta={item.role ?? null}
        />
      );
    }

    case "coach":
      return (
        <ItemLayout
          avatar={
            item.avatarUrl ? (
              <img
                src={item.avatarUrl}
                alt=""
                className="search-overlay-item-avatar avatar-round"
              />
            ) : (
              <div className="search-overlay-item-avatar avatar-round placeholder">
                <Icon icon="lucide:graduation-cap" className="size-5" aria-hidden />
              </div>
            )
          }
          title={item.username}
          subtitle={
            item.totalReviews > 0
              ? `${item.averageRating.toFixed(1)} \u2605 \u00b7 ${item.totalReviews} avis`
              : null
          }
          meta={item.isVerified ? "\u2713" : null}
        />
      );
  }
}

interface ItemLayoutProps {
  avatar: React.ReactNode;
  title: string;
  subtitle: string | null;
  meta: string | null;
}

function ItemLayout({ avatar, title, subtitle, meta }: ItemLayoutProps) {
  return (
    <>
      {avatar}
      <div className="search-overlay-item-text">
        <span className="search-overlay-item-title">{title}</span>
        {subtitle && <span className="search-overlay-item-subtitle">{subtitle}</span>}
      </div>
      {meta && <span className="search-overlay-item-meta">{meta}</span>}
    </>
  );
}
