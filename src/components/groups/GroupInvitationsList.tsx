"use client";

import { useTranslations, useLocale } from "next-intl";
import { Icon } from "@iconify/react";
import type { GroupInvitation } from "@/types/group";

interface GroupInvitationsListProps {
  invitations: GroupInvitation[];
}

const STATUS_STYLES: Record<GroupInvitation["status"], string> = {
  pending: "bg-amber-500/15 text-amber-300",
  accepted: "bg-emerald-500/15 text-emerald-300",
  declined: "bg-red-500/15 text-red-300",
};

/** Liste des invitations d'un groupe (owner/admin), avec statut. */
export function GroupInvitationsList({ invitations }: GroupInvitationsListProps) {
  const t = useTranslations("groups.invitations");
  const locale = useLocale();

  if (invitations.length === 0) {
    return <p className="text-editorial-muted text-sm">{t("empty")}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {invitations.map((invitation) => (
        <li
          key={invitation.id}
          className="border-editorial-line bg-editorial-2 flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <Icon icon="lucide:mail" className="text-editorial-muted h-4 w-4" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-white">
                {invitation.invitedPlayer?.username ?? invitation.invitedEmail ?? t("unknownTarget")}
              </p>
              <p className="text-editorial-muted text-xs">
                {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                  new Date(invitation.createdAt)
                )}
              </p>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[invitation.status]}`}
          >
            {t(`status.${invitation.status}`)}
          </span>
        </li>
      ))}
    </ul>
  );
}
