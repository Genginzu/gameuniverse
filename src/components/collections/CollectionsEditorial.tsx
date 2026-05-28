"use client";

/**
 * CollectionsEditorial : page Collections (`/collections`) au look éditorial.
 *
 * Affiche les collections de l'utilisateur courant. Conserve la logique métier :
 *   - Hook `useCollections(user.id)` pour la liste
 *   - Hook `useCollectionMutations` pour la création
 *
 * Look :
 *   - Hero éditorial 5/7 (kicker + titre display + subtitle | stats inline)
 *   - CTA « Créer une collection » à hauteur 56px alignée
 *   - Grille de `CollectionCardEditorial` (cover composite + count + last update)
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { KickerLabel } from "@/components/shared/KickerLabel";

import { useAuth } from "@/hooks/useAuth";
import { useCollections } from "@/hooks/useCollections";
import { useCollectionMutations } from "@/hooks/useCollectionMutations";

import { CollectionCardEditorial } from "./CollectionCardEditorial";
import { CollectionForm } from "./CollectionForm";
import { CollectionsPageSkeleton } from "./CollectionsPageSkeleton";

export function CollectionsEditorial() {
  const t = useTranslations("collections.editorial");
  const tPage = useTranslations("collections.page");
  const { user, loading: authLoading } = useAuth();

  const playerId = user?.id ?? "";
  const { collections, isLoading, refetch } = useCollections(playerId);
  const { createCollection } = useCollectionMutations({
    playerId,
    refetchCollections: refetch,
  });

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const stats = useMemo(() => {
    const totalCollections = collections.length;
    const totalGames = collections.reduce((sum, c) => sum + c.gamesCount, 0);
    const publicCollections = collections.filter((c) => c.isPublic).length;
    const largest = collections.reduce<typeof collections[number] | null>(
      (top, c) => (top === null || c.gamesCount > top.gamesCount ? c : top),
      null
    );
    return { totalCollections, totalGames, publicCollections, largest };
  }, [collections]);

  const handleCreate = async (data: Record<string, unknown>) => {
    setIsCreating(true);
    try {
      await createCollection(data as { name: string; description?: string; isPublic?: boolean });
      setShowCreateDialog(false);
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading) {
    return <CollectionsPageSkeleton />;
  }

  if (!user) {
    return (
      <section className="editorial-collections">
        <div className="editorial-collections-inner">
          <div className="editorial-collections-auth-required">
            <KickerLabel>{t("kicker")}</KickerLabel>
            <h1 className="editorial-collections-auth-required-title">
              {t("authRequired.title")}
            </h1>
            <p className="editorial-collections-auth-required-text">
              {t("authRequired.description")}
            </p>
            <Button asChild>
              <Link href="/auth">{t("authRequired.signIn")}</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return <CollectionsPageSkeleton />;
  }

  return (
    <section className="editorial-collections">
      <div className="editorial-collections-inner">
        {/* Hero */}
        <header className="editorial-collections-hero">
          <div>
            <KickerLabel>{t("kicker")}</KickerLabel>
            <h1 className="editorial-collections-hero-title">
              {t("titlePrefix")} <span className="accent">{t("titleAccent")}</span>
            </h1>
            <p className="editorial-collections-hero-subtitle">{t("subtitle")}</p>
          </div>

          <div className="editorial-collections-stats">
            <Stat
              label={t("stats.collections")}
              value={String(stats.totalCollections)}
              accent
            />
            <Stat label={t("stats.games")} value={String(stats.totalGames)} />
            <Stat
              label={t("stats.largest")}
              value={
                stats.largest ? (
                  <span className="editorial-collections-stat-largest">
                    {stats.largest.name}
                  </span>
                ) : (
                  "—"
                )
              }
            />
          </div>
        </header>

        {/* Controls */}
        <div className="editorial-collections-controls">
          <KickerLabel>
            {t("listKicker", { count: stats.totalCollections })}
          </KickerLabel>
          <button
            type="button"
            onClick={() => setShowCreateDialog(true)}
            className="editorial-collections-create-btn"
          >
            <Icon icon="lucide:plus" className="h-4 w-4" aria-hidden="true" />
            {t("createButton")}
          </button>
        </div>

        {/* Content */}
        {collections.length === 0 ? (
          <CollectionsEmptyState onCreate={() => setShowCreateDialog(true)} />
        ) : (
          <div className="editorial-collections-grid">
            {collections.map((collection) => (
              <CollectionCardEditorial
                key={collection.id}
                collection={collection}
                basePath="/collections"
                showVisibility
              />
            ))}
          </div>
        )}

        {/* Create dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{tPage("createButton")}</DialogTitle>
            </DialogHeader>
            <CollectionForm mode="create" onSubmit={handleCreate} isSubmitting={isCreating} />
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div>
      <p className={`editorial-collections-stat-value${accent ? " accent" : ""}`}>{value}</p>
      <KickerLabel className="mt-2">{label}</KickerLabel>
    </div>
  );
}

function CollectionsEmptyState({ onCreate }: { onCreate: () => void }) {
  const t = useTranslations("collections.editorial");

  return (
    <div className="editorial-collections-empty">
      <div className="editorial-collections-empty-icon">
        <Icon icon="lucide:layers" className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="editorial-collections-empty-title">{t("empty.title")}</h3>
      <p className="editorial-collections-empty-text">{t("empty.description")}</p>
      <Button onClick={onCreate}>
        <Icon icon="lucide:plus" className="mr-2 h-4 w-4" aria-hidden="true" />
        {t("empty.cta")}
      </Button>
    </div>
  );
}
