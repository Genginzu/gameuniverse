"use client";

import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CollectionForm } from "./CollectionForm";

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Create-collection modal shared by the self and profile collection pages.
 * Wraps the collection form in the editorial-styled dialog shell.
 */
export function CreateCollectionDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: CreateCollectionDialogProps) {
  const t = useTranslations("collections.page");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-editorial-line bg-editorial-2 text-white">
        <DialogHeader>
          <DialogTitle className="font-display text-white">{t("createButton")}</DialogTitle>
        </DialogHeader>
        <CollectionForm mode="create" onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  );
}
