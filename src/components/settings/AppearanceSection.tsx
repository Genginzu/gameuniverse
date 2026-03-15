"use client";

import { FaPalette, FaUser } from "react-icons/fa";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/shared/ImageUploader";

interface AppearanceSectionProps {
  avatarUrl: string | null;
  bannerUrl: string | null;
  onAvatarChange: (url: string) => void;
  onBannerChange: (url: string) => void;
  onAvatarDelete: () => void;
  onBannerDelete: () => void;
}

export function AppearanceSection({
  avatarUrl,
  bannerUrl,
  onAvatarChange,
  onBannerChange,
  onAvatarDelete,
  onBannerDelete,
}: AppearanceSectionProps) {
  const t = useTranslations("settings");

  return (
    <Card className="rounded-xl bg-white dark:bg-gray-800">
      <CardHeader>
        <div className="flex items-center">
          <div className="rounded-xl bg-pink-100 p-2 dark:bg-pink-900/30">
            <FaPalette className="h-4 w-4 text-pink-600 dark:text-pink-400 sm:h-5 sm:w-5" />
          </div>
          <div className="ml-3">
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
              {t("appearance.title")}
            </CardTitle>
            <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
              {t("appearance.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Avatar upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("appearance.avatarLabel")}
            </label>
            {!avatarUrl && (
              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700/50">
                <FaUser className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
            )}
            <ImageUploader
              context="avatars"
              currentImageUrl={avatarUrl}
              aspectRatio="1:1"
              onUploadSuccess={onAvatarChange}
              onDelete={onAvatarDelete}
            />
          </div>

          {/* Banner upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("appearance.bannerLabel")}
            </label>
            {!bannerUrl && (
              <div className="flex h-28 w-full items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 dark:from-violet-500/10 dark:to-cyan-500/10">
                <span className="text-xs text-gray-400 dark:text-gray-500">16:5</span>
              </div>
            )}
            <ImageUploader
              context="banners"
              currentImageUrl={bannerUrl}
              aspectRatio="16:5"
              onUploadSuccess={onBannerChange}
              onDelete={onBannerDelete}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
