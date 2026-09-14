"use client";

import { useTranslations } from "next-intl";

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
    <div className="space-y-4">
      {/* Banner — full width, click to change */}
      <div>
        <label className="text-editorial-muted mb-1.5 block text-xs font-medium">
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
        <label className="text-editorial-muted mb-1.5 block text-xs font-medium">
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
    </div>
  );
}
