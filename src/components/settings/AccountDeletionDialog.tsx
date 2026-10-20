"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/ui/loading-button";
import { confirmationWordFor, isValidConfirmation } from "@/lib/utils/accountDeletion";
import type { ApiError } from "@/lib/services/apiError";
import type { AccountDeletionRequestPayload } from "@/types/account-deletion";

const KNOWN_ERRORS = [
  "invalidConfirmation",
  "reauthRequired",
  "invalidPassword",
  "alreadyPending",
  "coachingPaymentPending",
  "coachingDisputeOpen",
];

const INPUT_CLASS =
  "h-11 rounded-[10px] border-editorial-line bg-editorial-2 text-base text-white placeholder:text-editorial-muted focus-visible:border-red-400 focus-visible:ring-2 focus-visible:ring-red-400/20 focus-visible:ring-offset-0";

interface AccountDeletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiresPassword: boolean;
  onConfirm: (payload: AccountDeletionRequestPayload) => Promise<void>;
}

export function AccountDeletionDialog({
  open,
  onOpenChange,
  requiresPassword,
  onConfirm,
}: AccountDeletionDialogProps) {
  const t = useTranslations("settings.deletion");
  const locale = useLocale();
  const word = confirmationWordFor(locale);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const canSubmit =
    isValidConfirmation(confirmation, locale) && (!requiresPassword || password.length > 0);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorKey(null);
    try {
      await onConfirm({ password: requiresPassword ? password : undefined, confirmation, locale });
    } catch (error) {
      const code = (error as ApiError).code;
      setErrorKey(code && KNOWN_ERRORS.includes(code) ? code : "generic");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-editorial-line bg-editorial-3 max-h-[90vh] w-[95vw] overflow-y-auto text-white sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="font-display text-white">{t("dialogTitle")}</DialogTitle>
            <DialogDescription className="text-editorial-muted">
              {t("dialogDescription")}
            </DialogDescription>
          </DialogHeader>

          {requiresPassword ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white/85">{t("passwordLabel")}</span>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={INPUT_CLASS}
              />
            </label>
          ) : (
            <p className="text-editorial-muted text-sm">{t("oauthReauth")}</p>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/85">
              {t("confirmationLabel", { word })}
            </span>
            <Input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              placeholder={word}
              className={INPUT_CLASS}
            />
          </label>

          {errorKey && (
            <p role="alert" className="text-sm text-red-400">
              {t(`errors.${errorKey}`)}
            </p>
          )}

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="border-editorial-line bg-editorial-2 min-h-[44px] w-full rounded-lg border px-4 text-sm text-white/90 sm:w-auto"
            >
              {t("cancel")}
            </button>
            <LoadingButton
              type="submit"
              loading={submitting}
              loadingText={t("confirm")}
              disabled={!canSubmit}
              className="min-h-[44px] w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
            >
              {t("confirm")}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
