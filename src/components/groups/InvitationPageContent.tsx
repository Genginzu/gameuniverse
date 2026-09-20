"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Icon } from "@iconify/react";

import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { LazyImage } from "@/components/ui/lazy-image";
import { LoadingButton } from "@/components/ui/loading-button";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, Link } from "@/i18n/navigation";
import { InvitationMessage } from "./InvitationMessage";
import type { GroupInvitationWithGroup } from "@/types/group";

interface InvitationPageContentProps {
  token: string;
}

async function fetchInvitation(token: string): Promise<GroupInvitationWithGroup | null> {
  const response = await fetch(`/api/invitations/${token}`);
  if (!response.ok) return null;
  const body = await response.json();
  return body.invitation;
}

export function InvitationPageContent({ token }: InvitationPageContentProps) {
  const t = useTranslations("groups.invitationPage");
  const locale = useLocale();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [invitation, setInvitation] = useState<GroupInvitationWithGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    fetchInvitation(token)
      .then(setInvitation)
      .finally(() => setIsLoading(false));
  }, [token, authLoading, user]);

  const handleAccept = async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/invitations/${token}/accept`, { method: "POST" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to accept invitation");
      }
      if (invitation) router.push(`/groups/${invitation.group.slug}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to accept invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/invitations/${token}/decline`, { method: "POST" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to decline invitation");
      }
      router.push("/groups");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to decline invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <section className="w-full">
        <EditorialContainer>
          <div className="border-editorial-line bg-editorial-2 mx-auto h-48 max-w-md animate-pulse rounded-2xl border" />
        </EditorialContainer>
      </section>
    );
  }

  if (!user) {
    return (
      <InvitationMessage
        icon="lucide:lock"
        title={t("authRequiredTitle")}
        description={t("authRequiredDescription")}
        action={
          <Button asChild>
            <Link href={`/auth?redirect=/invitations/${token}`}>{t("signIn")}</Link>
          </Button>
        }
      />
    );
  }

  if (!invitation) {
    return (
      <InvitationMessage
        icon="lucide:mail-x"
        title={t("notFoundTitle")}
        description={t("notFoundDescription")}
      />
    );
  }

  if (invitation.status !== "pending") {
    return (
      <InvitationMessage
        icon="lucide:info"
        title={t("alreadyAnsweredTitle")}
        description={t(`alreadyAnsweredDescription.${invitation.status}`)}
      />
    );
  }

  if (new Date(invitation.expiresAt) < new Date()) {
    return (
      <InvitationMessage
        icon="lucide:clock-alert"
        title={t("expiredTitle")}
        description={t("expiredDescription")}
      />
    );
  }

  return (
    <section className="w-full">
      <EditorialContainer>
        <div className="mx-auto max-w-md text-center">
          <div className="border-editorial-line bg-editorial-2 relative mx-auto mb-6 size-20 overflow-hidden rounded-2xl border">
            {invitation.group.imageUrl ? (
              <LazyImage src={invitation.group.imageUrl} alt="" fill sizes="80px" className="object-cover" />
            ) : (
              <div className="text-editorial-accent/50 grid h-full w-full place-items-center">
                <Icon icon="lucide:users" className="h-8 w-8" aria-hidden="true" />
              </div>
            )}
          </div>

          <KickerLabel>{t("kicker")}</KickerLabel>
          <h1 className="mt-2 font-display text-2xl font-bold text-white">
            {invitation.group.name}
          </h1>
          <p className="text-editorial-muted mt-2 text-sm">
            {t("invitedBy", { username: invitation.invitedBy.username ?? "?" })}
          </p>
          <p className="text-editorial-muted mt-1 text-sm">
            {t("membersCount", { count: invitation.group.membersCount, max: 50 })}
          </p>
          <p className="text-editorial-muted mt-1 text-xs">
            {t("expiresAt", {
              date: new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
                new Date(invitation.expiresAt)
              ),
            })}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <LoadingButton onClick={handleAccept} loading={isSubmitting}>
              {t("accept")}
            </LoadingButton>
            <Button
              variant="outline"
              className="border-editorial-line bg-editorial-3 text-white"
              onClick={handleDecline}
              disabled={isSubmitting}
            >
              {t("decline")}
            </Button>
          </div>

          {actionError && <p className="mt-4 text-sm text-red-400">{actionError}</p>}
        </div>
      </EditorialContainer>
    </section>
  );
}
