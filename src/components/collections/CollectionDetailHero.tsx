"use client";

/**
 * CollectionDetailHero : en-tête de la page Collection detail — cover composite
 * à gauche, titre + meta (owner, count, date) + barre d'actions owner à droite.
 *
 * Extrait de CollectionDetailEditorial pour respecter la limite de taille.
 * Style : Tailwind inline + tokens éditoriaux.
 */

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import Image from "next/image";

import { Link } from "@/i18n/navigation";
import { LazyImage } from "@/components/ui/lazy-image";
import { KickerLabel } from "@/components/shared/KickerLabel";

import type { CollectionDetail, CollectionItem } from "@/types/collection";

const ACTION_BASE =
  "border-editorial-line bg-editorial-2 hover:bg-editorial-3 hover:border-editorial-accent/50 inline-flex h-10 items-center gap-2 rounded-[10px] border px-4 text-[0.85rem] font-medium text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))]";

interface CollectionDetailHeroProps {
  collection: CollectionDetail;
  items: CollectionItem[];
  isOwner: boolean;
  updatedAtFormatted: string;
  locale: string;
  onAddGame: () => void;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onCopyLink: () => void;
  onDelete: () => void;
}

export function CollectionDetailHero({
  collection,
  items,
  isOwner,
  updatedAtFormatted,
  locale,
  onAddGame,
  onEdit,
  onToggleVisibility,
  onCopyLink,
  onDelete,
}: CollectionDetailHeroProps) {
  const t = useTranslations("collections.editorial.detail");
  const tPage = useTranslations("collections.page");
  const tActions = useTranslations("collections.actions");

  return (
    <header className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-[5fr_7fr] lg:items-stretch lg:gap-12">
      <CollectionCover collection={collection} items={items} />

      <div className="flex flex-col justify-between gap-6">
        <div>
          <KickerLabel>{t("kicker")}</KickerLabel>
          <h1 className="mt-2 font-display text-[clamp(1.75rem,3vw+1rem,3rem)] leading-[1.05] font-bold tracking-tight text-white">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="text-editorial-muted mt-4 max-w-[60ch] text-base leading-relaxed">
              {collection.description}
            </p>
          )}
        </div>

        <div className="border-editorial-line flex flex-wrap items-center gap-5 border-y py-4">
          <OwnerBadge owner={collection.owner} userId={collection.userId} locale={locale} />
          <span className="bg-editorial-line h-6 w-px" aria-hidden="true" />
          <span className="text-editorial-muted inline-flex items-baseline gap-1.5 font-mono text-[0.7rem] font-semibold tracking-[0.12em] uppercase">
            <span className="font-display text-base font-bold tracking-tight text-white normal-case">
              {items.length}
            </span>
            {t("gamesLabel")}
          </span>
          <span className="bg-editorial-line h-6 w-px" aria-hidden="true" />
          <span className="text-editorial-muted inline-flex items-baseline gap-1.5 font-mono text-[0.7rem] font-semibold tracking-[0.12em] uppercase">
            {t("updatedLabel")}
            <span className="font-display text-base font-bold tracking-tight text-white normal-case">
              {updatedAtFormatted}
            </span>
          </span>
        </div>

        {isOwner && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onAddGame}
              className="bg-editorial-accent inline-flex h-10 items-center gap-2 rounded-[10px] px-4 text-[0.85rem] font-medium text-[#0a0418] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))]"
            >
              <Icon icon="lucide:plus" className="h-4 w-4" aria-hidden="true" />
              {tPage("addGame")}
            </button>
            <button type="button" onClick={onEdit} className={ACTION_BASE}>
              <Icon icon="lucide:pencil" className="h-4 w-4" aria-hidden="true" />
              {tActions("edit")}
            </button>
            <button type="button" onClick={onToggleVisibility} className={ACTION_BASE}>
              <Icon
                icon={collection.isPublic ? "lucide:eye-off" : "lucide:eye"}
                className="h-4 w-4"
                aria-hidden="true"
              />
              {collection.isPublic ? tActions("makePrivate") : tActions("makePublic")}
            </button>
            <button type="button" onClick={onCopyLink} className={ACTION_BASE}>
              <Icon icon="lucide:link-2" className="h-4 w-4" aria-hidden="true" />
              {tActions("copyLink")}
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="border-editorial-line bg-editorial-2 inline-flex h-10 items-center gap-2 rounded-[10px] border px-4 text-[0.85rem] font-medium text-red-300 transition hover:border-red-600/50 hover:bg-red-600/10 hover:text-red-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
            >
              <Icon icon="lucide:trash-2" className="h-4 w-4" aria-hidden="true" />
              {tActions("delete")}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function CollectionCover({
  collection,
  items,
}: {
  collection: CollectionDetail;
  items: CollectionItem[];
}) {
  const t = useTranslations("collections.card");
  const covers = items
    .slice(0, 4)
    .map((it) => it.coverImage)
    .filter((c): c is string => Boolean(c));

  return (
    <div className="border-editorial-line from-editorial-accent/[0.18] to-editorial-accent/[0.04] relative aspect-[16/10] overflow-hidden rounded-[1.25rem] border bg-gradient-to-br lg:aspect-auto lg:min-h-[320px]">
      {collection.coverImageUrl ? (
        <LazyImage
          src={collection.coverImageUrl}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 41vw"
          showSkeleton
        />
      ) : covers.length > 0 ? (
        <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-[3px]">
          {covers.map((src, i) => (
            <div key={i} className="relative overflow-hidden bg-white/[0.04]">
              <LazyImage
                src={src}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 21vw"
                showSkeleton
              />
            </div>
          ))}
          {Array.from({ length: 4 - covers.length }).map((_, i) => (
            <div key={`empty-${i}`} className="relative overflow-hidden bg-white/[0.04]" />
          ))}
        </div>
      ) : (
        <div className="text-editorial-accent/50 grid h-full w-full place-items-center">
          <Icon icon="lucide:layers" className="h-14 w-14" aria-hidden="true" />
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/55"
        aria-hidden="true"
      />
      <span
        className={`absolute top-4 left-4 z-[1] inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 font-mono text-[0.7rem] font-semibold tracking-[0.14em] uppercase backdrop-blur-md ${collection.isPublic ? "text-editorial-accent" : "text-white"}`}
      >
        <Icon
          icon={collection.isPublic ? "lucide:globe" : "lucide:lock"}
          className="h-3.5 w-3.5"
          aria-hidden="true"
        />
        {collection.isPublic ? t("public") : t("private")}
      </span>
    </div>
  );
}

function OwnerBadge({
  owner,
  userId,
  locale,
}: {
  owner: CollectionDetail["owner"];
  userId: string;
  locale: string;
}) {
  const ownerName = owner.fullName ?? "—";
  const initial = ownerName.charAt(0).toUpperCase();

  return (
    <Link
      href={`/players/${userId}`}
      className="hover:text-editorial-accent inline-flex items-center gap-2.5 text-white transition-colors"
      locale={locale}
    >
      {owner.avatarUrl ? (
        <Image
          src={owner.avatarUrl}
          alt=""
          width={32}
          height={32}
          className="border-editorial-line size-8 rounded-full border object-cover"
        />
      ) : (
        <div
          className="border-editorial-line bg-editorial-accent/[0.18] text-editorial-accent grid size-8 place-items-center rounded-full border text-xs font-semibold"
          aria-hidden="true"
        >
          {initial}
        </div>
      )}
      <span className="text-sm font-semibold">{ownerName}</span>
    </Link>
  );
}
