"use client";

import { useTranslations } from "next-intl";
import { LoadingButton } from "@/components/ui/loading-button";

interface PasswordResetSectionProps {
  userEmail: string;
  onRequestReset: () => Promise<void>;
  isLoading: boolean;
}

export function PasswordResetSection({
  userEmail,
  onRequestReset,
  isLoading,
}: PasswordResetSectionProps) {
  const t = useTranslations("settings.security");

  const handleRequestReset = async () => {
    await onRequestReset();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-white/85">{t("password")}</label>
        <p className="text-editorial-muted mb-4 text-sm">{t("passwordDescription")}</p>
        <p className="text-editorial-muted mb-4 text-sm">{userEmail}</p>
      </div>
      <LoadingButton
        type="button"
        onClick={handleRequestReset}
        loading={isLoading}
        loadingText={t("requestReset")}
        variant="outline"
        className="border-editorial-line bg-editorial-2 hover:border-editorial-accent hover:bg-editorial-3 hover:text-editorial-accent text-white/90"
      >
        {t("requestReset")}
      </LoadingButton>
    </div>
  );
}
