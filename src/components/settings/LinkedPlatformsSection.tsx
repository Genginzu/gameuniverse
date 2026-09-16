"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { useLinkedPlatforms } from "@/hooks/useLinkedPlatforms";
import { useLibrarySync } from "@/hooks/useLibrarySync";
import { useToast } from "@/hooks/use-toast";
import { GAMING_PLATFORMS, PLATFORM_META, type GamingPlatform } from "@/types/linked-platforms";
import { isSyncablePlatform } from "@/types/library-sync";
import { PlatformRow } from "./PlatformRow";
import { SuggestionsBanner } from "./SuggestionsBanner";

type SectionT = ReturnType<typeof useTranslations<"settings.platforms">>;

export function LinkedPlatformsSection() {
  const t = useTranslations("settings.platforms");
  const tErrors = useTranslations("settings.errors");
  const {
    platforms,
    isLoading,
    savePlatform,
    connectPsn,
    setVisibility,
    removePlatform,
    refresh: refreshLinked,
  } = useLinkedPlatforms();
  const { jobByPlatform, startSync } = useLibrarySync();
  const { toast } = useToast();
  const [editingPlatform, setEditingPlatform] = useState<GamingPlatform | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [startingPlatform, setStartingPlatform] = useState<"steam" | "xbox" | null>(null);

  const linkedMap = new Map(platforms.map((p) => [p.platform, p]));

  // Refresh the linked-platforms list (for `lastSyncedAt`) whenever the set of
  // active jobs changes — i.e. when a sync starts or finishes.
  const activeKey = Array.from(jobByPlatform.values())
    .filter((j) => j.status === "running" || j.status === "pending")
    .map((j) => j.platform)
    .sort()
    .join(",");
  const prevActiveKey = useRef(activeKey);
  useEffect(() => {
    if (prevActiveKey.current !== activeKey) {
      prevActiveKey.current = activeKey;
      void refreshLinked();
    }
  }, [activeKey, refreshLinked]);

  const cancelEdit = () => {
    setEditingPlatform(null);
    setEditValue("");
  };

  const handleSaveManual = async () => {
    if (!editingPlatform || !editValue.trim()) return;
    setSaving(true);
    try {
      await savePlatform(editingPlatform, editValue.trim());
      toast({ title: t("saved") });
      cancelEdit();
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      const title = code
        ? t(
            `errors.${code}` as
              "errors.empty" | "errors.format" | "errors.not_found" | "errors.unreachable"
          )
        : tErrors("updateFailed");
      toast({ title, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleConnectPsn = async () => {
    if (!editValue.trim()) return;
    setSaving(true);
    try {
      await connectPsn(editValue.trim());
      toast({ title: t("saved") });
      cancelEdit();
    } catch (err) {
      const msg = err instanceof Error ? err.message : tErrors("updateFailed");
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSyncLibrary = async (platform: "steam" | "xbox") => {
    setStartingPlatform(platform);
    try {
      const job = await startSync(platform);
      toast({ title: job.status === "succeeded" ? t("syncDone") : t("syncStarted") });
    } catch (err) {
      const msg = err instanceof Error ? err.message : tErrors("updateFailed");
      toast({ title: msg, variant: "destructive" });
    } finally {
      setStartingPlatform(null);
    }
  };

  const handleToggleVisibility = async (platform: GamingPlatform) => {
    const linked = linkedMap.get(platform);
    if (!linked) return;
    setSaving(true);
    try {
      await setVisibility(platform, !linked.isPublic);
    } catch {
      toast({ title: tErrors("updateFailed"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (platform: GamingPlatform) => {
    setSaving(true);
    try {
      await removePlatform(platform);
      toast({ title: t("removed") });
    } catch {
      toast({ title: tErrors("updateFailed"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const renderRow = (platform: GamingPlatform) => (
    <PlatformRow
      key={platform}
      platform={platform}
      linked={linkedMap.get(platform) ?? null}
      isEditing={editingPlatform === platform}
      editValue={editValue}
      saving={saving}
      syncing={startingPlatform === platform}
      job={isSyncablePlatform(platform) ? (jobByPlatform.get(platform) ?? null) : null}
      t={t}
      onStartEdit={() => {
        setEditingPlatform(platform);
        setEditValue(linkedMap.get(platform)?.platformUsername ?? "");
      }}
      onCancelEdit={cancelEdit}
      onEditValueChange={setEditValue}
      onSaveManual={handleSaveManual}
      onConnectPsn={handleConnectPsn}
      onSyncLibrary={handleSyncLibrary}
      onToggleVisibility={() => handleToggleVisibility(platform)}
      onRemove={() => handleRemove(platform)}
    />
  );

  const connectedPlatforms = GAMING_PLATFORMS.filter((p) => PLATFORM_META[p].authType !== "manual");
  const manualPlatforms = GAMING_PLATFORMS.filter((p) => PLATFORM_META[p].authType === "manual");

  if (isLoading) {
    return (
      <PlatformsCard t={t}>
        <PlatformsSkeleton />
      </PlatformsCard>
    );
  }

  return (
    <div className="space-y-4">
      <SuggestionsBanner linked={new Set(platforms.map((p) => p.platform))} t={t} />
      <PlatformsCard t={t} titleKey="connectedTitle" descriptionKey="connectedDescription">
        <div className="space-y-2">{connectedPlatforms.map(renderRow)}</div>
      </PlatformsCard>
      <PlatformsCard t={t} titleKey="manualTitle" descriptionKey="manualDescription">
        <div className="space-y-2">{manualPlatforms.map(renderRow)}</div>
      </PlatformsCard>
    </div>
  );
}

function PlatformsCard({
  t,
  titleKey = "title",
  descriptionKey = "description",
  children,
}: {
  t: SectionT;
  titleKey?: string;
  descriptionKey?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-editorial-line bg-editorial-2 overflow-hidden rounded-xl border">
      <div className="flex items-center p-4">
        <div className="bg-editorial-accent/12 rounded-xl p-2">
          <Icon icon="lucide:gamepad-2" className="text-editorial-accent h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="ml-3">
          <h3 className="text-base font-semibold text-white sm:text-lg">
            {t(titleKey as "title")}
          </h3>
          <p className="text-editorial-muted text-sm">{t(descriptionKey as "description")}</p>
        </div>
      </div>
      <div className="p-4 pt-0">{children}</div>
    </div>
  );
}

function PlatformsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.06]" />
      ))}
    </div>
  );
}
