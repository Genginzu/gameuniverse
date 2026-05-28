"use client";

/**
 * CollectionDetailEditorial : page Collection detail (`/collections/[slug]`)
 * au look éditorial. Conserve la logique métier :
 *   - Hook `useCollectionDetail` (fetch via slug)
 *   - Hook `useCollectionMutations` (edit / delete / toggle visibility / add game)
 *
 * Look :
 *   - Lien retour mono kicker
 *   - Hero 5/7 : cover composite à gauche / titre display + meta + actions à droite
 *   - Grille de jeux compacte (`CollectionGameCardEditorial`)
 *   - Empty state cohérent avec le reste de l'éditorial
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import Image from "next/image";

import { Link, useRouter } from "@/i18n/navigation";
import { LazyImage } from "@/components/ui/lazy-image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { KickerLabel } from "@/components/shared/KickerLabel";

import { useAuth } from "@/hooks/useAuth";
import { useCollectionDetail } from "@/hooks/useCollectionDetail";
import { useCollectionMutations } from "@/hooks/useCollectionMutations";
import { toast } from "@/hooks/use-toast";

import type { CollectionDetail, CollectionItem } from "@/types/collection";

import { CollectionForm } from "./CollectionForm";
import { AddGameToCollection } from "./AddGameToCollection";
import { CollectionDetailEditorialSkeleton } from "./CollectionDetailEditorialSkeleton";

interface CollectionDetailEditorialProps {
  slug: string;
  locale: string;
}

export function CollectionDetailEditorial({ slug, locale }: CollectionDetailEditorialProps) {
  const t = useTranslations("collections.editorial.detail");
  const tPage = useTranslations("collections.page");
  const tActions = useTranslations("collections.actions");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const playerId = user?.id ?? "";

  const { collection, isLoading, error, notFound, refetch } = useCollectionDetail(playerId, slug);

  const { updateCollection, deleteCollection, toggleVisibility, addItem } = useCollectionMutations({
    playerId,
    refetchDetail: refetch,
  });

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddGameDialog, setShowAddGameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (authLoading || isLoading) return <CollectionDetailEditorialSkeleton />;

  if (!user) {
    return (
      <ErrorFallback
        title={t("authRequiredTitle")}
        description={t("authRequiredDescription")}
        showRefresh={false}
        showHomeButton
      />
    );
  }

  if (notFound) {
    return (
      <ErrorFallback
        title={tPage("notFoundTitle")}
        description={tPage("notFoundDescription")}
        showRefresh={false}
        showBackButton
        backUrl="/collections"
        backLabel={tPage("backToCollections")}
        locale={locale}
      />
    );
  }

  if (error || !collection) {
    return (
      <ErrorFallback
        title={tPage("errorTitle")}
        description={tPage("errorDescription")}
        showRefresh
        showBackButton
        backUrl="/collections"
        backLabel={tPage("backToCollections")}
        locale={locale}
      />
    );
  }

  const isOwner = user.id === collection.userId;
  const sortedItems = [...collection.items].sort((a, b) => a.position - b.position);

  const handleEdit = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      await updateCollection(
        slug,
        data as { name?: string; description?: string; isPublic?: boolean; coverImageUrl?: string }
      );
      setShowEditDialog(false);
      toast({ title: tPage("updateSuccess") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCollection(slug);
      toast({ title: tPage("deleteSuccess") });
      router.push("/collections");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleToggleVisibility = async () => {
    await toggleVisibility(slug, collection.isPublic);
  };

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/${locale}/players/${collection.userId}/collections/${collection.slug}`;
    await navigator.clipboard.writeText(shareUrl);
    toast({ title: tActions("linkCopied"), description: tActions("linkCopiedDescription") });
  };

  const handleAddGame = async (input: { gameId: string; note?: string }) => {
    setIsAddingGame(true);
    try {
      await addItem(slug, input);
      setShowAddGameDialog(false);
      toast({ title: tPage("addGameSuccess") });
    } finally {
      setIsAddingGame(false);
    }
  };

  const updatedAtFormatted = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(collection.updatedAt));

  return (
    <section className="editorial-collection-detail">
      <div className="editorial-collection-detail-inner">
        <Link href="/collections" className="editorial-collection-detail-back">
          <Icon icon="lucide:arrow-left" className="h-3.5 w-3.5" aria-hidden="true" />
          {tPage("backToCollections")}
        </Link>

        {/* Hero */}
        <header className="editorial-collection-detail-hero">
          <CollectionCover collection={collection} items={sortedItems} />

          <div className="editorial-collection-detail-body">
            <div>
              <KickerLabel>{t("kicker")}</KickerLabel>
              <h1 className="editorial-collection-detail-title">{collection.name}</h1>
              {collection.description && (
                <p className="editorial-collection-detail-description">{collection.description}</p>
              )}
            </div>

            <div className="editorial-collection-detail-meta">
              <OwnerBadge owner={collection.owner} userId={collection.userId} locale={locale} />
              <span className="editorial-collection-detail-meta-divider" aria-hidden="true" />
              <span className="editorial-collection-detail-meta-stat">
                <span className="editorial-collection-detail-meta-stat-value">
                  {sortedItems.length}
                </span>
                {t("gamesLabel")}
              </span>
              <span className="editorial-collection-detail-meta-divider" aria-hidden="true" />
              <span className="editorial-collection-detail-meta-stat">
                {t("updatedLabel")}
                <span className="editorial-collection-detail-meta-stat-value">
                  {updatedAtFormatted}
                </span>
              </span>
            </div>

            {isOwner && (
              <div className="editorial-collection-detail-actions">
                <button
                  type="button"
                  onClick={() => setShowAddGameDialog(true)}
                  className="editorial-collection-detail-action primary"
                >
                  <Icon icon="lucide:plus" className="h-4 w-4" aria-hidden="true" />
                  {tPage("addGame")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditDialog(true)}
                  className="editorial-collection-detail-action"
                >
                  <Icon icon="lucide:pencil" className="h-4 w-4" aria-hidden="true" />
                  {tActions("edit")}
                </button>
                <button
                  type="button"
                  onClick={handleToggleVisibility}
                  className="editorial-collection-detail-action"
                >
                  <Icon
                    icon={collection.isPublic ? "lucide:eye-off" : "lucide:eye"}
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                  {collection.isPublic ? tActions("makePrivate") : tActions("makePublic")}
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="editorial-collection-detail-action"
                >
                  <Icon icon="lucide:link-2" className="h-4 w-4" aria-hidden="true" />
                  {tActions("copyLink")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteDialog(true)}
                  className="editorial-collection-detail-action danger"
                >
                  <Icon icon="lucide:trash-2" className="h-4 w-4" aria-hidden="true" />
                  {tActions("delete")}
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Games */}
        <section>
          <header className="editorial-collection-detail-games-header">
            <div>
              <KickerLabel>{t("gamesKicker")}</KickerLabel>
              <h2 className="editorial-collection-detail-games-title">{t("gamesTitle")}</h2>
            </div>
          </header>

          {sortedItems.length === 0 ? (
            <CollectionDetailEmptyState
              isOwner={isOwner}
              onAdd={() => setShowAddGameDialog(true)}
            />
          ) : (
            <div className="editorial-collection-detail-games-grid">
              {sortedItems.map((item) => (
                <CollectionGameCardEditorial key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {/* Owner-only dialogs */}
        {isOwner && (
          <>
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{tPage("editCollection")}</DialogTitle>
                </DialogHeader>
                <CollectionForm
                  mode="edit"
                  defaultValues={{
                    name: collection.name,
                    description: collection.description ?? "",
                    isPublic: collection.isPublic,
                    coverImageUrl: collection.coverImageUrl ?? "",
                  }}
                  onSubmit={handleEdit}
                  isSubmitting={isSubmitting}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={showAddGameDialog} onOpenChange={setShowAddGameDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{tPage("addGame")}</DialogTitle>
                </DialogHeader>
                <AddGameToCollection onAdd={handleAddGame} isAdding={isAddingGame} />
              </DialogContent>
            </Dialog>

            <Dialog
              open={showDeleteDialog}
              onOpenChange={(open) => !open && !isDeleting && setShowDeleteDialog(false)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{tActions("deleteTitle")}</DialogTitle>
                  <DialogDescription>
                    {tActions("deleteDescription", { name: collection.name })}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(false)}
                    disabled={isDeleting}
                  >
                    {tActions("deleteCancel")}
                  </Button>
                  <LoadingButton
                    variant="destructive"
                    onClick={handleDelete}
                    loading={isDeleting}
                    loadingText={tActions("deleting")}
                  >
                    {tActions("deleteConfirm")}
                  </LoadingButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </section>
  );
}

/* ───────────── Cover ───────────── */

function CollectionCover({
  collection,
  items,
}: {
  collection: CollectionDetail;
  items: CollectionItem[];
}) {
  const t = useTranslations("collections.card");
  const covers = items.slice(0, 4).map((it) => it.coverImage).filter((c): c is string => Boolean(c));

  return (
    <div className="editorial-collection-detail-cover">
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
        <div className="editorial-collection-detail-cover-grid">
          {covers.map((src, i) => (
            <div key={i} className="editorial-collection-detail-cover-cell">
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
            <div key={`empty-${i}`} className="editorial-collection-detail-cover-cell" />
          ))}
        </div>
      ) : (
        <div className="editorial-collection-detail-cover-empty">
          <Icon icon="lucide:layers" className="h-14 w-14" aria-hidden="true" />
        </div>
      )}

      <div className="editorial-collection-detail-cover-overlay" aria-hidden="true" />
      <span
        className={`editorial-collection-detail-cover-tag${collection.isPublic ? " public" : ""}`}
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

/* ───────────── Owner badge ───────────── */

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
    <Link href={`/players/${userId}`} className="editorial-collection-detail-owner" locale={locale}>
      {owner.avatarUrl ? (
        <Image
          src={owner.avatarUrl}
          alt=""
          width={32}
          height={32}
          className="editorial-collection-detail-owner-avatar"
        />
      ) : (
        <div className="editorial-collection-detail-owner-fallback" aria-hidden="true">
          {initial}
        </div>
      )}
      <span className="editorial-collection-detail-owner-name">{ownerName}</span>
    </Link>
  );
}

/* ───────────── Game card ───────────── */

function CollectionGameCardEditorial({ item }: { item: CollectionItem }) {
  return (
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
  );
}

/* ───────────── Empty state ───────────── */

function CollectionDetailEmptyState({
  isOwner,
  onAdd,
}: {
  isOwner: boolean;
  onAdd: () => void;
}) {
  const t = useTranslations("collections.editorial.detail");

  return (
    <div className="editorial-collection-detail-empty">
      <div className="editorial-collection-detail-empty-icon">
        <Icon icon="lucide:gamepad-2" className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="editorial-collection-detail-empty-title">{t("emptyTitle")}</h3>
      <p className="editorial-collection-detail-empty-text">
        {isOwner ? t("emptyDescriptionOwner") : t("emptyDescriptionViewer")}
      </p>
      {isOwner && (
        <Button onClick={onAdd}>
          <Icon icon="lucide:plus" className="mr-2 h-4 w-4" aria-hidden="true" />
          {t("emptyCta")}
        </Button>
      )}
    </div>
  );
}
