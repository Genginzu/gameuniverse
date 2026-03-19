"use client";

import { useTranslations, useLocale } from "next-intl";
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
import type { AdminPlatform } from "@/types/admin-platforms";

interface DeletePlatformDialogProps {
  platform: AdminPlatform | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  usageCount?: number;
}

/** Resolve the platform name for the current locale */
function getPlatformName(platform: AdminPlatform, locale: string): string {
  const translation = platform.translations.find((t) => t.language_code === locale);
  if (translation?.name) return translation.name;
  return platform.translations[0]?.name ?? platform.slug;
}

export function DeletePlatformDialog({
  platform,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  usageCount,
}: DeletePlatformDialogProps) {
  const t = useTranslations("admin.platforms.deleteDialog");
  const locale = useLocale();
  const name = platform ? getPlatformName(platform, locale) : "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("warning", { name })}</DialogDescription>
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
