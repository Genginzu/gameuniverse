"use client";

import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GroupForm } from "./GroupForm";
import type { CreateGroupInput } from "@/lib/validations/group";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateGroupInput) => Promise<void>;
  isSubmitting: boolean;
}

/** Create-group modal used by the groups listing page. */
export function CreateGroupDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: CreateGroupDialogProps) {
  const t = useTranslations("groups.page");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-editorial-line bg-editorial-2 text-white">
        <DialogHeader>
          <DialogTitle className="font-display text-white">{t("createButton")}</DialogTitle>
        </DialogHeader>
        <GroupForm
          mode="create"
          onSubmit={(data) => onSubmit(data as CreateGroupInput)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
