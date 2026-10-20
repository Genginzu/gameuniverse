"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "@/i18n/navigation";
import { useAccountDeletion } from "@/hooks/useAccountDeletion";
import { hasPasswordLogin } from "@/lib/utils/accountDeletion";
import { AccountDeletionDialog } from "./AccountDeletionDialog";
import type { AccountDeletionRequestPayload } from "@/types/account-deletion";

const CONSEQUENCES = ["deactivated", "grace", "removed", "anonymised", "retained"] as const;

/** Settings danger zone: explains the consequences, then opens the confirmation dialog. */
export function AccountDeletionSection({ user }: { user: User | null }) {
  const t = useTranslations("settings.deletion");
  const router = useRouter();
  const { requestDeletion } = useAccountDeletion(Boolean(user));
  const [open, setOpen] = useState(false);

  const handleConfirm = async (payload: AccountDeletionRequestPayload) => {
    await requestDeletion(payload);
    setOpen(false);
    router.push("/account-deletion");
  };

  return (
    <div className="space-y-4">
      <ul className="text-editorial-muted list-disc space-y-2 pl-5 text-sm leading-relaxed">
        {CONSEQUENCES.map((key) => (
          <li key={key}>{t(`consequences.${key}`)}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!user}
        className="min-h-[44px] w-full rounded-lg border border-red-500/40 bg-red-500/10 px-4 text-sm font-semibold text-red-300 transition-all duration-300 hover:bg-red-500/20 disabled:opacity-50 sm:w-auto"
      >
        {t("button")}
      </button>
      <AccountDeletionDialog
        open={open}
        onOpenChange={setOpen}
        requiresPassword={user ? hasPasswordLogin(user) : true}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
