"use client";

import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { SettingsSkeleton } from "./SettingsSkeleton";
import { UsernameForm } from "./UsernameForm";
import { EmailForm } from "./EmailForm";
import { PasswordResetSection } from "./PasswordResetSection";
import { AppearanceSection } from "./AppearanceSection";
import { createClient } from "@/lib/supabase";
import { Icon } from "@iconify/react";

export function SettingsContent() {
  const t = useTranslations("settings");
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
      toast({
        title: t("profile.usernameUpdated"),
      });
    } catch {
      toast({
        title: t("errors.updateFailed"),
        variant: "destructive",
      });
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleEmailUpdate = async (email: string) => {
    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) {
        // Check if email is already in use
        if (error.message.includes("already") || error.message.includes("exists")) {
          toast({
            title: t("profile.emailInUse"),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("errors.updateFailed"),
            variant: "destructive",
          });
        }
        return;
      }
      toast({
        title: t("profile.emailUpdateSent"),
      });
    } catch {
      toast({
        title: t("errors.connectionError"),
        variant: "destructive",
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    setIsRequestingReset(true);
    try {
      await resetPassword(user.email);
      toast({
        title: t("security.resetSent"),
      });
    } catch {
      toast({
        title: t("security.resetError"),
        variant: "destructive",
      });
    } finally {
      setIsRequestingReset(false);
    }
  };

  const handleAvatarChange = () => {
    refreshProfile();
    // Invalidate Next.js Router Cache so the profile page shows the new image
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
    <div className="flex-1 p-4 sm:p-6">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="neon-text mb-2 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
          {t("title")}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">{t("subtitle")}</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Profile Section */}
        <Card className="rounded-xl bg-white dark:bg-gray-800">
          <CardHeader>
            <div className="flex items-center">
              <div className="rounded-xl bg-blue-100 p-2 dark:bg-blue-900/30">
                <Icon icon="fa:user" className="h-4 w-4 text-blue-600 dark:text-blue-400 sm:h-5 sm:w-5"  />
              </div>
              <div className="ml-3">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                  {t("profile.title")}
                </CardTitle>
                <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                  {t("profile.description")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Username Section */}
            <UsernameForm
              currentUsername={profile?.username || null}
              onUpdate={handleUsernameUpdate}
              isLoading={isUpdatingUsername}
            />

            {/* Email Section */}
            <EmailForm
              currentEmail={user?.email || ""}
              onUpdate={handleEmailUpdate}
              isLoading={isUpdatingEmail}
            />
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <AppearanceSection
          avatarUrl={profile?.avatar_url ?? null}
          bannerUrl={profile?.banner_url ?? null}
          onAvatarChange={handleAvatarChange}
          onBannerChange={handleBannerChange}
          onAvatarDelete={handleAvatarDelete}
          onBannerDelete={handleBannerDelete}
        />

        {/* Security Section */}
        <Card className="rounded-xl bg-white dark:bg-gray-800">
          <CardHeader>
            <div className="flex items-center">
              <div className="rounded-xl bg-purple-100 p-2 dark:bg-purple-900/30">
                <Icon icon="fa:shield-alt" className="h-4 w-4 text-purple-600 dark:text-purple-400 sm:h-5 sm:w-5"  />
              </div>
              <div className="ml-3">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                  {t("security.title")}
                </CardTitle>
                <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                  {t("security.description")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PasswordResetSection
              userEmail={user?.email || ""}
              onRequestReset={handlePasswordReset}
              isLoading={isRequestingReset}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
