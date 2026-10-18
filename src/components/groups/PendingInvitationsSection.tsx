"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { LoadingButton } from "@/components/ui/loading-button";
import { Button } from "@/components/ui/button";
import type { GroupInvitationWithGroup } from "@/types/group";

interface PendingInvitationsSectionProps {
  invitations: GroupInvitationWithGroup[];
}

/** Bandeau "invitations en attente" affiché sur la page /groups. */
export function PendingInvitationsSection({ invitations }: PendingInvitationsSectionProps) {
  const t = useTranslations("groups.invitationPage");

  return (
    <div className="mb-10">
      <KickerLabel className="mb-4">{t("pendingKicker", { count: invitations.length })}</KickerLabel>
      <ul className="flex flex-col gap-3">
        {invitations.map((invitation) => (
          <InvitationRow key={invitation.id} invitation={invitation} />
        ))}
      </ul>
    </div>
  );
}

function InvitationRow({ invitation }: { invitation: GroupInvitationWithGroup }) {
  const t = useTranslations("groups.invitationPage");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answered, setAnswered] = useState(false);

  const respond = async (action: "accept" | "decline") => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/invitations/${invitation.token}/${action}`, {
        method: "POST",
      });
      if (response.ok) {
        setAnswered(true);
        if (action === "accept") window.location.href = `/groups/${invitation.group.slug}`;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (answered) return null;

  return (
    <li className="border-editorial-line bg-editorial-2 flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon icon="lucide:mail" className="text-editorial-accent h-4 w-4" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-white">{invitation.group.name}</p>
          <p className="text-editorial-muted text-xs">
            {t("invitedBy", { username: invitation.invitedBy.username ?? "?" })}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <LoadingButton onClick={() => respond("accept")} loading={isSubmitting} size="sm">
          {t("accept")}
        </LoadingButton>
        <Button
          variant="outline"
          size="sm"
          className="border-editorial-line bg-editorial-3 text-white"
          onClick={() => respond("decline")}
          disabled={isSubmitting}
        >
          {t("decline")}
        </Button>
      </div>
    </li>
  );
}
