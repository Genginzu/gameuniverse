"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { CollectionDetail } from "./CollectionDetail";
import { CollectionActions } from "./CollectionActions";
import { CollectionForm } from "./CollectionForm";
import { AddGameToCollection } from "./AddGameToCollection";
import { CollectionDetailSkeleton } from "./CollectionSkeleton";
import { useCollectionDetail } from "@/hooks/useCollectionDetail";
import { useCollectionMutations } from "@/hooks/useCollectionMutations";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Link } from "@/i18n/navigation";

interface MyCollectionDetailContentProps {
  slug: string;
}

/**
 * Contenu détail d'une collection pour le dashboard.
 * Utilise le user connecté et navigue vers /collections au retour.
 */
export function MyCollectionDetailContent({ slug }: MyCollectionDetailContentProps) {
  const t = useTranslations("collections.page");
  const router = useRouter();
  const { user } = useAuth();
  const playerId = user?.id ?? "";

  const { collection, isLoading, error, notFound, refetch } = useCollectionDetail(playerId, slug);
  const { updateCollection, deleteCollection, toggleVisibility, addItem } = useCollectionMutations({
    playerId,
    refetchDetail: refetch,
  });

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddGameDialog, setShowAddGameDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingGame, setIsAddingGame] = useState(false);

  const handleEdit = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      await updateCollection(
        slug,
        data as { name?: string; description?: string; isPublic?: boolean; coverImageUrl?: string }
      );
      setShowEditDialog(false);
      toast({ title: t("updateSuccess") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    await deleteCollection(slug);
    toast({ title: t("deleteSuccess") });
    router.push("/collections");
  };

  const handleToggleVisibility = async () => {
    if (!collection) return;
    await toggleVisibility(slug, collection.isPublic);
  };

  const handleAddGame = async (input: { gameId: string; note?: string }) => {
    setIsAddingGame(true);
    try {
      await addItem(slug, input);
      setShowAddGameDialog(false);
      toast({ title: t("addGameSuccess") });
    } finally {
      setIsAddingGame(false);
    }
  };

  if (isLoading) return <CollectionDetailSkeleton />;

  if (notFound) {
    return (
      <ErrorFallback
        title={t("notFoundTitle")}
        description={t("notFoundDescription")}
        showRefresh={false}
      />
    );
  }

  if (error || !collection) {
    return (
      <ErrorFallback title={t("errorTitle")} description={t("errorDescription")} showRefresh />
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6">
      {/* Navigation retour */}
      <div className="mb-6">
        <Link href="/collections">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {t("backToCollections")}
          </Button>
        </Link>
      </div>

      {/* Actions propriétaire */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <CollectionActions
          collection={collection}
          onEdit={() => setShowEditDialog(true)}
          onDelete={handleDelete}
          onToggleVisibility={handleToggleVisibility}
        />
        <Button variant="outline" size="sm" onClick={() => setShowAddGameDialog(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t("addGame")}
        </Button>
      </div>

      {/* Détail de la collection */}
      <CollectionDetail collection={collection} />

      {/* Dialogs */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editCollection")}</DialogTitle>
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
            <DialogTitle>{t("addGame")}</DialogTitle>
          </DialogHeader>
          <AddGameToCollection onAdd={handleAddGame} isAdding={isAddingGame} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
