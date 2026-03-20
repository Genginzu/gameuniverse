"use client";


import { useTranslations } from "next-intl";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Icon } from "@iconify/react";

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
    <Card className="overflow-hidden rounded-xl bg-white/40 backdrop-blur-xl dark:bg-slate-800/50">
      <CardHeader>
        <div className="flex items-center">
          <div className="rounded-xl bg-pink-100 p-2 dark:bg-pink-900/30">
            <Icon icon="fa:palette" className="h-4 w-4 text-pink-600 dark:text-pink-400 sm:h-5 sm:w-5"  />
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

      <CardContent className="space-y-2 p-4 pt-0">
        {/* Banner — full width, click to change */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("appearance.bannerLabel")}
          </label>
          <ImageUploader
            context="banners"
            currentImageUrl={bannerUrl}
            aspectRatio="16:5"
            dropZoneClassName="h-44 sm:h-56"
            onUploadSuccess={onBannerChange}
            onDelete={onBannerDelete}
          />
        </div>

        {/* Avatar — centered, click to change */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("appearance.avatarLabel")}
          </label>
          <ImageUploader
            context="avatars"
            currentImageUrl={avatarUrl}
            aspectRatio="1:1"
            onUploadSuccess={onAvatarChange}
            onDelete={onAvatarDelete}
          />
        </div>
      </CardContent>
    </Card>
  );
}
