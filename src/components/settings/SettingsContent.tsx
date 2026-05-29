"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";

import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase";

import { KickerLabel } from "@/components/shared/KickerLabel";

import { SettingsSkeleton } from "./SettingsSkeleton";
import { UsernameForm } from "./UsernameForm";
import { EmailForm } from "./EmailForm";
import { PasswordResetSection } from "./PasswordResetSection";
import { AppearanceSection } from "./AppearanceSection";
import { LinkedPlatformsSection } from "./LinkedPlatformsSection";

/**
 * SettingsContent : onglet Settings de la page joueur (`/players/[id]`).
 * Look éditorial : header avec kicker + titre, sections-cards en surfaces
 * sombres avec icône + kicker + titre + description.
 *
 * Conserve toute la logique métier intacte — seules les surfaces visuelles
 * passent en mode éditorial. Les forms (UsernameForm, EmailForm, etc.) sont
 * réutilisés tels quels et héritent du theming via `.editorial-settings-section-body`.
 */
export function SettingsContent() {
  const t = useTranslations("settings");
  const tEditorial = useTranslations("settings.editorial");
  const router = useRouter();
  const { profile, loading: profileLoading, updateProfile, refreshProfile } = useProfile();
  const { user, loading: authLoading, resetPassword } = useAuth();
  const { toast } = useToast();
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const supabase = createClient();

  if (profileLoading || authLoading) {
    return <SettingsSkeleton />;
  }

  const handleUsernameUpdate = async (username: string) => {
    setIsUpdatingUsername(true);
    try {
      await updateProfile({ username });
      toast({ title: t("profile.usernameUpdated") });
    } catch {
      toast({ title: t("errors.updateFailed"), variant: "destructive" });
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleEmailUpdate = async (email: string) => {
    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) {
        if (error.message.includes("already") || error.message.includes("exists")) {
          toast({ title: t("profile.emailInUse"), variant: "destructive" });
        } else {
          toast({ title: t("errors.updateFailed"), variant: "destructive" });
        }
        return;
      }
      toast({ title: t("profile.emailUpdateSent") });
    } catch {
      toast({ title: t("errors.connectionError"), variant: "destructive" });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    setIsRequestingReset(true);
    try {
      await resetPassword(user.email);
      toast({ title: t("security.resetSent") });
    } catch {
      toast({ title: t("security.resetError"), variant: "destructive" });
    } finally {
      setIsRequestingReset(false);
    }
  };

  const handleAvatarChange = () => {
    refreshProfile();
    router.refresh();
  };

  const handleBannerChange = () => {
    refreshProfile();
    router.refresh();
  };

  const handleAvatarDelete = async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (!currentUser) return;
    await supabase.from("profiles").update({ avatar_url: null }).eq("id", currentUser.id);
    refreshProfile();
    router.refresh();
  };

  const handleBannerDelete = async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (!currentUser) return;
    await supabase.from("profiles").update({ banner_url: null }).eq("id", currentUser.id);
    refreshProfile();
    router.refresh();
  };

  return (
    <section className="editorial-settings">
      <header className="editorial-settings-header">
        <KickerLabel>{tEditorial("kicker")}</KickerLabel>
        <h1 className="editorial-settings-title">
          {tEditorial("titlePrefix")}{" "}
          <span className="accent">{tEditorial("titleAccent")}</span>
        </h1>
        <p className="editorial-settings-subtitle">{tEditorial("subtitle")}</p>
      </header>

      <div className="editorial-settings-sections">
        <SettingsSection
          icon="lucide:user"
          title={t("profile.title")}
          description={t("profile.description")}
        >
          <div className="space-y-6">
            <UsernameForm
              currentUsername={profile?.username || null}
              onUpdate={handleUsernameUpdate}
              isLoading={isUpdatingUsername}
            />
            <EmailForm
              currentEmail={user?.email || ""}
              onUpdate={handleEmailUpdate}
              isLoading={isUpdatingEmail}
            />
          </div>
        </SettingsSection>

        <SettingsSection
          icon="lucide:palette"
          title={t("appearance.title")}
          description={t("appearance.description")}
        >
          <AppearanceSection
            avatarUrl={profile?.avatar_url ?? null}
            bannerUrl={profile?.banner_url ?? null}
            onAvatarChange={handleAvatarChange}
            onBannerChange={handleBannerChange}
            onAvatarDelete={handleAvatarDelete}
            onBannerDelete={handleBannerDelete}
          />
        </SettingsSection>

        <SettingsSection
          icon="lucide:gamepad-2"
          title={t("platforms.title")}
          description={t("platforms.description")}
        >
          <LinkedPlatformsSection />
        </SettingsSection>

        <SettingsSection
          icon="lucide:shield"
          title={t("security.title")}
          description={t("security.description")}
        >
          <PasswordResetSection
            userEmail={user?.email || ""}
            onRequestReset={handlePasswordReset}
            isLoading={isRequestingReset}
          />
        </SettingsSection>
      </div>
    </section>
  );
}

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="editorial-settings-section">
      <header className="editorial-settings-section-header">
        <div className="editorial-settings-section-icon" aria-hidden="true">
          <Icon icon={icon} className="h-5 w-5" />
        </div>
        <div className="editorial-settings-section-heading">
          <h2 className="editorial-settings-section-title">{title}</h2>
          <p className="editorial-settings-section-description">{description}</p>
        </div>
      </header>
      <div className="editorial-settings-section-body">{children}</div>
    </section>
  );
}
