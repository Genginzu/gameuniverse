"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { CollectionList } from "./CollectionList";
import { CollectionForm } from "./CollectionForm";
import { useCollections } from "@/hooks/useCollections";
import { useCollectionMutations } from "@/hooks/useCollectionMutations";
import { useAuth } from "@/hooks/useAuth";

/**
 * Contenu "Mes collections" pour le dashboard.
 * Contrairement à CollectionsPageContent (page publique d'un joueur),
 * ce composant utilise le user connecté et n'affiche pas de lien retour.
 */
export function MyCollectionsContent() {
  const t = useTranslations("collections.page");
  const { user } = useAuth();
  const playerId = user?.id ?? "";

  const { collections, isLoading, error, refetch } = useCollections(playerId);
  const { createCollection } = useCollectionMutations({
    playerId,
    refetchCollections: refetch,
  });

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (data: Record<string, unknown>) => {
    setIsCreating(true);
    try {
      await createCollection(data as { name: string; description?: string; isPublic?: boolean });
      setShowCreateDialog(false);
    } finally {
      setIsCreating(false);
    }
  };

  if (error) {
    return (
      <ErrorFallback title={t("errorTitle")} description={t("errorDescription")} showRefresh />
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between sm:mb-8">
        <h1 className="neon-text text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
          {t("title")}
        </h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t("createButton")}
        </Button>
      </div>

      {/* Collection grid */}
      <CollectionList
        collections={collections}
        playerId={playerId}
        isOwner={true}
        isLoading={isLoading}
        basePath="/collections"
      />

      {/* Create dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createButton")}</DialogTitle>
          </DialogHeader>
          <CollectionForm mode="create" onSubmit={handleCreate} isSubmitting={isCreating} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
