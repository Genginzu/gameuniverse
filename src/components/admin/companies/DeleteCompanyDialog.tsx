"use client";

import { useTranslations } from "next-intl";
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
import type { AdminCompany } from "@/types/admin-companies";

export interface DeleteCompanyDialogProps {
  company: AdminCompany | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  usageCount?: number;
}

export function DeleteCompanyDialog({
  company,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  usageCount,
}: DeleteCompanyDialogProps) {
  const t = useTranslations("admin.companies.deleteDialog");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("warning", { name: company?.name ?? "" })}</DialogDescription>
        </DialogHeader>
        {usageCount !== null && usageCount !== undefined && usageCount > 0 && (
          <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
            {t("usageWarning", { count: usageCount })}
          </p>
        )}
        <p className="text-sm font-medium text-destructive">{t("irreversible")}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            {t("cancel")}
          </Button>
          <LoadingButton
            variant="destructive"
            onClick={onConfirm}
            loading={isDeleting}
            loadingText={t("deleting")}
          >
            {t("confirm")}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
