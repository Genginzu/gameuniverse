"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { Icon } from "@iconify/react";
import type { CoachProfile } from "@/types/coaching";

export function CoachProfileForm() {
  const t = useTranslations("coaching.settings.profile");
  const { data, isLoading, mutate } = useSWR<{ profile: CoachProfile | null }>("/api/coaching/profile", fetcher);
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [languages, setLanguages] = useState("");
  const [initialized, setInitialized] = useState(false);

  const profile = data?.profile;

  if (!initialized && profile) {
    setBio(profile.bio || "");
    setExperience(profile.experience || "");
    setLanguages(profile.languages.join(", "));
    setInitialized(true);
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { bio, experience, languages: languages.split(",").map((l) => l.trim()).filter(Boolean) };
      const method = profile ? "PATCH" : "POST";
      await fetch("/api/coaching/profile", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {profile && (
        <div className="glass-card flex items-center justify-between rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Icon icon={profile.isActive ? "lucide:check-circle" : "lucide:circle-off"} className={`size-5 ${profile.isActive ? "text-green-500" : "text-gray-400"}`} />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {profile.isActive ? t("active") : t("inactive")}
            </span>
            {profile.isVerified && (
              <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-medium text-cyan-400">{t("verified")}</span>
            )}
          </div>
          <button onClick={handleToggle} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700">
            {profile.isActive ? t("deactivate") : t("activate")}
          </button>
        </div>
      )}

      <div className="glass-card space-y-4 rounded-xl p-4 md:p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{t("bioLabel")}</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="glass-input w-full rounded-lg p-3 text-base" placeholder={t("bioPlaceholder")} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{t("experienceLabel")}</label>
          <textarea value={experience} onChange={(e) => setExperience(e.target.value)} rows={3} className="glass-input w-full rounded-lg p-3 text-base" placeholder={t("experiencePlaceholder")} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{t("languagesLabel")}</label>
          <input value={languages} onChange={(e) => setLanguages(e.target.value)} className="glass-input w-full rounded-lg p-3 text-base" placeholder={t("languagesPlaceholder")} />
          <p className="mt-1 text-xs text-gray-500">{t("languagesHint")}</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="w-full rounded-lg bg-linear-to-r from-cyan-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto">
          {saving ? t("saving") : profile ? t("update") : t("create")}
        </button>
      </div>
    </div>
  );
}
