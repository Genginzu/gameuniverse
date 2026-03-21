"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { CollectionList } from "./CollectionList";
import { CollectionForm } from "./CollectionForm";
import { useCollections } from "@/hooks/useCollections";
import { useCollectionMutations } from "@/hooks/useCollectionMutations";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

interface CollectionsPageContentProps {
  playerId: string;
  locale: string;
}

export function CollectionsPageContent({ playerId, locale }: CollectionsPageContentProps) {
  const t = useTranslations("collections.page");
  const { user } = useAuth();
  const isOwner = user?.id === playerId;

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
      <ErrorFallback
        title={t("errorTitle")}
        description={t("errorDescription")}
        showRefresh
        showBackButton
        backUrl={`/${locale}/players/${playerId}`}
        backLabel={t("backToPlayer")}
        locale={locale}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/players/${playerId}`}>
            <Button variant="ghost" size="sm">
              <Icon icon="lucide:arrow-left" className="mr-1.5 h-4 w-4" />
              {t("backToPlayer")}
            </Button>
          </Link>
          <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">
            {t("title")}
          </h1>
        </div>

        {isOwner && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Icon icon="lucide:plus" className="mr-1.5 h-4 w-4" />
            {t("createButton")}
          </Button>
        )}
      </div>

      {/* Collection grid */}
      <CollectionList
        collections={collections}
        playerId={playerId}
        isOwner={isOwner}
        isLoading={isLoading}
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
    </div>
  );
}
