"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CollectionForm } from "@/components/collections/CollectionForm";
import { useCollections } from "@/hooks/useCollections";
import { useCollectionMutations } from "@/hooks/useCollectionMutations";
import { PlayerCollectionsListView } from "./PlayerCollectionsListView";
import { PlayerCollectionDetailView } from "./PlayerCollectionDetailView";

interface PlayerCollectionsFeedProps {
  playerId: string;
  locale: string;
  isOwner: boolean;
}

export function PlayerCollectionsFeed({ playerId, locale, isOwner }: PlayerCollectionsFeedProps) {
  const t = useTranslations("collections.page");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Legacy hook for simple list (used by list view + refetch after mutations)
  const { collections, isLoading, error, refetch } = useCollections(playerId);
  const { createCollection } = useCollectionMutations({
    playerId,
    refetchCollections: refetch,
  });

  const handleCreate = async (data: Record<string, unknown>) => {
    setIsCreating(true);
    try {
      await createCollection(data as { name: string; description?: string; isPublic?: boolean });
      setShowCreateDialog(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => setSelectedSlug(null);

  const handleDeleted = () => {
    setSelectedSlug(null);
    refetch();
  };

  // Detail view
  if (selectedSlug) {
    return (
      <PlayerCollectionDetailView
        playerId={playerId}
        slug={selectedSlug}
        locale={locale}
        isOwner={isOwner}
        onBack={handleBack}
        onDeleted={handleDeleted}
        refetchList={refetch}
      />
    );
  }

  // List view
  return (
    <section className="editorial-player-collections mb-8 space-y-4">
      {/* Create button — owner only */}
      {isOwner && (
        <div className="flex justify-end">
          <Button onClick={() => setShowCreateDialog(true)} size="sm">
            <Icon icon="lucide:plus" className="mr-1.5 h-4 w-4" />
            {t("createButton")}
          </Button>
        </div>
      )}

      <PlayerCollectionsListView
        collections={collections}
        playerId={playerId}
        isOwner={isOwner}
        isLoading={isLoading}
        error={error}
        onSelectCollection={setSelectedSlug}
      />

      {/* Create dialog */}
      {isOwner && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("createButton")}</DialogTitle>
            </DialogHeader>
            <CollectionForm mode="create" onSubmit={handleCreate} isSubmitting={isCreating} />
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
