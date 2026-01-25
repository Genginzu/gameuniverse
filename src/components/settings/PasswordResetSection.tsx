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
        <label className="mb-2 block text-sm font-medium text-gray-900">
          {t("password")}
        </label>
        <p className="mb-4 text-sm text-gray-600">{t("passwordDescription")}</p>
        <p className="mb-4 text-sm text-gray-500">
          {userEmail}
        </p>
      </div>
      <LoadingButton
        type="button"
        onClick={handleRequestReset}
        loading={isLoading}
        loadingText={t("requestReset")}
        variant="outline"
      >
        {t("requestReset")}
      </LoadingButton>
    </div>
  );
}
