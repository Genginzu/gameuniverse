"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { Icon } from "@iconify/react";
import type { CoachProfile } from "@/types/coaching";

export function CoachProfileForm() {
  const t = useTranslations("coaching.settings.profile");
  const { data, isLoading, mutate } = useSWR<{ profile: CoachProfile | null }>(
    "/api/coaching/profile",
    fetcher
  );
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  const profile = data?.profile;

  if (!initialized && profile) {
    setBio(profile.bio || "");
    setExperience(profile.experience || "");
    setLanguages(profile.languages || []);
    setInitialized(true);
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { bio, experience, languages };
      const method = profile ? "PATCH" : "POST";
      await fetch("/api/coaching/profile", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await mutate();
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!profile) return;
    await fetch("/api/coaching/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !profile.isActive }),
    });
    await mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-white/[0.06]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {profile && (
        <div className="border-editorial-line bg-editorial-2 flex items-center justify-between rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <Icon
              icon={profile.isActive ? "lucide:check-circle" : "lucide:circle-off"}
              className={`size-5 ${profile.isActive ? "text-emerald-400" : "text-editorial-muted"}`}
            />
            <span className="text-sm font-medium text-white">
              {profile.isActive ? t("active") : t("inactive")}
            </span>
            {profile.isVerified && (
              <span className="bg-editorial-accent/15 text-editorial-accent rounded-full px-2 py-0.5 text-xs font-medium">
                {t("verified")}
              </span>
            )}
          </div>
          <button
            onClick={handleToggle}
            className="text-editorial-muted rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/15"
          >
            {profile.isActive ? t("deactivate") : t("activate")}
          </button>
        </div>
      )}

      <div className="border-editorial-line bg-editorial-2 space-y-4 rounded-xl border p-4 md:p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-white">{t("bioLabel")}</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="border-editorial-line bg-editorial-3 w-full rounded-lg border p-3 text-base text-white placeholder:text-editorial-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))]"
            placeholder={t("bioPlaceholder")}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-white">{t("experienceLabel")}</label>
          <textarea
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            rows={3}
            className="border-editorial-line bg-editorial-3 w-full rounded-lg border p-3 text-base text-white placeholder:text-editorial-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))]"
            placeholder={t("experiencePlaceholder")}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-white">{t("languagesLabel")}</label>
          <div className="flex gap-4">
            {[
              { value: "Français", label: "Français" },
              { value: "English", label: "English" },
            ].map((lang) => (
              <label key={lang.value} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={languages.includes(lang.value)}
                  onChange={(e) => {
                    if (e.target.checked) setLanguages([...languages, lang.value]);
                    else setLanguages(languages.filter((l) => l !== lang.value));
                  }}
                  className="text-palette-secondary-500 focus:ring-palette-secondary-500 size-4 rounded border-gray-300"
                />
                <span className="text-sm text-white/85">{lang.label}</span>
              </label>
            ))}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="from-palette-secondary-500 to-palette-primary-500 w-full rounded-lg bg-linear-to-r px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
        >
          {saving ? t("saving") : profile ? t("update") : t("create")}
        </button>
      </div>
    </div>
  );
}
