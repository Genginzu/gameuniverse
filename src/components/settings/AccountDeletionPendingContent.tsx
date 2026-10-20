"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAccountDeletion } from "@/hooks/useAccountDeletion";
import { useToast } from "@/hooks/use-toast";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";
import { LoadingButton } from "@/components/ui/loading-button";

/** Shown to a deactivated account: deletion date, cancel and sign-out actions. */
export function AccountDeletionPendingContent({ scheduledFor }: { scheduledFor: string }) {
  const t = useTranslations("accountDeletion.pending");
  const format = useFormatter();
  const router = useRouter();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const { cancelDeletion } = useAccountDeletion();
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelDeletion();
      toast({ title: t("cancelled") });
      router.replace("/settings");
      router.refresh();
    } catch {
      toast({ title: t("cancelError"), variant: "destructive" });
      setCancelling(false);
    }
  };

  const date = format.dateTime(new Date(scheduledFor), { dateStyle: "long" });

  return (
    <EditorialContainer as="section">
      <div className="border-editorial-line bg-editorial-3 mx-auto max-w-2xl rounded-2xl border p-6 md:p-8">
        <div
          className="mb-5 grid size-12 place-items-center rounded-xl bg-red-500/15 text-red-300"
          aria-hidden="true"
        >
          <Icon icon="lucide:user-x" className="size-6" />
        </div>
        <KickerLabel>{t("kicker")}</KickerLabel>
        <h1 className="font-display mt-2 text-[clamp(1.5rem,2.5vw+0.5rem,2.25rem)] leading-tight font-bold tracking-tight text-white">
          {t("title")}
        </h1>
        <p className="text-editorial-muted mt-4 text-sm leading-relaxed sm:text-base">
          {t("description", { date })}
        </p>
        <p className="text-editorial-muted mt-3 text-sm leading-relaxed">{t("restoreHint")}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <LoadingButton
            type="button"
            onClick={handleCancel}
            loading={cancelling}
            loadingText={t("cancel")}
            className="from-cta-from to-cta-to min-h-[44px] w-full bg-linear-to-r text-white sm:w-auto"
          >
            {t("cancel")}
          </LoadingButton>
          <button
            type="button"
            onClick={() => void signOut()}
            className="border-editorial-line bg-editorial-2 min-h-[44px] w-full rounded-lg border px-4 text-sm text-white/90 sm:w-auto"
          >
            {t("signOut")}
          </button>
        </div>
      </div>
    </EditorialContainer>
  );
}
