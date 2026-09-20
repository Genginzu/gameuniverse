"use client";

import { useTranslations } from "next-intl";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { GroupInviteForm } from "./GroupInviteForm";
import { GroupInvitationsList } from "./GroupInvitationsList";
import type { CreateGroupInvitationInput, GroupInvitation } from "@/types/group";

interface GroupManagementPanelProps {
  membersCount: number;
  invitations: GroupInvitation[];
  isInviting: boolean;
  inviteError: string | null;
  onInvite: (input: CreateGroupInvitationInput) => Promise<void>;
}

/** Panneau de gestion des invitations, réservé aux owner/admin du groupe. */
export function GroupManagementPanel({
  membersCount,
  invitations,
  isInviting,
  inviteError,
  onInvite,
}: GroupManagementPanelProps) {
  const t = useTranslations("groups.detail");

  return (
    <div>
      <KickerLabel className="mb-4">
        {t("invitationsKicker", { count: membersCount, max: 50 })}
      </KickerLabel>
      <GroupInviteForm isSubmitting={isInviting} error={inviteError} onInvite={onInvite} />
      <div className="mt-4">
        <GroupInvitationsList invitations={invitations} />
      </div>
    </div>
  );
}
