"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

import { Switch } from "@/components/ui/switch";

interface PrivacySectionProps {
  isPrivate: boolean;
  onChange: (isPrivate: boolean) => Promise<void>;
}

/**
 * Private profile toggle (profiles.stats_private). When on, visitors no longer
 * see the player's stats, library, sessions, activity, friends and
 * subscriptions — enforced by RLS (migration 20261018000014).
 */
export function PrivacySection({ isPrivate, onChange }: PrivacySectionProps) {
  const t = useTranslations("settings.privacy");
  const switchId = useId();
  const [saving, setSaving] = useState(false);

  const handleChange = async (checked: boolean) => {
    setSaving(true);
    try {
      await onChange(checked);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <label htmlFor={switchId} className="block text-sm font-medium text-white/85">
          {t("privateProfile")}
        </label>
        <p className="text-editorial-muted mt-1 text-sm leading-relaxed">
          {t("privateProfileDescription")}
        </p>
      </div>
      <div className="flex min-h-[44px] items-center gap-3">
        <span className="text-editorial-muted text-sm" aria-hidden="true">
          {isPrivate ? t("on") : t("off")}
        </span>
        <Switch
          id={switchId}
          checked={isPrivate}
          disabled={saving}
          onCheckedChange={handleChange}
          aria-describedby={`${switchId}-status`}
        />
        <span id={`${switchId}-status`} className="sr-only" aria-live="polite">
          {isPrivate ? t("statusPrivate") : t("statusPublic")}
        </span>
      </div>
    </div>
  );
}
