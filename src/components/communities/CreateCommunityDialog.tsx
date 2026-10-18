"use client";

import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CommunityForm } from "./CommunityForm";
import type { CreateCommunityInput } from "@/lib/validations/community";

interface CreateCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCommunityInput) => Promise<void>;
  isSubmitting: boolean;
}

/** Create-community modal used by the communities listing page. */
export function CreateCommunityDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: CreateCommunityDialogProps) {
  const t = useTranslations("communities.page");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-editorial-line bg-editorial-2 text-white">
        <DialogHeader>
          <DialogTitle className="font-display text-white">{t("createButton")}</DialogTitle>
        </DialogHeader>
        <CommunityForm
          mode="create"
          onSubmit={(data) => onSubmit(data as CreateCommunityInput)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
