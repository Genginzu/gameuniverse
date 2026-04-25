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

interface AdminDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  /** i18n namespace (e.g. "admin.genres.deleteDialog") */
  translationNamespace: string;
  /** Params passed to the warning/confirm translation key */
  warningParams?: Record<string, string | number>;
  /** Key used for the warning description (default: "warning") */
  warningKey?: string;
  /** Key used for the confirm button (default: "confirm") */
  confirmKey?: string;
  /** Optional usage count — shows orange warning when > 0 */
  usageCount?: number;
  /** When true, hides the delete button if usageCount > 0 */
  blockOnUsage?: boolean;
  /** Key used for the force confirm button when hasUsage (e.g. "forceConfirm") */
  forceConfirmKey?: string;
  /** Extra warning content shown when hasUsage (e.g. "forceWarning") */
  forceWarningKey?: string;
}

export function AdminDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  translationNamespace,
  warningParams = {},
  warningKey = "warning",
  confirmKey = "confirm",
  usageCount,
  blockOnUsage = false,
  forceConfirmKey,
  forceWarningKey,
}: AdminDeleteDialogProps) {
  const t = useTranslations(translationNamespace);
  const hasUsage = usageCount !== null && usageCount !== undefined && usageCount > 0;
  const showDeleteButton = !blockOnUsage || !hasUsage;
  const buttonKey = hasUsage && forceConfirmKey ? forceConfirmKey : confirmKey;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t(warningKey, warningParams)}</DialogDescription>
        </DialogHeader>

        {hasUsage && (
          <div className={forceWarningKey ? "space-y-2" : undefined}>
            <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
              {t("usageWarning", { count: usageCount })}
            </p>
            {forceWarningKey && (
              <p className="text-sm text-orange-600 dark:text-orange-400">
                {t(forceWarningKey)}
              </p>
            )}
          </div>
        )}

        {(!blockOnUsage || !hasUsage) && (
          <p className="text-sm font-medium text-destructive">{t("irreversible")}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            {t("cancel")}
          </Button>
          {showDeleteButton && (
            <LoadingButton
              variant="destructive"
              onClick={onConfirm}
              loading={isDeleting}
              loadingText={t("deleting")}
            >
              {t(buttonKey)}
            </LoadingButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
